const fs = require('fs');

function getDummyEmbedding() {
  const arr = [];
  for (let i = 0; i < 768; i++) {
    arr.push((Math.random() - 0.5) * 0.1);
  }
  return `[${arr.join(',')}]`;
}

const USERS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@civiq.com',
    fullName: 'Officer Vikram Singh',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'amit.sharma@gmail.com',
    fullName: 'Amit Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'priya.patel@gmail.com',
    fullName: 'Priya Patel',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'rahul.verma@gmail.com',
    fullName: 'Rahul Verma',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'sneha.reddy@gmail.com',
    fullName: 'Sneha Reddy',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces',
  }
];

const REPORTS = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'Dangerous Crater Pothole - Outer Circle CP',
    description: 'A very deep pothole has formed near Block A outer circle, right after the metro station exit. Several vehicles have damaged their tires today. Needs immediate repair.',
    category: 'Pothole',
    severity: 'High',
    latitude: 28.6305,
    longitude: 77.2178,
    address: 'Block A Outer Circle, Connaught Place, New Delhi',
    userId: '22222222-2222-2222-2222-222222222222',
    imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&h=400&fit=crop',
    departmentName: 'Public Works & Roads',
    status: 'pending'
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    title: 'Overflowing Commercial Trash and Plastic Pile',
    description: 'Large pile of commercial waste and plastic garbage bags dumped on the sidewalk behind Connaught Place Block A restaurants. Rotting smell is unbearable.',
    category: 'Garbage',
    severity: 'High',
    latitude: 28.6302,
    longitude: 77.2176,
    address: 'Radial Road 1, Block A, Connaught Place, New Delhi',
    userId: '33333333-3333-3333-3333-333333333333',
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&h=400&fit=crop',
    departmentName: 'Sanitation & Waste',
    status: 'pending'
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    title: 'Main Water Pipeline Burst near Metro Gate',
    description: 'Potable water is gushing out of a burst pipeline near Connaught Place Block A Metro Gate 2. The sidewalk is completely flooded and water pressure is dropping in nearby blocks.',
    category: 'Water Leakage',
    severity: 'High',
    latitude: 28.6303,
    longitude: 77.2175,
    address: 'Gate 2 Exit, Rajiv Chowk Metro Station, Connaught Place, New Delhi',
    userId: '44444444-4444-4444-4444-444444444444',
    imageUrl: 'https://images.unsplash.com/photo-1584267385494-9fdf97b090df?w=600&h=400&fit=crop',
    departmentName: 'Water Resources & Drainage',
    status: 'pending'
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    title: 'Entire Block of Streetlights Non-Functional',
    description: 'All streetlights along Arya Samaj Road are completely off for the last 3 nights. The street is pitch black after 8 PM, raising safety concerns for residents.',
    category: 'Streetlight',
    severity: 'Medium',
    latitude: 28.6445,
    longitude: 77.1890,
    address: 'Arya Samaj Road, Karol Bagh, New Delhi',
    userId: '55555555-5555-5555-5555-555555555555',
    imageUrl: 'https://images.unsplash.com/photo-1509024644558-2f56ce76c490?w=600&h=400&fit=crop',
    departmentName: 'Street & Electrical Operations',
    status: 'assigned'
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    title: 'Blocked Storm Drain causing Localized Flooding',
    description: 'Storm drain is completely choked with leaves and plastic waste, causing water to pool up to knee level after yesterday\'s light rain. Lajpat Nagar Market area.',
    category: 'Drainage',
    severity: 'Medium',
    latitude: 28.5680,
    longitude: 77.2430,
    address: 'Central Market, Lajpat Nagar II, New Delhi',
    userId: '33333333-3333-3333-3333-333333333333',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=400&fit=crop',
    departmentName: 'Water Resources & Drainage',
    status: 'in_progress'
  },
  {
    id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    title: 'Broken Park Benches and Uprooted Trees in Ridge Park',
    description: 'Several public benches are broken and storm damage has left branches blocking the pathways in Northern Ridge park near Delhi University.',
    category: 'Other',
    severity: 'Low',
    latitude: 28.6860,
    longitude: 77.2080,
    address: 'Northern Ridge Park, University Enclave, New Delhi',
    userId: '55555555-5555-5555-5555-555555555555',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop',
    departmentName: 'General Civic Services',
    status: 'resolved'
  }
];

