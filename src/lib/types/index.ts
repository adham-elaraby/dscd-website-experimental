export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl: string;
  registrationLink?: string;
  isPast?: boolean; // not necessary
  tags: string[];
  duration?: string;
  maxParticipants?: number;
  organizer?: string;
  learningObjectives?: string[];
  targetAudience?: string;
  requirements?: string[];
  is_featured?: boolean;
}

// Database types (matching Supabase schema)
export interface DatabaseEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  end_date: string | null;
  location: string;
  max_participants: number | null;
  current_participants: number;
  tags: string[];
  image_url: string;
  registration_url: string | null;
  is_featured: boolean;
  learning_objectives: string[];
  target_audience: string | null;
  requirements: string[];
  created_at: string;
  updated_at: string;
}

export interface PastEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl: string;
  organizer?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  technologies: string[];
  repoUrl?: string;
  demoUrl?: string;
  members: string[];
  status: 'active' | 'completed' | 'archived';
  featured: boolean;
}

// Database types (matching Supabase schema)
export interface DatabaseProject {
  id: string;
  title: string;
  description: string;
  image_url: string;
  github_url: string | null;
  demo_url: string | null;
  technologies: string[];
  team_members: string[];
  status: 'active' | 'completed' | 'archived';
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    email?: string;
    website?: string;
  };
  position: number;
  isLeadership?: boolean;
}

// Database types (matching Supabase schema)
export interface DatabaseTeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url: string;
  github_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  email: string | null;
  is_leadership: boolean;
  order_index: number | null;
  created_at: string;
}

export interface DatabaseContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  author: string;
  publishedAt: string;
  tags: string[];
  featured: boolean;
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  website: string;
  description: string;
  partnershipType: 'sponsor' | 'partner' | 'collaborator';
}
