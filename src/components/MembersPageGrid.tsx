import React, { useEffect, useState } from 'react';
import Footer from './ui/footer';
import InfiniteGridCanvas from './InfiniteGridCanvas';
import { MemberData } from '../types/member';
import { getWebhookUrl } from '@/utils/webhookUtils';

const MembersPageGrid: React.FC = () => {
  const [memberData, setMemberData] = useState<MemberData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const webhookUrl = getWebhookUrl('members');
        const username = import.meta.env.VITE_N8N_BASIC_AUTH_USERNAME;
        const password = import.meta.env.VITE_N8N_BASIC_AUTH_PASSWORD;
        if (!username || !password) throw new Error('Auth not configured');
        const basicAuth = btoa(`${username}:${password}`);
        const res = await fetch(webhookUrl, { headers: { 'Authorization': `Basic ${basicAuth}` } , signal: AbortSignal.timeout(15000)});
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        const transformed: MemberData[] = (Array.isArray(data) ? data : []).map((item: any, index: number) => {
          let imageUrl = '';
          if (item.property_image) {
            if (Array.isArray(item.property_image) && item.property_image.length > 0) imageUrl = item.property_image[0];
            else if (typeof item.property_image === 'string') imageUrl = item.property_image;
          }
          return {
            id: item.id || `member-${index}`,
            name: item.property_title || item.name || 'Member',
            description: item.property_description || 'Member',
            image: imageUrl || '/members/default.png'
          };
        }).filter((m: MemberData) => m.name && m.image);
        setMemberData(transformed);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {loading ? (
        <div className="absolute inset-0 z-50 bg-black text-white flex items-center justify-center">Loading…</div>
      ) : (
        <InfiniteGridCanvas memberData={memberData} />
      )}
      <div className="absolute inset-x-0 bottom-0 z-20">
        <Footer />
      </div>
    </div>
  );
};

export default MembersPageGrid;


