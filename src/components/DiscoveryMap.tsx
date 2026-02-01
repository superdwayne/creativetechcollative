import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NetworkProfile } from '@/types/network-profile';
import { MapPin, ArrowRight, X, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiscoveryMapProps {
  profiles: NetworkProfile[];
}

// Common city/location to coordinates mapping
const locationCoordinates: Record<string, [number, number]> = {
  // Netherlands
  'amsterdam': [52.3676, 4.9041],
  'rotterdam': [51.9244, 4.4777],
  'utrecht': [52.0907, 5.1214],
  'the hague': [52.0705, 4.3007],
  'netherlands': [52.1326, 5.2913],
  // UK
  'london': [51.5074, -0.1278],
  'manchester': [53.4808, -2.2426],
  'birmingham': [52.4862, -1.8904],
  'edinburgh': [55.9533, -3.1883],
  'bristol': [51.4545, -2.5879],
  'uk': [55.3781, -3.4360],
  'united kingdom': [55.3781, -3.4360],
  // Germany
  'berlin': [52.5200, 13.4050],
  'munich': [48.1351, 11.5820],
  'hamburg': [53.5511, 9.9937],
  'frankfurt': [50.1109, 8.6821],
  'germany': [51.1657, 10.4515],
  // Portugal
  'lisbon': [38.7223, -9.1393],
  'porto': [41.1579, -8.6291],
  'portugal': [39.3999, -8.2245],
  // Spain
  'barcelona': [41.3851, 2.1734],
  'madrid': [40.4168, -3.7038],
  'spain': [40.4637, -3.7492],
  // France
  'paris': [48.8566, 2.3522],
  'lyon': [45.7640, 4.8357],
  'france': [46.2276, 2.2137],
  // USA
  'new york': [40.7128, -74.0060],
  'san francisco': [37.7749, -122.4194],
  'los angeles': [34.0522, -118.2437],
  'austin': [30.2672, -97.7431],
  'seattle': [47.6062, -122.3321],
  'usa': [37.0902, -95.7129],
  // Other
  'tokyo': [35.6762, 139.6503],
  'singapore': [1.3521, 103.8198],
  'sydney': [33.8688, 151.2093],
  'melbourne': [-37.8136, 144.9631],
  'toronto': [43.6532, -79.3832],
  'dubai': [25.2048, 55.2708],
  'remote': [0, 0],
};

// Parse location string to coordinates
const getCoordinates = (location: string): [number, number] | null => {
  const normalizedLocation = location.toLowerCase().trim();

  // Direct match
  if (locationCoordinates[normalizedLocation]) {
    return locationCoordinates[normalizedLocation];
  }

  // Check if any known location is contained in the string
  for (const [key, coords] of Object.entries(locationCoordinates)) {
    if (normalizedLocation.includes(key)) {
      return coords;
    }
  }

  return null;
};

// Group profiles by location
interface LocationGroup {
  coordinates: [number, number];
  profiles: NetworkProfile[];
  locationName: string;
}

const DiscoveryMap: React.FC<DiscoveryMapProps> = ({ profiles }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationGroup | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Group profiles by location
  const locationGroups = useMemo(() => {
    const groups: Record<string, LocationGroup> = {};

    profiles.forEach(profile => {
      const coords = getCoordinates(profile.location);
      if (coords && coords[0] !== 0) { // Exclude "remote" with [0,0]
        const key = coords.join(',');
        if (!groups[key]) {
          groups[key] = {
            coordinates: coords,
            profiles: [],
            locationName: profile.location.split(',')[0].trim()
          };
        }
        groups[key].profiles.push(profile);
      }
    });

    return Object.values(groups);
  }, [profiles]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Add custom CSS
    const style = document.createElement('style');
    style.id = 'discovery-map-styles';
    style.textContent = `
      .discovery-map .leaflet-container {
        background: #09090b !important;
      }
      .discovery-map .leaflet-tile-pane {
        filter: grayscale(100%) brightness(0.4) contrast(1.2);
      }
      .discovery-map .location-marker {
        transition: all 0.3s ease;
      }
      .discovery-map .location-marker:hover {
        transform: scale(1.2);
      }
      .discovery-map .leaflet-control-zoom {
        border: none !important;
        box-shadow: none !important;
      }
      .discovery-map .leaflet-control-zoom a {
        background: rgba(24, 24, 27, 0.9) !important;
        color: #a1a1aa !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
        width: 32px !important;
        height: 32px !important;
        line-height: 32px !important;
        font-size: 14px !important;
      }
      .discovery-map .leaflet-control-zoom a:hover {
        background: rgba(39, 39, 42, 0.9) !important;
        color: #fff !important;
      }
    `;
    document.head.appendChild(style);

    const map = L.map(mapRef.current, {
      center: [48, 10],
      zoom: 4,
      minZoom: 2,
      maxZoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      noWrap: false,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;
    setIsMapReady(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      const styleEl = document.getElementById('discovery-map-styles');
      if (styleEl) styleEl.remove();
    };
  }, []);

  // Add markers when map is ready and we have location groups
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || locationGroups.length === 0) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add markers for each location group
    locationGroups.forEach((group) => {
      const count = group.profiles.length;
      const size = Math.min(16 + count * 4, 40);

      const icon = L.divIcon({
        className: 'location-marker',
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background: linear-gradient(135deg, #a855f7, #6366f1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: ${count > 9 ? '11px' : '12px'};
            font-weight: 600;
            font-family: system-ui, sans-serif;
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.4), 0 4px 12px rgba(0,0,0,0.3);
            cursor: pointer;
            border: 2px solid rgba(255,255,255,0.2);
          ">
            ${count}
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker(group.coordinates, { icon }).addTo(map);

      marker.on('click', () => {
        setSelectedLocation(group);
      });
    });
  }, [isMapReady, locationGroups]);

  return (
    <div className="discovery-map relative w-full h-[calc(100vh-200px)] min-h-[500px] bg-zinc-950">
      <div ref={mapRef} className="w-full h-full" />

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-zinc-900/90 backdrop-blur-sm border border-white/10 p-4 z-[1000]">
        <div className="text-xs font-secondary text-zinc-500 uppercase tracking-wider mb-2">Locations</div>
        <div className="text-2xl font-primary text-white">{locationGroups.length}</div>
        <div className="text-xs font-secondary text-zinc-500 mt-3 uppercase tracking-wider">Creatives</div>
        <div className="text-2xl font-primary text-white">{profiles.filter(p => getCoordinates(p.location)).length}</div>
      </div>

      {/* Selected Location Panel */}
      {selectedLocation && (
        <div className="absolute top-4 right-4 bottom-4 w-full max-w-sm bg-zinc-900/95 backdrop-blur-md border border-white/10 z-[1000] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-secondary mb-1">
                <MapPin className="h-3 w-3" />
                <span>{selectedLocation.locationName}</span>
              </div>
              <div className="text-lg font-primary text-white">
                {selectedLocation.profiles.length} Creative{selectedLocation.profiles.length !== 1 ? 's' : ''}
              </div>
            </div>
            <button
              onClick={() => setSelectedLocation(null)}
              className="p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Profiles List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedLocation.profiles.map((profile) => (
              <Link
                key={profile.id}
                to={`/directory/profile/${profile.slug}`}
                className="group block p-4 bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  {profile.profilePictureUrl ? (
                    <img
                      src={profile.profilePictureUrl}
                      alt={profile.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-primary">
                      {profile.fullName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-primary text-white truncate">{profile.fullName}</h4>
                      {profile.isCtcMember && (
                        <BadgeCheck className="h-3.5 w-3.5 text-purple-400/60 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs font-secondary text-zinc-500 truncate">{profile.location}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
                {profile.bio && (
                  <p className="text-xs font-secondary text-zinc-400 line-clamp-2">{profile.bio}</p>
                )}
                {profile.skills && profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile.skills.slice(0, 3).map((skill, i) => (
                      <span key={i} className="text-[10px] font-secondary text-zinc-500">
                        {skill}{i < 2 && i < profile.skills.length - 1 ? ' •' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-xs font-secondary text-zinc-600 z-[1000]">
        Click a marker to explore creatives in that location
      </div>
    </div>
  );
};

export default DiscoveryMap;
