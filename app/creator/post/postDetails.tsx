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
    TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { isAuthenticated } from "@/app/utils/auth";
import { marketapi } from "@/utils/api";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { CreatePostModal } from "@/app/(agency)/formModal";

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
    restaurantImage: string;
    googleMapsLink: string;
    address: string;
    guidelines: string;
    lastDate?: string;
    category?: string;
    status?: string;
};

const COLORS = {
    primary: "#4ADE80",
    background: "#000000",
    surface: "#1A1A1A",
    surfaceLight: "#2A2A2A",
    white: "#FFFFFF",
    grey: "#9CA3AF",
    tagReq: "#58398e",
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

    const [post, setPost] = useState<APIRestaurantPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [pauseVisible, setPauseVisible] = useState(false);

    // NEW: State to manage submission
    const [submission, setSubmission] = useState<{link: string}|null>(null);
    const [subStatusLoading, setSubStatusLoading] = useState(true);
    const [showEditForm, setShowEditForm] = useState(false);

    const postId = typeof params.postId === "string" ? params.postId : "";

    /* --------------------------- Handlers --------------------------- */

    const fetchPost = useCallback(async () => {
        if (!postId) {
            setError("Missing post ID");
            setLoading(false);
            return;
        }

        setError(null);
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
            setError(e?.message || "Failed to fetch details");
        } finally {
            setLoading(false);
        }
    }, [postId, post]);

    useEffect(() => {
        fetchPost();
    }, [postId]);

    // Fetch submission status for this user+post
    useEffect(() => {
        let cancelled = false;
        const fetchSubmission = async () => {
            setSubStatusLoading(true);
            try {
                const auth = await isAuthenticated();
                // Example endpoint; adjust as needed!
                const res = await marketapi.get(`post/submission?user_id=${auth.userId}&post_id=${postId}`);
                if (res.success && res.data?.link) {
                    if (!cancelled) setSubmission({ link: res.data.link });
                } else {
                    if (!cancelled) setSubmission(null);
                }
            } catch (e) {
                if (!cancelled) setSubmission(null);
            } finally {
                if (!cancelled) setSubStatusLoading(false);
            }
        };
        if (postId) fetchSubmission();
        return () => { cancelled = true; };
    }, [postId]);

    const handleEditSubmit = async (data: any) => {
        // TODO: Implement edit logic
        setEditModalVisible(false);
    };

    const updateCampaignStatus = async (status: string) => {
        // TODO: Implement API call to update status
        setPauseVisible(false);
    };

    const renderRewardChip = (pair: KeyValuePair, idx: number) => {
        const text = `${pair.platform}: ${pair.metric} ${pair.value}${pair.unit} • ₹${pair.reward}`;
        return (
            <View key={idx} style={localStyles.rewardChip}>
                <Text style={localStyles.rewardChipText}>{text}</Text>
            </View>
        );
    };

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

    const getDialogProps = () => {
        if (post.status === "pause") {
            return {
                header: "Resume Campaign",
                description: "Resuming will reactivate the campaign and allow new enrollments.",
                cancelLabel: "Stay Paused",
                proceedLabel: "Resume",
                onProceed: () => updateCampaignStatus("active")
            };
        }
        return {
            header: "Pause Campaign",
            description: "Pausing will hide this campaign and stop new enrollments.",
            cancelLabel: "Keep Running",
            proceedLabel: "Pause",
            onProceed: () => updateCampaignStatus("pause")
        };
    };

    const dialogProps = getDialogProps();

    const DetailsContent = () => (
        <>
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

            {(post.address || post.googleMapsLink) && (
                <View style={localStyles.section}>
                    <Text style={localStyles.sectionTitle}>Location</Text>
                    <View style={localStyles.row}>
                        <Ionicons name="location-outline" size={20} color={COLORS.white} style={{ marginRight: 6 }} />
                        <Text style={localStyles.text}>{post.address}</Text>
                    </View>
                    {post.googleMapsLink && (
                        <TouchableOpacity onPress={() => Linking.openURL(post.googleMapsLink)}>
                            <Text style={localStyles.linkText}>Open in Google Maps</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {post.keyValuePairs.length > 0 && (
                <View style={localStyles.section}>
                    <Text style={localStyles.sectionTitle}>Rewards & Criteria</Text>
                    <View style={localStyles.chipContainer}>
                        {post.keyValuePairs.map((pair, idx) => renderRewardChip(pair, idx))}
                    </View>
                </View>
            )}

            {post.itemsToPromote && (
                <View style={localStyles.section}>
                    <Text style={localStyles.sectionTitle}>Items to Promote</Text>
                    <Text style={localStyles.text}>{post.itemsToPromote}</Text>
                </View>
            )}

            <View style={localStyles.section}>
                <Text style={localStyles.sectionTitle}>Eligibility</Text>
                <Text style={localStyles.text}>Min. Followers: {post.minFollowers}{post.minFollowersUnit}</Text>
            </View>

            <View style={localStyles.section}>
                <Text style={localStyles.sectionTitle}>Guidelines</Text>
                <Text style={localStyles.text}>{post.guidelines}</Text>
            </View>
        </>
    );

    // Right column: Form for submitting/editiing the marketed post link
    const SubmitLinkForm = ({ initialLink = "", onSubmit, onCancel }: { initialLink?: string, onSubmit: (link:string)=>void, onCancel?:()=>void }) => {
        const [link, setLink] = useState(initialLink);
        const [submitting, setSubmitting] = useState(false);
        const [success, setSuccess] = useState(false);
        const [errorMsg, setErrorMsg] = useState('');

        const handleSubmit = async () => {
            if (!link.trim()) {
                setErrorMsg("Please enter the post link.");
                setSuccess(false);
                return;
            }
            setSubmitting(true);
            setErrorMsg('');
            setSuccess(false);

            // TODO: Actual submission logic (API call)
            // Here simulate and update parent:
            setTimeout(() => {
                setSubmitting(false);
                setSuccess(true);
                setErrorMsg('');
                onSubmit(link);
            }, 800);
        };

        return (
            <View>
                <Text style={localStyles.restaurantName}>{initialLink ? "Edit Your Submitted Link" : "Submit Your Marketed Post Link"}</Text>
                <Text style={localStyles.formLabel}>Post Link</Text>
                <TextInput
                    style={localStyles.textInput}
                    placeholder="Paste link here"
                    placeholderTextColor={COLORS.grey}
                    value={link}
                    onChangeText={setLink}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    editable={!submitting}
                />
                <TouchableOpacity
                    style={[
                        localStyles.submitBtn,
                        (submitting || !link.trim()) && { opacity: 0.6 }
                    ]}
                    onPress={handleSubmit}
                    disabled={submitting || !link.trim()}
                    activeOpacity={0.8}
                >
                    {submitting ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={localStyles.btnTextWhite}>
                            {initialLink ? "Save" : "Submit"}
                        </Text>
                    )}
                </TouchableOpacity>
                {onCancel ? (
                    <TouchableOpacity style={{marginTop:12, alignItems:'center'}} onPress={onCancel}>
                        <Text style={{color:COLORS.grey}}>Cancel</Text>
                    </TouchableOpacity>
                ) : null}
                {errorMsg ? (
                    <Text style={localStyles.errorText}>{errorMsg}</Text>
                ) : null}
                {success ? (
                    <Text style={localStyles.successText}>Post link submitted!</Text>
                ) : null}
            </View>
        );
    };

    // ---------- RIGHT-SIDE FOR SUBMISSION/EDIT VIEW LOGIC -----------
    // Note: subStatusLoading: show spinner, else adapt to state
    const RightSideSubmission = () => {
        if (subStatusLoading) {
            return (
                <View style={{alignItems:"center", justifyContent:"center", flex:1}}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
            );
        }
        // Already submitted, not editing
        if (submission && !showEditForm) {
            return (
                <View style={{flex:1, alignItems:"center", justifyContent:"center", marginTop:40}}>
                    <Ionicons name="checkmark-done-circle" size={48} color={COLORS.primary}/>
                    <Text style={{color:COLORS.primary, fontWeight:'bold', fontSize:20, marginTop:10}}>You already submitted!</Text>
                    <TouchableOpacity style={{marginTop:10, flexDirection:'row', alignItems:'center'}} onPress={()=>setShowEditForm(true)}>
                        <Ionicons name="create-outline" size={21} color={COLORS.white}/>
                        <Text style={{color:COLORS.white, marginLeft:5, textDecorationLine:"underline"}}>Edit submission</Text>
                    </TouchableOpacity>
                    <View style={{marginTop:15, paddingHorizontal:16, paddingVertical:14, borderRadius:8, backgroundColor:COLORS.surfaceLight, width:'100%', maxWidth:370}}>
                        <Text style={{color: COLORS.grey, fontWeight:"500", marginBottom:3}}>Submitted Link:</Text>
                        <Text style={{color: COLORS.white, fontSize:15}} selectable>{submission.link}</Text>
                    </View>
                </View>
            )
        }
        // Editing OR not yet submitted
        return <SubmitLinkForm
            initialLink={submission?.link || ""}
            onSubmit={(link:string)=>{
                setSubmission({link});
                setShowEditForm(false);
            }}
            onCancel={submission?.link ? ()=>setShowEditForm(false) : undefined}
        />
    };

    return (
        <View style={localStyles.container}>
            <View style={localStyles.header}>
                <Text style={localStyles.headerTitle}>Restaurant Details</Text>
            </View>
            {mobileLayout ? (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingBottom: 60 }}>
                    <DetailsContent />
                    <View style={{height:32}} />
                    <RightSideSubmission />
                </ScrollView>
            ) : (
                <View style={[localStyles.contentContainer, { flexDirection: 'row' }]}>
                    <ScrollView style={localStyles.leftColumn} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
                        <DetailsContent />
                    </ScrollView>
                    <View style={localStyles.verticalDivider} />
                    <ScrollView style={localStyles.rightColumn} contentContainerStyle={{ padding: 28, paddingBottom: 60 }}>
                        <RightSideSubmission />
                    </ScrollView>
                </View>
            )}

            {editModalVisible && (
                <CreatePostModal
                    isVisible={editModalVisible}
                    onClose={() => setEditModalVisible(false)}
                    onSubmit={handleEditSubmit}
                    initialData={undefined}
                />
            )}

            <ConfirmDialog
                visible={pauseVisible}
                header={dialogProps.header}
                description={dialogProps.description}
                cancelLabel={dialogProps.cancelLabel}
                proceedLabel={dialogProps.proceedLabel}
                proceedButtonColor={COLORS.instagram.red}
                onCancel={() => setPauseVisible(false)}
                onProceed={dialogProps.onProceed}
            />
        </View>
    );
};

