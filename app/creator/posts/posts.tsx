'use client';
import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    Image,
    StyleSheet,
    useWindowDimensions,
    ActivityIndicator,
    Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { COLORS } from "@/constants/theme";
import { isAuthenticated } from "@/app/utils/auth";

import { marketapi, localapi } from "@/utils/api";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type APIRestaurantPost = {
    _id: string;
    restaurantName: string;
    description: string;
    itemsToPromote?: string;
    minFollowers?: string;
    minFollowersUnit?: string;
    keyValuePairs?: {
        platform: string;
        metric: string;
        value: string;
        unit?: string;
        reward?: string;
    }[];
    restaurantImage?: string;
    googleMapsLink?: string;
    address?: string;
    guidelines?: string;
    lastDate?: string;
    image?: string;
    category?: string;
    postId?: string;
    status?: string;
};

const moneyNum = (s?: string) =>
    s ? parseFloat(String(s).replace(/[^0-9.]/g, "")) || 0 : 0;

/* -------------------------------------------------------------------------- */
/* Header Component                                                           */
/* -------------------------------------------------------------------------- */

const Header = memo(
    ({
        search,
        setSearch,
        sort,
        setSort,
    }: {
        search: string;
        setSearch: (s: string) => void;
        sort: string;
        setSort: (s: string) => void;
    }) => {
        const { width } = useWindowDimensions();
        const isDesktop = width > 900;

        return (
            <View
                style={[
                    styles.header,
                    { flexDirection: isDesktop ? "row" : "column" }
                ]}
            >
                <TextInput
                    placeholder="Search by tags, locations..."
                    placeholderTextColor={COLORS.grey}
                    value={search}
                    onChangeText={setSearch}
                    style={[
                        styles.searchBox,
                        { flex: isDesktop ? 1 : 0, marginRight: isDesktop ? 12 : 0 }
                    ]}
                />

                <View style={[
                    styles.sortContainer,
                    {
                        width: isDesktop ? 220 : "100%",
                        marginTop: isDesktop ? 0 : 10
                    }
                ]}>
                    {Platform.OS === "web" ? (
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            // @ts-ignore
                            style={styles.webSelect}
                        >
                            <option value="newest">Newest First</option>
                            <option value="reward-high">Reward: High to Low</option>
                            <option value="reward-low">Reward: Low to High</option>
                            <option value="followers-low">Followers: Low to High</option>
                            <option value="followers-high">Followers: High to Low</option>
                            <option value="deadline">Deadline: Soonest</option>
                        </select>
                    ) : (
                        <Pressable
                            onPress={() => {
                                const list = ["newest", "reward-high", "reward-low", "followers-low", "followers-high", "deadline"];
                                const next = list[(list.indexOf(sort) + 1) % list.length];
                                setSort(next);
                            }}
                            style={styles.mobileSortButton}
                        >
                            <Text style={{ color: COLORS.white }}>Sort: {sort}</Text>
                        </Pressable>
                    )}
                </View>
            </View>
        );
    }
);

/* -------------------------------------------------------------------------- */
/* Restaurant Card Component                                                  */
/* -------------------------------------------------------------------------- */

