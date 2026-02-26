import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { Text, TouchableOpacity, View, Animated, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { isAuthenticated, getUserName, signOut } from '../utils/auth';
import { localapi } from '../../utils/api';
import ErrorBanner from '../components/ErrorBanner';
import { styles } from './styles';

const ConnectScreen = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [showBanner, setShowBanner] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState('User');
    const [queueCount, setQueueCount] = useState(0);
    const [profileComplete, setProfileComplete] = useState(false);
    const router = useRouter();

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;
    const queueCountAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const initializeUser = async () => {
            try {
                // Get user ID and name
                const { userId: currentUserId } = await isAuthenticated();
                console.log('User ID:', currentUserId);
                if (!currentUserId) {
                    console.error('No user ID available');
                    return;
                }
                setUserId(currentUserId);

                // Get user name
                const name = await getUserName();
                setUserName(name);

                // Check profile completeness
                const checkRes = await localapi.get(`creator/profile-check?user_id=${currentUserId}`);
                if (checkRes.success) {
                    const { is_complete, missing_fields } = checkRes.data;
                    setProfileComplete(is_complete);

                    if (!is_complete) {
                        console.log('Profile incomplete. Missing:', missing_fields);
                    }
                }
            } catch (error) {
                console.error('Error initializing user:', error);
            } finally {
                setIsLoading(false);
                startAnimations();
            }
        };

        initializeUser();
    }, []);

    const startAnimations = () => {
        // Staggered entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();

        // Queue count animation with listener
        const queueAnimation = Animated.timing(queueCountAnim, {
            toValue: 396,
            duration: 2000,
            useNativeDriver: false,
        });

        queueCountAnim.addListener(({ value }) => {
            setQueueCount(Math.floor(value));
        });

        queueAnimation.start();

        // Pulse animation for queue text
        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        );
        pulseLoop.start();
    };

    const handleAgencyPress = async () => {
        // Button press animation
        Animated.sequence([
            Animated.timing(buttonScale, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(buttonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        router.push('/influencer/influencerProfileEdit');
    };


    const goToBrandMarketPlace = async () => {
        if (!profileComplete) {
            // Optional: You could show a specialized UI modal/Notice here instead of native alert
            alert("Please complete your Influencer Profile (including adding at least one social media link) before accessing the Marketplace.");
            // Also animate to draw attention to Edit Profile button
            Animated.sequence([
                Animated.timing(buttonScale, { toValue: 1.1, duration: 150, useNativeDriver: true }),
                Animated.timing(buttonScale, { toValue: 1, duration: 150, useNativeDriver: true }),
            ]).start();
            return;
        }

        // Button press animation
        Animated.sequence([
            Animated.timing(buttonScale, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(buttonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        router.push('/influencer/posts/posts');
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Final fallback error catch:', error);
        } finally {
            // ALWAYS redirect to login, even if an error occurred
            // This ensures the user isn't stuck on a private screen
            router.replace('/(Login)/login');
        }
    };
    if (isLoading) {
        return (
            <View style={styles.fullScreenContainer}>
                <LinearGradient
                    colors={[COLORS.background, COLORS.surface, COLORS.background]}
                    style={styles.loadingContainer}
                >
                    <Animated.View
                        style={[
                            styles.loadingSpinner,
                            {
                                transform: [{
                                    rotate: fadeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0deg', '360deg'],
                                    })
                                }]
                            }
                        ]}
                    >
                        <Ionicons name="refresh" size={40} color={COLORS.primary} />
                    </Animated.View>
                    <Text style={styles.loadingText}>Loading...</Text>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={styles.fullScreenContainer}>
            <LinearGradient
                colors={[COLORS.background, COLORS.surface, COLORS.background]}
                style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.topBar}>
                        <Pressable
                            style={styles.signOutButton}
                            onPress={handleSignOut}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityRole="button"
                        >
                            <Ionicons name="log-out-outline" size={16} color={COLORS.white} />
                            <Text style={styles.signOutText} selectable={false}>Sign out</Text>
                        </Pressable>
                    </View>
                    <Animated.View
                        pointerEvents="box-none"
                        style={[
                            styles.content,
                            {
                                opacity: fadeAnim,
                                transform: [
                                    { translateY: slideAnim },
                                    { scale: scaleAnim }
                                ]
                            }
                        ]}
                    >
                        <View style={styles.header}>
                            <Animated.Text
                                style={[
                                    styles.greeting,
                                    {
                                        transform: [{ scale: pulseAnim }]
                                    }
                                ]}
                            >
                                Hi {userName}!
                            </Animated.Text>
                            <Animated.Text
                                style={[
                                    styles.title,
                                    {
                                        transform: [{ scale: pulseAnim }]
                                    }
                                ]}
                            >
                                Welcome to Brands Market Place
                            </Animated.Text>

                            <ErrorBanner
                                visible={!profileComplete && showBanner}
                                type="info"
                                error="Please complete your profile details and link at least one social media account to access the Marketplace."
                                onDismiss={() => setShowBanner(false)}
                            />

                            <View style={styles.queueContainer}>
                                <Text style={styles.queueNumber}>
                                    {queueCount.toLocaleString()}
                                </Text>
                                <Text style={styles.queueText}>brands are already in Queue</Text>
                            </View>

                            <Text style={styles.subtitle}>
                                Please fill the details by clicking the following button
                            </Text>
                        </View>

                        <Animated.View
                            style={[
                                styles.buttonContainer,
                                { transform: [{ scale: buttonScale }] }
                            ]}
                        >
                            <TouchableOpacity
                                style={[styles.userTypeButton, styles.adAgencyButton]}
                                onPress={handleAgencyPress}
                                activeOpacity={0.8}
                            >
                                <View style={styles.buttonGradient}>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="business" size={24} color={COLORS.white} />
                                    </View>
                                    <Text style={styles.buttonText}>Edit Profile</Text>
                                    <Ionicons name="arrow-forward" size={20} color={COLORS.background} />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.userTypeButton,
                                    styles.contentCreatorButton,
                                    !profileComplete && { opacity: 0.6 } // Dim to indicate disabled status
                                ]}
                                onPress={goToBrandMarketPlace}
                                activeOpacity={0.8}
                            >
                                <View style={styles.buttonGradient}>
                                    <View style={[styles.iconContainer, !profileComplete && { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                                        <Ionicons name={profileComplete ? "camera" : "lock-closed"} size={24} color={COLORS.white} />
                                    </View>
                                    <Text style={styles.buttonText}>Check Marketplace</Text>
                                    <Ionicons name="arrow-forward" size={20} color={COLORS.background} />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.userTypeButton, styles.adAgencyButton, { marginTop: 8 }]}
                                onPress={() => router.push('/influencer/mySubmissions')}
                                activeOpacity={0.8}
                            >
                                <View style={styles.buttonGradient}>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="document-text" size={24} color={COLORS.white} />
                                    </View>
                                    <Text style={styles.buttonText}>My Applications</Text>
                                    <Ionicons name="arrow-forward" size={20} color={COLORS.background} />
                                </View>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Decorative elements */}
                        <View style={styles.decorativeElements}>
                            <View style={[styles.circle, styles.circle1]} />
                            <View style={[styles.circle, styles.circle2]} />
                            <View style={[styles.circle, styles.circle3]} />
                        </View>
                    </Animated.View>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};



export default ConnectScreen;
