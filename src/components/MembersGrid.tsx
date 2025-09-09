import React from 'react';

export interface GridMemberItem {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  image: string;
}

interface MembersGridProps {
  members: GridMemberItem[];
}

const MembersGrid: React.FC<MembersGridProps> = ({ members }) => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {members.map((m) => (
          <div key={m.id} className="bg-neutral-900 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="relative group">
              <img
                src={m.image}
                alt={m.name}
                className="w-full h-72 sm:h-80 md:h-[22rem] object-cover block"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/members/default.png';
                }}
              />

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-3">
                <div className="text-center">
                  <div className="text-white text-sm font-semibold">{m.name}</div>
                  {(m.bio || m.role) && (
                    <div className="text-white/80 text-xs mt-1 line-clamp-3">{m.bio || m.role}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-3 py-2">
              <div className="text-white text-xs">{m.name}</div>
              {(m.role || m.bio) && (
                <div className="text-white/60 text-[10px] uppercase tracking-wider mt-0.5">{m.role || m.bio}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MembersGrid;


