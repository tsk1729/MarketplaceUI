import { COLORS } from "@/constants/theme";
import React, { memo, useState } from "react";

export interface MediaItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    title: string;
    thumbnail?: string;
}

interface MediaGridProps {
    mediaItems: MediaItem[];
    numColumns?: number;
    spacing?: number;
    aspectRatio?: number;
    showCounter?: boolean;
    emptyMessage?: string;
    onItemPress?: (item: MediaItem, index: number) => void;
}

// Media Item Component
const MediaGridItem = memo(({
    item,
    index,
    aspectRatio,
    showCounter,
    onItemPress
}: {
    item: MediaItem;
    index: number;
    aspectRatio: number;
    showCounter: boolean;
    onItemPress?: (item: MediaItem, index: number) => void;
}) => {
    const [imageError, setImageError] = useState(false);
    const [isVideoPreviewVisible, setIsVideoPreviewVisible] = useState(false);

    const handleClick = () => {
        if (onItemPress) {
            onItemPress(item, index);
        }
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const handleVideoPreview = () => {
        if (item.type === 'video') {
            setIsVideoPreviewVisible(true);
        }
    };

    return (
        <>
            <div
                style={{
                    ...styles.gridItem,
                    aspectRatio: aspectRatio.toString(),
                }}
                onClick={handleClick}
                onDoubleClick={handleVideoPreview}
            >
                {/* Media Content */}
                <div style={styles.mediaContainer}>
                    {item.type === 'video' ? (
                        <>
                            <img
                                src={item.thumbnail || item.url}
                                style={styles.media}
                                alt={item.title}
                                onError={handleImageError}
                            />
                            <div style={styles.videoOverlay}>
                                <div style={styles.playButton}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                </div>
                            </div>
                        </>
                    ) : (
                        <img
                            src={item.url}
                            style={styles.media}
                            alt={item.title}
                            onError={handleImageError}
                        />
                    )}

                    {imageError && (
                        <div style={styles.errorOverlay}>
                            <div style={styles.errorText}>
                                Failed to load {item.type}
                            </div>
                        </div>
                    )}
                </div>

                {/* Counter */}
                {showCounter && (
                    <div style={styles.counter}>
                        {index + 1}
                    </div>
                )}

                {/* Type Badge */}
                <div style={{
                    ...styles.typeBadge,
                    backgroundColor: item.type === 'video' ? COLORS.primary : COLORS.secondary
                }}>
                    {item.type.toUpperCase()}
                </div>

                {/* Title Overlay */}
                <div style={styles.titleOverlay}>
                    <div style={styles.title}>{item.title}</div>
                </div>
            </div>

            {/* Video Preview Modal */}
            {isVideoPreviewVisible && item.type === 'video' && (
                <div
                    style={styles.videoModal}
                    onClick={() => setIsVideoPreviewVisible(false)}
                >
                    <div style={styles.videoModalContent} onClick={(e) => e.stopPropagation()}>
                        <video
                            src={item.url}
                            style={styles.videoPlayer}
                            controls
                            autoPlay
                            onError={() => setIsVideoPreviewVisible(false)}
                        />
                    </div>
                </div>
            )}
        </>
    );
});

// Main MediaGrid Component
const MediaGrid = memo(({
    mediaItems,
    numColumns = 2,
    spacing = 8,
    aspectRatio = 1,
    showCounter = false,
    emptyMessage = "No media items found",
    onItemPress
}: MediaGridProps) => {
    if (!mediaItems || mediaItems.length === 0) {
        return (
            <div style={styles.emptyContainer}>
                <div style={styles.emptyIcon}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill={COLORS.grey}/>
                    </svg>
                </div>
                <div style={styles.emptyText}>{emptyMessage}</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div
                style={{
                    ...styles.grid,
                    gridTemplateColumns: `repeat(${numColumns}, 1fr)`,
                    gap: `${spacing}px`,
                }}
            >
                {mediaItems.map((item, index) => (
                    <MediaGridItem
                        key={item.id}
                        item={item}
                        index={index}
                        aspectRatio={aspectRatio}
                        showCounter={showCounter}
                        onItemPress={onItemPress}
                    />
                ))}
            </div>
        </div>
    );
});

const styles = {
    container: {
        flex: 1,
        padding: '16px',
        backgroundColor: COLORS.background,
    },
    grid: {
        display: 'grid',
        width: '100%',
    },
    gridItem: {
        position: 'relative' as const,
        backgroundColor: COLORS.surface,
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        border: `1px solid ${COLORS.surfaceLight}`,
    },
    mediaContainer: {
        width: '100%',
        height: '100%',
        position: 'relative' as const,
    },
    media: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
        display: 'block',
    },
    videoOverlay: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    playButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '50%',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorOverlay: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        color: COLORS.white,
        fontSize: '14px',
        textAlign: 'center' as const,
        padding: '8px',
    },
    counter: {
        position: 'absolute' as const,
        top: '8px',
        left: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: COLORS.white,
        borderRadius: '12px',
        padding: '4px 8px',
        fontSize: '12px',
        fontWeight: 'bold',
    },
    typeBadge: {
        position: 'absolute' as const,
        top: '8px',
        right: '8px',
        color: COLORS.white,
        borderRadius: '4px',
        padding: '2px 6px',
        fontSize: '10px',
        fontWeight: 'bold',
    },
    titleOverlay: {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
        padding: '16px 8px 8px 8px',
    },
    title: {
        color: COLORS.white,
        fontSize: '14px',
        fontWeight: '500',
        textAlign: 'center' as const,
    },
    videoModal: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
    },
    videoModalContent: {
        width: '90%',
        height: '90%',
        maxWidth: '1200px',
        maxHeight: '800px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoPlayer: {
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
    },
    emptyContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        minHeight: '200px',
    },
    emptyIcon: {
        marginBottom: '16px',
        opacity: 0.5,
    },
    emptyText: {
        color: COLORS.grey,
        fontSize: '16px',
        textAlign: 'center' as const,
        maxWidth: '300px',
    },
};

// Add hover effects via CSS
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        .media-grid-item:hover {
            transform: scale(1.02);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
        
        .play-button:hover {
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(style);
}

export default MediaGrid; 