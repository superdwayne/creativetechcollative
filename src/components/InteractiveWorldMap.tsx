import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getWebhookUrl } from '@/utils/webhookUtils';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Interface for member data from Notion
interface NotionMember {
  id: string;
  name: string;
  description: string;
  country: string;
  image?: string;
}

// Interface for processed location data
interface LocationData {
  name: string;
  coordinates: [number, number];
  members: number;
  country: string;
  description?: string;
  memberNames: string[];
}

// Country to coordinates mapping
const countryCoordinates: Record<string, { coordinates: [number, number]; displayName: string; description: string }> = {
  'AMS': {
    coordinates: [52.3676, 4.9041],
    displayName: 'Netherlands (AMS)',
    description: 'Creative technologists in Amsterdam and surrounding areas'
  },
  'UK': {
    coordinates: [51.5074, -0.1276],
    displayName: 'United Kingdom',
    description: 'London-based creative technology professionals'
  },
  'Lisbon': {
    coordinates: [38.7223, -9.1393],
    displayName: 'Portugal (Lisbon)',
    description: 'Creative technologist in Lisbon'
  },
  'DE': {
    coordinates: [52.5200, 13.4050],
    displayName: 'Germany',
    description: 'Creative technologist in Germany'
  }
};

// Function to process member data and count by country
const processMemberData = (members: NotionMember[]): LocationData[] => {
  const countryGroups: Record<string, { count: number; names: string[] }> = {};
  
  // Group members by country and count them
  members.forEach(member => {
    const country = member.country || 'Unknown';
    if (!countryGroups[country]) {
      countryGroups[country] = { count: 0, names: [] };
    }
    countryGroups[country].count++;
    countryGroups[country].names.push(member.name);
  });
  
  // Convert to LocationData format
  return Object.entries(countryGroups)
    .filter(([country]) => countryCoordinates[country]) // Only include countries we have coordinates for
    .map(([country, data]) => {
      const countryInfo = countryCoordinates[country];
      return {
        name: countryInfo.displayName,
        coordinates: countryInfo.coordinates,
        members: data.count,
        country: countryInfo.displayName,
        description: countryInfo.description,
        memberNames: data.names
      };
    });
};

// Function to fetch member data from Notion via webhook
const fetchMemberData = async (): Promise<NotionMember[]> => {
  try {
    const response = await fetch(getWebhookUrl('members'));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching member data:', error);
    // Return fallback data if fetch fails
    return [
      { id: '1', name: 'Koen', description: 'Senior Creative Technologist', country: 'AMS' },
      { id: '2', name: 'Deniz', description: 'Creative Technologist', country: 'AMS' },
      { id: '3', name: 'Martin', description: 'Creative Technologist', country: 'AMS' },
      { id: '4', name: 'Florido', description: 'Creative Technologist', country: 'AMS' },
      { id: '5', name: 'Pax', description: 'Creative Technology Director', country: 'AMS' },
      { id: '6', name: 'Dwayne', description: 'Lead Creative Technologist', country: 'AMS' },
      { id: '7', name: 'Scy', description: 'Senior Creative Technologist', country: 'AMS' },
      { id: '8', name: 'Rohit', description: 'Senior Creative Technologist', country: 'AMS' },
      { id: '9', name: 'Christos', description: 'Creative Technologist', country: 'AMS' },
      { id: '10', name: 'Jennifer', description: 'Senior Creative Technologist', country: 'UK' },
      { id: '11', name: 'Joshua', description: 'Senior Creative Technologist', country: 'UK' },
      { id: '12', name: 'Adina', description: 'Creative Technologist', country: 'UK' },
      { id: '13', name: 'Erin', description: 'Creative Technologist Associate', country: 'UK' },
      { id: '14', name: 'John', description: 'Lead Creative Technologist', country: 'UK' },
      { id: '15', name: 'Olivia', description: 'Creative Technologist', country: 'UK' },
      { id: '16', name: 'Karolina', description: 'Creative Technologist', country: 'UK' },
      { id: '17', name: 'Rui', description: 'Senior Creative Technologist', country: 'Lisbon' },
      { id: '18', name: 'Tom', description: 'Senior Creative Technologist', country: 'DE' }
    ];
  }
};

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
  const [memberData, setMemberData] = useState<LocationData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Fetch member data on component mount
  useEffect(() => {
    const loadMemberData = async () => {
      setIsLoadingData(true);
      try {
        const members = await fetchMemberData();
        const processedData = processMemberData(members);
        setMemberData(processedData);
      } catch (error) {
        console.error('Failed to load member data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadMemberData();
  }, []);

  // Initialize map
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
      center: [54, 15], // Centered on Europe
      zoom: 4, // Zoomed in to focus on Europe
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

  // Add markers when member data is loaded
  useEffect(() => {
    if (!mapInstanceRef.current || isLoadingData || memberData.length === 0) return;

    // Clear existing markers
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstanceRef.current?.removeLayer(layer);
      }
    });

    // Add member markers
    memberData.forEach(({ name, coordinates, members, description }) => {
      const marker = L.marker(coordinates, {
        icon: createCustomIcon(members)
      }).addTo(mapInstanceRef.current!);

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
  }, [memberData, isLoadingData]);

  return (
    <div className="w-screen h-[700px] bg-black relative">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Total members counter */}
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white border border-gray-700 z-[1000]">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">
            {isLoadingData ? '...' : memberData.reduce((sum, location) => sum + location.members, 0)}
          </div>
          <div className="text-xs text-gray-300">Total Members</div>
        </div>
      </div>
      
      {/* Loading indicator */}
      {isLoadingData && (
        <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white border border-gray-700 z-[1000]">
          <div className="text-sm text-gray-300">Loading member data...</div>
        </div>
      )}
    </div>
  );
};

export default InteractiveWorldMap; 