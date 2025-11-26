'use client';
import React, { memo, useState, useEffect } from "react";
import { COLORS } from "@/constants/theme";
import { isAuthenticated } from "../utils/auth";

/* -------------------------------------------------------------------------- */
/* FORM SHAPE                                   */
/* -------------------------------------------------------------------------- */

const INITIAL_FORM = {
    restaurantName: "",
    description: "",
    itemsToPromote: "",
    minFollowers: "",
    minFollowersUnit: "K",
    keyValuePairs: [] as Array<{
        platform: string;
        metric: string;
        value: string;
        unit: string;
        reward: string;
    }>,
    restaurantImage: null as File | null,
    googleMapsLink: "",
    address: "",
    guidelines: "",
};

/* -------------------------------------------------------------------------- */
/* MAIN MODAL                                   */
/* -------------------------------------------------------------------------- */

export const CreatePostModal = memo(
    ({
         isVisible,
         onClose,
         onSubmit,
     }: {
        isVisible: boolean;
        onClose: () => void;
        onSubmit: (postData: any) => void;
    }) => {
        const [formData, setFormData] = useState(INITIAL_FORM);
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [imagePreview, setImagePreview] = useState<string | null>(null);

        // FIX: Initialize state based on prop to prevent initial flash/incorrect state
        const [fadeClass, setFadeClass] = useState(isVisible ? "fade-in" : "hidden");
        const [error, setError] = useState<string | null>(null);

        // FIX: Trigger fade in/out transition and handle unmounting
        useEffect(() => {
            let timer: NodeJS.Timeout;
            if (isVisible) {
                setFadeClass("fade-in");
            } else {
                // Only animate out if we are not already hidden
                if (fadeClass !== 'hidden') {
                    setFadeClass("fade-out");
                    // Wait for animation (180-200ms based on CSS transition) then set to hidden state
                    timer = setTimeout(() => {
                        setFadeClass("hidden");
                    }, 200);
                }
            }
            return () => clearTimeout(timer);
        }, [isVisible, fadeClass]);

        // Animation CSS
        useEffect(() => {
            if (typeof document !== "undefined" && !document.getElementById("modal-animation-style")) {
                const style = document.createElement("style");
                style.id = "modal-animation-style";
                style.innerHTML = `
                .fade-in { opacity: 1 !important; transform: scale(1) !important; transition: opacity 200ms cubic-bezier(0.65,0,0.35,1),transform 200ms cubic-bezier(0.65,0,0.35,1);}
                .fade-out { opacity: 0 !important; transform: scale(0.93) !important; transition: opacity 180ms cubic-bezier(0.65,0,0.35,1),transform 180ms cubic-bezier(0.65,0,0.35,1);}
                `;
                document.head.appendChild(style);
            }
        }, []);

        // FIX: The component only renders if it is visible or fading out
        if (fadeClass === 'hidden') return null;

        /* --------------------------- Helpers -------------------------------- */

        const update = (field: string, value: any) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
            setError(null);
        };

        const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                update("restaurantImage", file);
                setImagePreview(URL.createObjectURL(file));
            } else {
                update("restaurantImage", null);
                setImagePreview(null);
            }
        };

        const addKeyValuePair = () => {
            update("keyValuePairs", [
                ...formData.keyValuePairs,
                {
                    platform: "instagram",
                    metric: "views",
                    value: "",
                    reward: "",
                    unit: "",
                },
            ]);
        };

        const updateKeyValuePair = (idx: number, field: string, value: string) => {
            const updated = [...formData.keyValuePairs];
            updated[idx][field] = value;
            update("keyValuePairs", updated);
        };

        const removeKeyValuePair = (idx: number) => {
            update(
                "keyValuePairs",
                formData.keyValuePairs.filter((_, i) => i !== idx)
            );
        };

        /* --------------------------- Submit -------------------------------- */
        const handleSubmit = async () => {
            if (!formData.restaurantName.trim() || !formData.description.trim()) {
                setError("Restaurant name and description are required.");
                return;
            }
            if (!formData.restaurantImage) {
                setError("Please select a Restaurant image.");
                return;
            }
            setIsSubmitting(true);

            try {
                const auth = await isAuthenticated();
                const userId = auth?.userId;

                const fd = new FormData();
                const payload = {
                    restaurantName: formData.restaurantName,
                    description: formData.description,
                    itemsToPromote: formData.itemsToPromote,
                    minFollowers: formData.minFollowers,
                    minFollowersUnit: formData.minFollowersUnit,
                    keyValuePairs: formData.keyValuePairs,
                    googleMapsLink: formData.googleMapsLink,
                    address: formData.address,
                    guidelines: formData.guidelines,
                    category: "Food",
                };
                fd.append('data', JSON.stringify(payload));
                fd.append('user_id', userId || '');
                // formData.restaurantImage is guaranteed to be File here due to check above
                fd.append('file', formData.restaurantImage);

                const response = await fetch('https://marketapi.owlit.in/posts', {
                    method: 'POST',
                    body: fd,
                });


                if (response.status!=200) {
                    setError("Failed to create post.");
                    setIsSubmitting(false);
                    return;
                }

                // Request parent to turn off isVisible prop (triggers animation/unmount via useEffect)
                onClose();

                // Reset state after animation duration
                setTimeout(() => {
                    setFormData(INITIAL_FORM);
                    setImagePreview(null);
                    setIsSubmitting(false);
                    onSubmit(payload);
                }, 200);
            } catch (err) {
                console.error("Error posting:", err);
                setError("Something went wrong.");
                setIsSubmitting(false);
            }
        };

        /* --------------------------- Render UI -------------------------------- */

        return (
            <div
                style={{ ...styles.overlay, pointerEvents: isSubmitting ? "none" : "auto" }}
                className={fadeClass}
                onClick={() => {
                    // Manual close relies on onClose prop changing isVisible state
                    onClose();
                }}
            >
                <div
                    style={{
                        ...styles.modal,
                        pointerEvents: isSubmitting ? "none" : "auto",
                        transition: "box-shadow 0.18s cubic-bezier(.65,0,.35,1)",
                        boxShadow: fadeClass === "fade-in" ? "0 8px 48px rgba(0,0,0,.45)" : "0 0 0 rgba(0,0,0,0.00)",
                    }}
                    className={fadeClass}
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 style={styles.title}>
                        Create Restaurant Promotion Campaign
                    </h2>
                    {error && (
                        <div style={{
                            color: "#ff5974",
                            background: "rgba(255,90,120,0.07)",
                            fontWeight: 500,
                            padding: "9px 12px",
                            marginBottom: 12,
                            borderRadius: 7,
                            fontSize: "15px",
                            textAlign: "center"
                        }}>
                            {error}
                        </div>
                    )}
                    {/* Restaurant Name */}
                    <div style={styles.field}>
                        <label style={styles.label}>Restaurant Name *</label>
                        <input
                            type="text"
                            style={styles.input}
                            value={formData.restaurantName}
                            onChange={(e) => update("restaurantName", e.target.value)}
                        />
                    </div>
                    {/* Description */}
                    <div style={styles.field}>
                        <label style={styles.label}>Description *</label>
                        <textarea
                            style={styles.textarea}
                            value={formData.description}
                            onChange={(e) => update("description", e.target.value)}
                            rows={3}
                        />
                    </div>
                    {/* Items */}
                    <div style={styles.field}>
                        <label style={styles.label}>Items to be promoted</label>
                        <input
                            type="text"
                            style={styles.input}
                            value={formData.itemsToPromote}
                            onChange={(e) => update("itemsToPromote", e.target.value)}
                        />
                    </div>
                    {/* Followers */}
                    <div style={styles.field}>
                        <label style={styles.label}>Minimum Followers</label>
                        <div style={{ display: "flex", gap: 8 }}>
                            <input
                                type="number"
                                style={styles.followersInput}
                                value={formData.minFollowers}
                                onChange={(e) => update("minFollowers", e.target.value)}
                                min="0"
                                placeholder="1000"
                            />

                            <select
                                style={styles.followersUnitSelect}
                                value={formData.minFollowersUnit}
                                onChange={(e) =>
                                    update("minFollowersUnit", e.target.value)
                                }
                            >
                                <option value="">-</option>
                                <option value="K">K</option>
                                <option value="M">M</option>
                                <option value="B">B</option>
                            </select>
                        </div>
                    </div>
                    {/* KEY VALUE PAIRS */}
                    <div style={styles.field}>
                        <label style={styles.label}>Performance Metrics</label>
                        {formData.keyValuePairs.map((pair, idx) => (
                            <div key={idx} style={styles.metricRow}>
                                <select
                                    style={styles.platformSelect}
                                    value={pair.platform}
                                    onChange={(e) =>
                                        updateKeyValuePair(idx, "platform", e.target.value)
                                    }
                                >
                                    <option value="instagram">Instagram</option>
                                    <option value="youtube">YouTube</option>
                                    <option value="twitter">Twitter</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="tiktok">TikTok</option>
                                </select>

                                <select
                                    style={styles.metricSelect}
                                    value={pair.metric}
                                    onChange={(e) =>
                                        updateKeyValuePair(idx, "metric", e.target.value)
                                    }
                                >
                                    <option value="views">Views</option>
                                    <option value="likes">Likes</option>
                                    <option value="comments">Comments</option>
                                    <option value="impressions">Impressions</option>
                                </select>

                                <input
                                    type="number"
                                    style={styles.metricValueInput}
                                    value={pair.value}
                                    onChange={(e) =>
                                        updateKeyValuePair(idx, "value", e.target.value)
                                    }
                                    placeholder="1"
                                />

                                <select
                                    style={styles.metricUnitSelect}
                                    value={pair.unit}
                                    onChange={(e) =>
                                        updateKeyValuePair(idx, "unit", e.target.value)
                                    }
                                >
                                    <option value="K">K</option>
                                    <option value="M">M</option>
                                    <option value="B">B</option>
                                </select>

                                <input
                                    type="text"
                                    style={styles.metricInput}
                                    value={pair.reward}
                                    onChange={(e) =>
                                        updateKeyValuePair(idx, "reward", e.target.value)
                                    }
                                    placeholder="Rs.25"
                                />

                                <button
                                    style={styles.removeButton}
                                    onClick={() => removeKeyValuePair(idx)}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        <button style={styles.addButton} onClick={addKeyValuePair}>
                            + Add Metric
                        </button>
                    </div>
                    {/* Restaurant Image Picker */}
                    <div style={styles.field}>
                        <label style={styles.label}>Restaurant Image <span style={{ color: "#fa4848" }}>*</span></label>
                        <input
                            type="file"
                            accept="image/*"
                            style={styles.input}
                            onChange={handleImageChange}
                            disabled={isSubmitting}
                        />
                        {imagePreview && (
                            <img
                                src={imagePreview}
                                alt="Preview"
                                style={{
                                    width: "100%",
                                    maxWidth: 200,
                                    borderRadius: 12,
                                    marginTop: 8,
                                    alignSelf: "center",
                                    opacity: isSubmitting ? 0.5 : 1
                                }}
                            />
                        )}
                    </div>
                    {/* Maps */}
                    <div style={styles.field}>
                        <label style={styles.label}>Google Maps Link</label>
                        <input
                            type="url"
                            style={styles.input}
                            value={formData.googleMapsLink}
                            onChange={(e) => update("googleMapsLink", e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>
                    {/* Address */}
                    <div style={styles.field}>
                        <label style={styles.label}>Restaurant Address</label>
                        <textarea
                            style={styles.textarea}
                            value={formData.address}
                            onChange={(e) => update("address", e.target.value)}
                            rows={2}
                            disabled={isSubmitting}
                        />
                    </div>
                    {/* Guidelines */}
                    <div style={styles.field}>
                        <label style={styles.label}>Guidelines</label>
                        <textarea
                            style={styles.textarea}
                            value={formData.guidelines}
                            onChange={(e) => update("guidelines", e.target.value)}
                            rows={6}
                            placeholder="Enter guidelines, one per line"
                            disabled={isSubmitting}
                        />
                    </div>
                    {/* Actions */}
                    <div style={styles.actions}>
                        <button
                            style={styles.cancelButton}
                            onClick={() => {
                                onClose();
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            style={styles.submitButton}
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Creating..." : "Create"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
);

/* -------------------------------------------------------------------------- */
/* STYLES                                  */
/* -------------------------------------------------------------------------- */

const styles = {
    overlay: {
        position: "fixed", // Removed 'as const'
        inset: 0,
        zIndex: 1300,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(0,0,0,0.94)",
        padding: 16,
        opacity: 0,
        transform: "scale(0.95)",
    },
    modal: {
        backgroundColor: COLORS.background,
        borderRadius: 16,
        width: "95%",
        maxWidth: 480,
        maxHeight: "80vh",
        overflowY: "auto",
        padding: 32,
        display: "flex",
        flexDirection: "column", // Removed 'as const'
        alignItems: "stretch",
        boxShadow: "0 8px 48px rgba(0,0,0,.45)",
        opacity: 1,
        transform: "scale(1)",
        transition: "none",
    },
    title: {
        color: COLORS.instagram.red,
        fontWeight: 500,
        fontSize: 25,
        margin: "0 0 18px 0",
        textAlign: "center", // Removed 'as const'
        letterSpacing: 0.1,
    },
    field: {
        display: "flex",
        flexDirection: "column", // Removed 'as const'
        gap: 6,
        marginBottom: 16,
    },
    label: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: 100,
    },
    input: {
        background: COLORS.surface,
        color: COLORS.white,
        border: `1px solid ${COLORS.surfaceLight}`,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
        outline: "none",
    },
    textarea: {
        background: COLORS.surface,
        color: COLORS.white,
        border: `1px solid ${COLORS.surfaceLight}`,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 15,
        outline: "none",
        resize: "vertical", // Removed 'as const'
        textAlign: "left", // Removed 'as const'
        lineHeight: 1.4,
    },
    metricRow: {
        display: "flex",
        flexDirection: "row", // Removed 'as const'
        gap: 8,
        marginBottom: 6,
    },
    platformSelect: {
        background: COLORS.surface,
        color: COLORS.white,
        border: `1px solid ${COLORS.surfaceLight}`,
        borderRadius: 7,
        padding: "9px 6px",
        fontSize: 14,
        minWidth: 90,
    },
    metricSelect: {
        background: COLORS.surface,
        color: COLORS.white,
        border: `1px solid ${COLORS.surfaceLight}`,
        borderRadius: 7,
        padding: "9px 6px",
        fontSize: 14,
        minWidth: 80,
    },
    metricValueInput: {
        background: COLORS.surface,
        color: COLORS.white,
        border: `1px solid ${COLORS.surfaceLight}`,
        borderRadius: 7,
        padding: "9px 8px",
        fontSize: 14,
        width: 55,
    },
    metricUnitSelect: {
        background: COLORS.surface,
        color: COLORS.white,
        border: `1px solid ${COLORS.surfaceLight}`,
        borderRadius: 7,
        padding: "9px 6px",
        fontSize: 14,
        width: 50,
    },
    metricInput: {
        background: COLORS.surface,
        color: COLORS.white,
        border: `1px solid ${COLORS.surfaceLight}`,
        borderRadius: 7,
        padding: "9px 8px",
        fontSize: 14,
        width: 65,
    },
    removeButton: {
        background: "none",
        border: "none",
        color: COLORS.error,
        fontWeight: 700,
        fontSize: 19,
        cursor: "pointer",
    },
    addButton: {
        padding: "9px 13px",
        background: COLORS.surfaceLight,
        color: COLORS.white,
        border: `1px solid ${COLORS.surface}`,
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 500,
        cursor: "pointer",
        marginBottom: 14,
    },
    followersInput: {
        background: COLORS.surface,
        color: COLORS.white,
        border: `1px solid ${COLORS.surfaceLight}`,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        width: 120,
    },
    followersUnitSelect: {
        background: COLORS.surface,
        color: COLORS.white,
        border: `1px solid ${COLORS.surfaceLight}`,
        borderRadius: 8,
        padding: "12px 8px",
        fontSize: 16,
        width: 70,
    },
    actions: {
        display: "flex",
        flexDirection: "row", // Removed 'as const'
        justifyContent: "flex-end",
        gap: 8,
        paddingTop: 7,
    },
    cancelButton: {
        background: "none",
        border: `1px solid ${COLORS.surfaceLight}`,
        color: COLORS.white,
        borderRadius: 8,
        fontSize: 15,
        padding: "10px 15px",
        cursor: "pointer",
    },
    submitButton: {
        background: COLORS.white,
        color: COLORS.background,
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 15,
        padding: "10px 18px",
        cursor: "pointer",
        boxShadow: "0 4px 18px rgba(0,0,0,0.10)",
    }
};
