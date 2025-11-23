'use client';
import React, { memo, useState } from "react";
import { COLORS } from "@/constants/theme";
import { marketapi } from "@/utils/api";
import { isAuthenticated } from "../utils/auth";

/* -------------------------------------------------------------------------- */
/*                                FORM SHAPE                                   */
/* -------------------------------------------------------------------------- */

const INITIAL_FORM = {
    restaurantName: "",
    description: "",
    itemsToPromote: "",
    minFollowers: "",
    minFollowersUnit: "",
    keyValuePairs: [] as Array<{
        platform: string;
        metric: string;
        value: string;
        unit: string;
        reward: string;
    }>,
    restaurantImageUrl: "",
    googleMapsLink: "",
    address: "",
    guidelines: "",
};

/* -------------------------------------------------------------------------- */
/*                               MAIN MODAL                                     */
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

        /* --------------------------- Helpers -------------------------------- */

        const update = (field: string, value: any) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
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
                alert("Restaurant name and description are required.");
                return;
            }

            setIsSubmitting(true);

            try {
                const auth = await isAuthenticated();
                const userId = auth?.userId;

                const body = {
                    data: {
                        restaurantName: formData.restaurantName,
                        description: formData.description,
                        itemsToPromote: formData.itemsToPromote,
                        minFollowers: formData.minFollowers,
                        minFollowersUnit: formData.minFollowersUnit,
                        keyValuePairs: formData.keyValuePairs,
                        restaurantImage: formData.restaurantImageUrl,
                        googleMapsLink: formData.googleMapsLink,
                        address: formData.address,
                        guidelines: formData.guidelines,
                        category: "Food",
                    },
                    user_id: userId,
                };

                const response = await marketapi.post("posts", body);

                if (!response.success) {
                    alert(response.message || "Failed to create post.");
                    setIsSubmitting(false);
                    return;
                }

                onSubmit(body.data);
                setFormData(INITIAL_FORM);
                onClose();
            } catch (err) {
                console.error("Error posting:", err);
                alert("Something went wrong.");
            } finally {
                setIsSubmitting(false);
            }
        };

        if (!isVisible) return null;

        /* --------------------------- Render UI -------------------------------- */

        return (
            <div style={styles.overlay} onClick={onClose}>
                <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <h2 style={styles.title}>
                        Create Restaurant Promotion Campaign
                    </h2>

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
                                    <option value="">-</option>
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
                                    placeholder="$25"
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

                    {/* Restaurant Image */}
                    <div style={styles.field}>
                        <label style={styles.label}>Restaurant Image URL</label>
                        <input
                            type="url"
                            style={styles.input}
                            value={formData.restaurantImageUrl}
                            onChange={(e) => update("restaurantImageUrl", e.target.value)}
                        />
                    </div>

                    {/* Maps */}
                    <div style={styles.field}>
                        <label style={styles.label}>Google Maps Link</label>
                        <input
                            type="url"
                            style={styles.input}
                            value={formData.googleMapsLink}
                            onChange={(e) => update("googleMapsLink", e.target.value)}
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
                        />
                    </div>

                    {/* Actions */}
                    <div style={styles.actions}>
                        <button
                            style={styles.cancelButton}
                            onClick={onClose}
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
/*                                    STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = {
    overlay: {
        position: "fixed" as const,
        inset: 0,
        zIndex: 1300,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(0,0,0,0.94)",
        padding: 16,
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
        flexDirection: "column",
        alignItems: "stretch",
        boxShadow: "0 8px 48px rgba(0,0,0,.45)",

        /* 📱 Mobile — keep narrow & compact */
        ...(typeof window !== "undefined" && window.innerWidth < 640
            ? {
                width: "95%",
                maxWidth: "95%",
                padding: 22,
            }
            : {}),

        /* 💻 Laptop screens — MAKE IT WIDER */
        ...(typeof window !== "undefined" &&
        window.innerWidth >= 640 &&
        window.innerWidth < 1280
            ? {
                width: "80%",   // much wider
                maxWidth: 700,  // expanded width
            }
            : {}),

        /* 🖥 Desktop large screens */
        ...(typeof window !== "undefined" && window.innerWidth >= 1280
            ? {
                width: "70%",
                maxWidth: 780,
            }
            : {}),
    },

    title: {
        color: COLORS.instagram.red,
        fontWeight: 500,
        fontSize: 25,
        margin: "0 0 18px 0",
        textAlign: "center" as const,
        letterSpacing: 0.1,
    },
    field: {
        display: "flex",
        flexDirection: "column" as const,
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
        resize: "vertical" as const,
        textAlign: "left" as const,
        lineHeight: 1.4,
    },
    metricRow: {
        display: "flex",
        flexDirection: "row" as const,
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
        flexDirection: "row" as const,
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
    },
};

