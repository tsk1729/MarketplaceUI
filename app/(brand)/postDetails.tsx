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
    ActivityIndicator,
    Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { isAuthenticated } from "@/app/utils/auth";
import { localapi } from "../../utils/api";
// Adjust this import path based on your file structure
import { CreatePostModal } from "./formModal";
import ConfirmDialog from "../components/ConfirmDialog";
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

type APIRestaurantPost = {
    postId: string;
    brandSubject?: string;
    restaurantName?: string;
    description: string;
    itemsToPromote: string;
    minFollowers: string;
    minFollowersUnit: string;
    keyValuePairs: KeyValuePair[];
    postImage?: string; // URL from backend
    restaurantImage?: string; // Legacy URL from backend
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
    border: "#2A2A2A",
    white: "#FFFFFF",
    grey: "#9CA3AF",
    greyLight: "#D1D5DB",
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
    const router = useRouter();

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

    // State for Delete dialog
    const [deleteVisible, setDeleteVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Lists
    const [enrolledUsers, setEnrolledUsers] = useState<any[]>([]);
    const [completedUsers, setCompletedUsers] = useState<string[]>([]);

    // Payment Modal State
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [selectedUserForPayment, setSelectedUserForPayment] = useState<string | null>(null);

    // Hardcoded wallet balance for MVP
    const walletBalance = 5000;
    const paymentAmount = 500;

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

            const res = await localapi.get(`post?user_id=${auth.userId}&post_id=${postId}`);

            if (!res.success || !res.data?.data || Object.keys(res.data.data).length === 0) {
                setError("Post not found");
                setPost(null);
            } else {
                const data = res.data.data;

                // Map API response to our Type
                const mappedPost: APIRestaurantPost = {
                    postId: data._id,
                    brandSubject: data.brandSubject ?? data.restaurantName ?? "",
                    description: data.description ?? "",
                    itemsToPromote: data.itemsToPromote ?? "",
                    minFollowers: data.minFollowers ?? "",
                    minFollowersUnit: data.minFollowersUnit ?? "K",
                    keyValuePairs: data.keyValuePairs ?? [],
                    postImage: data.postImage || data.restaurantImage || "",
                    googleMapsLink: data.googleMapsLink ?? "",
                    address: data.address ?? "",
                    guidelines: data.guidelines ?? "",
                    lastDate: data.lastDate,
                    category: data.category,
                    status: data.status ?? "paused"
                };
                setPost(mappedPost);
            }

            // Fetch enrolled users
            const enrolledRes = await localapi.get(`${postId}/subscribers`);
            if (enrolledRes.success && enrolledRes.data?.data) {
                setEnrolledUsers(enrolledRes.data.data);
            }

            // Fetch completed users (Using the same API as per instructions)
            const completedRes = await localapi.get(`${postId}/settled-submissions`);
            if (completedRes.success && completedRes.data?.data) {
                setCompletedUsers(completedRes.data.data);
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
                brandSubject: post.brandSubject || post.restaurantName,
                description: post.description,
                itemsToPromote: post.itemsToPromote,
                minFollowers: post.minFollowers,
                minFollowersUnit: post.minFollowersUnit,
                keyValuePairs: post.keyValuePairs,
                googleMapsLink: post.googleMapsLink,
                address: post.address,
                guidelines: post.guidelines,
                // Vital for the Modal to know we are in edit mode:
                existingImageUrl: post.postImage || post.restaurantImage,
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
            const res = await localapi.post(endpoint, {});
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

    const handleDeletePost = async () => {
        if (!postId) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            const auth = await isAuthenticated();
            if (!auth?.userId) throw new Error("Unauthorized");

            // DELETE http://127.0.0.1:8000/posts/{postId}/{userId}
            // Using localapi helper
            const endpoint = `posts/${encodeURIComponent(auth.userId)}/${encodeURIComponent(postId)}`;

            // localapi.del automatically adds base URL and handles JSON body
            const res = await localapi.del(endpoint, {});

            if (!res.success) throw new Error(res.message || "Failed to delete campaign");

            setDeleteVisible(false);

            router.back();
        } catch (e: any) {
            console.error("Failed to delete campaign", e);
            setDeleteVisible(false); // Close dialog to show banner on screen
            setDeleteError("Something went wrong.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAccept = async (influencerId: string) => {
        try {
            const endpoint = `${postId}/submissions/${influencerId}/accept`;
            const res = await localapi.patch(endpoint, {});
            if (!res.success) throw new Error(res.message || "Failed to accept");
            fetchPost(); // refresh list
        } catch (e: any) {
            console.error("Accept failed", e);
            alert(e?.message || "Accept failed");
        }
    };

    const handleReject = async (influencerId: string) => {
        try {
            const endpoint = `${postId}/submissions/${influencerId}/reject`;
            const res = await localapi.patch(endpoint, {});
            if (!res.success) throw new Error(res.message || "Failed to reject");
            fetchPost(); // refresh list
        } catch (e: any) {
            console.error("Reject failed", e);
            alert(e?.message || "Reject failed");
        }
    };

    const handleReviewComplete = async (influencerId: string) => {
        try {
            const endpoint = `${postId}/submissions/${influencerId}/review-complete`;
            const res = await localapi.patch(endpoint, {});
            if (!res.success) throw new Error(res.message || "Failed to mark review complete");
            fetchPost(); // refresh list
        } catch (e: any) {
            console.error("Review complete failed", e);
            alert(e?.message || "Review complete failed");
        }
    };

    const handleUndoReviewComplete = async (influencerId: string) => {
        try {
            const endpoint = `${postId}/submissions/${influencerId}/undo-review-complete`;
            const res = await localapi.patch(endpoint, {});
            if (!res.success) throw new Error(res.message || "Failed to undo review complete");
            fetchPost(); // refresh list
        } catch (e: any) {
            console.error("Undo review complete failed", e);
            alert(e?.message || "Undo review complete failed");
        }
    };

    const handleCreditMoney = async (influencerId: string) => {
        try {
            const endpoint = `${postId}/submissions/${influencerId}/credit-money`;
            const res = await localapi.patch(endpoint, {});
            if (!res.success) throw new Error(res.message || "Failed to credit money");
            fetchPost(); // refresh list
        } catch (e: any) {
            console.error("Credit money failed", e);
            alert(e?.message || "Credit money failed");
        }
    };

    const confirmPayment = async () => {
        if (!selectedUserForPayment) return;
        await handleCreditMoney(selectedUserForPayment);
        setPaymentModalVisible(false);
        setSelectedUserForPayment(null);
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

    // NEW: Logic to enable/disable delete button
    const canDelete = enrolledUsers.length === 0 && completedUsers.length === 0;

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
                            source={{ uri: post.postImage || post.restaurantImage || 'https://via.placeholder.com/320x140?text=No+Image' }}
                            style={localStyles.restaurantImage}
                            resizeMode="cover"
                        />
                        <Text style={localStyles.restaurantName}>{post.brandSubject || post.restaurantName}</Text>
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

                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                                style={[localStyles.deleteButton, { flex: 1, backgroundColor: COLORS.surfaceLight }]}
                                onPress={() => setPauseVisible(true)}
                            >
                                <Text style={localStyles.btnTextWhite}>
                                    {post.status === "active" ? "Pause Campaign" : "Resume Campaign"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    localStyles.deleteButton,
                                    {
                                        flex: 1,
                                        backgroundColor: canDelete ? COLORS.error : COLORS.surfaceLight,
                                        borderColor: canDelete ? COLORS.error : '#444',
                                        opacity: canDelete ? 1 : 0.5
                                    }
                                ]}
                                onPress={() => canDelete && setDeleteVisible(true)}
                                disabled={!canDelete}
                            >
                                <Text style={[localStyles.btnTextWhite, !canDelete && { color: COLORS.grey }]}>
                                    Delete Campaign
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Stats Placeholders */}
                    <Text style={localStyles.statsTitle}>Influencers Enrolled</Text>
                    {enrolledUsers.map((user, idx) => (
                        <View key={idx} style={localStyles.userCard}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <Text style={localStyles.userCardText}>{user.name}</Text>
                                <View style={[localStyles.statusBadge, {
                                    backgroundColor: user.submission_status === 'accepted' ? COLORS.primary
                                        : user.submission_status === 'rejected' ? COLORS.error
                                            : COLORS.secondary
                                }]}>
                                    <Text style={localStyles.statusText}>{user.submission_status?.toUpperCase() || 'PENDING'}</Text>
                                </View>
                            </View>
                            {user.submission_status === 'pending' && (
                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                    <TouchableOpacity style={[localStyles.editButton, { flex: 1, paddingVertical: 6, backgroundColor: COLORS.primary }]} onPress={() => handleAccept(user.influencer_id)}>
                                        <Text style={localStyles.btnTextWhite}>Accept</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[localStyles.deleteButton, { flex: 1, paddingVertical: 6, borderColor: COLORS.error }]} onPress={() => handleReject(user.influencer_id)}>
                                        <Text style={[localStyles.btnTextWhite, { color: COLORS.error }]}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))}

                    <View style={{ height: 24 }} />

                    <Text style={localStyles.statsTitle}>Influencers Completed</Text>
                    {completedUsers.map((name, idx) => (
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
                                source={{ uri: post.postImage || post.restaurantImage || 'https://via.placeholder.com/320x140?text=No+Image' }}
                                style={localStyles.restaurantImage}
                                resizeMode="cover"
                            />
                            <Text style={localStyles.restaurantName}>{post.brandSubject || post.restaurantName}</Text>
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
                        <View style={[localStyles.actionRow, { flexDirection: 'column', gap: 12 }]}>
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

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity
                                    style={[localStyles.deleteButton, { flex: 1 }]}
                                    onPress={() => setPauseVisible(true)}
                                >
                                    <Text style={localStyles.btnTextWhite}>
                                        {post.status === "active" ? "Pause Campaign" : "Resume Campaign"}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        localStyles.deleteButton,
                                        {
                                            flex: 1,
                                            backgroundColor: canDelete ? COLORS.instagram.red : COLORS.surfaceLight,
                                            borderColor: canDelete ? COLORS.error : '#444',
                                            opacity: canDelete ? 1 : 0.5
                                        }
                                    ]}
                                    onPress={() => canDelete && setDeleteVisible(true)}
                                    disabled={!canDelete}
                                >
                                    <Text style={[localStyles.btnTextWhite, !canDelete && { color: COLORS.grey }]}>
                                        Delete Campaign
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={localStyles.dividerLine} />

                        {/* Stats Placeholders */}
                        <Text style={localStyles.statsTitle}>Influencers Enrolled</Text>
                        {enrolledUsers.map((user, idx) => (
                            <View key={idx} style={localStyles.userCard}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <Text style={localStyles.userCardText}>{user.name}</Text>
                                    <View style={[localStyles.statusBadge, {
                                        backgroundColor: user.submission_status === 'accepted' ? COLORS.primary
                                            : user.submission_status === 'rejected' ? COLORS.error
                                                : COLORS.secondary
                                    }]}>
                                        <Text style={localStyles.statusText}>
                                            {user.submission_status ? user.submission_status.replace('_', ' ').toUpperCase() : 'REQUESTED'}
                                        </Text>
                                    </View>
                                </View>
                                {user.submission_status === 'requested' && (
                                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                        <TouchableOpacity style={[localStyles.editButton, { flex: 1, paddingVertical: 6, backgroundColor: COLORS.primary }]} onPress={() => handleAccept(user.influencer_id)}>
                                            <Text style={localStyles.btnTextWhite}>Accept</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[localStyles.deleteButton, { flex: 1, paddingVertical: 6, borderColor: COLORS.error }]} onPress={() => handleReject(user.influencer_id)}>
                                            <Text style={[localStyles.btnTextWhite, { color: COLORS.error }]}>Reject</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {user.link && user.submission_status === 'proof_submitted' && (
                                    <View style={{ marginTop: 12, padding: 12, backgroundColor: COLORS.background, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border }}>
                                        <Text style={{ fontSize: 11, color: COLORS.grey, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Proof Link</Text>
                                        <TouchableOpacity onPress={() => Linking.openURL(user.link!)}>
                                            <Text style={{ fontSize: 13, color: COLORS.primary, textDecorationLine: 'underline' }} selectable>{user.link}</Text>
                                        </TouchableOpacity>
                                        {user.description && (
                                            <View style={{ marginTop: 8 }}>
                                                <Text style={{ fontSize: 11, color: COLORS.grey, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Notes</Text>
                                                <Text style={{ fontSize: 14, color: COLORS.greyLight, lineHeight: 20 }}>{user.description}</Text>
                                            </View>
                                        )}
                                        <TouchableOpacity style={[localStyles.editButton, { marginTop: 12, paddingVertical: 6, backgroundColor: COLORS.primary }]} onPress={() => handleReviewComplete(user.influencer_id)}>
                                            <Text style={localStyles.btnTextWhite}>Complete Review</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {user.submission_status === 'review_completed' && (
                                    <View style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}>
                                        <TouchableOpacity style={[localStyles.deleteButton, { flex: 1, paddingVertical: 6, borderColor: COLORS.error }]} onPress={() => handleUndoReviewComplete(user.influencer_id)}>
                                            <Text style={[localStyles.btnTextWhite, { color: COLORS.error }]}>Undo Review</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[localStyles.editButton, { flex: 1, paddingVertical: 6, backgroundColor: COLORS.primary }]} onPress={() => {
                                            setSelectedUserForPayment(user.influencer_id);
                                            setPaymentModalVisible(true);
                                        }}>
                                            <Text style={localStyles.btnTextWhite}>Pay Amount</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ))}

                        <View style={{ height: 24 }} />

                        <Text style={localStyles.statsTitle}>Influencers Completed</Text>
                        {completedUsers.map((name, idx) => (
                            <View key={idx} style={localStyles.userCard}>
                                <Text style={localStyles.userCardText}>{name}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Confirm Payment Modal */}
            <Modal visible={paymentModalVisible} transparent animationType="fade">
                <View style={localStyles.modalOverlay}>
                    <View style={localStyles.modalContent}>
                        <View style={localStyles.modalHeader}>
                            <Text style={localStyles.modalTitle}>Confirm Payment</Text>
                            <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.grey} />
                            </TouchableOpacity>
                        </View>

                        <View style={localStyles.modalBody}>
                            <Text style={localStyles.modalText}>You are about to credit money to the influencer.</Text>

                            <View style={localStyles.balanceCard}>
                                <View style={localStyles.balanceRow}>
                                    <Text style={localStyles.balanceLabel}>Wallet Balance</Text>
                                    <Text style={localStyles.balanceAmount}>₹{walletBalance}</Text>
                                </View>
                                <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 12 }} />
                                <View style={localStyles.balanceRow}>
                                    <Text style={localStyles.balanceLabel}>Amount to Pay</Text>
                                    <Text style={[localStyles.balanceAmount, { color: COLORS.error }]}>-₹{paymentAmount}</Text>
                                </View>
                                <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 12 }} />
                                <View style={localStyles.balanceRow}>
                                    <Text style={[localStyles.balanceLabel, { color: COLORS.white, fontWeight: '600' }]}>Remaining Balance</Text>
                                    <Text style={[localStyles.balanceAmount, { color: COLORS.primary }]}>₹{walletBalance - paymentAmount}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={localStyles.modalFooter}>
                            <TouchableOpacity style={localStyles.modalCancelBtn} onPress={() => setPaymentModalVisible(false)}>
                                <Text style={localStyles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={localStyles.modalConfirmBtn} onPress={confirmPayment}>
                                <Text style={localStyles.modalConfirmText}>Confirm & Pay</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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

            {/* Error Banner Overlay (absolute or top of screen) */}
            {deleteError && (
                <View style={{ position: 'absolute', top: 40, left: 0, right: 0, zIndex: 999 }}>
                    <ErrorBanner
                        error={deleteError}
                        onDismiss={() => setDeleteError(null)}
                    />
                </View>
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
                    dialogProceed = async () => { };
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

            {/* --- Delete Confirmation Dialog --- */}
            <ConfirmDialog
                visible={deleteVisible}
                header="Delete Campaign"
                description="Are you sure you want to delete this campaign? This action cannot be undone."
                cancelLabel="Cancel"
                proceedLabel="Delete"
                proceedButtonColor={COLORS.error}
                loading={isDeleting}
                onCancel={() => {
                    if (isDeleting) return;
                    setDeleteVisible(false);
                    // We don't clear error here on cancel so user can still see it if they cancelling after error?
                    // Actually, if they cancel, they probably want to dismiss everything.
                    // But error is now global.
                }}
                onProceed={handleDeletePost}
            />
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
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: "bold",
    },

    // Payment Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', maxWidth: 400, backgroundColor: COLORS.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
    modalBody: { padding: 20 },
    modalText: { color: COLORS.greyLight, fontSize: 14, marginBottom: 20 },
    balanceCard: { backgroundColor: COLORS.surfaceLight, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    balanceLabel: { color: COLORS.grey, fontSize: 14 },
    balanceAmount: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
    modalFooter: { flexDirection: 'row', padding: 20, paddingTop: 0, gap: 12 },
    modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border },
    modalCancelText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
    modalConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: COLORS.primary },
    modalConfirmText: { color: COLORS.background, fontSize: 14, fontWeight: '700' },
});
