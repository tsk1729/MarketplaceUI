'use client';

import { COLORS } from "@/constants/theme";
import api from "@/utils/api";
import { useRouter, useFocusEffect } from "expo-router";
import React, { lazy, memo, Suspense, useCallback, useEffect, useState } from "react";
import { isAuthenticated } from '../utils/auth';

// Constants
const NUM_COLUMNS = 3;
const CARD_GAP = 2;

// Instagram gradient colors
const INSTAGRAM_GRADIENT = {
    purple: "#833AB4",
    pink: "#C13584",
    red: "#E1306C",
    orange: "#FD1D1D",
    yellow: "#FCAF45",
    blue: "#405DE6"
};

// Types
type Post = {
    id: string;
    media_type: "VIDEO" | "IMAGE";
    media_url: string;
    post_id: string;
    thumbnail: string;
    time_stamp: string;

    sub_string?: string | null;
    bot_message?: string | null;
    bot_comment?: string | null;
    bot_link?: string | null;
    bot_link_label?: string | null;

    automated_comment_flag?: boolean;
    automated_dm_flag?: boolean;
    include_ai_notice?: boolean;
    link_enable?: boolean;
    use_rag?: boolean;
    file_name?: string | null;
};


// Lazy loaded components (will create web versions)
const VideoPlayer = lazy(() => import('../components/VideoPlayer'));
const ImagePreview = lazy(() => import('../components/ImagePreview'));
const NoPostsScreen = lazy(() => import('../components/NoPostsScreen'));

// Loading Animation Component for Web
const LoadingAnimation = memo(() => (
    <div style={loadingStyles.container}>
        <div style={loadingStyles.spinner}></div>
        <div style={loadingStyles.text}>Loading posts...</div>
    </div>
));

// Post Item Component
const PostItem = memo(({
    item,
    playingId,
    setPlayingId,
    onAutomationPress
}: {
    item: Post;
    playingId: string | null;
    setPlayingId: (id: string | null) => void;
    onAutomationPress: () => void;
}) => {
    const isVideo = item.media_type === "VIDEO";
    // New isAutomationEmpty logic: if use_rag is true, return true; otherwise, check sub_string, bot_message, and bot_comment only
    const isAutomationEmpty = (item: Post) => {
        if (item.use_rag) {
            return false;
        } else {
            return (!item.sub_string || item.sub_string.trim() === '') &&
                (!item.bot_message || item.bot_message.trim() === '') &&
                (!item.bot_comment || item.bot_comment.trim() === '');
        }
    };

    const [isPressed, setIsPressed] = useState(false);
    const [buttonPressed, setButtonPressed] = useState(false);

    const handlePress = () => {
        setButtonPressed(true);
        // Create a smooth button press effect with perfect timing for screen transition
        setTimeout(() => {
            setButtonPressed(false);
            // Optimized delay to sync with screen slide animation
            setTimeout(() => {
                onAutomationPress();
            }, 120);
        }, 200);
    };

    return (
        <div
            data-post-card
            style={{
                ...postItemStyles.card,
                transform: isPressed ? 'scale(0.95)' : 'scale(1)',
                transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                boxShadow: isPressed
                    ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                    : '0 4px 16px rgba(0, 0, 0, 0.1)',
            }}
        >
            <div style={postItemStyles.mediaWrapper}>
                <Suspense fallback={
                    <img
                        src={item.thumbnail}
                        style={postItemStyles.image}
                        alt="Post thumbnail"
                    />
                }>
                    {isVideo ? (
                        <VideoPlayer
                            uri={item.media_url}
                            id={item.id}
                            playingId={playingId}
                            setPlayingId={setPlayingId}
                            thumbnail={item.thumbnail}
                        />
                    ) : (
                        <ImagePreview uri={item.media_url} />
                    )}
                </Suspense>
            </div>

            {isAutomationEmpty(item) ? (
                <button
                    data-automation-button
                    style={{
                        ...postItemStyles.automationButton,
                        background: 'rgba(0, 0, 0, 0.5)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: buttonPressed
                            ? 'scale(0.85) rotate(5deg)'
                            : 'scale(1) rotate(0deg)',
                        boxShadow: buttonPressed
                            ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                            : '0 4px 12px rgba(0, 0, 0, 0.2)',
                        opacity: buttonPressed ? 0.8 : 1,
                    }}
                    onClick={handlePress}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                            transition: 'transform 0.2s ease-in-out',
                            transform: buttonPressed ? 'translateX(2px)' : 'translateX(0)',
                        }}
                    >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14l5-5-5-5m5 5H9" stroke={COLORS.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            ) : (
                <div
                    style={{
                        ...postItemStyles.automationButton,
                        background: `linear-gradient(90deg, ${INSTAGRAM_GRADIENT.purple}, ${INSTAGRAM_GRADIENT.pink}, ${INSTAGRAM_GRADIENT.red}, ${INSTAGRAM_GRADIENT.orange})`,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: buttonPressed
                            ? 'scale(0.85) rotate(5deg)'
                            : 'scale(1) rotate(0deg)',
                        boxShadow: buttonPressed
                            ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                            : '0 4px 12px rgba(0, 0, 0, 0.2)',
                        opacity: buttonPressed ? 0.8 : 1,
                        border: 'none',
                        cursor: 'pointer',
                    }}
                    data-automation-button
                    onClick={handlePress}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                            transition: 'transform 0.2s ease-in-out',
                            transform: buttonPressed ? 'translateX(2px)' : 'translateX(0)',
                        }}
                    >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14l5-5-5-5m5 5H9" stroke={COLORS.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            )}
        </div>
    );
});

