import { COLORS } from "@/constants/theme";
import React, { memo, useState, useRef } from "react";

interface ImagePreviewProps {
    uri: string;
}

const ImagePreview = memo(({ uri }: ImagePreviewProps) => {
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [imageError, setImageError] = useState(false);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    console.log("ImagePreview: Rendering with URI:", uri);

    // Validate URI
    const isValidUri = uri && typeof uri === "string" && (uri.startsWith("http") || uri.startsWith("data:"));

    if (!isValidUri || imageError) {
        console.log("ImagePreview: Invalid URI:", uri);
        return (
            <div style={styles.imageWrapper}>
                <div style={styles.errorOverlay}>
                    <div style={styles.errorText}>Invalid URL</div>
                </div>
            </div>
        );
    }

    const handleMouseDown = () => {
        longPressTimerRef.current = setTimeout(() => {
            setIsPreviewVisible(true);
        }, 200);
    };

    const handleMouseUp = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const handleImageError = () => {
        console.log("ImagePreview: Error loading", uri);
        setImageError(true);
    };

    const handleImageLoad = () => {
        console.log("ImagePreview: Successfully loaded", uri);
    };

    return (
        <>
            <div
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                style={styles.imageWrapper}
            >
                <img
                    src={uri}
                    style={styles.image}
                    alt="Post image"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                />
            </div>

            {isPreviewVisible && (
                <div
                    style={styles.previewModal}
                    onClick={() => setIsPreviewVisible(false)}
                >
                    <div style={styles.previewContent} onClick={(e) => e.stopPropagation()}>
                        <img
                            src={uri}
                            style={styles.previewImage}
                            alt="Full size preview"
                            onError={() => setIsPreviewVisible(false)}
                        />
                    </div>
                </div>
            )}
        </>
    );
});

const styles = {
    imageWrapper: {
        width: "100%",
        height: "100%",
        position: 'relative' as const,
        cursor: 'pointer',
    },
    image: {
        width: "100%",
        height: "100%",
        objectFit: 'cover' as const,
        display: 'block',
    },
    errorOverlay: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: 'white',
        fontSize: '16px',
        fontWeight: 'bold',
    },
    previewModal: {
        position: 'fixed' as const,
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
        maxWidth: '1200px',
        maxHeight: '800px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: COLORS.surface,
    },
    previewImage: {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain' as const,
    },
};

export default ImagePreview; 