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
import { marketapi,localapi } from "../../utils/api";
import { CreatePostModal } from "./formModal";
import { isAuthenticated } from "@/app/utils/auth";
// import { AutomationButton } from "../components/AutomationButton"

/* -------------------------------------------------------------------------- */
/* Types                                    */
/* -------------------------------------------------------------------------- */

type APIRestaurantPost = {
    _id:string;
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
    status?:string
};

const moneyNum = (s?: string) =>
    s ? parseFloat(String(s).replace(/[^0-9.]/g, "")) || 0 : 0;

/* -------------------------------------------------------------------------- */
/* Header Component                            */
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
                {/* Search */}
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

                {/* Sort */}
                <View style={[
                    styles.sortContainer,
                    {
                        width: isDesktop ? 220 : "100%",
                        // Only add margin top on mobile to separate it from search
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
                                const list = [
                                    "newest",
                                    "reward-high",
                                    "reward-low",
                                    "followers-low",
                                    "followers-high",
                                    "deadline",
                                ];
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
/* Restaurant Card Component                        */
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
        const bestReward =
            item.keyValuePairs?.length
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
                        defaultSource={require("../../assets/images/influencer.png")}
                    />
                )}


                <View style={styles.cardBody}>
                    <Text style={styles.cardName} numberOfLines={1} ellipsizeMode="tail">
                        {item.restaurantName || "Untitled"}
                    </Text>
                    <Text style={styles.cardItem} numberOfLines={2} ellipsizeMode="tail">
                        {(item.description?.trim() ||
                            item.itemsToPromote?.split(",")[0] ||
                            "Special offer").replace(/\s+/g, " ")}
                    </Text>

                    <View style={styles.tagRow}>
                        {/* STATUS BADGE */}
                        {item.status && (
                            <View style={[
                                styles.statusTag,
                                item.status === "active"
                                    ? styles.statusActive
                                    : item.status === "pause"
                                    ? styles.statusPaused
                                    : styles.statusStopped
                            ]}>
                                <Text style={styles.statusTagText}>
                                    {item.status === "active" && "Active"}
                                    {item.status === "pause" && "Paused"}
                                    {item.status === "stopped" && "Stopped"}
                                    {item.status !== "active" && item.status !== "pause" && item.status !== "stopped" && item.status}
                                </Text>
                            </View>
                        )}
                        {item.minFollowers && item.minFollowersUnit && (
                            <View style={styles.followTag}>
                                <Text style={styles.followTagText}>
                                    👥 {item.minFollowers}
                                    {item.minFollowersUnit}
                                </Text>
                            </View>
                        )}

                        {bestReward > 0 && (
                            <View style={styles.rewardTag}>
                                <Text style={styles.rewardTagText}>Rs. {bestReward}</Text>
                            </View>
                        )}
                    </View>

                    {item.address ? (
                        <Text style={styles.locationText} numberOfLines={2} ellipsizeMode="tail">
                            📍 {item.address}
                        </Text>
                    ) : null}
                </View>

                <Pressable
                    onPressIn={() => setPressed(true)}
                    onPressOut={() => setPressed(false)}
                    onPress={onAutomation}
                    style={[
                        styles.automationBtn,
                        { transform: [{ scale: pressed ? 0.92 : 1 }] },
                        Platform.OS === "web"
                            ? { backgroundColor: COLORS.instagram.red }
                            : { backgroundColor: COLORS.primary }
                    ]}
                >
                    <Text style={{ color: "white", fontSize: 16 }}>→</Text>
                </Pressable>
            </View>
        );
    }
);

/* -------------------------------------------------------------------------- */
/* MAIN SCREEN                                */
/* -------------------------------------------------------------------------- */

