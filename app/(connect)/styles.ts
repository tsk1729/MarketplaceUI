import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS } from '@/constants/theme';

const { height } = Dimensions.get('window');

export const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
        ...(Platform.OS === 'web' && {
            minHeight: '100vh' as any,
            minWidth: '100vw' as any,
        }),
    },
    container: {
        flex: 1,
        minHeight: height,
        width: '100%',
        backgroundColor: COLORS.background,
        ...(Platform.OS === 'web' && {
            minHeight: '100vh' as any,
        }),
    },
    safeArea: {
        flex: 1,
        minHeight: height,
        backgroundColor: COLORS.background,
        ...(Platform.OS === 'web' && {
            minHeight: '100vh' as any,
        }),
    },
    topBar: {
        alignSelf: 'center',
        width: '100%',
        maxWidth: 600,
        paddingHorizontal: 24,
        paddingTop: 8,
        marginBottom: 8,
        alignItems: 'flex-end',
        position: 'relative',
        zIndex: 10,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${COLORS.white}0D`,
        borderWidth: 1,
        borderColor: `${COLORS.white}1A`,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        elevation: 3,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        position: 'relative',
        zIndex: 10,
    },
    signOutText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: height,
        width: '100%',
        backgroundColor: COLORS.background,
        ...(Platform.OS === 'web' && {
            minHeight: '100vh' as any,
        }),
    },
    loadingSpinner: {
        marginBottom: 16,
    },
    loadingText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '500',
    },
    content: {
        flex: 1,
        padding: 24,
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
        justifyContent: 'center',
    },
    header: {
        marginBottom: 60,
        alignItems: 'center',
    },
    greeting: {
        fontSize: 28,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 40,
        letterSpacing: 0.5,
    },
    queueContainer: {
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: `${COLORS.white}0D`, // 5% opacity
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: `${COLORS.white}1A`, // 10% opacity
    },
    queueNumber: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 4,
    },
    queueText: {
        fontSize: 16,
        color: COLORS.white,
        fontWeight: '500',
        opacity: 0.9,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.grey,
        lineHeight: 24,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    buttonContainer: {
        marginBottom: 40,
        gap: 16,
    },
    userTypeButton: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    adAgencyButton: {
        backgroundColor: COLORS.white,
    },
    contentCreatorButton: {
        backgroundColor: COLORS.white,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 32,
    },
    iconContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 8,
        marginRight: 12,
    },
    buttonText: {
        color: COLORS.background,
        fontSize: 18,
        fontWeight: '800',
        flex: 1,
        textAlign: 'center',
        letterSpacing: 0.5,
        ...(Platform.OS === 'web' && {
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: '700',
            textRendering: 'optimizeLegibility' as any,
            WebkitFontSmoothing: 'antialiased' as any,
            MozOsxFontSmoothing: 'grayscale' as any,
        }),
        ...(Platform.OS === 'ios' && {
            fontWeight: '800',
        }),
        ...(Platform.OS === 'android' && {
            fontWeight: '900',
            textShadowColor: 'rgba(0, 0, 0, 0.1)',
            textShadowOffset: { width: 0, height: 0.5 },
            textShadowRadius: 0.5,
        }),
    },
    incompleteBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 59, 48, 0.15)', // light red background
        borderColor: 'rgba(255, 59, 48, 0.4)',
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        marginHorizontal: 16,
        gap: 12,
    },
    incompleteBannerText: {
        flex: 1,
        color: COLORS.white,
        fontSize: 14,
        lineHeight: 20,
    },
    decorativeElements: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
    },
    circle: {
        position: 'absolute',
        borderRadius: 1000,
        backgroundColor: `${COLORS.white}05`, // 2% opacity
    },
    circle1: {
        width: 200,
        height: 200,
        top: -100,
        right: -100,
    },
    circle2: {
        width: 150,
        height: 150,
        bottom: -75,
        left: -75,
        backgroundColor: `${COLORS.secondary}08`, // 3% opacity
    },
    circle3: {
        width: 100,
        height: 100,
        top: height * 0.3,
        left: -50,
        backgroundColor: `${COLORS.white}03`, // 1% opacity
    },
});
