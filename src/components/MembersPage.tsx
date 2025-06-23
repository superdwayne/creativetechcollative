import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Loader2 } from 'lucide-react';
import RotatingCube from './RotatingCube';
import Footer from './ui/footer';
import { getWebhookUrl } from '@/utils/webhookUtils';

interface MemberData {
  id: string;
  name: string;
  description: string;
  image: string;
  offset?: { x: number; y: number };
}

const MembersPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const titlesRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadingProgress, setLoadingProgress] = React.useState(0);
  const [memberData, setMemberData] = useState<MemberData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch member data from webhook
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setError(null);
        console.log('=== MEMBERS FETCH DEBUG ===');
        
        // Use the webhook utility to get the correct URL based on environment
        const webhookUrl = getWebhookUrl('members');
        const username = import.meta.env.VITE_N8N_BASIC_AUTH_USERNAME;
        const password = import.meta.env.VITE_N8N_BASIC_AUTH_PASSWORD;
        
        console.log('Webhook URL:', webhookUrl);
        console.log('Test mode:', import.meta.env.VITE_TEST === 'TRUE');
        console.log('Username configured:', !!username);
        console.log('Password configured:', !!password);

        if (!username || !password) {
          throw new Error('Authentication credentials not configured');
        }

        // Create Basic Auth header
        const basicAuth = btoa(`${username}:${password}`);

        const response = await fetch(webhookUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json'
          },
          // Add timeout
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch members: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Raw webhook data:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          // Transform the webhook data to match our MemberData interface
          const transformedMembers: MemberData[] = data
            .map((item: any, index: number) => {
              console.log(`Processing member ${index}:`, item);
              
              // Handle the image field - it might be an array
              let imageUrl = '';
              if (item.property_image) {
                if (Array.isArray(item.property_image) && item.property_image.length > 0) {
                  imageUrl = item.property_image[0];
                } else if (typeof item.property_image === 'string') {
                  imageUrl = item.property_image;
                }
              }
              
              // Generate random offset for positioning
              const offset = {
                x: 0,
                y: (Math.random() - 0.5) * 60 // Random offset between -30 and 30
              };

              const transformed = {
                id: item.id || `member-${index}`,
                name: item.property_title || item.name || 'Unknown Member',
                description: item.property_description || 'Team Member',
                image: imageUrl || '/members/default.png',
                offset
              };
              
              console.log(`Transformed member ${index}:`, transformed);
              return transformed;
            })
            .filter((member: MemberData) => member.name && member.name !== 'Unknown Member');

          console.log(`Final transformed members count: ${transformedMembers.length}`);
          setMemberData(transformedMembers);
        } else {
          console.log('No member data received or data is not an array:', data);
          setMemberData([]);
        }
      } catch (err: any) {
        console.error('Error fetching members:', err);
        
        if (err.name === 'TimeoutError') {
          setError('Request timed out. Please try again.');
        } else if (err.message.includes('Failed to fetch')) {
          setError('Unable to connect to the server. Please check your connection.');
        } else {
          setError(err.message || 'Failed to load members. Please try again later.');
        }
        
        // Fallback to empty array on error
        setMemberData([]);
      }
    };

    fetchMembers();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || !particlesRef.current || !titlesRef.current || memberData.length === 0) return;

    // Set initial loading state
    setIsLoading(true);
    setLoadingProgress(10);

    // Create ambient particles
    const createParticles = () => {
      // Particles removed to prevent cube clipping
      setLoadingProgress(20);
    };

    // Initialize Three.js scene
    const initThreeJS = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        preserveDrawingBuffer: true,
        alpha: true
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      setLoadingProgress(30);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000);
      scene.fog = new THREE.FogExp2(0x000, 0.08);

      const camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        100
      );
      camera.position.z = 5;

      setLoadingProgress(40);

      // Lights
      const ambientLight = new THREE.AmbientLight(0x404040, 1);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(0, 1, 1);
      scene.add(directionalLight);

      const pointLight = new THREE.PointLight(0xffffff, 2, 10);
      pointLight.position.set(0, 0, 2);
      scene.add(pointLight);

      setLoadingProgress(50);

      // Gallery settings
      const slideWidth = 3.2;
      const slideHeight = 1.8;
      const gap = 0.25;
      const slideCount = memberData.length;
      const totalWidth = slideCount * (slideWidth + gap);
      const slideUnit = slideWidth + gap;

      setLoadingProgress(60);

      // Settings
      const settings = {
        wheelSensitivity: 0.01,
        touchSensitivity: 0.01,
        momentumMultiplier: 2.5,
        smoothing: 0.1,
        slideLerp: 0.075,
        distortionDecay: 0.93,
        maxDistortion: 4.0,
        distortionSensitivity: 0.25,
        distortionSmoothing: 0.075,
        rotationFactor: 0.2,
        animationSpeed: 0.5,
        textFadeStart: slideWidth / 2,
        textFadeEnd: slideWidth / 2 + 0.5,
        textMaxBlur: 5,
        distortionIntensity: 0.3,
        horizontalDistortionDamping: 0.3,
        momentumDistortionBoost: 0.3,
        directionInfluence: 0.4,
        waveAmplitudeBoost: 0.2,
        directionChangeThreshold: 0.02,
        directionSmoothing: 0.03
      };

      // State variables
      const slides: THREE.Mesh[] = [];
      let currentPosition = 0;
      let targetPosition = 0;
      let isScrolling = false;
      let autoScrollSpeed = 0;
      let lastTime = 0;
      let touchStartX = 0;
      let touchLastX = 0;
      let globalTime = 0;
      let currentDistortionFactor = 0;
      let targetDistortionFactor = 0;
      let peakVelocity = 0;
      let velocityHistory = [0, 0, 0, 0, 0];
      let movementDirection = new THREE.Vector2(0, 0);
      let accumulatedMovement = 0;
      let lastMovementInput = 0;

      const imagesCount = memberData.length;

      // Random member selection
      const getRandomMemberIndex = () => Math.floor(Math.random() * memberData.length);
      const randomStartIndex = getRandomMemberIndex();

      // Create title elements
      const titleElements: any[] = [];
      const titlesContainer = titlesRef.current;
      
      if (titlesContainer) {
        // Clear any existing titles
        titlesContainer.innerHTML = '';
        
        setLoadingProgress(70);
        
        for (let i = 0; i < slideCount; i++) {
          const memberInfo = memberData[i];
          
          const titleEl = document.createElement('div');
          titleEl.className = 'slide-title';
          titleEl.style.cssText = `
            position: absolute;
            color: white;
            pointer-events: none;
            transition: opacity 0.3s ease, filter 0.3s ease;
          `;

          const titleText = document.createElement('h1');
          titleText.className = 'title-text';
          titleText.textContent = memberInfo.name;
          titleText.style.cssText = `
            font-family: var(--font-primary) !important;
            font-size: clamp(3rem, 12vw, 6vw);
            line-height: 0.9;
            font-weight: 500;
            letter-spacing: -0.03em;
            margin: 0;
            white-space: nowrap;
            text-transform: none;
          `;

          const jobTitle = document.createElement('p');
          jobTitle.className = 'job-title';
          jobTitle.textContent = memberInfo.description;
          jobTitle.style.cssText = `
            font-family: var(--font-secondary) !important;
            font-size: clamp(0.75rem, 2.5vw, 1vw);
            margin: 0;
            margin-bottom: 8px;
            color: rgba(255, 255, 255, 0.9);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            text-shadow: 
              -1px -1px 0 #000,
              1px -1px 0 #000,
              -1px 1px 0 #000,
              1px 1px 0 #000,
              0 0 3px rgba(0, 0, 0, 0.8);
          `;

          const titleNumber = document.createElement('p');
          titleNumber.className = 'title-number';
          titleNumber.innerHTML = `${memberInfo.description.replace(/\n/g, '<br>')}`;
          titleNumber.style.cssText = `
            font-family: var(--font-secondary) !important;
            font-size: clamp(0.875rem, 3vw, 1.2vw);
            margin: 0;
            position: relative;
            padding-top: 10px;
            display: block;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            line-height: 1.4;
            padding-left: 60px;
          `;

          // Add the stroke as a pseudo-element using CSS
          const style = document.createElement('style');
          style.textContent = `
            .title-number::before {
              content: "";
              position: absolute;
              left: 0;
              top: 10px;
              width: 40px;
              height: 3px;
              background-color: #254d62;
              transform: translateY(0.6em);
            }
          `;
          document.head.appendChild(style);

          titleEl.appendChild(titleText);
          titleEl.appendChild(titleNumber);
          titleEl.style.opacity = '0';
          titleEl.style.filter = 'blur(0px)';
          titlesContainer.appendChild(titleEl);

          titleElements.push({
            element: titleEl,
            offset: memberInfo.offset || { x: 0, y: 0 },
            index: i
          });
        }
      }

      // Create slides
      const createSlide = (index: number) => {
        const geometry = new THREE.PlaneGeometry(slideWidth, slideHeight, 64, 32);
        const material = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
          metalness: 0.2,
          roughness: 0.8,
          clearcoat: 0.4,
          clearcoatRoughness: 0.3,
          transparent: true,
          opacity: 0
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = index * (slideWidth + gap);
        mesh.userData = {
          originalVertices: [...geometry.attributes.position.array],
          index,
          time: Math.random() * 1000,
          waveSpeed: 0.5 + Math.random() * 0.5,
          waveAmplitude: 1.0,
          wavePhase: Math.random() * Math.PI * 2
        };

        const memberInfo = memberData[index];
        const imagePath = memberInfo.image;
        
        new THREE.TextureLoader().load(
          imagePath,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            material.map = texture;
            material.opacity = 1;
            material.needsUpdate = true;
            
            const imgAspect = texture.image.width / texture.image.height;
            const slideAspect = slideWidth / slideHeight;
            if (imgAspect > slideAspect) {
              mesh.scale.y = slideAspect / imgAspect;
            } else {
              mesh.scale.x = imgAspect / slideAspect;
            }
          },
          undefined,
          (err) => {
            console.warn(`Couldn't load image ${imagePath}`, err);
            // Set a default color if image fails to load
            material.color.setHex(0x333333);
            material.opacity = 1;
            material.needsUpdate = true;
          }
        );

        scene.add(mesh);
        slides.push(mesh);
      };

      // Create all slides
      for (let i = 0; i < slideCount; i++) {
        createSlide(i);
        setLoadingProgress(80 + (i / slideCount) * 15);
      }

      setLoadingProgress(95);

      // Position slides
      slides.forEach((slide) => {
        slide.position.x -= totalWidth / 2;
        slide.userData.targetX = slide.position.x;
        slide.userData.currentX = slide.position.x;
        slide.rotation.x = (Math.random() - 0.5) * 0.1;
        slide.rotation.y = (Math.random() - 0.5) * 0.1;
      });

      // Set initial position to random member
      const randomOffset = randomStartIndex * slideUnit;
      currentPosition = randomOffset;
      targetPosition = randomOffset;

      // Update title positions
      const updateTitlePositions = () => {
        titleElements.forEach((titleObj) => {
          const slide = slides[titleObj.index];
          if (!slide) return;
          
          const { element, offset } = titleObj;

          const vector = new THREE.Vector3(
            slide.position.x,
            slide.position.y,
            slide.position.z
          );
          vector.project(camera);

          const screenX = (vector.x * 0.5 + 0.5) * window.innerWidth;
          const screenY = (-vector.y * 0.5 + 0.5) * window.innerHeight;

          // Center the title horizontally
          element.style.left = '50%';
          element.style.top = `${screenY + offset.y}px`;
          element.style.transform = `translateX(-50%)`;

          const distanceFromCenter = Math.abs(slide.position.x);
          let opacity;
          if (distanceFromCenter < settings.textFadeStart) {
            opacity = 1;
          } else if (distanceFromCenter > settings.textFadeEnd) {
            opacity = 0;
          } else {
            opacity = 1 - (distanceFromCenter - settings.textFadeStart) / (settings.textFadeEnd - settings.textFadeStart);
          }

          element.style.opacity = opacity.toFixed(2);
          const blurValue = (1 - opacity) * settings.textMaxBlur;
          element.style.filter = `blur(${blurValue}px)`;
        });
      };

      // Distortion function
      const updateDistortion = (mesh: THREE.Mesh, distortionFactor: number, deltaTime: number) => {
        mesh.userData.time += deltaTime * settings.animationSpeed * mesh.userData.waveSpeed;
        const time = mesh.userData.time;
        const positionAttribute = mesh.geometry.attributes.position;
        const originalVertices = mesh.userData.originalVertices;

        const momentumBoost = Math.min(1.0, peakVelocity * settings.momentumDistortionBoost);
        const targetWaveAmplitude = 1.0 + momentumBoost * settings.waveAmplitudeBoost * 3.0;
        mesh.userData.waveAmplitude = mesh.userData.waveAmplitude || 1.0;
        mesh.userData.waveAmplitude += (targetWaveAmplitude - mesh.userData.waveAmplitude) * 0.05;

        const effectiveDistortion = distortionFactor * settings.distortionIntensity;
        const gravityCenterX = Math.sin(time * 0.1) * 0.5;
        const gravityCenterY = Math.cos(time * 0.15) * 0.3;
        const gravityStrength = Math.min(2.0, Math.max(0, effectiveDistortion)) * 2.0;

        for (let i = 0; i < positionAttribute.count; i++) {
          const x = originalVertices[i * 3];
          const y = originalVertices[i * 3 + 1];
          const z = originalVertices[i * 3 + 2];

          const distX = x - gravityCenterX;
          const distY = y - gravityCenterY;
          const dist = Math.sqrt(distX * distX + distY * distY + 0.0001);
          const gravityFactor = Math.min(1, 1 / (1 + dist * 8));

          const pullX = distX * gravityFactor * gravityStrength * 0.5;
          const pullY = distY * gravityFactor * gravityStrength * 0.5;

          const waveScale = mesh.userData.waveAmplitude;
          const phase = mesh.userData.wavePhase;
          const pulse = Math.sin(time + dist * 3 + phase) * 0.05 * effectiveDistortion * waveScale;

          const newX = x + Math.min(1, Math.max(-1, pullX));
          const newY = y + Math.min(1, Math.max(-1, pullY));
          const newZ = Math.min(2, Math.max(-2, (gravityFactor * gravityStrength + pulse) * (1 + Math.min(5, dist))));

          positionAttribute.setXYZ(i, newX, newY, newZ);
        }

        positionAttribute.needsUpdate = true;
        mesh.geometry.computeVertexNormals();

        const targetRotFactor = Math.min(0.2, effectiveDistortion) * settings.rotationFactor * (1 + momentumBoost * 0.5);
        mesh.userData.currentRotFactor = mesh.userData.currentRotFactor || 0;
        mesh.userData.currentRotFactor += (targetRotFactor - mesh.userData.currentRotFactor) * 0.1;
        const rotFactor = mesh.userData.currentRotFactor;

        mesh.rotation.x = Math.sin(time * 0.2) * 0.1 * rotFactor;
        mesh.rotation.y = Math.sin(time * 0.3 + 0.5) * 0.1 * rotFactor;
        mesh.rotation.z = rotFactor * 0.05 * Math.sin(time * 0.1);
      };

      // Mouse movement for light
      const handleMouseMove = (e: MouseEvent) => {
        const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        pointLight.position.x = mouseX * 3;
        pointLight.position.y = mouseY * 2;
      };

      // Drag functionality
      let isDragging = false;
      let dragStartX = 0;
      let dragLastX = 0;

      const handleMouseDown = (e: MouseEvent) => {
        isDragging = true;
        dragStartX = e.clientX;
        dragLastX = dragStartX;
        canvas.style.cursor = 'grabbing';
      };

      const handleMouseMoveCanvas = (e: MouseEvent) => {
        if (!isDragging) return;
        const mouseX = e.clientX;
        const deltaX = mouseX - dragLastX;
        
        accumulatedMovement += deltaX;
        const now = performance.now();
        const timeDelta = now - lastMovementInput;
        
        if (Math.abs(accumulatedMovement) > 1 || timeDelta > 50) {
          dragLastX = mouseX;
          const dragStrength = Math.abs(accumulatedMovement) * 0.02;
          targetDistortionFactor = Math.min(1.0, targetDistortionFactor + dragStrength);
          targetPosition -= accumulatedMovement * settings.touchSensitivity;
          accumulatedMovement = 0;
          lastMovementInput = now;
        }
      };

      const handleMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        canvas.style.cursor = 'grab';
        
        const velocity = (dragLastX - dragStartX) * 0.005;
        if (Math.abs(velocity) > 0.5) {
          autoScrollSpeed = -velocity * settings.momentumMultiplier * 0.05;
          targetDistortionFactor = Math.min(1.0, Math.abs(velocity) * 3 * settings.distortionSensitivity);
          isScrolling = true;
          setTimeout(() => {
            isScrolling = false;
          }, 800);
        }
      };

      // Wheel handling
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const wheelStrength = Math.abs(e.deltaY) * 0.001;
        targetDistortionFactor = Math.min(1.0, targetDistortionFactor + wheelStrength);
        targetPosition -= e.deltaY * settings.wheelSensitivity;
        isScrolling = true;
        autoScrollSpeed = Math.min(Math.abs(e.deltaY) * 0.0005, 0.05) * Math.sign(e.deltaY);
        
        clearTimeout((window as any).scrollTimeout);
        (window as any).scrollTimeout = setTimeout(() => {
          isScrolling = false;
        }, 150);
      };

      // Touch handling
      const handleTouchStart = (e: TouchEvent) => {
        touchStartX = e.touches[0].clientX;
        touchLastX = touchStartX;
        isScrolling = false;
      };

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const touchX = e.touches[0].clientX;
        const deltaX = touchX - touchLastX;
        
        accumulatedMovement += deltaX;
        const now = performance.now();
        const timeDelta = now - lastMovementInput;
        
        if (Math.abs(accumulatedMovement) > 1 || timeDelta > 50) {
          touchLastX = touchX;
          const touchStrength = Math.abs(accumulatedMovement) * 0.02;
          targetDistortionFactor = Math.min(1.0, targetDistortionFactor + touchStrength);
          targetPosition -= accumulatedMovement * settings.touchSensitivity;
          accumulatedMovement = 0;
          lastMovementInput = now;
          isScrolling = true;
        }
      };

      const handleTouchEnd = () => {
        const velocity = (touchLastX - touchStartX) * 0.005;
        if (Math.abs(velocity) > 0.5) {
          autoScrollSpeed = -velocity * settings.momentumMultiplier * 0.05;
          targetDistortionFactor = Math.min(1.0, Math.abs(velocity) * 3 * settings.distortionSensitivity);
          movementDirection.x = Math.sign(velocity) * -1;
          isScrolling = true;
          setTimeout(() => {
            isScrolling = false;
          }, 800);
        }
      };

      // Resize handling
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        updateTitlePositions();
      };

      // Animation loop
      const animate = (time: number) => {
        requestAnimationFrame(animate);
        const deltaTime = lastTime ? (time - lastTime) / 1000 : 0.016;
        lastTime = time;
        globalTime += deltaTime;

        pointLight.color.set(0xffffff);

        const prevPos = currentPosition;
        if (isScrolling) {
          targetPosition += autoScrollSpeed;
          const speedBasedDecay = 0.97 - Math.abs(autoScrollSpeed) * 0.5;
          autoScrollSpeed *= Math.max(0.92, speedBasedDecay);
          if (Math.abs(autoScrollSpeed) < 0.001) {
            autoScrollSpeed = 0;
          }
        }

        const positionDelta = Math.abs(targetPosition - currentPosition);
        const adaptiveSmoothing = settings.smoothing * (positionDelta < 0.1 ? 0.5 : 1.0);
        currentPosition += (targetPosition - currentPosition) * adaptiveSmoothing;

        const currentVelocity = Math.abs(currentPosition - prevPos) / deltaTime;
        const significantVelocity = currentVelocity > 0.01 ? currentVelocity : 0;
        velocityHistory.push(significantVelocity);
        velocityHistory.shift();

        const weights = [0.1, 0.15, 0.2, 0.25, 0.3];
        let weightSum = 0;
        let weightedVelocity = 0;
        for (let i = 0; i < velocityHistory.length; i++) {
          weightedVelocity += velocityHistory[i] * weights[i];
          weightSum += weights[i];
        }
        const avgVelocity = weightSum > 0 ? weightedVelocity / weightSum : 0;

        if (avgVelocity > peakVelocity) {
          peakVelocity += (avgVelocity - peakVelocity) * 0.3;
          const accelerationBoost = Math.min(0.1, avgVelocity * 0.03);
          targetDistortionFactor = Math.min(settings.maxDistortion, targetDistortionFactor + accelerationBoost);
        }

        peakVelocity *= 0.98;

        const movementDistortion = Math.min(1.0, currentVelocity * currentVelocity * 2);
        if (currentVelocity > 0.03) {
          const blendFactor = Math.min(0.2, currentVelocity);
          targetDistortionFactor += (movementDistortion - targetDistortionFactor) * blendFactor;
        }

        const velocityRatio = avgVelocity / (peakVelocity + 0.001);
        const isDecelerating = velocityRatio < 0.7 && peakVelocity > 0.3;

        if (isDecelerating) {
          targetDistortionFactor *= settings.distortionDecay * 1.01;
        } else if (avgVelocity < 0.1) {
          targetDistortionFactor *= settings.distortionDecay * 0.9;
        }

        const distortionDelta = Math.abs(targetDistortionFactor - currentDistortionFactor);
        const adaptiveDistortionSmoothing = settings.distortionSmoothing * (distortionDelta < 0.05 ? 0.5 : 1.0);
        currentDistortionFactor += (targetDistortionFactor - currentDistortionFactor) * adaptiveDistortionSmoothing;

        slides.forEach((slide, i) => {
          let baseX = i * slideUnit - currentPosition;
          baseX = ((baseX % totalWidth) + totalWidth) % totalWidth;
          if (baseX > totalWidth / 2) {
            baseX -= totalWidth;
          }
          if (Math.abs(baseX - slide.userData.targetX) > slideWidth * 2) {
            slide.userData.currentX = baseX;
          }
          slide.userData.targetX = baseX;
          slide.userData.currentX += (slide.userData.targetX - slide.userData.currentX) * settings.slideLerp;

          if (Math.abs(slide.userData.currentX) < totalWidth / 2 + slideWidth * 1.5) {
            slide.position.x = slide.userData.currentX;
            const distanceFromCenter = Math.abs(slide.userData.currentX);
            
            if (distanceFromCenter < slideWidth * 3) {
              updateDistortion(slide, currentDistortionFactor, deltaTime);
            }
          }
        });

        updateTitlePositions();
        renderer.render(scene, camera);
      };

      // Event listeners
      window.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMoveCanvas);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('resize', handleResize);

      canvas.style.cursor = 'grab';

      // Start animation
      animate(0);

      // Cleanup function
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMoveCanvas);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('wheel', handleWheel);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
        window.removeEventListener('resize', handleResize);
        
        // Dispose of Three.js resources
        slides.forEach(slide => {
          if (slide.geometry) slide.geometry.dispose();
          if (slide.material) {
            if (Array.isArray(slide.material)) {
              slide.material.forEach(mat => mat.dispose());
            } else {
              slide.material.dispose();
            }
          }
        });
        renderer.dispose();
      };
    };

    createParticles();
    const cleanup = initThreeJS();
    
    // Set loading complete
    setTimeout(() => {
      setLoadingProgress(100);
      setIsLoading(false);
    }, 500);

    return cleanup;
  }, [memberData]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Error Loading Members</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-black">
      {/* Loading Screen */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <RotatingCube />
          <div className="mt-8 flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
            <span className="text-white text-lg">Loading Members... {loadingProgress}%</span>
          </div>
        </div>
      )}

      {/* Particles Background */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none" />

      {/* Three.js Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Title Overlay */}
      <div ref={titlesRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Footer */}
      <div ref={footerRef} className="absolute bottom-0 left-0 right-0 z-20">
        <Footer />
      </div>
    </div>
  );
};

export default MembersPage;