import { SUPABASE_ANON_KEY, SUPABASE_URL, GOOGLE_WEB_CLIENT_ID } from '../config/constants';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const removeItem = async (key: string) => {
    try {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(key);
        }
    } catch (error) {
        console.error(`Error removing ${key}:`, error);
        throw error;
    }
};





// Check if user is authenticated
export const isAuthenticated = async () => {
    console.log('🔍 Checking authentication status...');
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('❌ Session check error:', error);
            return { isAuthenticated: false, userId: null };
        }

        if (!session) {
            console.log('ℹ️ No active session found');
            return { isAuthenticated: false, userId: null };
        }

        console.log('✅ User is authenticated');
        return {
            isAuthenticated: true,
            userId: session.user.id,
            user: session.user
        };
    } catch (error) {
        console.error('❌ Auth check error:', error);
        return { isAuthenticated: false, userId: null };
    }
};

// Get user name from authenticated session
export const getUserName = async () => {
    try {
        const { user } = await isAuthenticated();
        if (user) {
            // Try to get name from user metadata, fallback to email
            return user.user_metadata?.full_name ||
                   user.user_metadata?.name ||
                   user.email?.split('@')[0] ||
                   'User';
        }
        return 'User';
    } catch (error) {
        console.error('❌ Error getting user name:', error);
        return 'User';
    }
};

// Sign in with Google using Supabase Auth
export const signInWithGoogle = async () => {
    console.log('🔍 Starting Google Sign-in process...');
    console.log('🌐 Platform check:', typeof window !== 'undefined' ? 'web' : 'native');
    console.log('🔧 Supabase client initialized:', !!supabase);

    try {
        console.log('📞 Calling supabase.auth.signInWithOAuth...');
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: 'https://market.owlit.in',
                // redirectTo: 'http://localhost:8081',
                // redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });


        console.log('📦 OAuth response received');
        console.log('📋 Data:', data);
        console.log('❌ Error:', error);

        if (error) {
            console.error('❌ Google Sign-in error:', error);
            throw error;
        }

        console.log('✅ No error in OAuth response');

        // Wait for the session to be established and log the user ID
        supabase.auth.getUser().then(({ data, error }) => {
            if (data?.user) {
                console.log('✅ Supabase user ID:', data.user.id);
            } else if (error) {
                console.error('❌ Error fetching Supabase user:', error);
            }
        });

        console.log('✅ Google Sign-in initiated successfully');
        console.log('🔄 Returning data:', data);
        return data;
    } catch (error: any) {
        console.error('❌ Google Sign-in error:', error);
        console.error('❌ Error type:', typeof error);
        console.error('❌ Error message:', error.message);
        throw error;
    }
};

// Refresh token using Supabase
export const refreshToken = async () => {
    try {
        console.log('🔄 Refreshing token...');
        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
            console.error('❌ Token refresh error:', error);
            throw error;
        }

        if (data.session) {
            console.log('✅ Token refreshed successfully');
            return data.session;
        }

        throw new Error('No session returned from refresh');
    } catch (error) {
        console.error('❌ Token refresh error:', error);
        throw error;
    }
};

// Sign out
export const signOut = async () => {
    console.log('🔍 Starting sign out process...');
    try {
        // 1. Try to sign out from Supabase
        const { error } = await supabase.auth.signOut({ scope: 'local' });

        // If it's a "Session missing" error, we don't care!
        // It means the user is already logged out on the server.
        if (error && error.name !== 'AuthSessionMissingError') {
            console.warn('Supabase signout warning:', error.message);
        }

    } catch (error) {
        // Log unexpected errors, but don't let them stop the cleanup
        console.error('Unexpected error during Supabase signout:', error);
    }

    // 2. Clear local storage (Guaranteed execution)
    console.log('🧹 Clearing stored data...');
    try {
        // We use Promise.all to clear everything in parallel
        await Promise.all([
            removeItem('accessToken'),
            removeItem('refreshToken'),
            removeItem('userId'),
            removeItem('userType')
        ]);
        console.log('✅ Local storage wiped');
    } catch (e) {
        console.error('Error wiping storage:', e);
    }

    return true;
};
// User type management functions
export type UserType = 'brand' | 'influencer';

// Store user type in localStorage (can be upgraded to database later)
export const setUserType = async (userType: UserType) => {
    try {
        console.log(`💾 Storing user type: ${userType}`);
        if (typeof window !== 'undefined') {
            localStorage.setItem('userType', userType);
        }
        console.log('✅ User type stored successfully');
        return true;
    } catch (error) {
        console.error('❌ Error storing user type:', error);
        throw error;
    }
};

// Get user type from localStorage
export const getUserType = async (): Promise<UserType> => {
    try {
        if (typeof window !== 'undefined') {
            const userType = localStorage.getItem('userType') as UserType;
            console.log(`📖 Retrieved user type: ${userType || 'not set'}`);
            return userType || 'influencer'; // Default to influencer
        }
        console.log('📖 No window object, defaulting to influencer');
        return 'influencer';
    } catch (error) {
        console.error('❌ Error retrieving user type:', error);
        return 'influencer'; // Default fallback
    }
};


