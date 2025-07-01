import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect';

interface AsciiImageCubeProps {
  size?: number;
  rotationSpeed?: number;
  position?: { x: number; y: number; z: number };
  forceVisible?: boolean;
}

const AsciiImageCube: React.FC<AsciiImageCubeProps> = ({ 
  size = 2.5, 
  rotationSpeed = 0.01,
  position = { x: 0, y: 0, z: 0 },
  forceVisible = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const effectRef = useRef<any>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const scrollPositionRef = useRef(0);
  const targetRotationRef = useRef({ x: 0, y: 0, z: 0 });
  const currentRotationRef = useRef({ x: 0, y: 0, z: 0 });
  const scaleRef = useRef(0);
  const opacityRef = useRef(0.3);
  const [hasDroppedIn, setHasDroppedIn] = useState(false);
  const dropAnimationRef = useRef({ progress: 0, startTime: 0 });
  const charactersRef = useRef(' .:-+*=%@#');

  // Generate random initial rotation on component mount
  const initialRotationRef = useRef({
    x: (Math.random() - 0.5) * Math.PI * 2,
    y: (Math.random() - 0.5) * Math.PI * 2,
    z: (Math.random() - 0.5) * Math.PI * 2
  });

  // Listen for journey start to trigger drop animation
  useEffect(() => {
    const handleJourneyStart = () => {
      if (!hasDroppedIn) {
        setHasDroppedIn(true);
        dropAnimationRef.current.startTime = Date.now();
        dropAnimationRef.current.progress = 0;
      }
    };

    // Listen for clicks on the point cloud overlay
    const clickOverlay = document.querySelector('.absolute.inset-0.cursor-pointer');
    if (clickOverlay) {
      clickOverlay.addEventListener('click', handleJourneyStart);
    }

    // Also listen for any journey start events
    window.addEventListener('journeyStart', handleJourneyStart);

    return () => {
      if (clickOverlay) {
        clickOverlay.removeEventListener('click', handleJourneyStart);
      }
      window.removeEventListener('journeyStart', handleJourneyStart);
    };
  }, [hasDroppedIn]);

  // Screen coordinates for the Bézier path (viewport percentages)
  const screenWaypoints = [
    { x: 50, y: 50 },   // 1. Start at center
    { x: 50, y: 50 },   // 2. Stay center
    { x: 50, y: 40 },   // 3. Stay center
    { x: 50, y: 45 },   // 4. Stay center
    { x: 50, y: 45 }    // 5. Stop position (same as previous for smooth stop)
  ];

  // Convert path progress to screen position using Bézier interpolation
  const getScreenPosition = (progress: number) => {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const numSegments = screenWaypoints.length - 1;
    const segmentProgress = clampedProgress * numSegments;
    const segmentIndex = Math.floor(segmentProgress);
    const localProgress = segmentProgress - segmentIndex;
    
    const currentWaypoint = screenWaypoints[Math.min(segmentIndex, screenWaypoints.length - 1)];
    const nextWaypoint = screenWaypoints[Math.min(segmentIndex + 1, screenWaypoints.length - 1)];
    
    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    const easedProgress = easeInOutCubic(localProgress);
    
    const x = currentWaypoint.x + (nextWaypoint.x - currentWaypoint.x) * easedProgress;
    const y = currentWaypoint.y + (nextWaypoint.y - currentWaypoint.y) * easedProgress;
    
    return { x, y };
  };

  // Create CTC text texture for cube faces
  const createCTCTexture = (gradientColors: string[]) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = 512;
    canvas.height = 512;

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradientColors.forEach((color, index) => {
      gradient.addColorStop(index / (gradientColors.length - 1), color);
    });

    // Fill background with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set text properties for large CTC
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 180px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add text shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    // Draw CTC text
    ctx.fillText('CTC', canvas.width / 2, canvas.height / 2);

    // Add white outline
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeText('CTC', canvas.width / 2, canvas.height / 2);

    return canvas;
  };

  // Update cube position based on scroll
  const updateCubePosition = () => {
    if (!containerRef.current) return;

    const windowScrollY = window.scrollY || window.pageYOffset;
    const scrollableElement = document.querySelector('.overflow-y-auto');
    const containerScrollY = scrollableElement ? scrollableElement.scrollTop : 0;
    const totalScrollY = Math.max(windowScrollY, containerScrollY);
    
    const windowMaxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const containerMaxScroll = scrollableElement ? Math.max(0, scrollableElement.scrollHeight - scrollableElement.clientHeight) : 0;
    const maxScroll = Math.max(windowMaxScroll, containerMaxScroll);
    
    let scrollProgress = 0;
    if (maxScroll > 0) {
      scrollProgress = Math.min(1, totalScrollY / maxScroll);
    }
    
    let cubeScale = 0.7;
    let cubeOpacity = 0.3; // Keep initial dimness
    
    // Remove the brightening effect - keep constant dimness
    // if (scrollProgress > 0) {
    //   const opacityProgress = Math.min(scrollProgress / 0.3, 1);
    //   cubeOpacity = 0.3 + (0.2 * opacityProgress);
    // }
    
    if (scrollProgress >= 0.8) {
      const fadeProgress = (scrollProgress - 0.8) / 0.2;
      cubeOpacity = Math.max(0.3 - (fadeProgress * 0.1), 0.2); // Fade from 0.3 to 0.2
    }
    
    cubeOpacity = Math.max(0.2, Math.min(0.3, cubeOpacity)); // Keep within dim range
    
    scaleRef.current = cubeScale;
    opacityRef.current = cubeOpacity;
    
    let pathProgress;
    let verticalOffset = 0;
    
    if (scrollProgress <= 0.25) {
      pathProgress = 0;
      verticalOffset = 0;
    } else {
      pathProgress = 1;
      verticalOffset = 0;
    }
    
    const screenPos = getScreenPosition(pathProgress);
    
    // Always center horizontally, only adjust vertical position
    containerRef.current.style.left = 'calc(50% - 15px)';
    
    if (scrollProgress >= 0.25) {
      const baseY = 45;
      const finalY = baseY + verticalOffset;
      containerRef.current.style.top = `${finalY}%`;
    } else {
      containerRef.current.style.top = `${screenPos.y}%`;
    }
    
    // Use precise centering transform
    containerRef.current.style.transform = 'translate(calc(-50% - 15px), -50%)';
    
    const scrollDelta = totalScrollY - scrollPositionRef.current;
    scrollPositionRef.current = totalScrollY;
    
    if (Math.abs(scrollDelta) > 0) {
      const rotationMultiplier = 0.002;
      targetRotationRef.current.x += scrollDelta * rotationMultiplier;
      targetRotationRef.current.y += scrollDelta * rotationMultiplier * 0.8;
      targetRotationRef.current.z += scrollDelta * rotationMultiplier * 0.5;
    }
  };

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      updateCubePosition();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    const scrollableContainer = document.querySelector('.overflow-y-auto');
    if (scrollableContainer) {
      scrollableContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    updateCubePosition();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollableContainer) {
        scrollableContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Handle wheel events for immediate feedback
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const wheelDelta = e.deltaY;
      const rotationMultiplier = 0.001;
      
      targetRotationRef.current.x += wheelDelta * rotationMultiplier;
      targetRotationRef.current.y += wheelDelta * rotationMultiplier * 0.8;
      targetRotationRef.current.z += wheelDelta * rotationMultiplier * 0.5;
      
      setTimeout(() => {
        updateCubePosition();
      }, 10);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Animation loop to continuously update position
  useEffect(() => {
    const animatePosition = () => {
      updateCubePosition();
      requestAnimationFrame(animatePosition);
    };
    
    const animationId = requestAnimationFrame(animatePosition);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Main Three.js setup with ASCII effect
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 6;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    // ASCII Effect setup
    const effect = new AsciiEffect(renderer, charactersRef.current, {
      invert: false,
      resolution: 0.15
    });
    effect.setSize(window.innerWidth, window.innerHeight);
    effect.domElement.style.color = 'white';
    effect.domElement.style.backgroundColor = 'transparent';
    effect.domElement.style.fontFamily = 'monospace';
    effect.domElement.style.fontSize = '8px';
    effect.domElement.style.lineHeight = '8px';
    effect.domElement.style.letterSpacing = '0px';
    effectRef.current = effect;

    container.appendChild(effect.domElement);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(3, 3, 3);
    scene.add(directionalLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(-2, 2, 2);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x80c0ff, 1.0, 100);
    fillLight.position.set(2, -2, 2);
    scene.add(fillLight);

    const pointLight = new THREE.PointLight(0x4080ff, 1.2, 100);
    pointLight.position.set(0, 0, 4);
    scene.add(pointLight);

    // Create cube geometry
    const geometry = new THREE.BoxGeometry(size * 0.8, size * 0.8, size * 0.8);
    
    // Create materials with different gradient CTC textures for each face
    const gradientSets = [
      ['#ff6b6b', '#4ecdc4'], // Red to teal
      ['#a8e6cf', '#ffd93d'], // Green to yellow
      ['#ff8a80', '#ff80ab'], // Pink to light pink
      ['#81c784', '#4fc3f7'], // Green to blue
      ['#ffb74d', '#f06292'], // Orange to pink
      ['#9575cd', '#64b5f6']  // Purple to blue
    ];

    const materials: THREE.MeshPhongMaterial[] = [];
    const loader = new THREE.TextureLoader();

    gradientSets.forEach((colors, index) => {
      const canvas = createCTCTexture(colors);
      if (canvas) {
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const material = new THREE.MeshPhongMaterial({
          map: texture,
          shininess: 120,
          specular: 0x444444,
          transparent: true,
          opacity: 0.98,
          reflectivity: 0.5,
          combine: THREE.MixOperation,
          emissive: 0x111111,
          emissiveIntensity: 0.1
        });

        materials.push(material);
      }
    });

    // Create cube mesh
    const cube = new THREE.Mesh(geometry, materials);
    
    // Set initial position in 3D space
    if (!hasDroppedIn) {
      cube.position.set(0, 25, 0);
    } else {
      cube.position.set(0, 0, 0);
    }
    
    cube.rotation.x = initialRotationRef.current.x;
    cube.rotation.y = initialRotationRef.current.y;
    cube.rotation.z = initialRotationRef.current.z;
    
    targetRotationRef.current = { ...initialRotationRef.current };
    currentRotationRef.current = { ...initialRotationRef.current };
    
    cubeRef.current = cube;
    scene.add(cube);

    // Mark as loaded since we're generating textures programmatically
    setIsLoaded(true);

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      effect.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop for 3D rendering
    const animate = () => {
      if (cubeRef.current) {
        // Handle drop-in animation
        if (hasDroppedIn && dropAnimationRef.current.progress < 1) {
          const elapsed = Date.now() - dropAnimationRef.current.startTime;
          const duration = 4000;
          dropAnimationRef.current.progress = Math.min(elapsed / duration, 1);
          
          const easeOutQuart = (t: number) => {
            return 1 - Math.pow(1 - t, 4);
          };
          
          const easedProgress = easeOutQuart(dropAnimationRef.current.progress);
          cubeRef.current.position.y = 25 - (25 * easedProgress);
          
          // Update ASCII effect opacity during drop
          const dropOpacity = Math.min(dropAnimationRef.current.progress * 0.5, 1);
          effectRef.current.domElement.style.opacity = (dropOpacity * opacityRef.current).toString();
          
        } else if (!hasDroppedIn) {
          cubeRef.current.position.y = 25;
          effectRef.current.domElement.style.opacity = '0';
        }
        
        // Smoothly interpolate current rotation towards target rotation
        const lerpFactor = 0.12;
        currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * lerpFactor;
        currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * lerpFactor;
        currentRotationRef.current.z += (targetRotationRef.current.z - currentRotationRef.current.z) * lerpFactor;
        
        // Update dynamic lighting
        const time = Date.now() * 0.001;
        pointLight.position.x = Math.sin(time * 0.7) * 3;
        pointLight.position.y = Math.cos(time * 0.5) * 2;
        pointLight.intensity = 1.0 + Math.sin(time * 1.2) * 0.3;
        
        cubeRef.current.rotation.x = currentRotationRef.current.x;
        cubeRef.current.rotation.y = currentRotationRef.current.y;
        cubeRef.current.rotation.z = currentRotationRef.current.z;

        // Add subtle floating motion on Z-axis
        if (hasDroppedIn && dropAnimationRef.current.progress >= 1) {
          cubeRef.current.position.z = Math.sin(time * 0.8) * 0.15;
        }
        
        // Add slight rotation animation when not actively scrolling
        const rotationDelta = Math.abs(targetRotationRef.current.x - currentRotationRef.current.x) + 
                             Math.abs(targetRotationRef.current.y - currentRotationRef.current.y) + 
                             Math.abs(targetRotationRef.current.z - currentRotationRef.current.z);
        
        if (rotationDelta < 0.02) {
          cubeRef.current.rotation.y += rotationSpeed * 0.15;
          cubeRef.current.rotation.x += rotationSpeed * 0.08;
          cubeRef.current.rotation.z += rotationSpeed * 0.05;
        }
        
        // Apply scale and opacity based on scroll position
        const targetScale = scaleRef.current;
        const targetOpacity = opacityRef.current;
        cubeRef.current.scale.setScalar(targetScale);
        
        // Apply opacity to ASCII effect (only if drop animation is complete)
        if (hasDroppedIn && dropAnimationRef.current.progress >= 1) {
          effectRef.current.domElement.style.opacity = targetOpacity.toString();
        }
      }
      
      effectRef.current.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
      if (container && effect.domElement) {
        container.removeChild(effect.domElement);
      }
      geometry.dispose();
      materials.forEach(material => {
        if (material.map) material.map.dispose();
        material.dispose();
      });
      renderer.dispose();
    };
  }, [size, rotationSpeed, position, hasDroppedIn]);

  // If forceVisible is true, set hasDroppedIn to true immediately
  useEffect(() => {
    if (forceVisible && !hasDroppedIn) {
      setHasDroppedIn(true);
    }
  }, [forceVisible, hasDroppedIn]);

  return (
    <div 
      ref={containerRef}
      className={`transition-all duration-300 ease-out ascii-cube-container ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ 
        width: '100vw', 
        height: '100vh',
        pointerEvents: 'none',
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(calc(-50% - 15px), -50%)', // Ensure perfect centering
        zIndex: 1,
        overflow: 'visible',
        willChange: 'transform, left, top',
        visibility: 'visible',
        display: 'block',
      }}
    />
  );
};

export default AsciiImageCube;