import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@/constants/theme';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 32,
        // Web-specific shadow will be added inline
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 12,
    },
    centeredLogoWrapper: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 10,
        borderWidth: 3,
        borderColor: COLORS.surface,
    },
    logo: {
        color: COLORS.background,
        fontSize: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: 30,
    },
    input: {
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.grey,
        borderRadius: 12,
        paddingHorizontal: 18,
        paddingVertical: 16,
        fontSize: 17,
        color: COLORS.white,
        marginBottom: 18,
    },
    button: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 18,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginTop: 24,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonText: {
        color: COLORS.background,
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});

// Web-specific styles for card
export const webCardStyle = Platform.OS === 'web' ? {
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
} : {}; 
export default styles;