const RestaurantCard = memo(
    ({
        item,
        width,
        onAutomation,
    }: {
        item: APIRestaurantPost;
        width: number;
        onAutomation: () => void;
    }) => {
        const [pressed, setPressed] = useState(false);
        const bestReward = item.keyValuePairs?.length
            ? Math.max(...item.keyValuePairs.map((k) => moneyNum(k.reward)))
            : 0;

        return (
            <View style={[styles.card, { width }]}>
                {Platform.OS === "web" ? (
                    <img
                        src={item.image || item.restaurantImage || ""}
                        style={{
                            width: "100%",
                            height: 160,
                            objectFit: "cover",
                            borderTopLeftRadius: 14,
                            borderTopRightRadius: 14,
                            background: "#222"
                        }}
                        alt={item.restaurantName || "Restaurant"}
                        onError={e => { (e.target as HTMLImageElement).src = "https://ik.imagekit.io/owlit/agency/passport_photo_HMktjeYkg.jpg" }}
                    />
                ) : (
                    <Image
                        source={{ uri: item.image || item.restaurantImage || "" }}
                        style={styles.cardImg}
                        defaultSource={require("../../../assets/images/influencer.png")}
                    />
                )}

                <View style={styles.cardBody}>
                    <Text style={styles.cardName} numberOfLines={1}>{item.restaurantName || "Untitled"}</Text>
                    <Text style={styles.cardItem} numberOfLines={2}>
                        {(item.description?.trim() || item.itemsToPromote?.split(",")[0] || "Special offer").replace(/\s+/g, " ")}
                    </Text>

                    <View style={styles.tagRow}>
                        {item.status && (
                            <View style={[
                                styles.statusTag,
                                item.status === "active" ? styles.statusActive : item.status === "pause" ? styles.statusPaused : styles.statusStopped
                            ]}>
                                <Text style={styles.statusTagText}>{item.status}</Text>
                            </View>
                        )}
                        {item.minFollowers && (
                            <View style={styles.followTag}>
                                <Text style={styles.followTagText}>👥 {item.minFollowers}{item.minFollowersUnit}</Text>
                            </View>
                        )}
                        {bestReward > 0 && (
                            <View style={styles.rewardTag}>
                                <Text style={styles.rewardTagText}>Rs. {bestReward}</Text>
                            </View>
                        )}
                    </View>
                    {item.address && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Text style={{ color: COLORS.grey, fontSize: 12 }} numberOfLines={1}>📍 {item.address}</Text>
                        </View>
                    )}
                </View>

                <Pressable
                    onPressIn={() => setPressed(true)}
                    onPressOut={() => setPressed(false)}
                    onPress={onAutomation}
                    style={[
                        styles.automationBtn,
                        { transform: [{ scale: pressed ? 0.92 : 1 }] },
                        Platform.OS === "web" ? { backgroundColor: COLORS.instagram.red } : { backgroundColor: COLORS.primary }
                    ]}
                >
                    <Text style={{ color: "white", fontSize: 16 }}>→</Text>
                </Pressable>
            </View>
        );
    }
);

/* -------------------------------------------------------------------------- */
/* MAIN SCREEN                                                                */
/* -------------------------------------------------------------------------- */

