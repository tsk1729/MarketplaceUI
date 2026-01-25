'use client';
import React, { memo, useState, useEffect, useRef, ChangeEvent } from "react";
import { COLORS } from "@/constants/theme";
import { isAuthenticated } from "../utils/auth";
import { localapi, marketapi } from "../../utils/api";
import ErrorBanner from "../components/ErrorBanner";

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

type KeyValuePair = {
    platform: string;
    metric: string;
    value: string;
    unit: string;
    reward: string;
};

// We extend the Props to accept initialData (optional)
type CreatePostModalProps = {
    isVisible: boolean;
    onClose: () => void;
    onSubmit: (postData: any) => void;
    initialData?: FormState & { postId?: string; existingImageUrl?: string }; // New prop
};

type FormState = {
    restaurantName: string;
    description: string;
    itemsToPromote: string;
    minFollowers: string;
    minFollowersUnit: string;
    keyValuePairs: KeyValuePair[];
    restaurantImage: File | null; // This represents a NEW file upload
    googleMapsLink: string;
    address: string;
    guidelines: string;
};

const INITIAL_FORM: FormState = {
    restaurantName: "",
    description: "",
    itemsToPromote: "",
    minFollowers: "",
    minFollowersUnit: "K",
    keyValuePairs: [],
    restaurantImage: null,
    googleMapsLink: "",
    address: "",
    guidelines: "",
};

/* -------------------------------------------------------------------------- */
/* MAIN MODAL */
/* -------------------------------------------------------------------------- */

