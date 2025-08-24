import { COLORS } from "@/constants/theme";
import React, { memo } from "react";

const NoPostsScreen = memo(() => (
    <div style={styles.noPostsContainer}>
        <div style={styles.noPostsIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17C14.24 4.42 12.25 4.75 10.74 6.26C9.23 7.77 8.9 9.76 9.65 11.69L11.07 10.27C10.84 9.74 10.84 9.26 11.07 8.93C11.3 8.6 11.58 8.6 11.91 8.93L12.69 9.71C12.69 9.71 14.83 11.85 15.19 12.21C15.55 12.57 15.55 13.07 15.19 13.43L12.69 15.93C12.33 16.29 11.83 16.29 11.47 15.93L9.71 14.17C9.35 13.81 9.35 13.31 9.71 12.95L10.27 12.39C9.26 11.64 7.77 11.97 6.26 13.48C4.75 14.99 4.42 16.98 5.17 18.91L2.5 16.24L1 17.74L7 23.74H9V21.74C10.1 21.74 11 20.84 11 19.74C11 18.64 10.1 17.74 9 17.74H7.74L5.17 15.17C6.08 13.65 7.75 12.92 9.26 13.26L12.95 16.95C13.31 17.31 13.81 17.31 14.17 16.95L16.95 14.17C17.31 13.81 17.31 13.31 16.95 12.95L13.26 9.26C12.92 7.75 13.65 6.08 15.17 5.17L17.74 7.74H19.74C20.84 7.74 21.74 8.64 21.74 9.74V11.74L23.74 9.74V7.74L21 9Z" fill={COLORS.primary}/>
            </svg>
        </div>
        <div style={styles.noPostsTitle}>No Posts Yet</div>
        <div style={styles.noPostsSubtitle}>
            Tap "Fetch New Posts" to sync your Instagram content
        </div>
    </div>
));

const styles = {
    noPostsContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 32px',
        backgroundColor: COLORS.background,
        minHeight: '400px',
    },
    noPostsIcon: {
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    noPostsTitle: {
        fontSize: '24px',
        fontWeight: '600',
        color: COLORS.white,
        marginBottom: '8px',
        textAlign: 'center' as const,
    },
    noPostsSubtitle: {
        fontSize: '16px',
        color: COLORS.grey,
        textAlign: 'center' as const,
        lineHeight: '22px',
        maxWidth: '300px',
    },
};

export default NoPostsScreen; 