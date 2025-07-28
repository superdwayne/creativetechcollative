import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Member data with coordinates and counts
const memberData: Array<{
  name: string;
  coordinates: [number, number];
  members: number;
  country: string;
  description?: string;
}> = [
  {
    name: "Netherlands",
    coordinates: [52.3676, 4.9041],
    members: 8,
    country: "Netherlands",
    description: "Creative technologists in Amsterdam and surrounding areas"
  },
  {
    name: "United Kingdom",
    coordinates: [51.5074, -0.1276],
    members: 4,
    country: "United Kingdom",
    description: "London-based creative technology professionals"
  },
  {
    name: "Portugal",
    coordinates: [38.7223, -9.1393],
    members: 1,
    country: "Portugal",
    description: "Creative technologist in Lisbon"
  }
];

// Custom marker icon - minimalist red cross
const createCustomIcon = (memberCount: number) => {
  const size = 12;
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 2px;
          height: ${size}px;
          background: #ef4444;
          position: absolute;
        "></div>
        <div style="
          width: ${size}px;
          height: 2px;
          background: #ef4444;
          position: absolute;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

const InteractiveWorldMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Add custom CSS for the map
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-container {
        background: #000000 !important;
      }
      .custom-marker {
        background: transparent !important;
        border: none !important;
      }
      .custom-marker:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(239, 68, 68, 0.6) !important;
      }
      .leaflet-popup-content-wrapper {
        background: rgba(0, 0, 0, 0.9) !important;
        color: white !important;
        border: 1px solid #333 !important;
        border-radius: 8px !important;
        backdrop-filter: blur(10px) !important;
      }
      .leaflet-popup-tip {
        background: rgba(0, 0, 0, 0.9) !important;
        border: 1px solid #333 !important;
      }
      .leaflet-control-zoom {
        border: 1px solid #333 !important;
        background: rgba(0, 0, 0, 0.8) !important;
      }
      .leaflet-control-zoom a {
        background: rgba(0, 0, 0, 0.8) !important;
        color: white !important;
        border: 1px solid #333 !important;
      }
      .leaflet-control-zoom a:hover {
        background: rgba(239, 68, 68, 0.8) !important;
      }
    `;
    document.head.appendChild(style);

    // Initialize the map
    const map = L.map(mapRef.current, {
      center: [50, 10],
      zoom: 3,
      minZoom: 3,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: false,
      maxBounds: [[-90, -180], [90, 180]],
      maxBoundsViscosity: 1.0,
      dragging: true
    });

    // Add dark theme tile layer with no wrapping
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      noWrap: true,
      bounds: [[-90, -180], [90, 180]]
    }).addTo(map);

    // Add member markers
    memberData.forEach(({ name, coordinates, members, description }) => {
      const marker = L.marker(coordinates, {
        icon: createCustomIcon(members)
      }).addTo(map);

      const popupContent = `
        <div style="text-align: center;">
          <h3 style="font-weight: bold; font-size: 18px; margin-bottom: 8px;">${name}</h3>
          <p style="font-size: 14px; color: #d1d5db; margin-bottom: 8px;">${description}</p>
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #ef4444;"></div>
            <span style="font-size: 14px;">${members} member${members !== 1 ? 's' : ''}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
    });

    // Add zoom control
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    mapInstanceRef.current = map;
    setIsLoaded(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="w-screen h-[700px] bg-black relative">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* About the Collective Text */}
     
      

      {/* Total members counter */}
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white border border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">
            {memberData.reduce((sum, location) => sum + location.members, 0)}
          </div>
          <div className="text-xs text-gray-300">Total Members</div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveWorldMap; 