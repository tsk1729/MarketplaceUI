import { COLORS } from "@/constants/theme";
import React, { memo, useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
    uri: string;
    id: string;
    playingId: string | null;
    setPlayingId: (id: string | null) => void;
    thumbnail: string;
}

const VideoPlayer = memo(({
    uri,
    id,
    playingId,
    setPlayingId,
    thumbnail,
}: VideoPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [isLongPressing, setIsLongPressing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (playingId !== id && isLongPressing) {
            videoRef.current?.pause();
            setIsLongPressing(false);
        }
    }, [playingId, id, isLongPressing]);

    const handleMouseDown = () => {
        longPressTimerRef.current = setTimeout(() => {
            handleLongPress();
        }, 200);
    };

    const handleMouseUp = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
        if (isLongPressing) {
            handlePressOut();
        }
    };



    const handleLongPress = async () => {
        setIsLongPressing(true);
        setIsPreviewVisible(true);
        setIsLoading(true);
        setPlayingId(id);

        try {
            if (videoRef.current) {
                await videoRef.current.play();
            }
        } catch (error) {
            console.log('Error playing video:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePressOut = async () => {
        setIsLongPressing(false);
        setIsPreviewVisible(false);
        setPlayingId(null);
        try {
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        } catch (error) {
            console.log('Error pausing video:', error);
        }
    };

    const handleVideoLoad = () => {
        setIsLoading(false);
    };

    return (
        <>
            <div
                style={styles.videoWrapper}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                data-video-wrapper
            >
                <img
                    src={thumbnail}
                    style={styles.thumbnail}
                    alt="Video thumbnail"
                />
                <div style={styles.playIcon} data-play-icon>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </div>
                <div style={styles.hintText} data-hint-text>
                    Hold to preview
                </div>
            </div>

            {isPreviewVisible && (
                <div
                    style={styles.previewModal}
                    onClick={() => setIsPreviewVisible(false)}
                >
                    <div style={styles.previewContent} onClick={(e) => e.stopPropagation()}>
                        <button
                            style={styles.closeButton}
                            onClick={() => setIsPreviewVisible(false)}
                            data-close-video
                        >
                            ×
                        </button>
                        {isLoading && (
                            <div style={styles.videoLoadingContainer}>
                                <div style={styles.spinner}></div>
                            </div>
                        )}
                        <video
                            ref={videoRef}
                            src={uri}
                            style={styles.previewVideo}
                            poster={thumbnail}
                            autoPlay
                            loop
                            muted
                            playsInline
                            controls
                            onLoadedData={handleVideoLoad}
                            onError={() => setIsPreviewVisible(false)}
                        />
                    </div>
                </div>
            )}
        </>
    );
});

const styles = {
    videoWrapper: {
        width: "100%",
        height: "100%",
        position: "relative" as const,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    thumbnail: {
        width: "100%",
        height: "100%",
        objectFit: "cover" as const,
    },
    playIcon: {
        position: "absolute" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        borderRadius: "50%",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
    },
    hintText: {
        position: "absolute" as const,
        bottom: "8px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "white",
        fontSize: "12px",
        padding: "4px 8px",
        borderRadius: "12px",
        fontWeight: "500",
        opacity: 0.6,
        transition: "all 0.3s ease",
    },
    previewModal: {
        position: "fixed" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
    },
    previewContent: {
        width: '90%',
        height: '90%',
        maxWidth: '800px',
        maxHeight: '600px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: COLORS.surface,
        position: 'relative' as const,
    },
    previewVideo: {
        width: '100%',
        height: '100%',
        objectFit: 'contain' as const,
    },
    videoLoadingContainer: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1,
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: `4px solid ${COLORS.surfaceLight}`,
        borderTop: `4px solid ${COLORS.primary}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    closeButton: {
        position: 'absolute' as const,
        top: '16px',
        right: '16px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        fontSize: '24px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        transition: 'background 0.2s ease',
    },
};

export default VideoPlayer; 