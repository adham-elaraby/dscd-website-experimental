import { Event, Project, TeamMember, DatabaseEvent, DatabaseProject, DatabaseTeamMember } from '../types';

// Convert database event to frontend event
export function dbEventToEvent(dbEvent: DatabaseEvent): Event {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    description: dbEvent.description,
    date: dbEvent.date,
    location: dbEvent.location,
    imageUrl: dbEvent.image_url,
    registrationLink: dbEvent.registration_url || undefined,
    isPast: new Date(dbEvent.date) < new Date(),
    tags: dbEvent.tags,
    maxParticipants: dbEvent.max_participants || undefined,
    organizer: 'DSC Darmstadt',
    learningObjectives: dbEvent.learning_objectives || [],
    targetAudience: dbEvent.target_audience || undefined,
    requirements: dbEvent.requirements || [],
    is_featured: dbEvent.is_featured,
    galleryImages: dbEvent.gallery_urls || []
  };
}

// Convert frontend event to database event
export function eventToDbEvent(event: Partial<Event>): Partial<DatabaseEvent> {
  return {
    title: event.title,
    description: event.description || '',
    date: event.date || '',
    location: event.location || '',
    image_url: event.imageUrl || '',
    registration_url: event.registrationLink || null,
    tags: event.tags || [],
    max_participants: event.maxParticipants || null,
    learning_objectives: event.learningObjectives || [],
    target_audience: event.targetAudience || null,
    requirements: event.requirements || [],
    is_featured: event.is_featured || false,
    gallery_urls: event.galleryImages || []
  };
}

// Convert database project to frontend project
export function dbProjectToProject(dbProject: DatabaseProject): Project {
  return {
    id: dbProject.id,
    title: dbProject.title,
    description: dbProject.description,
    imageUrl: dbProject.image_url,
    technologies: dbProject.technologies,
    repoUrl: dbProject.github_url || undefined,
    demoUrl: dbProject.demo_url || undefined,
    members: dbProject.team_members,
    status: dbProject.status,
    featured: dbProject.is_featured
  };
}

// Convert frontend project to database project
export function projectToDbProject(project: Partial<Project>): Partial<DatabaseProject> {
  return {
    title: project.title,
    description: project.description || '',
    image_url: project.imageUrl || '',
    technologies: project.technologies || [],
    github_url: project.repoUrl || null,
    demo_url: project.demoUrl || null,
    team_members: project.members || [],
    status: project.status || 'active',
    is_featured: project.featured || false
  };
}

// Convert database team member to frontend team member
export function dbTeamMemberToTeamMember(dbMember: DatabaseTeamMember): TeamMember {
  return {
    id: dbMember.id,
    name: dbMember.name,
    role: dbMember.role,
    bio: dbMember.bio,
    imageUrl: dbMember.image_url,
    socialLinks: {
      linkedin: dbMember.linkedin_url || undefined,
      github: dbMember.github_url || undefined,
      twitter: dbMember.twitter_url || undefined,
      email: dbMember.email || undefined,
      website: dbMember.website_url || undefined,
    },
    position: dbMember.order_index || 0,
    isLeadership: dbMember.is_leadership,
  };
}

// Convert frontend team member to database team member
export function teamMemberToDbTeamMember(member: Partial<TeamMember>): Partial<DatabaseTeamMember> {
  return {
    name: member.name || '',
    role: member.role || '',
    bio: member.bio || '',
    image_url: member.imageUrl || '',
    github_url: member.socialLinks?.github || null,
    linkedin_url: member.socialLinks?.linkedin || null,
    twitter_url: member.socialLinks?.twitter || null,
    website_url: member.socialLinks?.website || null,
    email: member.socialLinks?.email || null,
    order_index: member.position || null,
    is_leadership: false // Can be updated later
  };
}
