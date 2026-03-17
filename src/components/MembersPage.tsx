import React, { useRef, useEffect, useState } from 'react';

import { Loader2 } from 'lucide-react';
import RotatingCube from './RotatingCube';
import Footer from './ui/footer';
import { getWebhookUrl } from '@/utils/webhookUtils';
import { MemberData } from '../types/member';



const MembersPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [memberData, setMemberData] = useState<MemberData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Canvas and infinite grid state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Camera/viewport state
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [footerHeight, setFooterHeight] = useState(94);
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });
  const [hoveredMember, setHoveredMember] = useState<{member: MemberData, gridX: number, gridY: number} | null>(null);
  
  // Grid settings
  const cellSize = 350; // Size of each grid cell
  const imageSize = 300; // Size of member images
  const maxVelocity = 4; // Reduced from 8 for slower movement
  const friction = 0.98; // Increased from 0.95 for more friction
  
  // Fallback data when no member data is available
  const fallbackMembers: MemberData[] = [
    { 
      id: '1', 
      name: 'Dwayne', 
      description: 'Founder', 
      role: 'Founder & CEO',
      image: '/members/Dwayne.png',
      bio: 'Visionary leader passionate about building the future of creative technology. Bringing together diverse minds to solve complex challenges.',
      skills: ['Strategy', 'Leadership', 'Innovation', 'Product Vision'],
      location: 'San Francisco, CA'
    },
    { 
      id: '2', 
      name: 'Adina', 
      description: 'Designer', 
      role: 'Creative Director',
      image: '/members/Adina.png',
      bio: 'Award-winning designer with a passion for creating beautiful, intuitive experiences that users love.',
      skills: ['UI/UX Design', 'Brand Design', 'Design Systems', 'Figma'],
      location: 'Berlin, Germany'
    },
    { 
      id: '3', 
      name: 'Deniz', 
      description: 'Developer', 
      role: 'Full Stack Engineer',
      image: '/members/Deniz.png',
      bio: 'Full-stack developer who loves building scalable applications and exploring new technologies.',
      skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
      location: 'Istanbul, Turkey'
    },
    { 
      id: '4', 
      name: 'Olivia', 
      description: 'Creative Technologist', 
      role: 'Creative Technologist',
      image: '/members/erin.png',
      bio: 'Creative technologist bridging the gap between design and technology, crafting innovative digital experiences that inspire and engage.',
      skills: ['Creative Technology', 'Digital Innovation', 'Experience Design', 'Strategy'],
      location: 'London, UK',
      quote: 'I see experimentation as a method of building mental flexibility – an important substance for being able to engage with others and the world around me.'
    },
    { 
      id: '5', 
      name: 'Florido', 
      description: 'Motion Designer', 
      role: 'Motion Graphics Designer',
      image: '/members/Florido.png',
      bio: 'Creative storyteller bringing ideas to life through motion design and animation.',
      skills: ['After Effects', 'Cinema 4D', 'Animation', 'Video Editing'],
      location: 'Barcelona, Spain'
    },
    { 
      id: '6', 
      name: 'James', 
      description: 'Frontend Dev', 
      role: 'Frontend Engineer',
      image: '/members/James.png',
      bio: 'Frontend specialist focused on performance, accessibility, and modern web technologies.',
      skills: ['React', 'Vue.js', 'CSS', 'Web Performance'],
      location: 'Toronto, Canada'
    },
    { 
      id: '7', 
      name: 'Jennifer', 
      description: 'Product Manager', 
      role: 'Senior Product Manager',
      image: '/members/Jennifer.png',
      bio: 'Strategic product leader with a track record of launching successful digital products.',
      skills: ['Product Strategy', 'Analytics', 'User Stories', 'Roadmapping'],
      location: 'New York, NY'
    },
    { 
      id: '8', 
      name: 'Joshua', 
      description: 'Backend Dev', 
      role: 'Backend Engineer',
      image: '/members/Joshua.png',
      bio: 'Backend engineer passionate about building robust, scalable systems and APIs.',
      skills: ['Python', 'PostgreSQL', 'Docker', 'Microservices'],
      location: 'Austin, TX'
    },
    { 
      id: '9', 
      name: 'Karolina', 
      description: 'Brand Strategist', 
      role: 'Brand Strategy Lead',
      image: '/members/Karolina.png',
      bio: 'Brand strategist helping companies define their voice and connect with their audience.',
      skills: ['Brand Strategy', 'Marketing', 'Copywriting', 'Market Research'],
      location: 'Warsaw, Poland',
      quote: 'I believe that connection is a form of magic. As creative technologists, we conceptualize and build genuine experiences that bring a sense of awe, ease, and wonder to our viewers.'
    },
    { 
      id: '10', 
      name: 'Koen', 
      description: 'AI Engineer', 
      role: 'Machine Learning Engineer',
      image: '/members/Koen.png',
      bio: 'AI researcher and engineer working on cutting-edge machine learning applications.',
      skills: ['Machine Learning', 'Python', 'TensorFlow', 'Data Science'],
      location: 'Amsterdam, Netherlands'
    },
    { 
      id: '11', 
      name: 'Martin', 
      description: 'DevOps', 
      role: 'DevOps Engineer',
      image: '/members/Martin.png',
      bio: 'Infrastructure expert ensuring reliable, scalable, and secure deployment pipelines.',
      skills: ['Kubernetes', 'AWS', 'CI/CD', 'Monitoring'],
      location: 'Prague, Czech Republic'
    },
    { 
      id: '12', 
      name: 'Pax', 
      description: 'Content Strategist', 
      role: 'Content Strategy Lead',
      image: '/members/Pax.png',
      bio: 'Content strategist crafting compelling narratives that engage and inspire audiences.',
      skills: ['Content Strategy', 'Writing', 'SEO', 'Social Media'],
      location: 'Melbourne, Australia'
    },
    { 
      id: '13', 
      name: 'Rui', 
      description: 'UI Designer', 
      role: 'Senior UI Designer',
      image: '/members/Rui.png',
      bio: 'Detail-oriented designer creating pixel-perfect interfaces with exceptional user experiences.',
      skills: ['UI Design', 'Prototyping', 'Design Systems', 'Interaction Design'],
      location: 'Lisbon, Portugal'
    },
    { 
      id: '14', 
      name: 'John', 
      description: 'Technologist', 
      role: 'Technology Strategist',
      image: '/members/john.png',
      bio: 'Technology visionary exploring emerging trends and their potential impact on the future.',
      skills: ['Technology Strategy', 'Innovation', 'Research', 'Consulting'],
      location: 'Seattle, WA'
    }
  ];

  // Use fallback data if no member data is provided
  const activeMembers = memberData.length > 0 ? memberData : fallbackMembers;
  
  // Image cache
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

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
                y: 0
              };

              const transformed = {
                id: item.id || `member-${index}`,
                name: item.property_title || item.name || 'Unknown Member',
                description: item.property_description || 'Team Member',
                image: imageUrl || '/members/default.png',
                quote: item.property_quote || item.quote || '', // Get quote from database
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
        
        setIsLoading(false);
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
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, []);
  
  // Enhanced image preloading with priority loading
  useEffect(() => {
    const loadImageWithFallback = (member: MemberData) => {
      if (imageCache.current.has(member.image)) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        imageCache.current.set(member.image, img);
        // Trigger a re-render when image loads
        if (animationRef.current) {
          render();
        }
      };
      
      img.onerror = () => {
        console.warn(`Failed to load image: ${member.image}, using fallback`);
        // Create a fallback image with member's initials
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          imageCache.current.set(member.image, fallbackImg);
          if (animationRef.current) {
            render();
          }
        };
        // Use a default image or create a canvas with initials
        fallbackImg.src = '/members/default.png';
      };
      
      img.src = member.image;
    };

    // Load first few images immediately (for initial view)
    const priorityMembers = activeMembers.slice(0, 8);
    priorityMembers.forEach(loadImageWithFallback);

    // Load remaining images with slight delay to not block priority loading
    setTimeout(() => {
      activeMembers.slice(8).forEach((member, index) => {
        setTimeout(() => loadImageWithFallback(member), index * 50);
      });
    }, 100);
  }, [activeMembers]);

  // Calculate footer height
  useEffect(() => {
    const calculateFooterHeight = () => {
      const height = window.innerWidth >= 768 ? 112 : 94;
      setFooterHeight(height);
    };
    
    calculateFooterHeight();
    window.addEventListener('resize', calculateFooterHeight);
    return () => window.removeEventListener('resize', calculateFooterHeight);
  }, []);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Get member for grid position - infinite tiling
  const getMemberAtPosition = (gridX: number, gridY: number): MemberData => {
    // Create infinite tiling pattern
    const memberIndex = (Math.abs(gridX) + Math.abs(gridY * 3)) % activeMembers.length;
    return activeMembers[memberIndex];
  };

  // Render function
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate visible grid bounds with padding
    const padding = 2;
    const startX = Math.floor((camera.x - padding * cellSize) / cellSize);
    const endX = Math.ceil((camera.x + width + padding * cellSize) / cellSize);
    const startY = Math.floor((camera.y - padding * cellSize) / cellSize);
    const endY = Math.ceil((camera.y + height + padding * cellSize) / cellSize);

    // Draw grid of member images
    for (let gridX = startX; gridX <= endX; gridX++) {
      for (let gridY = startY; gridY <= endY; gridY++) {
        const member = getMemberAtPosition(gridX, gridY);
        const image = imageCache.current.get(member.image);
        
        if (image && image.complete) {
          // Calculate position on screen
          const screenX = (gridX * cellSize) - camera.x;
          const screenY = (gridY * cellSize) - camera.y;
          
          // Only draw if visible
          if (screenX + imageSize > 0 && screenX < width && 
              screenY + imageSize > 0 && screenY < height) {
            
            // Draw image without rounded corners, maintaining aspect ratio
            const aspectRatio = image.width / image.height;
            let drawWidth = imageSize;
            let drawHeight = imageSize;
            
            if (aspectRatio > 1) {
              // Image is wider than tall
              drawHeight = imageSize / aspectRatio;
            } else {
              // Image is taller than wide
              drawWidth = imageSize * aspectRatio;
            }
            
            // Center the image within the cell
            const drawX = screenX + (cellSize - drawWidth) / 2;
            const drawY = screenY + (cellSize - drawHeight) / 2;
            
            ctx.drawImage(
              image, 
              drawX, 
              drawY, 
              drawWidth, 
              drawHeight
            );
            
            // Add subtle border around the actual image
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.strokeRect(
              drawX, 
              drawY, 
              drawWidth, 
              drawHeight
            );
            
            // Add member name overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(
              drawX, 
              drawY + drawHeight - 40, 
              drawWidth, 
              40
            );
            
            ctx.fillStyle = 'white';
            ctx.font = '14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
              member.name,
              drawX + drawWidth / 2,
              drawY + drawHeight - 15
            );

          }
        } else {
          // Draw enhanced placeholder for loading images
          const screenX = (gridX * cellSize) - camera.x;
          const screenY = (gridY * cellSize) - camera.y;
          
          if (screenX + imageSize > 0 && screenX < width && 
              screenY + imageSize > 0 && screenY < height) {
            
            const drawX = screenX + (cellSize - imageSize) / 2;
            const drawY = screenY + (cellSize - imageSize) / 2;
            
            // Animated loading placeholder
            const time = Date.now() * 0.002;
            const pulse = 0.3 + Math.sin(time + gridX + gridY) * 0.1;
            
            // Background
            ctx.fillStyle = `rgba(40, 40, 40, ${pulse})`;
            ctx.fillRect(drawX, drawY, imageSize, imageSize);
            
            // Border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.strokeRect(drawX, drawY, imageSize, imageSize);
            
            // Loading indicator - animated dots
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            const centerX = drawX + imageSize / 2;
            const centerY = drawY + imageSize / 2;
            
            for (let i = 0; i < 3; i++) {
              const dotTime = time + i * 0.5;
              const opacity = 0.2 + Math.sin(dotTime) * 0.2;
              ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
              ctx.beginPath();
              ctx.arc(centerX - 15 + i * 15, centerY, 3, 0, Math.PI * 2);
              ctx.fill();
            }
            
            // Member name placeholder
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(drawX, drawY + imageSize - 40, imageSize, 40);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
              member.name,
              drawX + imageSize / 2,
              drawY + imageSize - 15
            );
          }
        }
      }
    }
  };

  // Animation loop
  useEffect(() => {
    const animate = () => {
      // Apply momentum
      if (!isDragging && (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1)) {
        setCamera(prev => ({
          x: prev.x + velocity.x,
          y: prev.y + velocity.y
        }));
        
        setVelocity(prev => ({
          x: prev.x * friction,
          y: prev.y * friction
        }));
      }
      
      render();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [camera, velocity, isDragging, activeMembers, hoveredMember]);

  // Mouse/touch interaction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getEventPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const pos = getEventPos(e);
      setIsDragging(true);
      setLastMouse(pos);
      setMouseDownPos(pos);
      setHasDragged(false);
      setVelocity({ x: 0, y: 0 });
      canvas.style.cursor = 'grabbing';
    };

    const handleClick = (e: MouseEvent) => {
      // Only trigger click if we haven't dragged
      if (hasDragged) return;
      
      const pos = getEventPos(e);
      const clickX = pos.x + camera.x;
      const clickY = pos.y + camera.y;
      
      // Find which grid cell was clicked
      const gridX = Math.floor(clickX / cellSize);
      const gridY = Math.floor(clickY / cellSize);
      
      // Get the member and their image to calculate actual bounds
      const member = getMemberAtPosition(gridX, gridY);
      const image = imageCache.current.get(member.image);
      
      if (image && image.complete) {
        // Calculate actual image dimensions with aspect ratio
        const aspectRatio = image.width / image.height;
        let drawWidth = imageSize;
        let drawHeight = imageSize;
        
        if (aspectRatio > 1) {
          drawHeight = imageSize / aspectRatio;
        } else {
          drawWidth = imageSize * aspectRatio;
        }
        
        // Calculate actual image position
        const imageStartX = (gridX * cellSize) + (cellSize - drawWidth) / 2;
        const imageStartY = (gridY * cellSize) + (cellSize - drawHeight) / 2;
        
        // Check if click is within actual image bounds
        if (clickX >= imageStartX && clickX <= imageStartX + drawWidth &&
            clickY >= imageStartY && clickY <= imageStartY + drawHeight) {
          setSelectedMember(member);
        }
      }
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const pos = getEventPos(e);
      
      // Handle hover detection when not dragging
      if (!isDragging) {
        const hoverX = pos.x + camera.x;
        const hoverY = pos.y + camera.y;
        
        // Find which grid cell is being hovered
        const gridX = Math.floor(hoverX / cellSize);
        const gridY = Math.floor(hoverY / cellSize);
        
        // Get the member and check if hovering over image
        const member = getMemberAtPosition(gridX, gridY);
        const image = imageCache.current.get(member.image);
        
        if (image && image.complete) {
          const aspectRatio = image.width / image.height;
          let drawWidth = imageSize;
          let drawHeight = imageSize;
          
          if (aspectRatio > 1) {
            drawHeight = imageSize / aspectRatio;
          } else {
            drawWidth = imageSize * aspectRatio;
          }
          
          const imageStartX = (gridX * cellSize) + (cellSize - drawWidth) / 2;
          const imageStartY = (gridY * cellSize) + (cellSize - drawHeight) / 2;
          
          // Check if hovering over the actual image
          if (hoverX >= imageStartX && hoverX <= imageStartX + drawWidth &&
              hoverY >= imageStartY && hoverY <= imageStartY + drawHeight) {
            setHoveredMember({member, gridX, gridY});
          } else {
            setHoveredMember(null);
          }
        } else {
          setHoveredMember(null);
        }
        return;
      }
      
      e.preventDefault();
      const deltaX = pos.x - lastMouse.x;
      const deltaY = pos.y - lastMouse.y;
      
      // Check if we've moved enough to consider this a drag
      const dragThreshold = 5; // pixels
      const totalMovement = Math.sqrt(
        Math.pow(pos.x - mouseDownPos.x, 2) + Math.pow(pos.y - mouseDownPos.y, 2)
      );
      
      if (totalMovement > dragThreshold) {
        setHasDragged(true);
      }
      
      // Update camera position (inverted for natural feel)
      setCamera(prev => ({
        x: prev.x - deltaX,
        y: prev.y - deltaY
      }));
      
      // Store velocity for momentum
      setVelocity({
        x: Math.max(-maxVelocity, Math.min(maxVelocity, -deltaX)),
        y: Math.max(-maxVelocity, Math.min(maxVelocity, -deltaY))
      });
      
      setLastMouse(pos);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      canvas.style.cursor = 'grab';
    };

    const handleMouseLeave = () => {
      setHoveredMember(null);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const sensitivity = 0.3; // Further reduced from 0.6 for very slow trackpad scrolling
      
      setCamera(prev => ({
        x: prev.x + e.deltaX * sensitivity,
        y: prev.y + e.deltaY * sensitivity
      }));
      
      setVelocity({
        x: Math.max(-maxVelocity, Math.min(maxVelocity, e.deltaX * 0.08)), // Further reduced from 0.15 for trackpad
        y: Math.max(-maxVelocity, Math.min(maxVelocity, e.deltaY * 0.08)) // Further reduced from 0.15 for trackpad
      });
    };

    // Mouse events
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('mouseleave', handlePointerUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);
    
    // Touch events
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    canvas.addEventListener('touchend', handlePointerUp);
    
    // Wheel event
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('mouseup', handlePointerUp);
      canvas.removeEventListener('mouseleave', handlePointerUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handlePointerDown);
      canvas.removeEventListener('touchmove', handlePointerMove);
      canvas.removeEventListener('touchend', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [isDragging, lastMouse, maxVelocity]);

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

  if (activeMembers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-lg">No members available...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-black">
      {/* Loading Screen */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <RotatingCube>
            <div></div>
          </RotatingCube>
          <div className="mt-8 flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
            <span className="text-white text-lg">Loading Members...</span>
          </div>
        </div>
      )}

      {/* Infinite Grid Canvas */}
      <div 
        className="fixed top-0 left-0 right-0 bg-black overflow-hidden select-none"
        style={{ bottom: `${footerHeight}px` }}
      >
        <div
          ref={containerRef}
          className="w-full h-full relative"
        >
          <canvas
            ref={canvasRef}
            className="cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
          />
          
        </div>
      </div>

      {/* Member Profile Overlay - Magazine Style */}
      {selectedMember && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMember(null)}
        >
          <div 
            className="bg-white max-w-5xl w-full h-auto md:h-[70vh] flex flex-col md:flex-row overflow-hidden shadow-2xl rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-3 right-3 md:top-4 md:right-4 z-20 w-8 h-8 bg-black/80 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Left side - Large portrait image */}
            <div className="w-full md:w-1/2 relative bg-black h-64 md:h-auto">
              <img
                src={selectedMember.image}
                alt={selectedMember.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/members/default.png';
                }}
              />
            </div>

            {/* Right side - Quote Card */}
            <div className="w-full md:w-1/2 relative overflow-hidden">
                {/* Abstract light streaks background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900">
                  {/* Light streaks - orange/yellow */}
                  <div className="absolute top-0 right-0 w-full h-full">
                    <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 transform rotate-12 translate-x-8 -translate-y-16 opacity-80"></div>
                    <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-br from-yellow-300 via-orange-300 to-yellow-400 transform rotate-15 translate-x-12 -translate-y-12 opacity-70"></div>
                    <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-br from-orange-300 via-yellow-200 to-white transform rotate-18 translate-x-16 -translate-y-8 opacity-90"></div>
                  </div>
                  
                  {/* Blue light streaks */}
                  <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-500 transform -rotate-12 -translate-x-4 -translate-y-8 opacity-60"></div>
                    <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-br from-cyan-300 via-blue-300 to-cyan-400 transform -rotate-15 -translate-x-2 -translate-y-4 opacity-50"></div>
                  </div>
                </div>
                
                {/* Quote content */}
                <div className="relative h-full flex items-center justify-center p-6 md:p-8">
                  <div className="bg-gray-200/95 backdrop-blur-sm p-6 md:p-8 max-w-sm">
                    {selectedMember.quote && selectedMember.quote.trim() ? (
                      <blockquote className="text-gray-900 text-lg leading-relaxed font-normal">
                        "{selectedMember.quote}"
                      </blockquote>
                    ) : (
                      <div className="text-gray-600 text-center italic">
                        "Creativity is intelligence having fun."
                      </div>
                    )}
                  </div>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="absolute inset-x-0 bottom-0 z-20">
        <Footer />
      </div>
    </div>
  );
};

export default MembersPage;