const COMMENTS = [
  { userId: '33333333-3333-3333-3333-333333333333', content: 'This is indeed extremely dangerous. I saw a motorcyclist slip here yesterday.' },
  { userId: '44444444-4444-4444-4444-444444444444', content: 'Reported this to the local ward office as well, hopefully they act soon.' },
  { userId: '11111111-1111-1111-1111-111111111111', content: 'The municipal team has been dispatched to investigate this issue.' },
  { userId: '22222222-2222-2222-2222-222222222222', content: 'This block is very dark at night. Safety check needed immediately.' }
];

let sql = `-- ============================================================
-- SQL Seed File for CIVIQ remote database
-- Generated programmatically to bypass auth rate-limits
-- ============================================================

-- Clean up existing data to ensure a fresh, consistent seed
TRUNCATE TABLE public.report_verifications CASCADE;
TRUNCATE TABLE public.votes CASCADE;
TRUNCATE TABLE public.comments CASCADE;
TRUNCATE TABLE public.reports CASCADE;
TRUNCATE TABLE public.profiles CASCADE;
DELETE FROM auth.users WHERE email IN (${USERS.map(u => `'${u.email}'`).join(', ')});

`;

// 1. Insert Users into auth.users (triggers profile creation)
USERS.forEach(u => {
  const meta = JSON.stringify({ full_name: u.fullName, avatar_url: u.avatarUrl });
  const appMeta = JSON.stringify({ provider: 'email', providers: ['email'] });
  // Note: we insert dummy encrypted passwords
  sql += `INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, aud, role, created_at, updated_at)
VALUES (
  '${u.id}',
  '${u.email}',
  '$2a$10$O0F.U5WjK3j6Jj.D1n2a7uG162.h2h3o4p5q6r7s8t9u0v1w2x3y4z5', -- dummy hash
  now(),
  '${meta}'::jsonb,
  '${appMeta}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
);

`;
});

// We manually trigger profile role update for the admin since handle_new_user trigger runs
sql += `
-- Set Vikram Singh to admin role
UPDATE public.profiles SET role = 'admin' WHERE id = '11111111-1111-1111-1111-111111111111';
`;

// 2. Insert Reports
REPORTS.forEach(r => {
  const vector = getDummyEmbedding();
  sql += `
INSERT INTO public.reports (
  id, user_id, title, description, image_url, category, severity, status, confidence, summary,
  latitude, longitude, address, department_id, tags, ai_summary, embedding, created_at
) VALUES (
  '${r.id}',
  '${r.userId}',
  '${r.title.replace(/'/g, "''")}',
  '${r.description.replace(/'/g, "''")}',
  '${r.imageUrl}',
  '${r.category}',
  '${r.severity}',
  '${r.status}',
  0.95,
  'AI classified ${r.category.toLowerCase()} issue. Assign to ${r.departmentName}.',
  ${r.latitude},
  ${r.longitude},
  '${r.address.replace(/'/g, "''")}',
  (SELECT id FROM public.departments WHERE name = '${r.departmentName}' LIMIT 1),
  ARRAY['${r.category.toLowerCase()}', '${r.severity.toLowerCase()}', 'delhi'],
  'Hyperlocal civic issue: ${r.title.replace(/'/g, "''")}',
  '${vector}'::vector(768),
  now() - INTERVAL '${Math.floor(Math.random() * 5)} days'
);
`;
});

// 3. Insert Votes, Comments, and Verifications for rich dashboard metrics
REPORTS.forEach(r => {
  // Let other users interact
  const otherUsers = USERS.filter(u => u.id !== r.userId);
  
  otherUsers.forEach((u, i) => {
    // Add Vote
    if (i % 2 === 0) {
      sql += `INSERT INTO public.votes (report_id, user_id, created_at) VALUES ('${r.id}', '${u.id}', now());\n`;
    }
    // Add Verification
    if (i % 3 === 0) {
      sql += `INSERT INTO public.report_verifications (report_id, user_id, verified, created_at) VALUES ('${r.id}', '${u.id}', true, now());\n`;
    }
    // Add Comment
    if (i < COMMENTS.length) {
      const comm = COMMENTS[i];
      sql += `INSERT INTO public.comments (report_id, user_id, content, created_at) VALUES ('${r.id}', '${u.id}', '${comm.content.replace(/'/g, "''")}', now());\n`;
    }
  });
});

fs.writeFileSync('scripts/seed-data.sql', sql);
console.log('Successfully generated scripts/seed-data.sql');
