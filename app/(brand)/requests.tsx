import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator, ScrollView,
    TouchableOpacity, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { localapi } from '../../utils/api';
import { isAuthenticated } from '../utils/auth';

const COLORS = {
    primary: '#4ADE80',
    background: '#0A0A0A',
    surface: '#141414',
    surfaceLight: '#1E1E1E',
    border: '#2A2A2A',
    white: '#FFFFFF',
    grey: '#6B7280',
    greyLight: '#9CA3AF',
    error: '#EF4444',
    pending: '#F59E0B',
    accepted: '#4ADE80',
    rejected: '#EF4444',
};

type Submission = {
    _id: string;
    post_id: string;
    influencer_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    updated_at: string;
    post_title?: string;
    influencer_name?: string;
    instagram_link?: string;
    instagram_followers?: number;
    youtube_link?: string;
    youtube_followers?: number;
    twitter_link?: string;
    twitter_followers?: number;
    linkedin_link?: string;
    linkedin_followers?: number;
    tiktok_link?: string;
    tiktok_followers?: number;
};

// Helper for formatting large numbers
const formatFollowers = (num: number | undefined): string => {
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

type TabKey = 'pending' | 'accepted' | 'rejected' | 'all';

const TABS: { key: TabKey; label: string; icon: string; color: string }[] = [
    { key: 'pending', label: 'Pending', icon: 'time-outline', color: COLORS.pending },
    { key: 'accepted', label: 'Approved', icon: 'checkmark-circle-outline', color: COLORS.accepted },
    { key: 'rejected', label: 'Rejected', icon: 'close-circle-outline', color: COLORS.rejected },
    { key: 'all', label: 'All', icon: 'list-outline', color: COLORS.greyLight },
];

export default function BrandRequestsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabKey>('pending');
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    const fetchSubmissions = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        setError(null);
        try {
            const auth = await isAuthenticated();
            if (!auth?.userId) throw new Error('Unauthorized');
            const statusParam = activeTab !== 'all' ? `?status=${activeTab}` : '';
            const res = await localapi.get(`brands/${auth.userId}/all-submissions${statusParam}`);
            if (!res.success) throw new Error(res.message || 'Failed to load');
            setSubmissions(res.data?.data || []);
        } catch (e: any) {
            setError(e.message || 'Could not load requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab]);

    useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(() => {
            if (Platform.OS === 'web' && typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
            fetchSubmissions(true);
        }, 15000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [fetchSubmissions]);

    const handleAction = async (sub: Submission, action: 'accept' | 'reject') => {
        setActionLoading(sub._id + action);
        try {
            const auth = await isAuthenticated();
            if (!auth?.userId) throw new Error('Unauthorized');
            const res = await localapi.patch(`${sub.post_id}/submissions/${sub.influencer_id}/${action}`, {});
            if (res.success) {
                const newStatus = (action === 'accept' ? 'accepted' : 'rejected') as Submission['status'];
                setSubmissions(prev =>
                    prev.map(s => s._id === sub._id ? { ...s, status: newStatus } : s)
                        .filter(s => activeTab === 'all' || s.status === activeTab)
                );
            } else {
                setError(res.message || 'Action failed');
            }
        } catch (e: any) {
            setError(e.message || 'Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    const activeTabConfig = TABS.find(t => t.key === activeTab)!;

    return (
        <View style={styles.root}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="chevron-back" size={22} color={COLORS.white} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Influencer Requests</Text>
                    <Text style={styles.headerSub}>Review & manage applications</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
                {TABS.map(tab => {
                    const isActive = activeTab === tab.key;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, isActive && { borderBottomColor: tab.color, borderBottomWidth: 2 }]}
                            onPress={() => setActiveTab(tab.key)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={tab.icon as any}
                                size={16}
                                color={isActive ? tab.color : COLORS.grey}
                                style={{ marginBottom: 2 }}
                            />
                            <Text style={[styles.tabText, isActive && { color: tab.color }]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Error banner */}
            {error && (
                <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={() => setError(null)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <Ionicons name="close" size={16} color={COLORS.greyLight} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Content */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading requests…</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.list}
                    contentContainerStyle={submissions.length === 0 ? styles.emptyContainer : styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchSubmissions(true); }}
                            tintColor={COLORS.primary}
                        />
                    }
                >
                    {submissions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="people-outline" size={36} color={activeTabConfig.color} />
                            </View>
                            <Text style={styles.emptyTitle}>No {activeTab !== 'all' ? activeTab : ''} requests</Text>
                            <Text style={styles.emptySubtitle}>
                                {activeTab === 'pending'
                                    ? 'New applications from influencers will appear here.'
                                    : `You have no ${activeTab} applications yet.`}
                            </Text>
                        </View>
                    ) : (
                        // ── max-width wrapper ──
                        <View style={styles.cardList}>
                            {submissions.map(sub => {
                                const statusConfig = TABS.find(t => t.key === sub.status) || TABS[0];
                                const isActioning = actionLoading?.startsWith(sub._id);
                                return (
                                    <View key={sub._id} style={styles.card}>
                                        {/* Post label */}
                                        <View style={styles.cardPostRow}>
                                            <View style={styles.postDot} />
                                            <Text style={styles.postTitle} numberOfLines={1}>
                                                {sub.post_title || 'Unknown Post'}
                                            </Text>
                                        </View>

                                        <View style={styles.divider} />

                                        {/* Influencer info */}
                                        <View style={styles.influencerRow}>
                                            <View style={styles.avatar}>
                                                <Ionicons name="person" size={18} color={COLORS.grey} />
                                            </View>
                                            <View style={{ flex: 1, gap: 6 }}>
                                                <Text style={styles.influencerName}>{sub.influencer_name || 'Unknown'}</Text>

                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                    {sub.instagram_link ? (
                                                        <View style={styles.socialPill}>
                                                            <Ionicons name="logo-instagram" size={14} color="#E1306C" />
                                                            <Text style={styles.socialPillText}>{formatFollowers(sub.instagram_followers)}</Text>
                                                        </View>
                                                    ) : null}
                                                    {sub.youtube_link ? (
                                                        <View style={styles.socialPill}>
                                                            <Ionicons name="logo-youtube" size={14} color="#FF0000" />
                                                            <Text style={styles.socialPillText}>{formatFollowers(sub.youtube_followers)}</Text>
                                                        </View>
                                                    ) : null}
                                                    {sub.twitter_link ? (
                                                        <View style={styles.socialPill}>
                                                            <Ionicons name="logo-twitter" size={14} color="#1DA1F2" />
                                                            <Text style={styles.socialPillText}>{formatFollowers(sub.twitter_followers)}</Text>
                                                        </View>
                                                    ) : null}
                                                    {sub.linkedin_link ? (
                                                        <View style={styles.socialPill}>
                                                            <Ionicons name="logo-linkedin" size={14} color="#0A66C2" />
                                                            <Text style={styles.socialPillText}>{formatFollowers(sub.linkedin_followers)}</Text>
                                                        </View>
                                                    ) : null}
                                                    {sub.tiktok_link ? (
                                                        <View style={styles.socialPill}>
                                                            <Ionicons name="logo-tiktok" size={14} color="#FE2C55" />
                                                            <Text style={styles.socialPillText}>{formatFollowers(sub.tiktok_followers)}</Text>
                                                        </View>
                                                    ) : null}

                                                    {!sub.instagram_link && !sub.youtube_link && !sub.twitter_link && !sub.linkedin_link && !sub.tiktok_link && (
                                                        <Text style={[styles.igHandle, { color: COLORS.grey, marginTop: 0 }]}>No Social Links</Text>
                                                    )}
                                                </View>
                                            </View>
                                            <View style={[styles.statusBadge, { borderColor: statusConfig.color + '55', backgroundColor: statusConfig.color + '18' }]}>
                                                <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} style={{ marginRight: 4 }} />
                                                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={styles.dateText}>
                                            Applied {new Date(sub.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </Text>

                                        {/* Actions — only for pending */}
                                        {sub.status === 'pending' && (
                                            <View style={styles.actionRow}>
                                                <TouchableOpacity
                                                    style={[styles.actionBtn, styles.rejectBtn, isActioning && { opacity: 0.5 }]}
                                                    disabled={!!isActioning}
                                                    onPress={() => handleAction(sub, 'reject')}
                                                >
                                                    {actionLoading === sub._id + 'reject'
                                                        ? <ActivityIndicator size="small" color={COLORS.error} />
                                                        : <Text style={[styles.actionText, { color: COLORS.error }]}>Reject</Text>}
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.actionBtn, styles.acceptBtn, isActioning && { opacity: 0.5 }]}
                                                    disabled={!!isActioning}
                                                    onPress={() => handleAction(sub, 'accept')}
                                                >
                                                    {actionLoading === sub._id + 'accept'
                                                        ? <ActivityIndicator size="small" color={COLORS.background} />
                                                        : <Text style={styles.actionText}>Accept</Text>}
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },

    header: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 18, paddingTop: Platform.OS === 'ios' ? 60 : 20, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: COLORS.surfaceLight,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
    headerSub: { fontSize: 12, color: COLORS.grey, marginTop: 1 },

    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    tab: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent',
    },
    tabText: { fontSize: 12, fontWeight: '600', color: COLORS.grey },

    errorBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: COLORS.error + '15', margin: 12, padding: 12,
        borderRadius: 10, borderLeftWidth: 3, borderLeftColor: COLORS.error,
    },
    errorText: { color: COLORS.greyLight, flex: 1, fontSize: 13 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { color: COLORS.grey, fontSize: 14 },

    list: { flex: 1 },
    listContent: { padding: 16, paddingBottom: 48 },

    // ── centred max-width wrapper ──
    cardList: {
        maxWidth: 680,
        width: '100%',
        alignSelf: 'center',
    },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    emptyState: { alignItems: 'center', gap: 10, maxWidth: 280 },
    emptyIcon: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: COLORS.surfaceLight,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 4,
    },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.white, textAlign: 'center' },
    emptySubtitle: { fontSize: 13, color: COLORS.grey, textAlign: 'center', lineHeight: 20 },

    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 14, padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: COLORS.border,
    },
    cardPostRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    postDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
    postTitle: { color: COLORS.greyLight, fontSize: 13, fontWeight: '600', flex: 1 },
    divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 12 },

    influencerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    avatar: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: COLORS.surfaceLight,
        alignItems: 'center', justifyContent: 'center',
    },
    influencerName: { fontSize: 15, fontWeight: '700', color: COLORS.white },
    igHandle: { fontSize: 12, color: COLORS.grey, marginTop: 1 },
    socialPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    socialPillText: {
        fontSize: 12,
        color: COLORS.white,
        fontWeight: '600',
    },

    statusBadge: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 20, borderWidth: 1,
    },
    statusText: { fontSize: 12, fontWeight: '600' },

    dateText: { fontSize: 12, color: COLORS.grey, marginBottom: 12 },

    actionRow: { flexDirection: 'row', gap: 10 },
    actionBtn: {
        flex: 1, height: 40, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    rejectBtn: { backgroundColor: COLORS.error + '15', borderWidth: 1, borderColor: COLORS.error + '40' },
    acceptBtn: { backgroundColor: COLORS.primary },
    actionText: { fontSize: 14, fontWeight: '700', color: COLORS.background },
});
