import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Force sign out
export async function forceSignOut() {
  await supabase.auth.signOut();
  window.location.reload(); // Force reload after sign out
}

// Helper function to make a user an admin
export async function makeUserAdmin(email: string) {
  try {
    // First get the user's ID from their email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError) throw userError;
    if (!userData) throw new Error('User not found');

    // Then update their profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        role: 'admin',
        status: 'active'
      })
      .eq('id', userData.id);
    
    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error('Error making user admin:', error);
    throw error;
  }
}

// Helper function to make all users admins
export async function makeAllUsersAdmins() {
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ 
      role: 'admin',
      status: 'active'
    });
  
  if (updateError) throw updateError;
  return true;
}