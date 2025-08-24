import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const AgencyScreen = () => {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.background, COLORS.surface, COLORS.background]}
                style={styles.gradient}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.content}>
                        <Text style={styles.title}>Hello World</Text>
                        <Text style={styles.subtitle}>Welcome to Ad Agency Portal</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: COLORS.grey,
        textAlign: 'center',
    },
});

export default AgencyScreen;


