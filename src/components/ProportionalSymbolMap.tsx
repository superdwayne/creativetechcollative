import React from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker
} from "react-simple-maps";

// Member data with coordinates and counts
const memberData: Array<{
  name: string;
  coordinates: [number, number];
  members: number;
  country: string;
}> = [
  {
    name: "Netherlands",
    coordinates: [4.9041, 52.3676],
    members: 8,
    country: "Netherlands"
  },
  {
    name: "United Kingdom",
    coordinates: [-0.1276, 51.5074],
    members: 4,
    country: "United Kingdom"
  },
  {
    name: "Portugal",
    coordinates: [-9.1393, 38.7223],
    members: 1,
    country: "Portugal"
  }
];

// Function to generate scattered coordinates within a country
const generateScatteredCoordinates = (baseCoordinates: [number, number], count: number): [number, number][] => {
  const coordinates: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    // Add random offset within reasonable bounds for each country
    const latOffset = (Math.random() - 0.5) * 2; // ±1 degree latitude
    const lngOffset = (Math.random() - 0.5) * 3; // ±1.5 degrees longitude
    coordinates.push([
      baseCoordinates[0] + lngOffset,
      baseCoordinates[1] + latOffset
    ]);
  }
  return coordinates;
};

const ProportionalSymbolMap: React.FC = () => {
  return (
    <div className="w-screen h-[700px] bg-black flex items-center justify-center">
      <div className="relative w-full h-full">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 147,
            center: [0, 0]
          }}
          className="w-full h-full"
        >
          <ZoomableGroup>
            {/* World geography */}
            <Geographies
              geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
            >
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#1a1a1a"
                    stroke="#333333"
                    strokeWidth={0.5}
                    className="transition-all duration-300 hover:fill-gray-800"
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none" },
                      pressed: { outline: "none" }
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Member location markers - SCATTERED SMALL RED CROSSES */}
            {memberData.map(({ name, coordinates, members, country }) => {
              const scatteredCoords = generateScatteredCoordinates(coordinates, members);
              return scatteredCoords.map((coord, index) => (
                <Marker key={`${name}-${index}`} coordinates={coord}>
                  {/* Small red cross marker */}
                  <g>
                    {/* Vertical line */}
                    <line
                      x1="0"
                      y1="-4"
                      x2="0"
                      y2="4"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    {/* Horizontal line */}
                    <line
                      x1="-4"
                      y1="0"
                      x2="4"
                      y2="0"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </g>
                </Marker>
              ));
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white border border-gray-700">
          <h3 className="text-sm font-semibold mb-2">Member Locations</h3>
          <div className="space-y-2">
            {memberData.map(({ name, members }) => (
              <div key={name} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs">{name}: {members} member{members !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total members counter */}
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white border border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {memberData.reduce((sum, location) => sum + location.members, 0)}
            </div>
            <div className="text-xs text-gray-300">Total Members</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProportionalSymbolMap; 