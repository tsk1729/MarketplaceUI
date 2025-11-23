import { COLORS } from "@/constants/theme";
import api from '@/utils/api';
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import React, { useState } from "react";
import { Animated, Dimensions, Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform, Modal, TextInput, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { signOut } from "../utils/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [rotateAnim] = useState(new Animated.Value(0));

    const toggleExpand = () => {
        setIsExpanded((prev) => !prev);
        Animated.timing(rotateAnim, {
            toValue: isExpanded ? 0 : 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    return (
        <View style={[styles.faqItem, isExpanded && styles.faqItemExpanded]}>
            <TouchableOpacity
                style={styles.questionContainer}
                onPress={toggleExpand}
                activeOpacity={0.8}
            >
                <Text style={styles.question}>{question}</Text>
                <Animated.View style={{ transform: [{ rotate }] }}>
                    <Ionicons
                        name={"chevron-down"}
                        size={20}
                        color={COLORS.white}
                    />
                </Animated.View>
            </TouchableOpacity>
            {isExpanded && (
                <View style={styles.answerContainer}>
                    <Text style={styles.answer}>{answer}</Text>
                </View>
            )}
        </View>
    );
};

export default function FAQScreen() {
    const insets = useSafeAreaInsets();
    const { width } = Dimensions.get('window');
    const router = useRouter();
    const segments = useSegments();

    const faqData = [
        {
            question: "🦉 Why am I unable to authorize?",
            answer: "If you attempt to authorize multiple times within a short period, Instagram's servers may flag your network as spam.\n\n🔹 Please wait for some time before trying again.\n🔹 Alternatively, you can switch to a different network and retry.\n\nThis should help resolve the issue! 🚀"
        },
        {
            question: "🦉 Why are some of my messages or comments not getting automated?",
            answer: "There could be a few possible reasons:\n\n🔹 When authorizing Instagram, ensure you provide all necessary permissions for automation to work smoothly.\n🔹 If you have recently changed your password, deactivated, or reactivated your account, your authorization may have been affected.\n🔹 To fix this, deauthorize and authorize Instagram again through the Owlit portal.\n\nIf you continue facing issues, try deauthorizing and authorizing back—it usually resolves the problem! 🚀"
        },
        {
            question: "🦉 How can I subscribe to Owlit?",
            answer: "Please contact us:\n\n📧 Email: tsk1729@yahoo.com\n📱 WhatsApp: +91 8688765697\n\nWe're happy to assist you! 🚀"
        },
        {
            question: "🦉 Are automated comments and messages unlimited?",
            answer: "Yes, they are unlimited—there is no cap! 🚀\nYou can automate as many comments and messages as you need without any restrictions."
        },
        {
            question: "🦉 How can Owlit help me as a content creator?",
            answer: "To increase your Instagram reach, consistent interaction between you and your audience is crucial. Owlit automates engagement by:\n\n✅ Allowing content creators to encourage audience comments by referencing interesting points or sharing resources.\n✅ Automatically replying to comments, reducing manual effort while keeping the conversation active.\n✅ Boosting engagement, which helps improve visibility and reach.\n✅ Studies show posts.tsx with high comments get 10x more reach.\n\nWith Owlit, you can focus on creating content while we handle the interactions! 🚀"
        },
        {
            question: "🦉 What is the validity of a webhook?",
            answer: "The default validity of a webhook is 30 days. However, based on user requirements, we can extend it as needed."
        },
        {
            question: "🦉 Is Owlit verified?",
            answer: "Yes, Owlit is verified by Meta, and we strictly follow all regulations provided by Meta."
        },
        {
            question: "🦉 Do we get discounts on annual packs?",
            answer: "Yes! We offer huge discounts on annual packs. 🎉\nSubscribe for a year and save big on automation costs!"
        },
        {
            question: "🦉 How can I improve my reach/leads in Instagram?",
            answer: "To boost your reach, try using engaging comments and messages with emojis 🎉🔥\nWrite creatively to spark conversations and keep your audience engaged! 🚀"
        },
        {
            question: "🦉 I have product links. How can I innovatively send them to my audience?",
            answer: "In the Owlit portal, we offer a field called custom_message.\nIf you enter your custom_message along with your product link, Owlit will creatively format and send the message to your audience.\nIf you enter plain text, it will be sent as usual."
        },
        {
            question: "🦉 Do you have an Android/iOS app?",
            answer: "Coming soon! 🚀\nWe're launching our Android and iOS apps soon to make automation even more convenient for you. Stay tuned! 📱"
        },
        {
            question: "🦉 Any exciting upcoming versions?",
            answer: "Yes! 🎉 We have exciting new versions coming up where you can earn by subscribing.\nStay tuned for more updates! 🚀"
        },
        {
            question: "🦉 Will you be launching on other social media platforms?",
            answer: "Yes! 🚀 We are planning to launch on YouTube, Twitter, and LinkedIn soon.\nStay connected for updates! 🎉"
        },
        {
            question: "🦉 I don't see posts.tsx. What should I do?",
            answer: "If you find the Sync Instagram Posts button, tap it to sync and then reload the page to reflect changes.\nIf the issue persists, try deauthorizing and then authorizing again before syncing the posts.tsx back."
        }
    ];

    const handleEditProfile = () => router.push("/profile");
    const handlePrivacyPolicy = async () => {
        try {
            const url = 'https://api.owlit.in/privacy-policy';
            const supported = await Linking.canOpenURL(url);
            if (supported) await Linking.openURL(url);
        } catch {}
    };
    const handleTerms = async () => {
        try {
            const url = 'https://api.owlit.in/terms-of-service';
            const supported = await Linking.canOpenURL(url);
            if (supported) await Linking.openURL(url);
        } catch {}
    };
    const handleDeauthorize = () => router.push("/connect");
    const handleSignOut = async () => {
        try {
            await signOut();
            // Add small delay to ensure router is ready for navigation
            setTimeout(() => {
                try {
                    router.dismissAll();
                    router.replace("/(Login)/login");
                } catch (navError) {
                    console.error('Navigation error during sign out:', navError);
                    // Force reload as fallback
                    if (typeof window !== 'undefined') {
                        window.location.href = '/(Login)/login';
                    }
                }
            }, 100);
        } catch {
            // Add delay even for error case
            setTimeout(() => {
                try {
                    router.dismissAll();
                    router.replace("/(Login)/login");
                } catch (navError) {
                    console.error('Navigation error during sign out (error case):', navError);
                    // Force reload as fallback
                    if (typeof window !== 'undefined') {
                        window.location.href = '/(Login)/login';
                    }
                }
            }, 100);
        }
    };

    const handleOpenAIKeyPage = () => router.push("/openai-key");

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.title}>Frequently Asked Questions (FAQ)</Text>
            </View>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                    <ActionButton icon="person-outline" label="Edit Profile" onPress={handleEditProfile} />
                    <ActionButton icon="shield-checkmark-outline" label="Privacy Policy" onPress={handlePrivacyPolicy} />
                    <ActionButton icon="document-text-outline" label="Terms & Conditions" onPress={handleTerms} />
                    <ActionButton icon="log-out-outline" label="Deauthorize" onPress={handleDeauthorize} />
                    <ActionButton icon="key-outline" label="Cost" onPress={handleOpenAIKeyPage} />
                    <ActionButton icon="exit-outline" label="Sign Out" onPress={handleSignOut} danger />
                </View>
                {/* FAQ Items */}
                {faqData.map((item, index) => (
                    <FAQItem
                        key={index}
                        question={item.question}
                        answer={item.answer}
                    />
                ))}
                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

function ActionButton({ icon, label, onPress, danger }: { icon: any, label: string, onPress: () => void, danger?: boolean }) {
    return (
        <TouchableOpacity
            style={[styles.actionButton, danger && styles.actionButtonDanger]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            <Ionicons name={icon} size={20} color={COLORS.white} style={{ marginBottom: 2 }} />
            <Text style={styles.actionButtonText}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surface,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.white,
        textAlign: "center",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    faqItem: {
        marginBottom: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        overflow: "hidden",
        shadowColor: COLORS.background,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: Platform.OS === 'web' ? 0.08 : 0.15,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.surface,
    },
    faqItemExpanded: {
        borderColor: COLORS.primary,
        shadowOpacity: Platform.OS === 'web' ? 0.16 : 0.25,
    },
    questionContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 18,
        paddingRight: 10,
    },
    question: {
        flex: 1,
        fontSize: 17,
        fontWeight: "700",
        color: COLORS.white,
        marginRight: 8,
    },
    answerContainer: {
        padding: 16,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: COLORS.surfaceLight,
    },
    answer: {
        fontSize: 15,
        color: COLORS.grey,
        lineHeight: 22,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginBottom: 28,
        gap: 16,
    },
    actionButton: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: 120,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        shadowColor: COLORS.background,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    actionButtonDanger: {
        backgroundColor: '#FF4444',
        borderColor: '#FF4444',
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: 13,
        marginTop: 2,
        textAlign: 'center',
        fontWeight: '500',
        letterSpacing: 0.1,
    },
});
