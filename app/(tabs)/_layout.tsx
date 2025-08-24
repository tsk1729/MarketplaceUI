import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarShowLabel: false,
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.grey,
                animation: 'shift',
                tabBarStyle: {
                    backgroundColor: COLORS.background,
                    borderTopWidth: 0,
                    position: 'absolute',
                    bottom: 0,
                    elevation: 0,
                    height: 80,
                    paddingBottom: 8,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ size, color }) => <Ionicons name="home" size={size} color={color} />, 
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="bookmark" size={size} color={color} />, 
                }}
            />
            <Tabs.Screen
                name="sponsors"
                options={{
                    title: "Sponsors",
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="star" size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
} 