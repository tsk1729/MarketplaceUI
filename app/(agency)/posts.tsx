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
import { marketapi } from "../../utils/api";
import { CreatePostModal } from "./formModal";
import {isAuthenticated} from "@/app/utils/auth";
import {AutomationButton} from "../components/AutomationButton"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type APIRestaurantPost = {
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
    post_id?: string;
};

const moneyNum = (s?: string) =>
    s ? parseFloat(String(s).replace(/[^0-9.]/g, "")) || 0 : 0;

/* -------------------------------------------------------------------------- */
/*                                Header Component                            */
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
                <View style={[styles.sortContainer, { width: isDesktop ? 220 : "100%" }]}>
                    {Platform.OS === "web" ? (
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
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
/*                           Restaurant Card Component                        */
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


                    <Text style={styles.cardName}>{item.restaurantName}</Text>
                    <Text style={styles.cardItem}>
                        {item.itemsToPromote
                            ? item.itemsToPromote.split(",")[0] + "..."
                            : "Special Offer"}
                    </Text>

                    <View style={styles.tagRow}>
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
                        <Text style={styles.locationText}>📍 {item.address}</Text>
                    ) : null}

                    {/*{item.lastDate ? (*/}
                    {/*    <Text style={styles.deadlineText}>*/}
                    {/*        ⏰ Due: {new Date(item.lastDate).toLocaleDateString()}*/}
                    {/*    </Text>*/}
                    {/*) : null}*/}

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
/*                                 MAIN SCREEN                                */
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
        mobile:2,
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


    /* -------- Fixed Grid Layout (responsive columns) -------- */
    const gap = 14;
    // const cardWidth =
    //     width > 1150
    //         ? (width - 80 - gap * 3) / 4
    //         : width > 900
    //             ? (width - 60 - gap * 2) / 3
    //             : width > 600
    //                 ? (width - 40 - gap * 1) / 2
    //                 : width - 20;

    /* ---------------- Fetch posts ---------------- */
    const fetchRestaurants = useCallback(async () => {
        setLoading(true);
        try {
            const auth = await isAuthenticated();
            const uid = auth?.userId;
            const { success, data } = await marketapi.get("posts?user_id=" + uid);
            setRestaurants(success ? data?.data?.posts || [] : []);
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
                    return String(b.post_id || "").localeCompare(String(a.post_id || ""));
            }
        });

        return list;
    }, [restaurants, search, sort]);

    const automate = async (r: APIRestaurantPost) => {
        const auth = await isAuthenticated();
        const uid = auth?.userId;

        router.push({
            pathname: "/(automation)/automation",
            params: {
                id: uid,
                mediaType: "IMAGE",
                mediaUrl: r.restaurantImage || r.image,
                postId: r.post_id,
                thumbnail: r.restaurantImage || r.image,
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
                                key={item.post_id || item.restaurantName}
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
/*                                   STYLES                                   */
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
        padding: 14,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        color: COLORS.white,
        fontSize: 16,
    },
    sortContainer: {
        marginTop: 10,
    },
    webSelect: {
        width: "100%",
        padding: 14,
        borderRadius: 25,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        color: COLORS.white,
        fontSize: 15,
    },
    mobileSortButton: {
        padding: 14,
        borderRadius: 25,
        backgroundColor: COLORS.surfaceLight,
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
    locationText: {
        color: COLORS.white,
        marginTop: 4,
        opacity: 0.9,
    },
    deadlineText: {
        color: "#fbbf24",
        marginTop: 4,
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
        position: "absolute", // 'fixed' not valid for React Native StyleSheet
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