// Main Component
export default function PostsGridScreen() {
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const router = useRouter();

    const fetchPosts = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setIsLoading(true);
            const { userId } = await isAuthenticated();
            if (!userId) {
                console.error('No user ID available');
                return;
            }
            const response = await api.post('get_all_posts', userId);

            if (!response || typeof response !== 'object') {
                throw new Error('Invalid response from server');
            }

            if (response.success && Array.isArray(response.data)) {
                console.log(`✅ Updated ${response.data.length} posts with latest automation states`);
                setPosts(response.data);
            } else {
                console.error('Invalid posts.tsx data received:', response);
                setPosts([]);
            }
        } catch (error) {
            console.error('Error fetching posts.tsx:', error);
            setPosts([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const syncInstagramMedia = async () => {
        try {
            const { userId } = await isAuthenticated();
            if (!userId) {
                console.error('No user ID available');
                return;
            }
            setIsLoading(true);
            const response = await api.post('sync_instagram_media', userId);

            if (response.success) {
                await fetchPosts(false);
            } else {
                alert('Sync Failed\nPlease either Authorise or contact administrator');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    // Refetch posts.tsx when screen comes into focus (returning from automation screen)
    useFocusEffect(
        useCallback(() => {
            console.log('🔄 Screen focused - refreshing posts.tsx to update automation states');
            fetchPosts(false); // Don't show loading when returning from automation
        }, [fetchPosts])
    );

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchPosts(false);
        setIsRefreshing(false);
    };

    const handleAutomationPress = async (post: Post) => {
        const { userId } = await isAuthenticated();
        router.push({
            pathname: "/(automation)/automation",
            params: {
                id: userId,
                mediaType: post.media_type,
                mediaUrl: post.media_url,
                postId: post.post_id,
                thumbnail: post.thumbnail,
                timeStamp: post.time_stamp,
                subString: post.sub_string ?? null,
                botMessage: post.bot_message ?? null,
                botComment: post.bot_comment ?? null,
                botLink: post.bot_link ?? null,
                botLinkLabel: post.bot_link_label ?? null,
                automatedCommentFlag: (post.automated_comment_flag ?? false).toString(),
                automatedDmFlag: (post.automated_dm_flag ?? false).toString(),
                includeAiNotice: (post.include_ai_notice ?? false).toString(),
                linkEnable: (post.link_enable ?? false).toString(),
                useRag: (post.use_rag ?? false).toString(),
                fileName:post.file_name
            }
        });
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <button
                    style={styles.headerButton}
                    onClick={syncInstagramMedia}
                    disabled={isLoading}
                >
                    <span style={styles.headerText}>
                        Fetch New Posts (Live)
                    </span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17C14.24 4.42 12.25 4.75 10.74 6.26C9.23 7.77 8.9 9.76 9.65 11.69L11.07 10.27C10.84 9.74 10.84 9.26 11.07 8.93C11.3 8.6 11.58 8.6 11.91 8.93L12.69 9.71C12.69 9.71 14.83 11.85 15.19 12.21C15.55 12.57 15.55 13.07 15.19 13.43L12.69 15.93C12.33 16.29 11.83 16.29 11.47 15.93L9.71 14.17C9.35 13.81 9.35 13.31 9.71 12.95L10.27 12.39C9.26 11.64 7.77 11.97 6.26 13.48C4.75 14.99 4.42 16.98 5.17 18.91L2.5 16.24L1 17.74L7 23.74H9V21.74C10.1 21.74 11 20.84 11 19.74C11 18.64 10.1 17.74 9 17.74H7.74L5.17 15.17C6.08 13.65 7.75 12.92 9.26 13.26L12.95 16.95C13.31 17.31 13.81 17.31 14.17 16.95L16.95 14.17C17.31 13.81 17.31 13.31 16.95 12.95L13.26 9.26C12.92 7.75 13.65 6.08 15.17 5.17L17.74 7.74H19.74C20.84 7.74 21.74 8.64 21.74 9.74V11.74L23.74 9.74V7.74L21 9Z" fill={COLORS.instagram}/>
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div style={styles.content}>
                {isLoading ? (
                    <LoadingAnimation />
                ) : posts.length === 0 ? (
                    <Suspense fallback={<LoadingAnimation />}>
                        <NoPostsScreen />
                    </Suspense>
                ) : (
                    <div style={styles.scrollContainer}>
                        <div data-posts-grid style={styles.postsGrid}>
                            {posts.map((item) => (
                                <PostItem
                                    key={item.id}
                                    item={item}
                                    playingId={playingId}
                                    setPlayingId={setPlayingId}
                                    onAutomationPress={() => handleAutomationPress(item)}
                                />
                            ))}
                        </div>


                    </div>
                )}
            </div>
        </div>
    );
}

// Styles
const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100vh',
        backgroundColor: COLORS.background,
    },
    header: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        backgroundColor: COLORS.background,
        borderBottom: `0.5px solid ${COLORS.grey}`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '16px',
        backdropFilter: 'blur(10px)',
    },
    headerButton: {
        display: 'flex',
        flexDirection: 'row' as const,
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: '12px 20px',
        borderRadius: '25px',
        border: `1px solid ${COLORS.primary}`,
        cursor: 'pointer',
        gap: '8px',
        transition: 'all 0.2s ease',
        fontSize: '16px',
        fontWeight: '600',
    },
    headerText: {
        color: COLORS.background,
        margin: 0,
    },
    content: {
        position: 'absolute' as const,
        top: '80px',
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    scrollContainer: {
        height: '100%',
        overflowY: 'auto' as const,
        padding: '16px',
    },
    postsGrid: {
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(min(300px, calc(100vw / ${NUM_COLUMNS} - 20px)), 1fr))`,
        gap: `${CARD_GAP}px`,
        width: '100%',
        marginBottom: '20px',
        '@media (max-width: 768px)': {
            gridTemplateColumns: 'repeat(2, 1fr)',
        },
        '@media (max-width: 480px)': {
            gridTemplateColumns: '1fr',
        },
    },
    refreshContainer: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '20px',
        marginBottom: '40px',
    },
    refreshButton: {
        backgroundColor: COLORS.primary,
        color: COLORS.white,
        border: 'none',
        padding: '12px 24px',
        borderRadius: '20px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
};

const postItemStyles = {
    card: {
        aspectRatio: '1',
        backgroundColor: COLORS.surface,
        overflow: 'hidden' as const,
        position: 'relative' as const,
        borderRadius: '8px',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
    },
    mediaWrapper: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.surfaceLight,
        position: 'relative' as const,
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
    },
    automationButton: {
        position: 'absolute' as const,
        bottom: '8px',
        right: '8px',
        zIndex: 2,
        border: 'none',
        borderRadius: '20px',
        padding: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease-in-out',
        transform: 'scale(1)',
        overflow: 'hidden',
    },
};

const loadingStyles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        backgroundColor: COLORS.background,
    },
    spinner: {
        width: '50px',
        height: '50px',
        border: `4px solid ${COLORS.surfaceLight}`,
        borderTop: `4px solid ${COLORS.primary}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    text: {
        marginTop: '16px',
        color: COLORS.grey,
        fontSize: '16px',
    },
};

// Add CSS keyframes for spinner animation and post interactions
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes pulseGlow {
            0%, 100% {
                box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4);
            }
            50% {
                box-shadow: 0 0 0 8px rgba(74, 222, 128, 0);
            }
        }
        
        /* Post card hover effects */
        [data-post-card]:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
        }
        
        /* Button hover effects */
        button:hover {
            transform: scale(1.05);
        }
        
        /* Automation button effects */
        [data-automation-button]:hover {
            animation: pulseGlow 1.5s infinite;
            transform: scale(1.1) !important;
        }
        
        [data-automation-button]:active {
            transform: scale(0.9) rotate(10deg) !important;
        }
        
        @keyframes buttonBounce {
            0%, 100% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(1.1) rotate(5deg); }
        }
        
        @keyframes ripple {
            0% {
                transform: scale(0);
                opacity: 1;
            }
            100% {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        /* Button click ripple effect */
        [data-automation-button]::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
        }
        
        [data-automation-button]:active::before {
            width: 40px;
            height: 40px;
            animation: ripple 0.6s ease-out;
        }
        
        /* Video player animations */
        @keyframes videoPulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.1); }
        }
        
        [data-video-wrapper]:hover [data-play-icon] {
            animation: videoPulse 1.5s infinite;
            background-color: rgba(0, 0, 0, 0.8) !important;
        }
        
        [data-video-wrapper]:hover [data-hint-text] {
            opacity: 1 !important;
            transform: translateX(-50%) translateY(-5px) !important;
        }
        
        [data-video-wrapper] {
            transition: transform 0.2s ease;
        }
        
        [data-video-wrapper]:hover {
            transform: scale(1.02);
        }
        
        /* Video close button hover */
        [data-close-video]:hover {
            background: rgba(255, 255, 255, 0.2) !important;
        }
        
        /* Posts grid animation */
        [data-posts-grid] > * {
            animation: slideInUp 0.5s ease-out;
        }
        
        [data-posts-grid] > *:nth-child(1) { animation-delay: 0.1s; }
        [data-posts-grid] > *:nth-child(2) { animation-delay: 0.2s; }
        [data-posts-grid] > *:nth-child(3) { animation-delay: 0.3s; }
        [data-posts-grid] > *:nth-child(4) { animation-delay: 0.1s; }
        [data-posts-grid] > *:nth-child(5) { animation-delay: 0.2s; }
        [data-posts-grid] > *:nth-child(6) { animation-delay: 0.3s; }
        
        /* Responsive grid adjustments */
        @media (max-width: 768px) {
            .posts-grid {
                grid-template-columns: repeat(2, 1fr) !important;
            }
        }
        
        @media (max-width: 480px) {
            .posts-grid {
                grid-template-columns: 1fr !important;
            }
        }
        
        /* Custom scrollbar */
        *::-webkit-scrollbar {
            width: 8px;
        }
        
        *::-webkit-scrollbar-track {
            background: ${COLORS.surface};
        }
        
        *::-webkit-scrollbar-thumb {
            background: ${COLORS.grey};
            border-radius: 4px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
            background: ${COLORS.primary};
        }
    `;
    document.head.appendChild(style);
}
