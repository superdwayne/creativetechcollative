import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface RotatingCubeProps {
  children: React.ReactNode;
}

const RotatingCube: React.FC<RotatingCubeProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cubeRef = useRef<THREE.LineSegments | null>(null);
  const solidCubeRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollOpacity, setScrollOpacity] = useState(0.3); // Start dimmed
  const timeRef = useRef(0);

  // Handle scroll-based opacity changes
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = Math.min(scrollY / Math.max(maxScroll * 0.3, 1), 1); // Reach full opacity by 30% scroll
      
      // Opacity goes from 0.3 (dimmed) to 1.0 (fully visible) based on scroll
      const newOpacity = 0.3 + (0.7 * scrollProgress);
      setScrollOpacity(newOpacity);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Set initial opacity
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 4;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(160, 160);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    // Create wireframe cube - FIXED SIZE FOREVER
    const geometry = new THREE.BoxGeometry(2.0, 2.0, 2.0);
    
    // Store original vertex positions for distortion
    const originalPositions = geometry.attributes.position.array.slice();
    
    const edges = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.8, // Much more visible wireframe
      linewidth: 1
    });
    const cube = new THREE.LineSegments(edges, wireframeMaterial);
    cubeRef.current = cube;
    scene.add(cube);

    // Create solid metallic cube - FIXED SIZE FOREVER
    const solidGeometry = new THREE.BoxGeometry(1.95, 1.95, 1.95);
    
    // Store original vertex positions for solid cube distortion
    const solidOriginalPositions = solidGeometry.attributes.position.array.slice();
    
    const metallicMaterial = new THREE.MeshStandardMaterial({
      color: 0xa8a8a8, // Fixed metallic silver color
      metalness: 1.0,
      roughness: 0.2, // Less shiny
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      envMapIntensity: 1.5 // Reduced intensity
    });
    
    const solidCube = new THREE.Mesh(solidGeometry, metallicMaterial);
    solidCube.castShadow = true;
    solidCube.receiveShadow = true;
    solidCubeRef.current = solidCube;
    scene.add(solidCube);

    // Create a simple environment map for reflections
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
    scene.add(cubeCamera);
    
    // Set the environment map
    metallicMaterial.envMap = cubeRenderTarget.texture;

    // Enhanced lighting setup for better metallic visibility
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(3, 3, 3);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Key light for metallic highlights
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(-2, 2, 2);
    scene.add(keyLight);

    // Fill light
    const fillLight = new THREE.PointLight(0x4080ff, 0.8, 100);
    fillLight.position.set(2, -2, 2);
    scene.add(fillLight);

    // Rim light for edge definition
    const rimLight = new THREE.PointLight(0x80c0ff, 0.6, 100);
    rimLight.position.set(-3, 1, -2);
    scene.add(rimLight);

    // Additional accent light
    const accentLight = new THREE.SpotLight(0xffffff, 0.8);
    accentLight.position.set(0, 4, 0);
    accentLight.target = solidCube;
    scene.add(accentLight);

    // Distortion function
    const applyDistortion = (geometry: THREE.BufferGeometry, originalPositions: Float32Array, time: number, intensity: number = 0.08) => {
      const positions = geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        const x = originalPositions[i];
        const y = originalPositions[i + 1];
        const z = originalPositions[i + 2];
        
        // Create multiple wave frequencies for complex distortion
        const wave1 = Math.sin(time * 0.8 + x * 2.0 + y * 1.5) * intensity;
        const wave2 = Math.cos(time * 1.2 + y * 2.5 + z * 1.8) * intensity * 0.7;
        const wave3 = Math.sin(time * 0.6 + z * 1.8 + x * 2.2) * intensity * 0.5;
        
        // Apply distortion with different intensities per axis
        positions[i] = x + wave1 * 0.8;
        positions[i + 1] = y + wave2 * 1.0;
        positions[i + 2] = z + wave3 * 0.9;
      }
      
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    };

    // Animation loop
    const animate = () => {
      timeRef.current += 0.016; // Increment time for distortion
      
      if (cubeRef.current && solidCubeRef.current) {
        // Always continue rotating - never reset position
        cubeRef.current.rotation.x += 0.003;
        cubeRef.current.rotation.y += 0.005;
        cubeRef.current.rotation.z += 0.002;

        // Sync solid cube rotation with wireframe
        solidCubeRef.current.rotation.x = cubeRef.current.rotation.x;
        solidCubeRef.current.rotation.y = cubeRef.current.rotation.y;
        solidCubeRef.current.rotation.z = cubeRef.current.rotation.z;

        // Apply subtle distortion to both geometries
        applyDistortion(geometry, originalPositions, timeRef.current, 0.06);
        applyDistortion(solidGeometry, solidOriginalPositions, timeRef.current, 0.04);
        
        // Update edges geometry for wireframe
        const newEdges = new THREE.EdgesGeometry(geometry);
        cubeRef.current.geometry.dispose();
        cubeRef.current.geometry = newEdges;

        // Update environment map occasionally for dynamic reflections
        if (Math.floor(Date.now() / 100) % 10 === 0) {
          cubeCamera.position.copy(solidCube.position);
          cubeCamera.update(renderer, scene);
        }

        // Keep materials completely static - NO ANIMATIONS
        // Metallic cube stays hidden (opacity 0)
        metallicMaterial.opacity = 0;
        
        // Wireframe stays consistently bright
        wireframeMaterial.opacity = 0.8;
        
        // Material properties stay constant
        metallicMaterial.roughness = 0.2;
        metallicMaterial.envMapIntensity = 1.5;

        // Apply scroll-based opacity to container
        if (containerRef.current) {
          containerRef.current.style.opacity = scrollOpacity.toString();
        }
      }
      
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      edges.dispose();
      wireframeMaterial.dispose();
      solidGeometry.dispose();
      metallicMaterial.dispose();
      cubeRenderTarget.dispose();
      renderer.dispose();
    };
  }, [isHovered, scrollOpacity, timeRef]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div className="relative inline-block">
      {/* 3D Cube Canvas - ABSOLUTELY NO SCALING */}
      <div 
        ref={containerRef}
        className="absolute flex items-center justify-center pointer-events-none transition-opacity duration-300 ease-out"
        style={{ 
          width: '160px', 
          height: '160px',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)', // ONLY TRANSLATION
          zIndex: 1,
          opacity: scrollOpacity // Start dimmed, will be animated via scroll
        }}
      />
      
      {/* Logo Content with hover detection - ABSOLUTELY NO SCALING */}
      <div 
        className="relative z-10 flex items-center justify-center w-[100px] h-[100px] cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img 
          src="/ctc-logo.svg" 
          alt="CTC Logo" 
          className="w-12 h-12 object-contain transition-all duration-300"
          style={{
            filter: isHovered ? 'brightness(1.2) contrast(1.1)' : 'brightness(1)',
          }}
        />
      </div>
    </div>
  );
};

export default RotatingCube;