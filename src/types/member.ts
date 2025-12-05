export interface MemberData {
  id: string;
  name: string;
  description: string;
  image: string;
  offset?: { x: number; y: number };
  bio?: string;
  skills?: string[];
  role?: string;
  location?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
  quote?: string;
}
