import { styles, webCardStyle } from "@/app/(profile)/styles";
import { COLORS } from '@/constants/theme';
import api from "@/utils/api";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from "expo-router";
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { isAuthenticated } from '../utils/auth';

export default function ProfileScreen() {
    const [countryCode, setCountryCode] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchProfile = async () => {
        try {
            const { userId } = await isAuthenticated();
            if (!userId) {
                console.error('No user ID available');
                return;
            }
            const response = await api.post('fetch_user_details', userId);

            if (response && response.data) {
                const userData = response.data;
                setCountryCode(userData.country_code || '');
                setMobile(userData.mobile || '');
                setEmail(userData.email || '');
                setAddress(userData.address || '');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            Alert.alert('Error', 'Failed to fetch profile. Please try again.');
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchProfile();
        }, [])
    );

    const handleSubmit = async () => {
        if (!countryCode || !mobile || !email || !address) {
            Alert.alert('Missing Fields', 'Please fill out all fields before submitting.');
            return;
        }

        try {
            const { userId } = await isAuthenticated();
            if (!userId) {
                console.error('No user ID available');
                return;
            }
            let body = {
                "user_id": userId,
                "country_code": countryCode,
                "mobile": mobile,
                "email": email,
                "address": address
            }

            let data = await api.post("update_details", body);
            console.log(data);
            Alert.alert(
                'Profile Saved',
                'Updated necessary details',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ],
                { cancelable: false }
            );
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <KeyboardAwareScrollView
            contentContainerStyle={styles.container}
            enableOnAndroid
            extraScrollHeight={20}
            keyboardShouldPersistTaps="handled"
        >
            <View style={[styles.card, webCardStyle]}>
                <View style={styles.centeredLogoWrapper}>
                    <View style={styles.logoContainer}>
                        <MaterialCommunityIcons name="owl" size={48} style={styles.logo} />
                    </View>
                </View>

                <Text style={styles.title}>Add Profile Details</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Country Code"
                    placeholderTextColor={COLORS.grey}
                    value={countryCode}
                    onChangeText={setCountryCode}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Mobile"
                    placeholderTextColor={COLORS.grey}
                    value={mobile}
                    onChangeText={setMobile}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={COLORS.grey}
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />

                <TextInput
                    style={[styles.input, { height: 100 }]}
                    placeholder="Address"
                    placeholderTextColor={COLORS.grey}
                    multiline
                    numberOfLines={4}
                    value={address}
                    onChangeText={setAddress}
                />

                <TouchableOpacity
                    style={[styles.button, isLoading && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>
                        {isLoading ? 'Saving...' : 'Save Profile'}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAwareScrollView>
    );
} 