export default function RestaurantOffersGridScreen() {
    const [restaurants, setRestaurants] = useState<APIRestaurantPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [createVisible, setCreateVisible] = useState(false);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("newest");

    const router = useRouter();
    const { width } = useWindowDimensions();
    const COLS = {
        desktop: 5,
        laptop: 3,
        tablet: 2,
        mobile: 2,
    };

    const GUTTER = 14;
    const H_PADDING = 20;

    let columns = 1;

    if (width >= 1280) columns = COLS.desktop;
    else if (width >= 992) columns = COLS.laptop;
    else if (width >= 640) columns = COLS.tablet;
    else columns = COLS.mobile;

    const totalGap = GUTTER * (columns - 1);
    const cardWidth = (width - H_PADDING * 2 - totalGap) / columns;
    const gap = 14;

    /* ---------------- Fetch posts ---------------- */
    const fetchRestaurants = useCallback(async () => {
        setLoading(true);
        try {
            const auth = await isAuthenticated();
            const uid = auth?.userId;
            const { success, data } = await marketapi.get("posts?user_id=" + uid);
            let normalizedPosts: any[] = [];
            if (success && data) {
                if (Array.isArray(data.posts)) {
                    normalizedPosts = data.posts;
                } else if (data.posts && typeof data.posts === "object") {
                    normalizedPosts = [data.posts];
                }
            }
            setRestaurants(normalizedPosts);
        } catch {
            setRestaurants([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRestaurants();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchRestaurants();
        }, [])
    );

    /* -------------- Filter + Sort -------------- */
    const filtered = useMemo(() => {
        let list = restaurants.slice();
        const q = search.trim().toLowerCase();

        if (q) {
            list = list.filter(
                (r) =>
                    r.restaurantName?.toLowerCase().includes(q) ||
                    r.address?.toLowerCase().includes(q) ||
                    r.itemsToPromote?.toLowerCase().includes(q) ||
                    r.description?.toLowerCase().includes(q)
            );
        }

        list.sort((a, b) => {
            switch (sort) {
                case "reward-high":
                    return (
                        Math.max(...(b.keyValuePairs?.map((k) => moneyNum(k.reward)) || [0])) -
                        Math.max(...(a.keyValuePairs?.map((k) => moneyNum(k.reward)) || [0]))
                    );
                case "reward-low":
                    return (
                        Math.min(...(a.keyValuePairs?.map((k) => moneyNum(k.reward)) || [999999])) -
                        Math.min(...(b.keyValuePairs?.map((k) => moneyNum(k.reward)) || [999999]))
                    );
                case "followers-low":
                    return (parseInt(a.minFollowers || "0") || 0) -
                        (parseInt(b.minFollowers || "0") || 0);
                case "followers-high":
                    return (parseInt(b.minFollowers || "0") || 0) -
                        (parseInt(a.minFollowers || "0") || 0);
                case "deadline":
                    return (
                        (a.lastDate ? new Date(a.lastDate).getTime() : Infinity) -
                        (b.lastDate ? new Date(b.lastDate).getTime() : Infinity)
                    );
                default:
                    return String(b.postId || "").localeCompare(String(a.postId || ""));
            }
        });

        return list;
    }, [restaurants, search, sort]);

    const automate = async (r: APIRestaurantPost) => {
        const auth = await isAuthenticated();
        const uid = auth?.userId;

        router.push({
            pathname: "/postDetails",
            params: {
                postId: r._id,
            },
        });
    };

    return (
        <View style={styles.container}>
            <Header search={search} setSearch={setSearch} sort={sort} setSort={setSort} />

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : filtered.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>No posts found</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                    <View
                        style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            paddingHorizontal: 10,
                            gap: gap,
                        }}
                    >
                        {filtered.map((item) => (
                            <RestaurantCard
                                key={item.postId || item.restaurantName}
                                item={item}
                                width={cardWidth}
                                onAutomation={() => automate(item)}
                            />
                        ))}
                    </View>
                </ScrollView>
            )}

            {/* Floating Add Button */}
            <Pressable
                onPress={() => setCreateVisible(true)}
                style={[
                    styles.fab,
                    Platform.OS === "web" ? { bottom: 100 } : { bottom: 20 },
                ]}
            >
                <Text style={{ color: "white", fontSize: 20 }}>＋</Text>
            </Pressable>

            <CreatePostModal
                isVisible={createVisible}
                onClose={() => setCreateVisible(false)}
                onSubmit={() => {
                    setCreateVisible(false);
                    fetchRestaurants();
                }}
            />
        </View>
    );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    /* HEADER */
    header: {
        padding: 14,
    },
    searchBox: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: 16, // Matches the spacing of the sort box
        height: 54,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        color: COLORS.white,
        fontSize: 16,
    },
    sortContainer: {
        // Margin top handled in component logic for responsiveness
        justifyContent: 'center',
    },
    webSelect: {
        width: "100%",
        height: 54,
        // FIX: Use explicit paddingLeft for HTML select elements, paddingHorizontal may not apply
        paddingLeft: 16,
        paddingRight: 16,
        borderRadius: 25,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        color: COLORS.white,
        fontSize: 16,
        appearance: 'none',
        MozAppearance: 'none',
        WebkitAppearance: 'none',
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
    },
    cardImg: {
        width: "100%",
        height: 160,
    },
    cardBody: {
        padding: 12,
        paddingBottom: 56, // keep text clear of the floating action button
    },
    cardName: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "600",
    },
    cardItem: {
        color: COLORS.white,
        marginTop: 4,
        fontWeight: "500",
    },
    tagRow: {
        flexDirection: "row",
        gap: 6,
        marginVertical: 6,
        flexWrap: "wrap",
    },
    followTag: {
        backgroundColor: "rgba(59,130,246,0.2)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    followTagText: {
        color: "#3b82f6",
        fontWeight: "500",
    },
    rewardTag: {
        backgroundColor: "rgba(34,197,94,0.2)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    rewardTagText: {
        color: COLORS.white,
        fontWeight: "600",
    },
    /* Status badge styles */
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 4,
        minWidth: 54,
        alignItems: "center",
    },
    statusTagText: {
        fontWeight: "700",
        fontSize: 12,
        color: "#fff",
        textTransform: "uppercase",
        letterSpacing: 0.25,
    },
    statusActive: {
        backgroundColor: "#16a34a",
    },
    statusPaused: {
        backgroundColor: "#eab308",
    },
    statusStopped: {
        backgroundColor: "#dc2626",
    },
    locationText: {
        color: COLORS.white,
        marginTop: 4,
        opacity: 0.9,
    },
    automationBtn: {
        position: "absolute",
        right: 10,
        bottom: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },

    /* STATUS */
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyBox: {
        marginTop: 50,
        alignItems: "center",
    },
    emptyText: {
        color: COLORS.grey,
        fontSize: 18,
    },

    /* FAB */
    fab: {
        position: "absolute",
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: COLORS.instagram.red,
        backgroundColor: COLORS.background,
        zIndex: 9999,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
});
