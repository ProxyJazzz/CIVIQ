const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://example.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.test');
console.log('supabase.auth.getClaims:', typeof supabase.auth.getClaims);
console.log('supabase.auth.getUser:', typeof supabase.auth.getUser);
console.log('supabase.auth.getSession:', typeof supabase.auth.getSession);
