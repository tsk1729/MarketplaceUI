import React, { useState, useEffect, useCallback } from 'react';
import {
    useWindowDimensions,
    View,
    Text,
    Image,
    TouchableOpacity,
    Linking,
    ScrollView,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { isAuthenticated } from "@/app/utils/auth";
import { marketapi,localapi } from "../../utils/api";
// Adjust this import path based on your file structure
import { CreatePostModal } from "../(agency)/formModal";
import ConfirmDialog from "../components/ConfirmDialog";

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

type APIRestaurantPost = {
    postId: string;
    restaurantName: string;
    description: string;
    itemsToPromote: string;
    minFollowers: string;
    minFollowersUnit: string;
    keyValuePairs: KeyValuePair[];
    restaurantImage: string; // URL from backend
    googleMapsLink: string;
    address: string;
    guidelines: string;
    lastDate?: string;
    category?: string;
    status?: string;
};

/* -------------------------------------------------------------------------- */
/* THEME & STYLES */
/* -------------------------------------------------------------------------- */

const COLORS = {
    primary: "#4ADE80",
    secondary: "#2DD4BF",
    background: "#000000",
    surface: "#1A1A1A",
    surfaceLight: "#2A2A2A",
    white: "#FFFFFF",
    grey: "#9CA3AF",
    tagReq: "#58398e",
    black: "#000000",
    shadow: "#000000",
    instagram: {
        red: "#E1306C",
        blue: "#0095F6"
    },
    error: "#ff5974"
} as const;

const isMobile = (width: number) => width < 768;

/* -------------------------------------------------------------------------- */
/* COMPONENT */
/* -------------------------------------------------------------------------- */

const RestaurantDetailsScreen: React.FC = () => {
    const { width } = useWindowDimensions();
    const params = useLocalSearchParams();

    // State for Main Data
    const [post, setPost] = useState<APIRestaurantPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for Edit Modal
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editFormData, setEditFormData] = useState<any>(null);
    const [editLoading, setEditLoading] = useState(false);

    // State for Pause dialog
    const [pauseVisible, setPauseVisible] = useState(false);
    const [isPausing, setIsPausing] = useState(false);

    // Get ID from params (support both naming conventions just in case)
    const postId = typeof params.postId === "string" ? params.postId : "";

    /* --------------------------- Data Fetching --------------------------- */

    const fetchPost = useCallback(async () => {
        if (!postId) {
            setError("Missing post ID");
            setLoading(false);
            return;
        }

        setError(null);
        // Only show full screen loading on initial load, not refresh
        if (!post) setLoading(true);

        try {
            const auth = await isAuthenticated();
            if (!auth?.userId) throw new Error("Unauthorized");

            const res = await marketapi.get(`post?user_id=${auth.userId}&post_id=${postId}`);

            if (!res.success || !res.data?.data || Object.keys(res.data.data).length === 0) {
                setError("Post not found");
                setPost(null);
            } else {
                const data = res.data.data;

                // Map API response to our Type
                const mappedPost: APIRestaurantPost = {
                    postId: data._id,
                    restaurantName: data.restaurantName ?? "",
                    description: data.description ?? "",
                    itemsToPromote: data.itemsToPromote ?? "",
                    minFollowers: data.minFollowers ?? "",
                    minFollowersUnit: data.minFollowersUnit ?? "K",
                    keyValuePairs: data.keyValuePairs ?? [],
                    restaurantImage: data.restaurantImage || "",
                    googleMapsLink: data.googleMapsLink ?? "",
                    address: data.address ?? "",
                    guidelines: data.guidelines ?? "",
                    lastDate: data.lastDate,
                    category: data.category,
                    status: data.status ?? "paused"
                };
                setPost(mappedPost);
            }
        } catch (e: any) {
            console.error(e);
            setError(e?.message || "Failed to fetch details");
        } finally {
            setLoading(false);
        }
    }, [postId, post]);

    useEffect(() => {
        fetchPost();
    }, [postId]);

    /* --------------------------- Handlers --------------------------- */

    const handleEditPress = async () => {
        if (!post) return;
        setEditLoading(true);

        try {
            // We reuse the data we already fetched in `post`,
            // OR fetch fresh data if your backend structure is volatile.
            // Here, we map the current `post` state to the Form Shape.

            const formShape = {
                restaurantName: post.restaurantName,
                description: post.description,
                itemsToPromote: post.itemsToPromote,
                minFollowers: post.minFollowers,
                minFollowersUnit: post.minFollowersUnit,
                keyValuePairs: post.keyValuePairs,
                googleMapsLink: post.googleMapsLink,
                address: post.address,
                guidelines: post.guidelines,
                // Vital for the Modal to know we are in edit mode:
                existingImageUrl: post.restaurantImage,
                postId: post.postId
            };

            setEditFormData(formShape);
            setEditModalVisible(true);
        } catch (e) {
            console.error("Error preparing edit form", e);
            alert("Could not load edit form.");
        } finally {
            setEditLoading(false);
        }
    };

    const handleEditSubmit = (updatedPayload: any) => {
        // Close modal
        setEditModalVisible(false);
        setEditFormData(null);
        // Refresh the page data
        fetchPost();
    };

    /**
     * Pause or Resume Campaign
     * This uses the correct API endpoint as specified:
     * curl -X 'POST' \
     *  'http://127.0.0.1:8000/update_status?post_id=uuid&status=pause'
     * Uses utils/api.ts helper (localapi).
     *
     * Pass status "pause" to pause campaign, "active" to resume.
     */
    const updateCampaignStatus = async (status: string) => {
        if (!postId) return;
        setIsPausing(true);
        try {
            const auth = await isAuthenticated();
            if (!auth?.userId) throw new Error("Unauthorized");
            // Send post_id & status via query string as API expects
            const endpoint = `update_status?post_id=${encodeURIComponent(postId)}&status=${encodeURIComponent(status)}`;
            const res = await marketapi.post(endpoint, {});
            if (!res.success) throw new Error(res.message || "Failed to update campaign status");
            setPauseVisible(false);
            fetchPost();
        } catch (e: any) {
            console.error("Failed to update campaign status", e);
            alert(e?.message || "Failed to update campaign status");
        } finally {
            setIsPausing(false);
        }
    };

    /* --------------------------- Render Helpers --------------------------- */

    const renderRewardChip = (pair: KeyValuePair, idx: number) => {
        const text = `${pair.platform}: ${pair.metric} ${pair.value}${pair.unit} • ₹${pair.reward}`;
        return (
            <View key={idx} style={localStyles.rewardChip}>
                <Text style={localStyles.rewardChipText}>{text}</Text>
            </View>
        );
    };

    /* --------------------------- Main Render --------------------------- */

    if (loading) {
        return (
            <View style={localStyles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (error || !post) {
        return (
            <View style={localStyles.centerContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
                <Text style={{ color: COLORS.error, fontSize: 18, marginTop: 12 }}>
                    {error || "Post not found"}
                </Text>
            </View>
        );
    }

    const mobileLayout = isMobile(width);

    return (
        <View style={localStyles.container}>
            {/* Header */}
            <View style={localStyles.header}>
                <Text style={localStyles.headerTitle}>Restaurant Details</Text>
            </View>
            {mobileLayout ? (
                <ScrollView
                    style={{ flex: 1, backgroundColor: COLORS.background }}
                    contentContainerStyle={{ padding: 18, paddingBottom: 60 }}
                >
                    {/* Hero Section */}
                    <View style={localStyles.heroSection}>
                        <Image
                            source={{ uri: post.restaurantImage || 'https://via.placeholder.com/320x140?text=No+Image' }}
                            style={localStyles.restaurantImage}
                            resizeMode="cover"
                        />
                        <Text style={localStyles.restaurantName}>{post.restaurantName}</Text>
                        {post.category && <Text style={localStyles.categoryBadge}>{post.category}</Text>}
                        <Text style={localStyles.description}>{post.description}</Text>
                    </View>

                    {/* Location */}
                    {(post.address || post.googleMapsLink) && (
                        <View style={localStyles.section}>
                            <Text style={localStyles.sectionTitle}>Location</Text>
                            <View style={localStyles.row}>
                                <Ionicons name="location-outline" size={20} color={COLORS.white} style={{ marginRight: 6 }} />
                                <Text style={localStyles.text}>{post.address}</Text>
                            </View>
                            {post.googleMapsLink ? (
                                <TouchableOpacity onPress={() => Linking.openURL(post.googleMapsLink)}>
                                    <Text style={localStyles.linkText}>Open in Google Maps</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    )}

                    {/* Rewards */}
                    {post.keyValuePairs.length > 0 && (
                        <View style={localStyles.section}>
                            <Text style={localStyles.sectionTitle}>Rewards & Criteria</Text>
                            <View style={localStyles.chipContainer}>
                                {post.keyValuePairs.map((pair, idx) => renderRewardChip(pair, idx))}
                            </View>
                        </View>
                    )}

                    {/* Items */}
                    {post.itemsToPromote && (
                        <View style={localStyles.section}>
                            <Text style={localStyles.sectionTitle}>Items to Promote</Text>
                            <Text style={localStyles.text}>{post.itemsToPromote}</Text>
                        </View>
                    )}

                    {/* Requirements */}
                    <View style={localStyles.section}>
                        <Text style={localStyles.sectionTitle}>Eligibility</Text>
                        <Text style={localStyles.text}>
                            Min. Followers: {post.minFollowers}{post.minFollowersUnit}
                        </Text>
                    </View>

                    {/* Guidelines */}
                    <View style={localStyles.section}>
                        <Text style={localStyles.sectionTitle}>Guidelines</Text>
                        <Text style={localStyles.text}>{post.guidelines}</Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={[
                        localStyles.actionRow,
                        { flexDirection: 'column', gap: 8 }
                    ]}>
                        <TouchableOpacity
                            style={localStyles.editButton}
                            onPress={handleEditPress}
                            disabled={editLoading}
                        >
                            {editLoading ? (
                                <ActivityIndicator color={COLORS.white} size="small" />
                            ) : (
                                <Text style={localStyles.btnTextWhite}>Edit Campaign</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={localStyles.deleteButton} onPress={() => setPauseVisible(true)}>
                            <Text style={localStyles.btnTextWhite}>
                                {post.status === "active" ? "Pause Campaign" : "Resume Campaign"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Stats Placeholders */}
                    <Text style={localStyles.statsTitle}>Influencers Enrolled</Text>
                    {["John Doe", "Jane Smith", "Alex Kim"].map((name, idx) => (
                        <View key={idx} style={localStyles.userCard}>
                            <Text style={localStyles.userCardText}>{name}</Text>
                        </View>
                    ))}

                    <View style={{ height: 24 }} />

                    <Text style={localStyles.statsTitle}>Influencers Completed</Text>
                    {["Sara Novak", "Mohammed Khan"].map((name, idx) => (
                        <View key={idx} style={localStyles.userCard}>
                            <Text style={localStyles.userCardText}>{name}</Text>
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <View style={[localStyles.contentContainer, { flexDirection: 'row' }]}>
                    {/* --- LEFT COLUMN: DETAILS --- */}
                    <ScrollView
                        style={localStyles.leftColumn}
                        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
                    >
                        {/* Hero Section */}
                        <View style={localStyles.heroSection}>
                            <Image
                                source={{ uri: post.restaurantImage || 'https://via.placeholder.com/320x140?text=No+Image' }}
                                style={localStyles.restaurantImage}
                                resizeMode="cover"
                            />
                            <Text style={localStyles.restaurantName}>{post.restaurantName}</Text>
                            {post.category && <Text style={localStyles.categoryBadge}>{post.category}</Text>}
                            <Text style={localStyles.description}>{post.description}</Text>
                        </View>

                        {/* Location */}
                        {(post.address || post.googleMapsLink) && (
                            <View style={localStyles.section}>
                                <Text style={localStyles.sectionTitle}>Location</Text>
                                <View style={localStyles.row}>
                                    <Ionicons name="location-outline" size={20} color={COLORS.white} style={{ marginRight: 6 }} />
                                    <Text style={localStyles.text}>{post.address}</Text>
                                </View>
                                {post.googleMapsLink ? (
                                    <TouchableOpacity onPress={() => Linking.openURL(post.googleMapsLink)}>
                                        <Text style={localStyles.linkText}>Open in Google Maps</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        )}

                        {/* Rewards */}
                        {post.keyValuePairs.length > 0 && (
                            <View style={localStyles.section}>
                                <Text style={localStyles.sectionTitle}>Rewards & Criteria</Text>
                                <View style={localStyles.chipContainer}>
                                    {post.keyValuePairs.map((pair, idx) => renderRewardChip(pair, idx))}
                                </View>
                            </View>
                        )}

                        {/* Items */}
                        {post.itemsToPromote && (
                            <View style={localStyles.section}>
                                <Text style={localStyles.sectionTitle}>Items to Promote</Text>
                                <Text style={localStyles.text}>{post.itemsToPromote}</Text>
                            </View>
                        )}

                        {/* Requirements */}
                        <View style={localStyles.section}>
                            <Text style={localStyles.sectionTitle}>Eligibility</Text>
                            <Text style={localStyles.text}>
                                Min. Followers: {post.minFollowers}{post.minFollowersUnit}
                            </Text>
                        </View>

                        {/* Guidelines */}
                        <View style={localStyles.section}>
                            <Text style={localStyles.sectionTitle}>Guidelines</Text>
                            <Text style={localStyles.text}>{post.guidelines}</Text>
                        </View>
                    </ScrollView>

                    {/* Vertical Divider (Desktop Only) */}
                    <View style={localStyles.verticalDivider} />

                    {/* --- RIGHT COLUMN: ACTIONS & STATS --- */}
                    <ScrollView
                        style={localStyles.rightColumn}
                        contentContainerStyle={{ padding: 28, paddingBottom: 60 }}
                    >
                        {/* Action Buttons */}
                        <View style={localStyles.actionRow}>
                            <TouchableOpacity
                                style={localStyles.editButton}
                                onPress={handleEditPress}
                                disabled={editLoading}
                            >
                                {editLoading ? (
                                    <ActivityIndicator color={COLORS.white} size="small" />
                                ) : (
                                    <Text style={localStyles.btnTextWhite}>Edit Campaign</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={localStyles.deleteButton} onPress={() => setPauseVisible(true)}>
                                <Text style={localStyles.btnTextWhite}>
                                    {post.status === "active" ? "Pause Campaign" : "Resume Campaign"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={localStyles.dividerLine} />

                        {/* Stats Placeholders */}
                        <Text style={localStyles.statsTitle}>Influencers Enrolled</Text>
                        {["John Doe", "Jane Smith", "Alex Kim"].map((name, idx) => (
                            <View key={idx} style={localStyles.userCard}>
                                <Text style={localStyles.userCardText}>{name}</Text>
                            </View>
                        ))}

                        <View style={{ height: 24 }} />

                        <Text style={localStyles.statsTitle}>Influencers Completed</Text>
                        {["Sara Novak", "Mohammed Khan"].map((name, idx) => (
                            <View key={idx} style={localStyles.userCard}>
                                <Text style={localStyles.userCardText}>{name}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* --- MODAL --- */}
            {editModalVisible && (
                <CreatePostModal
                    isVisible={editModalVisible}
                    onClose={() => {
                        setEditModalVisible(false);
                        setEditFormData(null);
                    }}
                    onSubmit={handleEditSubmit}
                    // IMPORTANT: Pass the correctly shaped data here
                    initialData={editFormData}
                />
            )}

            {/* --- Set ConfirmDialog props dynamically based on status --- */}
            {(() => {
                let dialogHeader = "Pause Campaign";
                let dialogDescription = "Pausing will hide this campaign and stop new enrollments. Existing assignments remain active.";
                let dialogCancelLabel = "Keep Running";
                let dialogProceedLabel: any = "Pause";
                let dialogButtonColor = COLORS.instagram.red;
                let dialogProceed = () => updateCampaignStatus("pause");

                if (post.status === "pause") {
                    dialogHeader = "Resume Campaign";
                    dialogDescription = "Resuming will reactivate the campaign and allow new enrollments.";
                    dialogCancelLabel = "Stay Paused";
                    dialogProceedLabel = "Resume";
                    dialogButtonColor = COLORS.instagram.red;
                    dialogProceed = () => updateCampaignStatus("active");
                } else if (post.status === "stop" || post.status === "stopped") {
                    dialogHeader = "Campaign Stopped";
                    dialogDescription = "This campaign is stopped and cannot be resumed.";
                    dialogCancelLabel = "Close";
                    dialogProceedLabel = undefined;
                    dialogButtonColor = COLORS.instagram.red;
                    dialogProceed = async () => {};
                }

                return (
                    <ConfirmDialog
                        visible={pauseVisible}
                        header={dialogHeader}
                        description={dialogDescription}
                        cancelLabel={dialogCancelLabel}
                        proceedLabel={dialogProceedLabel}
                        proceedButtonColor={dialogButtonColor}
                        loading={isPausing}
                        onCancel={() => !isPausing && setPauseVisible(false)}
                        onProceed={dialogProceed}
                    />
                );
            })()}
        </View>
    );
};

export default RestaurantDetailsScreen;

/* -------------------------------------------------------------------------- */
/* STYLES DEFINITION */
/* -------------------------------------------------------------------------- */

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centerContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surfaceLight,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "600",
        color: COLORS.instagram.red,
    },
    contentContainer: {
        flex: 1,
        minHeight: 0,
    },
    leftColumn: {
        flex: 1.4,
        backgroundColor: COLORS.background,
    },
    rightColumn: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    verticalDivider: {
        width: 1,
        backgroundColor: COLORS.surfaceLight,
    },

    // Left Column Styles
    heroSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    restaurantImage: {
        width: '100%',
        maxWidth: 400,
        height: 250,
        borderRadius: 12,
        backgroundColor: COLORS.surfaceLight,
        marginBottom: 16,
    },
    restaurantName: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.instagram.red,
        textAlign: 'center',
    },
    categoryBadge: {
        backgroundColor: COLORS.surfaceLight,
        color: COLORS.white,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginVertical: 6,
        fontSize: 13,
        overflow: 'hidden',
    },
    description: {
        color: COLORS.grey,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 22,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.instagram.red,
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    text: {
        color: COLORS.white,
        fontSize: 15,
        lineHeight: 22,
    },
    linkText: {
        color: COLORS.instagram.blue,
        fontWeight: '600',
        marginTop: 4,
        fontSize: 15,
        marginLeft: 26, // align with text under icon
    },
    chipContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    rewardChip: {
        backgroundColor: COLORS.tagReq,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 8,
    },
    rewardChipText: {
        color: COLORS.white,
        fontWeight: "600",
        fontSize: 14,
    },

    // Right Column Styles
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    editButton: {
        backgroundColor: COLORS.instagram.red,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        backgroundColor: COLORS.surfaceLight,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnTextWhite: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: 15,
    },
    dividerLine: {
        height: 1,
        backgroundColor: COLORS.surfaceLight,
        marginBottom: 24,
    },
    statsTitle: {
        color: COLORS.primary,
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 12,
    },
    userCard: {
        backgroundColor: COLORS.surfaceLight,
        padding: 14,
        borderRadius: 8,
        marginBottom: 10,
    },
    userCardText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: "500",
    },
});
