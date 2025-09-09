import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import RotatingCube from './RotatingCube';
import Footer from './ui/footer';
import InfiniteGrid from './InfiniteGrid';
import { getWebhookUrl } from '@/utils/webhookUtils';
import { MemberData } from '../types/member';

const MembersPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
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
                y: 0
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
    <div className="relative w-full h-screen overflow-hidden bg-black">
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

      {/* VW Lab Style Infinite Grid */}
      <InfiniteGrid
        memberData={memberData}
      />

      {/* Footer */}
      <div className="absolute inset-x-0 bottom-0 z-20">
        <Footer />
      </div>
    </div>
  );
};

export default MembersPage;