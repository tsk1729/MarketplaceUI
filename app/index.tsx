import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { isAuthenticated, getUserType } from './utils/auth';
import { COLORS } from '@/constants/theme';

export default function RootIndex() {
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        checkAuthAndRedirect();
    }, []);

    const checkAuthAndRedirect = async () => {
        try {
            console.log('🔍 Root index: Checking authentication...');

            // Add small delay to ensure router is ready
            await new Promise(resolve => setTimeout(resolve, 100));

            const { isAuthenticated: authenticated, userId } = await isAuthenticated();

            console.log('✅ Auth check result:', { authenticated, userId });

            if (authenticated && userId) {
                console.log('👤 User is authenticated, checking user type...');

                try {
                    // Get user type to determine routing
                    const userType = await getUserType();
                    console.log('📋 User type:', userType);

                    // Route based on user type
                    const targetRoute = userType === 'brand' ? "/(connect)/agency" : "/(connect)/influencer";
                    console.log('🎯 Routing to:', targetRoute);

                    router.replace(targetRoute);
                } catch (userTypeError) {
                    console.error('❌ Error getting user type:', userTypeError);
                    // Fallback: redirect to login on user type error
                    try {
                        router.replace("/(Login)/login");
                    } catch (fallbackNavError) {
                        console.error('Fallback navigation failed:', fallbackNavError);
                        // Last resort fallback
                        setTimeout(() => {
                            try {
                                router.replace("/(Login)");
                            } catch (finalFallbackError) {
                                console.error('Final fallback navigation failed:', finalFallbackError);
                            }
                        }, 1000);
                    }
                }
            } else {
                console.log('🚪 User not authenticated, redirecting to login...');
                try {
                    router.replace("/(Login)/login");
                } catch (navError) {
                    console.error('Navigation error:', navError);
                    // Fallback navigation
                    setTimeout(() => {
                        try {
                            router.replace("/(Login)");
                        } catch (fallbackError) {
                            console.error('Fallback navigation failed:', fallbackError);
                        }
                    }, 500);
                }
            }
        } catch (error) {
            console.error('❌ Error during auth check:', error);
            // Fallback to login on error
            try {
                router.replace("/(Login)");
            } catch (navError) {
                console.error('Fallback navigation failed:', navError);
            }
        } finally {
            setIsChecking(false);
        }
    };

    // Show loading while checking authentication
    return (
        <View style={{
            flex: 1,
            backgroundColor: COLORS.background,
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{
                color: COLORS.white,
                marginTop: 16,
                fontSize: 16
            }}>
                Checking authentication...
            </Text>
        </View>
    );
}
