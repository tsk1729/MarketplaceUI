import { COLORS } from "@/constants/theme";
import { isAuthenticated, signInWithGoogle, setUserType, getUserType, UserType } from "../utils/auth";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import { router, useRootNavigation } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import { Image, Text, View, TouchableOpacity, Animated, SafeAreaView, Platform, Dimensions, ScrollView } from "react-native";
import { styles } from "./authstyles";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isMobileWeb = isWeb && width < 768;  // phone browser
const isDesktopWeb = isWeb && width >= 768; // laptop/desktop browser

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const navigation = useRootNavigation();

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const logoScaleAnim = useRef(new Animated.Value(0)).current;
    const loadingAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        initializeAuth();
    }, []);

    useEffect(() => {
        if (!isInitializing) {
            // Start entrance animations with staggered timing
            Animated.sequence([
                // First: Logo animation
                Animated.spring(logoScaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
                // Second: Main content fade and slide
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(slideAnim, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ]),
                // Third: Scale animation for interactive elements
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isInitializing]);

    const initializeAuth = async () => {
        try {
            const { isAuthenticated: authenticated, userId } = await isAuthenticated();
            if (authenticated && userId) {
                // Get user type using proper auth utility function
                const userType = await getUserType();

                // Check if navigation is ready
                if (navigation?.isReady()) {
                    // Route based on user type
                    if (userType === 'brand') {
                        router.replace("/(connect)/brand");
                    } else {
                        router.replace("/(connect)/influencer");
                    }
                } else {
                    // Fallback: try again after a short delay
                    setTimeout(() => {
                        if (userType === 'brand') {
                            router.replace("/(connect)/brand");
                        } else {
                            router.replace("/(connect)/influencer");
                        }
                    }, 300);
                }
            }
        } catch (error) {
            console.error('Initialization error:', error);
        } finally {
            setIsInitializing(false);
        }
    };

    const buttonScaleAnim = useRef(new Animated.Value(1)).current;

    const handleGoogleSignIn = async (userType: 'brand' | 'influencer') => {
        console.log(`🚀 handleGoogleSignIn called for ${userType}`);

        // Button press animation
        Animated.sequence([
            Animated.timing(buttonScaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(buttonScaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        setLoading(true);
        setError(null);

        // Loading animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(loadingAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(loadingAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        try {
            console.log(`🔍 Starting Google Sign-in for ${userType}...`);

            // Store user type using proper auth utility function
            await setUserType(userType);

            console.log('📞 About to call signInWithGoogle()...');

            const data = await signInWithGoogle();
            console.log('📦 Sign-in response received:', data);
            console.log('📋 Response type:', typeof data);
            console.log('📋 Response keys:', data ? Object.keys(data) : 'null/undefined');

            if (data && data.url) {
                // For web, this will redirect to Google OAuth
                console.log('✅ OAuth URL generated:', data.url);
                console.log(`🌐 About to redirect ${userType} to Google OAuth...`);
                // The user will be redirected to Google, then back to our app
                // User type is stored in localStorage and will be read during initialization
            } else {
                console.log('❌ No OAuth URL in response:', data);
                throw new Error('No OAuth URL received');
            }
        } catch (error: any) {
            console.error(`❌ Google Sign-in error for ${userType}:`, error);
            console.error('❌ Error type:', typeof error);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
            setError(error.message || "An unexpected error occurred. Please try again later.");
        } finally {
            console.log('🏁 Finally block executed');
            setLoading(false);
            // Stop loading animation
            loadingAnim.stopAnimation();
        }
    };

    const handleBrandSignIn = () => handleGoogleSignIn('brand');
    const handleInfluencerSignIn = () => handleGoogleSignIn('influencer');

    if (isInitializing) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Animated.View
                        style={[
                            styles.logoContainer,
                            {
                                transform: [{ scale: logoScaleAnim }],
                                opacity: logoScaleAnim,
                            }
                        ]}
                    >
                        <MaterialCommunityIcons name="owl" size={36} color={COLORS.primary} />
                    </Animated.View>
                    <Text style={styles.appName}>Owlit</Text>
                    <Text style={styles.tagline}>Influencer Marketplace</Text>
                </View>
                <View style={styles.illustrationContainer}>
                    <Image
                        source={require("../../assets/images/influencer.png")}
                        style={styles.illustration}
                        resizeMode="contain"
                    />
                </View>
                <View style={styles.contentSection}>
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // For desktop web browsers, use a side-by-side layout
    if (isDesktopWeb) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                >
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        {/* Centered Branding Section - Full Width */}
                        <Animated.View
                            style={[
                                { alignItems: 'center', paddingVertical: 20 },
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }],
                                }
                            ]}
                        >
                            <Animated.View
                                style={[
                                    styles.logoContainer,
                                    {
                                        transform: [{ scale: logoScaleAnim }],
                                        opacity: logoScaleAnim,
                                    }
                                ]}
                            >
                                <MaterialCommunityIcons name="owl" size={36} color={COLORS.primary} />
                            </Animated.View>
                            <Animated.Text
                                style={[
                                    styles.appName,
                                    { textAlign: 'center' },
                                    {
                                        opacity: fadeAnim,
                                        transform: [{ translateY: slideAnim }],
                                    }
                                ]}
                            >
                                Owlit
                            </Animated.Text>
                            <Animated.Text
                                style={[
                                    styles.tagline,
                                    { textAlign: 'center' },
                                    {
                                        opacity: fadeAnim,
                                        transform: [{ translateY: slideAnim }],
                                    }
                                ]}
                            >
                                Influencer Marketplace
                            </Animated.Text>
                        </Animated.View>

                        {/* Two Column Layout */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
                            {/* Left Side - Illustration */}
                            <Animated.View
                                style={[
                                    { flex: 1, justifyContent: 'center', alignItems: 'center', paddingLeft: 80, paddingRight: 40 },
                                    {
                                        opacity: fadeAnim,
                                        transform: [{ translateX: slideAnim }],
                                    }
                                ]}
                            >
                                <Image
                                    source={require("../../assets/images/influencer.png")}
                                    style={[styles.illustration, { maxHeight: 250 }]}
                                    resizeMode="contain"
                                />
                            </Animated.View>

                            {/* Right Side - Content */}
                            <Animated.View
                                style={[
                                    { flex: 1, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 40, paddingRight: 80, maxWidth: 600 },
                                    {
                                        opacity: fadeAnim,
                                        transform: [{ translateX: slideAnim }],
                                    }
                                ]}
                            >
                                {/* Welcome Content */}
                                <Animated.Text
                                    style={[
                                        styles.welcomeText,
                                        {
                                            opacity: fadeAnim,
                                            transform: [{ translateY: slideAnim }],
                                        }
                                    ]}
                                >
                                    Welcome to owlit
                                </Animated.Text>
                                <Animated.Text
                                    style={[
                                        styles.descriptionText,
                                        { marginBottom: 20 },
                                        {
                                            opacity: fadeAnim,
                                            transform: [{ translateY: slideAnim }],
                                        }
                                    ]}
                                >
                                    Connect influencers with ad agencies. Build successful partnerships and grow your business.
                                </Animated.Text>

                                {/* Marketplace Info Card */}
                                <Animated.View
                                    style={[
                                        styles.marketplaceInfo,
                                        { marginBottom: 20 },
                                        {
                                            opacity: fadeAnim,
                                            transform: [{ translateY: slideAnim }],
                                        }
                                    ]}
                                >
                                    <Text style={styles.marketplaceTitle}>🎯 Influencer Marketplace</Text>
                                    <Text style={styles.marketplaceDescription}>
                                        Join thousands of influencers and brands building successful partnerships
                                    </Text>
                                </Animated.View>
                            </Animated.View>
                        </View>

                        {/* Centered Login Section - Full Width */}
                        <Animated.View
                            style={[
                                { alignItems: 'center', paddingVertical: 20 },
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }],
                                }
                            ]}
                        >
                            {loading ? (
                                <Animated.View
                                    style={[
                                        styles.loadingOverlay,
                                        {
                                            opacity: fadeAnim,
                                            transform: [{ scale: scaleAnim }],
                                        }
                                    ]}
                                >
                                    <Animated.Text
                                        style={[
                                            styles.loadingText,
                                            {
                                                opacity: loadingAnim,
                                            }
                                        ]}
                                    >
                                        Signing in...
                                    </Animated.Text>
                                </Animated.View>
                            ) : (
                                <>
                                    <Animated.View
                                        style={{
                                            transform: [{ scale: buttonScaleAnim }],
                                        }}
                                    >
                                        <TouchableOpacity
                                            style={styles.googleButton}
                                            onPress={handleInfluencerSignIn}
                                            activeOpacity={0.9}
                                        >
                                            <View style={styles.googleIconContainer}>
                                                <Ionicons name="logo-google" size={20} color={COLORS.surface} />
                                            </View>
                                            <Text style={styles.googleButtonText}>Continue as Influencer</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.googleButton}
                                            onPress={handleBrandSignIn}
                                            activeOpacity={0.9}
                                        >
                                            <View style={styles.googleIconContainer}>
                                                <Ionicons name="logo-google" size={20} color={COLORS.surface} />
                                            </View>
                                            <Text style={styles.googleButtonText}>Continue as Brand</Text>
                                        </TouchableOpacity>
                                    </Animated.View>

                                    {error && (
                                        <Animated.View
                                            style={[
                                                styles.errorContainer,
                                                {
                                                    opacity: fadeAnim,
                                                    transform: [{ scale: scaleAnim }],
                                                }
                                            ]}
                                        >
                                            <Text style={[styles.errorText, { textAlign: 'center' }]}>
                                                {error}
                                            </Text>
                                        </Animated.View>
                                    )}

                                    <Text style={[styles.termsText, { textAlign: 'center' }]}>
                                        By continuing, you agree to our Terms of Service and Privacy Policy
                                    </Text>
                                </>
                            )}
                        </Animated.View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Mobile layout (for both native mobile and mobile web browsers)
    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background, minHeight: '100%' }}>
            <ScrollView
                style={{ flex: 1, width: '100%', height: '100%', backgroundColor: COLORS.background }}
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: isMobileWeb ? 40 : Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40, backgroundColor: COLORS.background }}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                {/* Header Section */}
                <Animated.View
                    style={[
                        styles.header,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.logoContainer,
                            {
                                transform: [{ scale: logoScaleAnim }],
                                opacity: logoScaleAnim,
                            }
                        ]}
                    >
                        <MaterialCommunityIcons name="owl" size={36} color={COLORS.primary} />
                    </Animated.View>
                    <Animated.Text
                        style={[
                            styles.appName,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }
                        ]}
                    >
                        Owlit
                    </Animated.Text>
                    <Animated.Text
                        style={[
                            styles.tagline,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }
                        ]}
                    >
                        Influencer Marketplace
                    </Animated.Text>
                </Animated.View>

                {/* Illustration Section */}
                <Animated.View
                    style={[
                        styles.illustrationContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }
                    ]}
                >
                    <Image
                        source={require("../../assets/images/influencer.png")}
                        style={styles.illustration}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* Content Section */}
                <Animated.View
                    style={[
                        styles.contentSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }
                    ]}
                >
                    <Animated.Text
                        style={[
                            styles.welcomeText,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }
                        ]}
                    >
                        Welcome to Owlit
                    </Animated.Text>
                    <Animated.Text
                        style={[
                            styles.descriptionText,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }
                        ]}
                    >
                        Connect influencers with ad agencies. Build successful partnerships and grow your business.
                    </Animated.Text>

                    {/* Marketplace Info Card */}
                    <Animated.View
                        style={[
                            styles.marketplaceInfo,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }
                        ]}
                    >
                        <Text style={styles.marketplaceTitle}>🎯 Influencer Marketplace</Text>
                        <Text style={styles.marketplaceDescription}>
                            Join thousands of influencers and brands building successful partnerships
                        </Text>
                    </Animated.View>

                    {/* Login Section */}
                    {loading ? (
                        <Animated.View
                            style={[
                                styles.loadingOverlay,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ scale: scaleAnim }],
                                }
                            ]}
                        >
                            <Animated.Text
                                style={[
                                    styles.loadingText,
                                    {
                                        opacity: loadingAnim,
                                    }
                                ]}
                            >
                                Signing in...
                            </Animated.Text>
                        </Animated.View>
                    ) : (
                        <Animated.View
                            style={[
                                styles.loginSection,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }],
                                }
                            ]}
                        >
                            <Animated.View
                                style={{
                                    transform: [{ scale: buttonScaleAnim }],
                                }}
                            >
                                <TouchableOpacity
                                    style={styles.googleButton}
                                    onPress={handleInfluencerSignIn}
                                    activeOpacity={0.9}
                                >
                                    <View style={styles.googleIconContainer}>
                                        <Ionicons name="logo-google" size={20} color={COLORS.surface} />
                                    </View>
                                    <Text style={styles.googleButtonText}>Continue as Influencer</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.googleButton}
                                    onPress={handleBrandSignIn}
                                    activeOpacity={0.9}
                                >
                                    <View style={styles.googleIconContainer}>
                                        <Ionicons name="logo-google" size={20} color={COLORS.surface} />
                                    </View>
                                    <Text style={styles.googleButtonText}>Continue as Brand</Text>
                                </TouchableOpacity>
                            </Animated.View>

                            {error && (
                                <Animated.View
                                    style={[
                                        styles.errorContainer,
                                        {
                                            opacity: fadeAnim,
                                            transform: [{ scale: scaleAnim }],
                                        }
                                    ]}
                                >
                                    <Text style={styles.errorText}>{error}</Text>
                                </Animated.View>
                            )}

                            <Text style={styles.termsText}>
                                By continuing, you agree to our Terms of Service and Privacy Policy
                            </Text>
                        </Animated.View>
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
}
