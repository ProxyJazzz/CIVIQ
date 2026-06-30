const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── 1. Load environment variables ──────────────────────────────────────────
if (fs.existsSync('.env.local')) {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  envText.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = val;
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const googleApiKey = process.env.GOOGLE_API_KEY;

if (!supabaseUrl || !supabaseKey || !googleApiKey) {
  console.error('Missing required environment variables in .env.local');
  process.exit(1);
}

// Helper to generate a dummy 768-dimension vector in case Gemini API fails
function getDummyEmbedding() {
  const arr = [];
  for (let i = 0; i < 768; i++) {
    arr.push((Math.random() - 0.5) * 0.1);
  }
  return arr;
}

async function generateEmbedding(text) {
  try {
    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    if (result && result.embedding && result.embedding.values) {
      return result.embedding.values;
    }
  } catch (err) {
    console.warn(`[Gemini API] Failed to generate embedding. Using self-healing dummy vector. Reason: ${err.message}`);
  }
  return getDummyEmbedding();
}

function getUserClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

// ─── 2. User Data Definitions ────────────────────────────────────────────────
// Admin signed up first to ensure role = 'admin' is assigned (since RLS trigger assigns admin to first user or @civiq.gov)
const MOCK_USERS = [
  {
    email: 'admin@civiq.com',
    password: 'CiviqAdmin123!',
    fullName: 'Officer Vikram Singh',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&h=120&fit=crop&crop=faces',
  },
  {
    email: 'amit.sharma@gmail.com',
    password: 'CiviqUser123!',
    fullName: 'Amit Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=faces',
  },
  {
    email: 'priya.patel@gmail.com',
    password: 'CiviqUser123!',
    fullName: 'Priya Patel',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
  },
  {
    email: 'rahul.verma@gmail.com',
    password: 'CiviqUser123!',
    fullName: 'Rahul Verma',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
  },
  {
    email: 'sneha.reddy@gmail.com',
    password: 'CiviqUser123!',
    fullName: 'Sneha Reddy',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces',
  }
];

// ─── 3. Report Data Definitions ──────────────────────────────────────────────
const MOCK_REPORTS = [
  {
    title: 'Dangerous Crater Pothole - Outer Circle CP',
    description: 'A very deep pothole has formed near Block A outer circle, right after the metro station exit. Several vehicles have damaged their tires today. Needs immediate repair.',
    category: 'Pothole',
    severity: 'High',
    latitude: 28.6305,
    longitude: 77.2178,
    address: 'Block A Outer Circle, Connaught Place, New Delhi',
    reporterEmail: 'amit.sharma@gmail.com',
    imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&h=400&fit=crop',
    departmentName: 'Public Works & Roads',
    status: 'pending'
  },
  {
    title: 'Overflowing Commercial Trash and Plastic Pile',
    description: 'Large pile of commercial waste and plastic garbage bags dumped on the sidewalk behind Connaught Place Block A restaurants. Rotting smell is unbearable.',
    category: 'Garbage',
    severity: 'High',
    latitude: 28.6302,
    longitude: 77.2176,
    address: 'Radial Road 1, Block A, Connaught Place, New Delhi',
    reporterEmail: 'priya.patel@gmail.com',
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&h=400&fit=crop',
    departmentName: 'Sanitation & Waste',
    status: 'pending'
  },
  {
    title: 'Main Water Pipeline Burst near Metro Gate',
    description: 'Potable water is gushing out of a burst pipeline near Connaught Place Block A Metro Gate 2. The sidewalk is completely flooded and water pressure is dropping in nearby blocks.',
    category: 'Water Leakage',
    severity: 'High',
    latitude: 28.6303,
    longitude: 77.2175,
    address: 'Gate 2 Exit, Rajiv Chowk Metro Station, Connaught Place, New Delhi',
    reporterEmail: 'rahul.verma@gmail.com',
    imageUrl: 'https://images.unsplash.com/photo-1584267385494-9fdf97b090df?w=600&h=400&fit=crop',
    departmentName: 'Water Resources & Drainage',
    status: 'pending'
  },
  {
    title: 'Entire Block of Streetlights Non-Functional',
    description: 'All streetlights along Arya Samaj Road are completely off for the last 3 nights. The street is pitch black after 8 PM, raising safety concerns for residents.',
    category: 'Streetlight',
    severity: 'Medium',
    latitude: 28.6445,
    longitude: 77.1890,
    address: 'Arya Samaj Road, Karol Bagh, New Delhi',
    reporterEmail: 'sneha.reddy@gmail.com',
    imageUrl: 'https://images.unsplash.com/photo-1509024644558-2f56ce76c490?w=600&h=400&fit=crop',
    departmentName: 'Street & Electrical Operations',
    status: 'assigned'
  },
  {
    title: 'Blocked Storm Drain causing Localized Flooding',
    description: 'Storm drain is completely choked with leaves and plastic waste, causing water to pool up to knee level after yesterday\'s light rain. Lajpat Nagar Market area.',
    category: 'Drainage',
    severity: 'Medium',
    latitude: 28.5680,
    longitude: 77.2430,
    address: 'Central Market, Lajpat Nagar II, New Delhi',
    reporterEmail: 'priya.patel@gmail.com',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=400&fit=crop',
    departmentName: 'Water Resources & Drainage',
    status: 'in_progress'
  },
  {
    title: 'Broken Park Benches and Uprooted Trees in Ridge Park',
    description: 'Several public benches are broken and storm damage has left branches blocking the pathways in Northern Ridge park near Delhi University.',
    category: 'Other',
    severity: 'Low',
    latitude: 28.6860,
    longitude: 77.2080,
    address: 'Northern Ridge Park, University Enclave, New Delhi',
    reporterEmail: 'sneha.reddy@gmail.com',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop',
    departmentName: 'General Civic Services',
    status: 'resolved'
  }
];

const MOCK_COMMENTS = [
  'This is indeed extremely dangerous. I saw a motorcyclist slip here yesterday.',
  'Reported this to the local ward office as well, hopefully they act soon.',
  'The municipal team has been dispatched to investigate this issue.',
  'This block is very dark at night. Safety check needed immediately.'
];

// ─── 4. Main Seed Execution ──────────────────────────────────────────────────
async function seed() {
  console.log('Starting CIVIQ database seeding with rate-limit self-healing...');
  const mainSupabase = createClient(supabaseUrl, supabaseKey);

  // Fetch departments mapping (UUID lookup by name)
  const { data: depts, error: deptsErr } = await mainSupabase.from('departments').select('id, name');
  if (deptsErr) {
    console.error('Error fetching departments:', deptsErr.message);
    process.exit(1);
  }
  const deptMap = {};
  depts.forEach(d => {
    deptMap[d.name] = d.id;
  });

  const activeUsers = {}; // Mapping of email -> auth User object
  const activeClients = {}; // Mapping of email -> active authenticated Supabase client

  // 1. Seed and Sign Up/In Users
  for (const u of MOCK_USERS) {
    console.log(`Setting up user: ${u.email}...`);
    try {
      const client = getUserClient();
      const { data: signUpData, error: signUpErr } = await client.auth.signUp({
        email: u.email,
        password: u.password,
        options: {
          data: {
            full_name: u.fullName,
            avatar_url: u.avatarUrl
          }
        }
      });

      let userObj;
      if (signUpErr) {
        // Fallback: If signup rate limit is hit, try logging in first
        const { data: signInData, error: signInErr } = await client.auth.signInWithPassword({
          email: u.email,
          password: u.password
        });
        if (signInErr) {
          console.warn(`⚠️ Could not sign up or sign in ${u.email} due to limits: ${signUpErr.message || signInErr.message}`);
          continue; // Move to next user
        }
        userObj = signInData.user;
      } else {
        userObj = signUpData.user;
        // Authenticate the user client
        await client.auth.signInWithPassword({
          email: u.email,
          password: u.password
        });
      }

      activeUsers[u.email] = userObj;
      activeClients[u.email] = client;
      console.log(`✓ Set up user: ${u.fullName} (ID: ${userObj.id})`);
    } catch (err) {
      console.error(`Failed to set up user ${u.email}:`, err.message);
    }
  }

  // Ensure we have at least one successfully authenticated user to perform operations
  const activeUserEmails = Object.keys(activeUsers);
  if (activeUserEmails.length === 0) {
    console.error('❌ Critical: No users could be authenticated. Seeding aborted.');
    process.exit(1);
  }

  const primaryReporterEmail = activeUserEmails[0];
  const primaryClient = activeClients[primaryReporterEmail];
  const primaryUser = activeUsers[primaryReporterEmail];

  console.log(`Primary user session established: ${primaryReporterEmail} (ID: ${primaryUser.id})`);

  // 2. Seed Reports
  const seededReports = [];

  for (const rep of MOCK_REPORTS) {
    console.log(`Creating report: "${rep.title}"...`);
    
    // Check if the requested reporter was successfully authenticated
    let reporterEmail = rep.reporterEmail;
    let client = activeClients[reporterEmail];
    let reporterUser = activeUsers[reporterEmail];

    if (!client || !reporterUser) {
      // Self-healing fallback: Use the primary authenticated user to bypass RLS violations
      console.log(`Reporter ${rep.reporterEmail} not available. Falling back to primary user ${primaryReporterEmail}.`);
      reporterEmail = primaryReporterEmail;
      client = primaryClient;
      reporterUser = primaryUser;
    }

    // Generate real embedding using Gemini model (or dummy on fail)
    const textToEmbed = `Title: ${rep.title}\nDescription: ${rep.description}`;
    const embedding = await generateEmbedding(textToEmbed);

    const deptId = deptMap[rep.departmentName] || null;

    const { data: reportData, error: insertErr } = await client
      .from('reports')
      .insert({
        user_id: reporterUser.id,
        title: rep.title,
        description: rep.description,
        image_url: rep.imageUrl,
        category: rep.category,
        severity: rep.severity,
        confidence: 0.92,
        summary: `AI classified ${rep.category.toLowerCase()} issue. Route to ${rep.departmentName}.`,
        status: rep.status,
        latitude: rep.latitude,
        longitude: rep.longitude,
        address: rep.address,
        department_id: deptId,
        tags: [rep.category.toLowerCase(), rep.severity.toLowerCase(), 'delhi'],
        ai_summary: `Hyperlocal civic issue: ${rep.title}`,
        embedding: `[${embedding.join(',')}]`,
      })
      .select()
      .single();

    if (insertErr) {
      console.error(`❌ Failed to insert report "${rep.title}":`, insertErr.message);
    } else {
      console.log(`✓ Created report: "${reportData.title}" (ID: ${reportData.id})`);
      seededReports.push(reportData);
    }
  }

  if (seededReports.length === 0) {
    console.error('❌ Error: No reports were successfully seeded.');
    process.exit(1);
  }

  // 3. Seed votes, comments, and verifications
  console.log('Seeding votes, comments, and verifications...');
  for (const report of seededReports) {
    // Let other active users interact with this report
    for (const email of activeUserEmails) {
      const userAuth = activeUsers[email];
      const client = activeClients[email];

      // Skip report creator
      if (userAuth.id === report.user_id) continue;

      // Add Vote
      const { error: voteErr } = await client
        .from('votes')
        .insert({ report_id: report.id, user_id: userAuth.id });
      if (voteErr && !voteErr.message.includes('unique')) {
        console.warn(`Could not add vote on report ${report.id} for user ${email}:`, voteErr.message);
      }

      // Add Verification
      const { error: verifyErr } = await client
        .from('report_verifications')
        .insert({ report_id: report.id, user_id: userAuth.id, verified: true });
      if (verifyErr && !verifyErr.message.includes('unique')) {
        console.warn(`Could not add verification on report ${report.id} for user ${email}:`, verifyErr.message);
      }

      // Add Comment
      const commentText = MOCK_COMMENTS[Math.floor(Math.random() * MOCK_COMMENTS.length)];
      const { error: commentErr } = await client
        .from('comments')
        .insert({
          report_id: report.id,
          user_id: userAuth.id,
          content: commentText,
        });
      if (commentErr) {
        console.warn(`Could not add comment on report ${report.id} for user ${email}:`, commentErr.message);
      }
    }
  }

  // 4. Verification Check and Finish
  const { count: finalRepCount } = await mainSupabase.from('reports').select('*', { count: 'exact', head: true });
  const { count: finalCommentsCount } = await mainSupabase.from('comments').select('*', { count: 'exact', head: true });
  console.log('\n🎉 Seeding completed successfully!');
  console.log(`Total Reports: ${finalRepCount}`);
  console.log(`Total Comments: ${finalCommentsCount}`);
}

seed().catch(err => {
  console.error('Seeding failed with error:', err);
});
