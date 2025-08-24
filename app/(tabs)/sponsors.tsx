import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { SafeAreaView, StyleSheet, Text, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SponsorsScreen() {
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}> 
            <View style={styles.header}>
                <Text style={styles.title}>Sponsors</Text>
            </View>
            <View style={styles.outerContent}>
                <View style={styles.card}>
                    <Ionicons name="rocket" size={56} color={COLORS.primary} style={{ marginBottom: 12 }} />
                    <Text style={styles.comingSoon}>Coming Soon</Text>
                    <Text style={styles.description}>
                        We're working on something exciting! Stay tuned for updates.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
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
    outerContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        alignItems: "center",
        paddingVertical: 48,
        paddingHorizontal: 32,
        shadowColor: COLORS.background,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: Platform.OS === 'web' ? 0.10 : 0.18,
        shadowRadius: 16,
        elevation: 8,
    },
    comingSoon: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.white,
        marginTop: 8,
        marginBottom: 10,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: COLORS.grey,
        textAlign: "center",
        lineHeight: 24,
        maxWidth: 320,
    },
}); 