export const CreatePostModal = memo(function CreatePostModal({
    isVisible,
    onClose,
    onSubmit,
    initialData,
}: CreatePostModalProps) {
    const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [fadeClass, setFadeClass] = useState(isVisible ? "fade-in" : "hidden");
    const [error, setError] = useState<string | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const isEditMode = !!initialData; // Derived state to check if we are editing

    // Handle Animation & Reset/Prefill Logic
    useEffect(() => {
        let timer: NodeJS.Timeout | undefined;
        if (isVisible) {
            setFadeClass("fade-in");

            // PREFILL LOGIC
            if (initialData) {
                setFormData({
                    restaurantName: initialData.restaurantName || "",
                    description: initialData.description || "",
                    itemsToPromote: initialData.itemsToPromote || "",
                    minFollowers: initialData.minFollowers || "",
                    minFollowersUnit: initialData.minFollowersUnit || "K",
                    keyValuePairs: initialData.keyValuePairs || [],
                    restaurantImage: null, // Reset file input, we rely on existingImageUrl for preview
                    googleMapsLink: initialData.googleMapsLink || "",
                    address: initialData.address || "",
                    guidelines: initialData.guidelines || "",
                });
                // Set preview to the URL from backend
                setImagePreview(initialData.existingImageUrl || null);
            } else {
                // RESET LOGIC (Create Mode)
                setFormData(INITIAL_FORM);
                setImagePreview(null);
            }
        } else {
            if (fadeClass !== "hidden") {
                setFadeClass("fade-out");
                timer = setTimeout(() => {
                    setFadeClass("hidden");
                }, 200);
            }
        }
        return () => timer && clearTimeout(timer);
    }, [isVisible, fadeClass, initialData]);

    // Internal: Scroll to top if error appears
    useEffect(() => {
        if (error && modalRef.current) {
            modalRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [error]);

    // ... (Keep existing animation style useEffect) ...
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

    if (fadeClass === "hidden") return null;

    /* --------------------------- Helpers ------------------------------- */
    const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (error) setError(null);
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            if (file.size > 4 * 1024 * 1024) {
                setError("File size must be 4MB or less.");
                (e.target as HTMLInputElement).value = "";
                return;
            }
            update("restaurantImage", file);
            setImagePreview(URL.createObjectURL(file));
        }
        // Note: We don't clear the image if they cancel selection in Edit mode,
        // but for simplicity, let's assume they want to replace it if they click input.
    };

    // ... (Keep addKeyValuePair, updateKeyValuePair, removeKeyValuePair as is) ...
    const addKeyValuePair = () => {
        update("keyValuePairs", [...formData.keyValuePairs, { platform: "instagram", metric: "views", value: "", reward: "", unit: "" }]);
    };

    const updateKeyValuePair = (idx: number, field: keyof KeyValuePair, value: string) => {
        setFormData((prev) => {
            const updated = [...prev.keyValuePairs];
            updated[idx][field] = value;
            return { ...prev, keyValuePairs: updated };
        });
        setError(null);
    };

    const removeKeyValuePair = (idx: number) => {
        setFormData((prev) => ({ ...prev, keyValuePairs: prev.keyValuePairs.filter((_, i) => i !== idx) }));
    };

    /* --------------------------- Submit ------------------------------- */
    const handleSubmit = async () => {
        if (!formData.restaurantName.trim() || !formData.description.trim()) {
            setError("Restaurant name and description are required.");
            return;
        }

        // VALIDATION: In create mode, image is required. In edit mode, it's optional (fallback to existing).
        if (!isEditMode && !formData.restaurantImage) {
            setError("Please select a Restaurant image.");
            return;
        }

        setIsSubmitting(true);

        try {
            const auth = await isAuthenticated();
            const userId = auth?.userId || "";

            // Build JSON data payload from form values
            const dataPayload = {
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
                ...(isEditMode && { postId: initialData?.postId }),
            };

            // Prepare multipart form-data (align with provided curl contract)
            const fd = new FormData();

            if (isEditMode) {
                const useExisting = (!formData.restaurantImage && !!initialData?.existingImageUrl);
                const fields = {
                    user_id: userId,
                    use_existing_image: useExisting ? "true" : "false",
                    data: dataPayload,
                    post_id: initialData?.postId || "",
                };
                const file = formData.restaurantImage || undefined;

                const { success, message } = await marketapi.putMultipart("update_post", fields, file as any);
                if (!success) {
                    setError(message || "Failed to update post");
                    setIsSubmitting(false);
                    return;
                }
            } else {
                // CREATE: use helper method for multipart POST
                const fields = {
                    user_id: userId,
                    data: dataPayload,
                };
                const file = formData.restaurantImage || undefined;

                const { success, message } = await marketapi.postMultipart("posts", fields, file as any);
                if (!success) {
                    setError(message || "Failed to create post");
                    setIsSubmitting(false);
                    return;
                }
            }

            onClose();

            setTimeout(() => {
                setImagePreview(null);
                setIsSubmitting(false);
                onSubmit(dataPayload); // Trigger refresh in parent
            }, 200);
        } catch (err) {
            console.error("Error posting:", err);
            setError("Something went wrong.");
            setIsSubmitting(false);
        }
    };

    /* --------------------------- Render UI ---------------------------- */
    return (
        <div
            style={{ ...styles.overlay, pointerEvents: isSubmitting ? "none" : "auto" }}
            className={fadeClass}
            onClick={onClose}
        >
            <div
                ref={modalRef}
                style={{
                    ...styles.modal,
                    pointerEvents: isSubmitting ? "none" : "auto",
                    boxShadow: fadeClass === "fade-in" ? "0 8px 48px rgba(0,0,0,.45)" : "0 0 0 rgba(0,0,0,0)",
                }}
                className={fadeClass}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={styles.title}>
                    {isEditMode ? "Edit Campaign" : "Create Restaurant Promotion"}
                </h2>

                {/* ... (Keep Error and Required Fields Note) ... */}
                {error && (
                    <div style={{ marginBottom: 12 }}>
                        <ErrorBanner error={error} onDismiss={() => setError(null)} />
                    </div>
                )}

                {/* ... (Keep Name, Description, Items, Followers inputs same as before) ... */}
                <div style={styles.field}>
                    <label style={styles.label}>Restaurant Name *</label>
                    <input type="text" style={styles.input} value={formData.restaurantName} onChange={(e) => update("restaurantName", e.target.value)} />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Description *</label>
                    <textarea style={styles.textarea} value={formData.description} onChange={(e) => update("description", e.target.value)} rows={3} />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Items to be promoted</label>
                    <input type="text" style={styles.input} value={formData.itemsToPromote} onChange={(e) => update("itemsToPromote", e.target.value)} />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Minimum Followers</label>
                    <div style={{ display: "flex", gap: 8 }}>
                        <input
                            type="number"
                            style={styles.followersInput}
                            value={formData.minFollowers}
                            onChange={(e) => update("minFollowers", e.target.value)}
                            min={0}
                            placeholder="1000"
                        />
                        <select
                            style={styles.followersUnitSelect}
                            value={formData.minFollowersUnit}
                            onChange={(e) => update("minFollowersUnit", e.target.value)}
                        >
                            <option value="">-</option>
                            <option value="K">K</option>
                            <option value="M">M</option>
                            <option value="B">B</option>
                        </select>
                    </div>
                </div>

                {/* ... (Keep Metrics section same as before) ... */}
                <div style={styles.field}>
                    {/* ... Metric mapping code ... */}
                    <button style={styles.addButton} onClick={addKeyValuePair}>+ Add Metric</button>
                    {formData.keyValuePairs.map((pair, idx) => (
                        <div key={idx} style={styles.metricRow}>
                            {/* ... Selects and inputs for metrics ... */}
                            {/* Simplified for brevity, paste your original map logic here */}
                            <select style={styles.platformSelect} value={pair.platform} onChange={(e) => updateKeyValuePair(idx, "platform", e.target.value)}>
                                <option value="instagram">Instagram</option>
                                <option value="youtube">YouTube</option>
                                <option value="twitter">Twitter</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="tiktok">TikTok</option>
                            </select>
                            <select style={styles.metricSelect} value={pair.metric} onChange={(e) => updateKeyValuePair(idx, "metric", e.target.value)}>
                                <option value="views">Views</option>
                                <option value="likes">Likes</option>
                                <option value="comments">Comments</option>
                                <option value="impressions">Impressions</option>
                            </select>
                            <input type="number" style={styles.metricValueInput} value={pair.value} onChange={(e) => updateKeyValuePair(idx, "value", e.target.value)} placeholder="1" />
                            <select style={styles.metricUnitSelect} value={pair.unit} onChange={(e) => updateKeyValuePair(idx, "unit", e.target.value)}>
                                <option value="K">K</option>
                                <option value="M">M</option>
                                <option value="B">B</option>
                            </select>
                            <input type="number" style={styles.metricInput} value={pair.reward} placeholder="Rs.50" onChange={(e) => updateKeyValuePair(idx, "reward", e.target.value)} />
                            <button style={styles.removeButton} onClick={() => removeKeyValuePair(idx)}>✕</button>
                        </div>
                    ))}
                </div>


                {/* Restaurant Image Picker */}
                <div style={styles.field}>
                    <label style={styles.label}>
                        Restaurant Image {!isEditMode && <span style={{ color: "#fa4848" }}>*</span>}
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        style={styles.input}
                        onChange={handleImageChange}
                        disabled={isSubmitting}
                    />
                    {imagePreview && (
                        <div style={{ textAlign: 'center' }}>
                            <img
                                src={imagePreview}
                                alt="Preview"
                                style={{
                                    width: "100%",
                                    maxWidth: 200,
                                    borderRadius: 12,
                                    marginTop: 8,
                                    opacity: isSubmitting ? 0.5 : 1,
                                }}
                            />
                            {isEditMode && !formData.restaurantImage && (
                                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Current Image</div>
                            )}
                        </div>
                    )}
                </div>

                {/* ... (Keep Maps, Address, Guidelines same as before) ... */}
                <div style={styles.field}>
                    <label style={styles.label}>Google Maps Link *</label>
                    <input type="url" style={styles.input} value={formData.googleMapsLink} onChange={(e) => update("googleMapsLink", e.target.value)} />
                </div>
                <div style={styles.field}>
                    <label style={styles.label}>Restaurant Address *</label>
                    <textarea style={styles.textarea} value={formData.address} onChange={(e) => update("address", e.target.value)} rows={2} />
                </div>
                <div style={styles.field}>
                    <label style={styles.label}>Guidelines *</label>
                    <textarea style={styles.textarea} value={formData.guidelines} onChange={(e) => update("guidelines", e.target.value)} rows={6} />
                </div>

                {/* Actions */}
                <div style={styles.actions}>
                    <button style={styles.cancelButton} onClick={onClose} disabled={isSubmitting}>Cancel</button>
                    <button style={styles.submitButton} onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update" : "Create")}
                    </button>
                </div>
            </div>
        </div>
    );
});

