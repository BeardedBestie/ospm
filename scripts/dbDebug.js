require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testDbConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing required environment variables.');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false }
  });

  console.log('Testing connection to Supabase...');
  try {
    const { data, error, status } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Query error:', error);
      console.error('Status code:', status);
      process.exit(1);
    }

    console.log('Connection successful! Sample project row:', data);
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

testDbConnection();
