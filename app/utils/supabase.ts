import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/constants';

// Create a single supabase client for interacting with your database
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
});

// Function to check if user is authenticated
export const isAuthenticated = async () => {
  console.log('🔍 Checking authentication status...');
  const { data: { session } } = await supabase.auth.getSession();
  console.log('📱 Session status:', session ? 'Active' : 'No session');
  return !!session;
};

// Function to sign out
export const signOut = async () => {
  console.log('🚪 Starting sign out process...');
  try {
    // Sign out from Google
    console.log('🔑 Signing out from Google...');
    await GoogleSignin.signOut();
    console.log('✅ Google sign out successful');

    // Sign out from Supabase
    console.log('🔑 Signing out from Supabase...');
    await supabase.auth.signOut();
    console.log('✅ Supabase sign out successful');

    // Clear any stored data
    console.log('🧹 Clearing stored data...');
    await AsyncStorage.clear();
    console.log('✅ Storage cleared successfully');

    console.log('✅ Sign out process completed successfully');
  } catch (error) {
    console.error('❌ Error during sign out:', error);
    throw error;
  }
}; 