// ... styles ...
// Just added one helper style for the error
const styles: { [key: string]: React.CSSProperties } = {
    // ... (Your existing styles) ...

    // ... (rest of your styles)
    overlay: {
        position: "fixed",
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
        flexDirection: "column",
        alignItems: "stretch",
        boxShadow: "0 8px 48px rgba(0,0,0,.45)",
    },
    title: {
        color: COLORS.instagram.red,
        fontWeight: 500,
        fontSize: 25,
        margin: "0 0 18px 0",
        textAlign: "center",
        letterSpacing: 0.1,
    },
    field: {
        display: "flex",
        flexDirection: "column",
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
        resize: "vertical",
        lineHeight: 1.4,
    },
    metricRow: {
        display: "flex",
        flexDirection: "row",
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
        color: COLORS.error, // Ensure COLORS.error exists, or use '#ff0000'
        fontWeight: 700,
        fontSize: 19,
        cursor: "pointer",
    },
    addButton: {
        padding: "9px 13px",
        background: COLORS.surfaceLight,
        color: COLORS.white,
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
        flexDirection: "row",
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
        fontSize: 15,
        padding: "10px 18px",
        cursor: "pointer",
        fontWeight: 600,
        boxShadow: "0 4px 18px rgba(0,0,0,0.10)",
    },
};
