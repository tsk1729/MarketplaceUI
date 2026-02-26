import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// Using the same theme constants found in other creator files
const COLORS = {
    primary: "#4ADE80",
    background: "#000000",
    surfaceLight: "#2A2A2A",
    white: "#FFFFFF",
    grey: "#9CA3AF",
    error: "#ff5974",
    pending: "#FBBF24"
};

import { localapi } from "@/utils/api";
import { isAuthenticated } from "../utils/auth";
import ErrorBanner from "../components/ErrorBanner";

type Submission = {
    _id: string;
    post_id: string;
    influencer_id: string;
    status?: 'pending' | 'accepted' | 'rejected';
    updated_at: string;
    post_title?: string;
    post_image?: string;
};

export default function MySubmissionsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'all' | 'accepted' | 'pending' | 'rejected'>('all');

    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Polling refs
    const lastPolledRef = useRef<string>(new Date().toISOString());
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isVisibleRef = useRef<boolean>(true);

    const fetchSubmissions = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        setError(null);

        try {
            const auth = await isAuthenticated();
            if (!auth?.userId) throw new Error("Unauthorized");

            let url = `influencers/${auth.userId}/my-submissions`;
            if (activeTab !== 'all') {
                url += `?status=${activeTab}`;
            }

            const res = await localapi.get(url);

            if (!res.success) {
                throw new Error(res.message || "Failed to fetch submissions");
            }

            setSubmissions(res.data?.data || []);
            // Update last polled time
            lastPolledRef.current = new Date().toISOString();
        } catch (err: any) {
            console.error("Error fetching submissions:", err);
            setError(err.message || "Could not load submissions.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab]);

    // Initial fetch & tab change fetch
    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    // Setup Polling (only poll for 'all' or 'pending' to quickly see acceptances)
    useEffect(() => {
        const setupPolling = async () => {
            const auth = await isAuthenticated();
            if (!auth?.userId) return;

            // Clear existing interval
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

            // Poll every 15 seconds
            pollIntervalRef.current = setInterval(async () => {
                // Skip polling if tab is not visible (Web)
                if (Platform.OS === 'web' && typeof document !== 'undefined') {
                    if (document.visibilityState !== 'visible') return;
                }

                try {
                    const since = lastPolledRef.current;
                    const res = await localapi.get(`influencers/${auth.userId}/my-submissions/poll?since=${encodeURIComponent(since)}`);

                    if (res.success && res.data?.data && res.data.data.length > 0) {
                        const updatedSubmissions = res.data.data;

                        setSubmissions(prev => {
                            let newSubmissions = [...prev];
                            let changed = false;

                            updatedSubmissions.forEach((updatedDoc: Submission) => {
                                const idx = newSubmissions.findIndex(s => s._id === updatedDoc._id);
                                if (idx > -1) {
                                    // Make sure it still matches the current tab filter before keeping it
                                    if (activeTab === 'all' || activeTab === updatedDoc.status) {
                                        newSubmissions[idx] = updatedDoc;
                                    } else {
                                        // It no longer matches the current tab filter, remove it
                                        newSubmissions.splice(idx, 1);
                                    }
                                    changed = true;
                                } else if (activeTab === 'all' || activeTab === updatedDoc.status) {
                                    // It's a new matching document
                                    newSubmissions.unshift(updatedDoc);
                                    changed = true;
                                }
                            });

                            return changed ? newSubmissions : prev;
                        });

                        // Update poll time since we found new data
                        lastPolledRef.current = new Date().toISOString();
                    } else if (res.success) {
                        // Just update time so we don't fetch old history next time
                        lastPolledRef.current = new Date().toISOString();
                    }
                } catch (err) {
                    console.warn("Polling error:", err);
                }
            }, 15000); // 15 seconds
        };

        setupPolling();

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [activeTab]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSubmissions(true);
    }, [fetchSubmissions]);

    const renderTabs = () => {
        const tabs: Array<{ key: typeof activeTab; label: string }> = [
            { key: 'all', label: 'All' },
            { key: 'accepted', label: 'Approved' },
            { key: 'pending', label: 'Pending' },
            { key: 'rejected', label: 'Rejected' },
        ];

        return (
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'accepted': return COLORS.primary;
            case 'rejected': return COLORS.error;
            default: return COLORS.pending;
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Applications</Text>
            </View>

            {renderTabs()}

            {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView
                    style={styles.listContainer}
                    contentContainerStyle={submissions.length === 0 ? styles.emptyScroll : { paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                >
                    {submissions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={64} color={COLORS.surfaceLight} />
                            <Text style={styles.emptyText}>No applications found.</Text>
                        </View>
                    ) : (
                        submissions.map((sub) => (
                            <View key={sub._id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.brandName} numberOfLines={1}>
                                        {sub.post_title || "Unknown Brand"}
                                    </Text>
                                    <View style={[styles.badge, { backgroundColor: getStatusColor(sub.status) }]}>
                                        <Text style={styles.badgeText}>{(sub.status || 'pending').toUpperCase()}</Text>
                                    </View>
                                </View>

                                <Text style={styles.dateText}>
                                    Last Updated: {new Date(sub.updated_at).toLocaleDateString()}
                                </Text>

                                {sub.status === 'accepted' && (
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => router.push({ pathname: "/influencer/post/postDetails", params: { postId: sub.post_id } })}
                                    >
                                        <Text style={styles.actionButtonText}>Submit Deliverables</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 16,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surfaceLight,
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    tabsContainer: {
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surfaceLight,
    },
    tabsScroll: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.surfaceLight,
        marginRight: 8,
    },
    activeTab: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        color: COLORS.grey,
        fontWeight: '600',
    },
    activeTabText: {
        color: COLORS.background,
    },
    listContainer: {
        flex: 1,
        padding: 16,
        width: '100%',
        maxWidth: Platform.OS === 'web' ? 800 : '100%',
        alignSelf: 'center',
    },
    emptyScroll: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: COLORS.grey,
        marginTop: 16,
        fontSize: 16,
    },
    card: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    brandName: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        color: COLORS.background,
        fontSize: 10,
        fontWeight: 'bold',
    },
    dateText: {
        color: COLORS.grey,
        fontSize: 14,
        marginBottom: 12,
    },
    actionButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    actionButtonText: {
        color: COLORS.background,
        fontWeight: 'bold',
        fontSize: 15,
    }
});
