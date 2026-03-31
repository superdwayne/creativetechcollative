import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Footer from './ui/footer';
import { getWebhookUrl } from '@/utils/webhookUtils';
import { n8nFetch } from '@/utils/n8nProxy';
import InfinityGrid from './InfinityGrid';

interface MemberData {
  id: string;
  name: string;
  description: string;
  image: string;
}

const fallbackMembers: MemberData[] = [
  { id: '1', name: 'Dwayne Paisley-Marshall', description: 'Founder', image: '/members/Dwayne.png' },
  { id: '2', name: 'Adina', description: 'Design Lead', image: '/members/Adina.png' },
  { id: '3', name: 'Deniz', description: 'Creative Technologist', image: '/members/Deniz.png' },
  { id: '4', name: 'Erin', description: 'UX Researcher', image: '/members/erin.png' },
  { id: '5', name: 'Florido', description: 'Motion Designer', image: '/members/Florido.png' },
  { id: '6', name: 'James', description: 'Frontend Developer', image: '/members/James.png' },
];

const MembersInfinite: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [memberData, setMemberData] = useState<MemberData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setError(null);
        setIsLoading(true);

        const webhookUrl = getWebhookUrl('members');
        const response = await n8nFetch(webhookUrl, 'GET');

        if (!response.ok) throw new Error(`Failed: ${response.status}`);

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const transformed: MemberData[] = data.map((item: any, index: number) => {
            const propImg = item.property_image;
            const image = Array.isArray(propImg) ? propImg[0] : (propImg || fallbackMembers[index % fallbackMembers.length].image);
            return {
              id: item.id || `m-${index}`,
              name: item.property_title || item.name || 'Member',
              description: item.property_description || 'Team',
              image
            };
          }).filter(m => m.name && m.name !== 'Member');

          setMemberData(transformed.length ? transformed : fallbackMembers);
          setUseFallback(!transformed.length);
        } else {
          setUseFallback(true);
          setMemberData(fallbackMembers);
        }
      } catch (err: any) {
        setError(err.message);
        setUseFallback(true);
        setMemberData(fallbackMembers);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="py-8 text-center px-4 bg-black">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">Our Collective</h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">A dynamic community of creative technologists, designers, and innovators pushing the boundaries of what's possible.</p>
        {useFallback && <p className="text-gray-500 text-sm mt-4">Showing preview data</p>}
        {error && !useFallback && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </div>

      <InfinityGrid
        memberData={memberData.map(m => ({
          id: m.id,
          name: m.name,
          description: m.description,
          image: m.image
        }))}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />

      <Footer />
    </div>
  );
};

export default MembersInfinite;
