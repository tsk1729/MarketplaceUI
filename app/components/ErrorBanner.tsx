import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

type ErrorBannerProps = {
    error: string | null;
    onDismiss: () => void;
    visible?: boolean;
    type?: 'error' | 'info';
};

const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, onDismiss, visible = true, type = 'error' }) => {
    if (!visible || !error) return null;

    const isError = type === 'error';
    const backgroundColor = isError ? COLORS.white : COLORS.white;
    const textColor = "#000000";
    const subtextColor = 'rgba(0,0,0,0.7)';
    const iconColor = "#000000";

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <View style={styles.content}>
                <Ionicons name={isError ? "alert-circle" : "information-circle"} size={24} color={iconColor} />
                <View style={styles.textContainer}>

                    <Text style={[styles.message, { color: textColor }]}>{error}</Text>
                    {isError && (
                        <Text style={[styles.subtext, { color: subtextColor }]}>
                            Contact administrator if this persists.
                        </Text>
                    )}
                </View>
            </View>
            <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
                <Ionicons name="close" size={20} color={iconColor} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // backgroundColor set dynamically
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 8,
        justifyContent: 'space-between',
        // Shadow for elevation
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    content: {
        flexDirection: 'row',
        flex: 1,
        marginRight: 12,
    },
    textContainer: {
        marginLeft: 12,
        flex: 1,
    },
    title: {
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 2,
    },
    message: {
        fontSize: 14,
        marginBottom: 4,
    },
    subtext: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    dismissButton: {
        padding: 4,
    },
});

export default ErrorBanner;
