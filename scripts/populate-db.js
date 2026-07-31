import { supabase } from '../lib/supabase.js';

// Sample projects
const sampleProjects = [
  {
    title: "University Food Tracker",
    description: "A web application to track meal plans and nutritional information for university students. This project helps students manage their meal plans, track nutritional intake, and discover healthy eating options on campus. Built with React and Node.js.",
    image_url: "/images/food-tracker.jpg",
    github_url: "https://github.com/dscdarmstadt/food-tracker",
    demo_url: "https://food-tracker.dscdarmstadt.de",
    technologies: ["React", "Node.js", "MongoDB", "Express"],
    team_members: ["Alice Smith", "Bob Johnson", "Charlie Brown"],
    status: "active",
    is_featured: true
  },
  {
    title: "Campus Event Planner",
    description: "A platform for organizing and discovering events happening on campus. An intuitive platform that allows students and organizations to create, manage, and discover events happening around campus. Features include event recommendations, calendar integration, and RSVP management.",
    image_url: "/images/event-planner.jpg",
    github_url: "https://github.com/dscdarmstadt/event-planner",
    technologies: ["Vue.js", "Firebase", "TypeScript"],
    team_members: ["David Wilson", "Emma Davis", "Frank Miller"],
    status: "completed",
    is_featured: false
  }
];

// Sample team members
const sampleTeamMembers = [
  {
    name: "Sarah Johnson",
    role: "DSC Lead",
    bio: "Computer Science student passionate about community building and web development. Leading the DSC Darmstadt chapter to create impactful tech solutions.",
    image_url: "/images/team/sarah.jpg",
    github_url: "https://github.com/sarahjohnson",
    linkedin_url: "https://linkedin.com/in/sarahjohnson",
    email: "sarah@dscdarmstadt.de",
    is_leadership: true,
    order_index: 1
  },
  {
    name: "Michael Chen",
    role: "Technical Lead",
    bio: "Fullstack developer with expertise in React, Node.js, and cloud technologies. Passionate about mentoring and building scalable applications.",
    image_url: "/images/team/michael.jpg",
    github_url: "https://github.com/michaelchen",
    linkedin_url: "https://linkedin.com/in/michaelchen",
    is_leadership: true,
    order_index: 2
  },
  {
    name: "Lisa Weber",
    role: "Community Manager",
    bio: "Organizing events and workshops to bring the tech community together. Background in UI/UX design and digital marketing.",
    image_url: "/images/team/lisa.jpg",
    linkedin_url: "https://linkedin.com/in/lisaweber",
    twitter_url: "https://twitter.com/lisaweber",
    is_leadership: false,
    order_index: 3
  }
];

// Events are intentionally NOT seeded here. They are created exclusively through
// the admin panel by a signed-in admin, so this script only seeds projects and team.
async function populateDatabase() {
  try {
    console.log('Starting database population...');

    // Insert projects
    console.log('Inserting projects...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .insert(sampleProjects)
      .select();

    if (projectsError) {
      console.error('Error inserting projects:', projectsError);
    } else {
      console.log(`Inserted ${projects.length} projects`);
    }

    // Insert team members
    console.log('Inserting team members...');
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .insert(sampleTeamMembers)
      .select();

    if (teamError) {
      console.error('Error inserting team members:', teamError);
    } else {
      console.log(`Inserted ${teamMembers.length} team members`);
    }

    console.log('Database population completed!');
  } catch (error) {
    console.error('Error populating database:', error);
  }
}

// Run the script
populateDatabase();
