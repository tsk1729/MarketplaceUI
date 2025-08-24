import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@/constants/theme';

export const styles = StyleSheet.create({
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
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: Platform.OS === 'ios' ? 20 : 40,
    },
    content: {
        padding: Platform.OS === 'web' ? 24 : 20,
        paddingHorizontal: Platform.OS === 'web' ? 32 : 24,
        minHeight: '100%',
        maxWidth: Platform.OS === 'web' ? 800 : '100%',
        alignSelf: Platform.OS === 'web' ? 'center' : 'auto',
        width: '100%',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 8,
        textAlign: 'center',
        marginTop: 10,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.grey,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
        marginBottom: 10,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 18,
        fontSize: 16,
        color: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        minHeight: 56,
        textAlignVertical: 'center',
    },
    inputError: {
        borderColor: COLORS.error,
    },
    addressInput: {
        minHeight: 80,
        paddingTop: 18,
        textAlignVertical: 'top',
    },
    errorText: {
        color: COLORS.error,
        fontSize: 14,
        marginTop: 4,
    },
    languageInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    languageInput: {
        flex: 1,
    },
    instagramInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: '100%',
    },
    instagramInput: {
        flex: 1,
        minWidth: 0, // Allow input to shrink if needed
    },
    connectButton: {
        backgroundColor: COLORS.white,
        paddingHorizontal: Platform.OS === 'web' ? 16 : 12,
        paddingVertical: 12,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 56,
        maxWidth: 120, // Prevent button from getting too wide
        flexShrink: 0, // Prevent button from shrinking
        shadowColor: '#6366F1',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    connectButtonText: {
        color: COLORS.background,
        fontSize: Platform.OS === 'web' ? 14 : 15,
        fontWeight: '600',
        textAlign: 'center',
        ...(Platform.OS === 'ios' && {
            fontSize: 14,
        }),
        ...(Platform.OS === 'android' && {
            fontSize: 14,
        }),
    },
    connectedButton: {
        backgroundColor: COLORS.white, // Modern emerald green
        shadowColor: '#10B981',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    connectedButtonText: {
        color: COLORS.background,
        fontSize: Platform.OS === 'web' ? 13 : 14,
        fontWeight: '600',
        textAlign: 'center',
        ...(Platform.OS === 'ios' && {
            fontSize: 13,
        }),
        ...(Platform.OS === 'android' && {
            fontSize: 13,
        }),
    },
    connectButtonDisabled: {
        backgroundColor: '#64748B', // Modern slate color
        opacity: 0.7,
        shadowOpacity: 0.1,
        elevation: 2,
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        minHeight: 56,
        paddingLeft: 18,
        overflow: 'hidden',
    },
    currencySymbol: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '600',
        marginRight: 8,
    },
    priceInput: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
        paddingLeft: 0,
        minHeight: 54,
    },
    warningText: {
        color: '#FFA500', // Orange warning color
        fontSize: 13,
        fontStyle: 'italic',
        marginBottom: 12,
        lineHeight: 18,
    },
    priceRangeContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    priceInputWrapper: {
        flex: 1,
    },
    rangeLabel: {
        color: COLORS.grey,
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
    },
    rangeSeparator: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 30, // Align with input fields
    },
    separatorText: {
        color: COLORS.grey,
        fontSize: 16,
        fontWeight: '500',
    },
    addButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 56,
        minWidth: 70,
    },
    addButtonDisabled: {
        backgroundColor: COLORS.surfaceLight,
        opacity: 0.8,
    },
    addButtonText: {
        color: COLORS.background,
        fontSize: 16,
        fontWeight: '600',
    },
    addButtonTextDisabled: {
        color: COLORS.grey,
    },
    languageTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    languageTag: {
        backgroundColor: COLORS.surfaceLight,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 36,
        marginBottom: 4,
    },
    languageTagText: {
        color: COLORS.white,
        fontSize: 14,
    },
    removeTagText: {
        color: COLORS.grey,
        fontSize: 16,
        marginLeft: 4,
    },
    saveButtonContainer: {
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 20,
    },
    saveButton: {
        backgroundColor: COLORS.white,
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 12,
        alignItems: 'center',
        minHeight: 56,
        maxWidth: 2000,
        shadowColor: COLORS.white,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    saveButtonText: {
        color: COLORS.background,
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    loadingText: {
        color: COLORS.white,
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
    },
    statusMessageContainer: {
        marginHorizontal: Platform.OS === 'web' ? '5%' : 20,
        marginBottom: 20,
        padding: Platform.OS === 'web' ? 24 : 20,
        borderRadius: 16,
        alignItems: 'center',
        minHeight: 60,
        justifyContent: 'center',
        // Responsive width
        maxWidth: Platform.OS === 'web' ? 600 : '100%',
        alignSelf: 'center',
        width: '100%',
        // Enhanced shadow
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        // Enhanced web shadow
        ...(Platform.OS === 'web' && {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        }),
    },
    successMessage: {
        backgroundColor: COLORS.white,
        borderLeftWidth: 6,
        borderLeftColor: '#059669',
    },
    errorMessage: {
        backgroundColor: '#EF4444',
        borderLeftWidth: 6,
        borderLeftColor: '#DC2626',
    },
    statusMessageText: {
        color: COLORS.background,
        fontSize: Platform.OS === 'web' ? 17 : 16,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: Platform.OS === 'web' ? 26 : 24,
        letterSpacing: 0.2,
        // Enhanced text rendering
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        // Responsive font scaling
        ...(Platform.OS === 'web' && {
            '@media (max-width: 768px)': {
                fontSize: 16,
                lineHeight: 24,
            },
        }),
    },
});