export default RestaurantDetailsScreen;

const localStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centerContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
    header: { paddingVertical: 14, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceLight },
    headerTitle: { fontSize: 24, fontWeight: "600", color: COLORS.instagram.red },
    contentContainer: { flex: 1 },
    leftColumn: { flex: 1.4 },
    rightColumn: { flex: 1 },
    verticalDivider: { width: 1, backgroundColor: COLORS.surfaceLight },
    heroSection: { alignItems: 'center', marginBottom: 24 },
    restaurantImage: { width: '100%', maxWidth: 400, height: 250, borderRadius: 12, backgroundColor: COLORS.surfaceLight, marginBottom: 16 },
    restaurantName: { fontSize: 24, fontWeight: '700', color: COLORS.instagram.red, textAlign: 'center' },
    categoryBadge: { backgroundColor: COLORS.surfaceLight, color: COLORS.white, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginVertical: 6, fontSize: 13, overflow: 'hidden' },
    description: { color: COLORS.grey, fontSize: 16, textAlign: 'center', marginTop: 4, lineHeight: 22 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.instagram.red, marginBottom: 10 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    text: { color: COLORS.white, fontSize: 15, lineHeight: 22 },
    linkText: { color: COLORS.instagram.blue, fontWeight: '600', marginTop: 4, fontSize: 15, marginLeft: 26 },
    chipContainer: { flexDirection: "row", flexWrap: "wrap" },
    rewardChip: { backgroundColor: COLORS.tagReq, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 8 },
    rewardChipText: { color: COLORS.white, fontWeight: "600", fontSize: 14 },
    actionRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    editButton: { backgroundColor: COLORS.instagram.red, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flex: 1 },
    deleteButton: { backgroundColor: COLORS.surfaceLight, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1, borderColor: '#444', alignItems: 'center', justifyContent: 'center' },
    btnTextWhite: { color: COLORS.background, fontWeight: "600", fontSize: 14 },
    dividerLine: { height: 1, backgroundColor: COLORS.surfaceLight, marginBottom: 24 },
    statsTitle: { color: COLORS.primary, fontSize: 18, fontWeight: "700", marginBottom: 12 },
    userCard: { backgroundColor: COLORS.surfaceLight, padding: 14, borderRadius: 8, marginBottom: 10 },
    userCardText: { color: COLORS.white, fontSize: 15, fontWeight: "500" },
    formContainer: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 24, alignItems: 'stretch', marginTop: 36 },
    formTitle: { color: COLORS.primary, fontWeight: '700', fontSize: 18, marginBottom: 16, textAlign: 'center' },
    formLabel: { color: COLORS.instagram.red, fontWeight: '600', fontSize: 15, marginBottom: 8,marginTop:10 },
    inputWrapper: { backgroundColor: COLORS.surfaceLight, borderRadius: 6, padding: 10, marginBottom: 10, minHeight: 28 },
    linkInput: { color: COLORS.white, fontSize: 14 },
    inputFieldRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
    textInput: { flex: 1, backgroundColor: COLORS.surfaceLight, color: COLORS.white, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, borderWidth: 1, borderColor: COLORS.white },
    submitBtn: { marginLeft: 8, backgroundColor: COLORS.white, borderRadius: 7, padding: 10, alignItems: 'center', justifyContent: 'center',marginTop:30 },
    errorText: { color: COLORS.error, fontSize: 13, marginTop: 8, textAlign: 'center' },
    successText: { color: COLORS.primary, fontSize: 13, marginTop: 8, textAlign: 'center' },
});
