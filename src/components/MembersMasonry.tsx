import React from 'react';

export interface MasonryMemberItem {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  image: string;
}

interface MembersMasonryProps {
  members: MasonryMemberItem[];
}

const MembersMasonry: React.FC<MembersMasonryProps> = ({ members }) => {
  return (
    <div className="w-full">
      <div className="masonry masonry-col-1 sm:masonry-col-2 lg:masonry-col-3 xl:masonry-col-5 2xl:masonry-col-6">
        {members.map((m) => (
          <div key={m.id} className="masonry-item">
            <div className="bg-neutral-900 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="relative group">
                <img
                  src={m.image}
                  alt={m.name}
                  className="w-full h-auto object-cover block"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/members/default.png';
                  }}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6">
                  <div className="text-center">
                    <div className="text-white font-semibold text-lg">{m.name}</div>
                    {(m.bio || m.role) && (
                      <div className="text-white/80 text-sm mt-2 leading-relaxed line-clamp-4">{m.bio || m.role}</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="text-white text-sm tracking-wide">{m.name}</div>
                {(m.role || m.bio) && (
                  <div className="text-white/60 text-xs uppercase tracking-wider mt-1">{m.role || m.bio}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MembersMasonry;
