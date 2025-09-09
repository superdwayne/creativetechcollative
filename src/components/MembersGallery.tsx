import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MemberData } from '../types/member';

interface MembersGalleryProps {
  memberData: MemberData[];
}

const MembersGallery: React.FC<MembersGalleryProps> = ({ memberData }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const planesRef = useRef<THREE.Mesh[]>([]);
  const animationRef = useRef<number | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [targetRotation, setTargetRotation] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [footerHeight, setFooterHeight] = useState(94);
  
  // VW Lab exact 3D Slider settings
  const radius = 8;
  const planeWidth = 3;
  const planeHeight = 4;
  const totalMembers = 12; // VW Lab uses around 12 items visible at once

  // Fallback data for testing when no member data is available
  const fallbackMembers: MemberData[] = [
    { id: '1', name: 'Dwayne', description: 'Founder', image: '/members/Dwayne.png' },
    { id: '2', name: 'Adina', description: 'Designer', image: '/members/Adina.png' },
    { id: '3', name: 'Deniz', description: 'Developer', image: '/members/Deniz.png' },
    { id: '4', name: 'Erin', description: 'UX Researcher', image: '/members/erin.png' },
    { id: '5', name: 'Florido', description: 'Motion Designer', image: '/members/Florido.png' },
    { id: '6', name: 'James', description: 'Frontend Dev', image: '/members/James.png' },
    { id: '7', name: 'Jennifer', description: 'Product Manager', image: '/members/Jennifer.png' },
    { id: '8', name: 'Joshua', description: 'Backend Dev', image: '/members/Joshua.png' },
    { id: '9', name: 'Karolina', description: 'Brand Strategist', image: '/members/Karolina.png' },
    { id: '10', name: 'Koen', description: 'AI Engineer', image: '/members/Koen.png' },
    { id: '11', name: 'Martin', description: 'DevOps', image: '/members/Martin.png' },
    { id: '12', name: 'Pax', description: 'Content Strategist', image: '/members/Pax.png' },
    { id: '13', name: 'Rui', description: 'UI Designer', image: '/members/Rui.png' },
    { id: '14', name: 'John', description: 'Technologist', image: '/members/john.png' }
  ];

  // Use fallback data if no member data is provided
  const activeMembers = memberData.length > 0 ? memberData : fallbackMembers;

  // Initialize Three.js scene with VW Lab style 3D slider
  useEffect(() => {
    if (!mountRef.current || activeMembers.length === 0) return;

    // Calculate footer height
    const calculatedFooterHeight = window.innerWidth >= 768 ? 112 : 94;
    setFooterHeight(calculatedFooterHeight);

    // Scene setup
      const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.01); // Subtle fog for depth
    sceneRef.current = scene;

        // Camera setup - VW Lab positioning
      const camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / (window.innerHeight - calculatedFooterHeight), 
      0.1, 
      1000
    );
    camera.position.set(0, 0, 12); // VW Lab camera position
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight - calculatedFooterHeight);
    renderer.setClearColor(0x000000);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting setup for dramatic effect
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
      scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

    // Additional rim lighting for dramatic effect
    const rimLight = new THREE.DirectionalLight(0x4080ff, 0.3);
    rimLight.position.set(-10, -5, -5);
    scene.add(rimLight);

    // Create member planes in circular arrangement (VW Lab style)
    const planes: THREE.Mesh[] = [];
    const angleStep = (Math.PI * 2) / totalMembers;

    for (let i = 0; i < totalMembers; i++) {
      const angle = i * angleStep;
      const memberIndex = i % activeMembers.length;
      const member = activeMembers[memberIndex];

      // Create plane geometry with higher segments for potential effects
      const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 32, 32);
      
      // VW Lab style material - clean and simple
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: false
      });
      
      const plane = new THREE.Mesh(geometry, material);
      
      // Position in perfect circle
      plane.position.x = Math.cos(angle) * radius;
      plane.position.z = Math.sin(angle) * radius;
      plane.position.y = 0;
      
      // Make plane face center - VW Lab style
      plane.lookAt(0, 0, 0);
      
      // Store member data for infinite loop
      plane.userData = { 
        member, 
        originalIndex: i,
        currentMemberIndex: memberIndex
      };
      
      scene.add(plane);
      planes.push(plane);

      // Load texture asynchronously
      const textureLoader = new THREE.TextureLoader();
      textureLoader.crossOrigin = 'anonymous';
      
      textureLoader.load(
        member.image,
        (texture) => {
          texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          
          // Fix upside down images by flipping Y
          texture.flipY = false;
          texture.center.set(0.5, 0.5);
          texture.rotation = Math.PI; // Rotate 180 degrees to fix orientation
          
          // Apply texture and make it visible
          material.map = texture;
          material.needsUpdate = true;
        },
        undefined,
        (error) => {
          console.warn(`Failed to load texture for ${member.name}:`, error);
          // Keep the gray fallback material
        }
      );
    }

    planesRef.current = planes;

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [activeMembers, totalMembers, radius, planeWidth, planeHeight]);

  // Animation loop with VW Lab style smooth rotation
  useEffect(() => {
    const animate = () => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

      // VW Lab style rotation - more responsive and direct
      const rotationDiff = targetRotation - rotation;
      const newRotation = rotation + rotationDiff * 0.15; // More responsive like VW Lab
      setRotation(newRotation);

      // VW Lab style momentum physics
      if (!isDragging && Math.abs(velocity) > 0.001) {
        setTargetRotation(prev => prev + velocity);
        setVelocity(prev => prev * 0.95); // Quicker momentum decay like VW Lab
      }

      // Update plane positions - VW Lab clean style
      planesRef.current.forEach((plane, index) => {
        const angleStep = (Math.PI * 2) / totalMembers;
        const angle = (index * angleStep) + newRotation;
        
        // VW Lab positioning - clean circular arrangement
        plane.position.x = Math.cos(angle) * radius;
        plane.position.z = Math.sin(angle) * radius;
        plane.position.y = 0; // No floating - clean like VW Lab
        
        // Always face the center - VW Lab style
        plane.lookAt(0, 0, 0);

        // Update member data for infinite loop
        const rotationCycles = Math.floor(Math.abs(newRotation) / (Math.PI * 2));
        const memberIndex = (index + rotationCycles) % activeMembers.length;
        
        // Update texture if member changed
        if (plane.userData.currentMemberIndex !== memberIndex) {
          plane.userData.currentMemberIndex = memberIndex;
          const member = activeMembers[memberIndex];
          
          const textureLoader = new THREE.TextureLoader();
          textureLoader.crossOrigin = 'anonymous';
                    textureLoader.load(
            member.image,
          (texture) => {
              texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
              texture.minFilter = THREE.LinearFilter;
              texture.magFilter = THREE.LinearFilter;
              
              // Fix upside down images by flipping Y
              texture.flipY = false;
              texture.center.set(0.5, 0.5);
              texture.rotation = Math.PI; // Rotate 180 degrees to fix orientation
              
                            if (plane.material instanceof THREE.MeshBasicMaterial) {
                plane.material.map = texture;
                plane.material.needsUpdate = true;
            }
          },
          undefined,
            (error) => {
              console.warn(`Failed to load texture for ${member.name}:`, error);
            }
          );
        }

        // Keep VW Lab simple - no complex scaling effects
      });

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [rotation, targetRotation, velocity, isDragging, activeMembers, totalMembers, radius]);

    // VW Lab style interactions - exactly like their implementation
  useEffect(() => {
    if (!rendererRef.current) return;

    const canvas = rendererRef.current.domElement;
    let startX = 0;
    let currentX = 0;
    let isPointerDown = false;

    const handlePointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      startX = e.clientX;
      currentX = e.clientX;
      setIsDragging(true);
      setVelocity(0);
        canvas.style.cursor = 'grabbing';
      canvas.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      
      currentX = e.clientX;
      const deltaX = currentX - startX;
      
      // VW Lab sensitivity - much more responsive
      const sensitivity = 0.01;
      const deltaRotation = deltaX * sensitivity;
      
      setTargetRotation(deltaRotation);
      setVelocity(deltaRotation * 0.1);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isPointerDown) return;
      
      isPointerDown = false;
      setIsDragging(false);
        canvas.style.cursor = 'grab';
      canvas.releasePointerCapture(e.pointerId);
      
      // Add momentum based on final velocity
      const finalDelta = (currentX - startX) * 0.01;
      setVelocity(finalDelta * 0.1);
    };

    // VW Lab uses wheel for additional control
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
      const wheelSensitivity = 0.002;
      const deltaRotation = e.deltaY * wheelSensitivity;
      
      setTargetRotation(prev => prev + deltaRotation);
      setVelocity(deltaRotation * 0.1);
    };

    // Handle window resize
      const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current) return;
      
      const calculatedFooterHeight = window.innerWidth >= 768 ? 112 : 94;
      setFooterHeight(calculatedFooterHeight);
      
      const newHeight = window.innerHeight - calculatedFooterHeight;
      
      cameraRef.current.aspect = window.innerWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, newHeight);
    };

    // Attach events to canvas like VW Lab
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('resize', handleResize);

      return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (activeMembers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-lg">No members available...</div>
      </div>
    );
  }

  return (
    <div 
      className="fixed top-0 left-0 right-0 bg-black overflow-hidden select-none"
      style={{ bottom: `${footerHeight}px` }}
    >
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />
      
      {/* Instructions overlay with VW Lab style */}
      <div className="absolute top-6 left-6 text-white/60 text-sm font-light pointer-events-none z-10">
        <p>Drag to rotate • Infinite 3D Gallery</p>
        <p className="text-xs mt-1 opacity-75">Inspired by VW Lab</p>
      </div>

      {/* Member count overlay */}
      <div className="absolute bottom-6 left-6 text-white/80 text-sm font-light pointer-events-none z-10">
        <p>Showcasing {activeMembers.length} creative minds</p>
      </div>

      {/* Current member indicator */}
      <div className="absolute top-6 right-6 text-white/60 text-sm font-light pointer-events-none z-10">
        <p>Circular Gallery</p>
      </div>
    </div>
  );
};

export default MembersGallery;