export default function RestaurantOffersGridScreen() {
    const [restaurants, setRestaurants] = useState<APIRestaurantPost[]>([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("newest");

    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const router = useRouter();
    const { width } = useWindowDimensions();

    // Grid config
    const COLS = { desktop: 5, laptop: 3, tablet: 2, mobile: 2 };
    const GUTTER = 14;
    const H_PADDING = 20;
    let columns = width >= 1280 ? COLS.desktop : width >= 992 ? COLS.laptop : width >= 640 ? COLS.tablet : COLS.mobile;
    const cardWidth = (width - H_PADDING * 2 - (GUTTER * (columns - 1))) / columns;

    const fetchRestaurants = useCallback(async (cursor?: string | null) => {
        if (cursor === undefined) {
            setLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const auth = await isAuthenticated();
            if (!auth) return;

            // Sort configuration map
            const SORT_MAPPING: Record<string, { field: string; direction: string }> = {
                "newest": { field: "address", direction: "-1" },
                "reward-high": { field: "address", direction: "-1" },
                "reward-low": { field: "address", direction: "1" },
                "followers-low": { field: "address", direction: "1" },
                "followers-high": { field: "address", direction: "-1" },
                "deadline": { field: "address", direction: "1" },
            };

            const sortConfig = SORT_MAPPING[sort] || SORT_MAPPING["newest"];

            // Construct query params
            const params = new URLSearchParams({
                user_id: auth.userId || "",
                page_size: "10",
                direction: sortConfig.direction,
                sort_field: sortConfig.field
            });

            if (cursor) {
                params.append("last_value", cursor);
            }

            // Using localapi as requested
            // Endpoint: /brand/posts based on curl "http://127.0.0.1:8000/brand/posts..."
            const { success, data } = await marketapi.get(`brand/posts?${params.toString()}`);

            if (success && data) {
                const newPosts = Array.isArray(data.data) ? data.data : [];
                setNextCursor(data.next_cursor);

                if (cursor) {
                    setRestaurants(prev => [...prev, ...newPosts]);
                } else {
                    setRestaurants(newPosts);
                }
            }
        } catch (e) {
            console.error("Fetch error", e);
            if (cursor === undefined) setRestaurants([]);
        } finally {
            setLoading(false);
            setIsLoadingMore(false);
        }
    }, [sort]);

    // Initial load
    useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);
    // Re-fetch when finding focus is sometimes tricky with pagination state, 
    // but standard pattern usually expects refreshing on focus or just first load. 
    // Keeping simple initial load for now to avoid reset loops.
    // useFocusEffect(useCallback(() => { fetchRestaurants(); }, []));

    const filtered = useMemo(() => {
        let list = [...restaurants];
        const q = search.trim().toLowerCase();
        if (q) {
            list = list.filter(r =>
                r.restaurantName?.toLowerCase().includes(q) ||
                r.address?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [restaurants, search]);

    const handleLoadMore = () => {
        if (!isLoadingMore && nextCursor) {
            fetchRestaurants(nextCursor);
        }
    };

    return (
        <View style={styles.container}>
            <Header search={search} setSearch={setSearch} sort={sort} setSort={setSort} />

            {loading ? (
                <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>
            ) : filtered.length === 0 ? (
                <View style={styles.emptyBox}><Text style={styles.emptyText}>No posts found</Text></View>
            ) : (
                <View style={{ flex: 1 }}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        persistentScrollbar={true}
                        showsVerticalScrollIndicator={true}
                        onScroll={({ nativeEvent }) => {
                            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
                            if (isCloseToBottom) {
                                handleLoadMore();
                            }
                        }}
                        scrollEventThrottle={400}
                    >
                        <View style={styles.gridWrapper}>
                            {filtered.map((item) => (
                                <RestaurantCard
                                    key={item.postId || item._id}
                                    item={item}
                                    width={cardWidth}
                                    onAutomation={() => router.push({ pathname: "/creator/post/postDetails", params: { postId: item._id } })}
                                />
                            ))}
                        </View>
                        {isLoadingMore && (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}


        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        // Web fix: Always reserve space for scrollbar to prevent layout jumping
        ...Platform.select({
            web: { overflowY: 'scroll' } as any
        })
    },
    scrollContent: {
        paddingHorizontal: 10,
        paddingBottom: 120,
        flexGrow: 1, // Ensures content container fills the screen
        minHeight: '100.5%', // Forces the ScrollView to always have "scrolling room"
    },
    gridWrapper: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 14,
    },
    /* HEADER */
    header: { padding: 14 },
    searchBox: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: 16,
        height: 54,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        color: COLORS.white,
    },
    sortContainer: { justifyContent: 'center' },
    webSelect: {
        width: "100%",
        height: 54,
        paddingLeft: 16,
        borderRadius: 25,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        color: COLORS.white,
        cursor: 'pointer',
    } as any,
    mobileSortButton: {
        height: 54,
        paddingHorizontal: 16,
        borderRadius: 25,
        backgroundColor: COLORS.surfaceLight,
        justifyContent: 'center',
    },
    /* CARD */
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 10,
    },
    cardImg: { width: "100%", height: 160 },
    cardBody: { padding: 12, paddingBottom: 56 },
    cardName: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
    cardItem: { color: COLORS.white, marginTop: 4, opacity: 0.8 },
    tagRow: { flexDirection: "row", gap: 6, marginVertical: 8, flexWrap: "wrap" },
    followTag: { backgroundColor: "rgba(59,130,246,0.2)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    followTagText: { color: "#3b82f6", fontWeight: "500", fontSize: 12 },
    rewardTag: { backgroundColor: "rgba(34,197,94,0.2)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    rewardTagText: { color: COLORS.white, fontWeight: "600", fontSize: 12 },
    statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusTagText: { color: "#fff", fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
    statusActive: { backgroundColor: "#16a34a" },
    statusPaused: { backgroundColor: "#eab308" },
    statusStopped: { backgroundColor: "#dc2626" },
    automationBtn: {
        position: "absolute",
        right: 10,
        bottom: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    loader: { flex: 1, justifyContent: "center", alignItems: "center" },
    emptyBox: { marginTop: 50, alignItems: "center" },
    emptyText: { color: COLORS.grey, fontSize: 18 },
    fab: {
        position: "absolute",
        right: 20,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: COLORS.instagram.red,
        backgroundColor: COLORS.background,
        zIndex: 999,
    },
});