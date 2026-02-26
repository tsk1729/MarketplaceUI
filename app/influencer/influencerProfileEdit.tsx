import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { localapi, mainapi } from '../../utils/api';
import { isAuthenticated } from '../utils/auth';
import { styles } from './styles';
import { Ionicons } from '@expo/vector-icons';

interface FormData {
    name: string;
    mobile: string;
    gmail: string;
    address: string;
    pincode: string;
    languages: string[];
    chargePerPostMin: string;
    chargePerPostMax: string;
    instagramLink: string;
    instagramFollowers: string;
    youtubeLink: string;
    youtubeFollowers: string;
    twitterLink: string;
    twitterFollowers: string;
    linkedinLink: string;
    linkedinFollowers: string;
    tiktokLink: string;
    tiktokFollowers: string;
}

const CreatorScreen = () => {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        mobile: '',
        gmail: '',
        address: '',
        pincode: '',
        languages: [],
        chargePerPostMin: '',
        chargePerPostMax: '',
        instagramLink: '',
        instagramFollowers: '',
        youtubeLink: '',
        youtubeFollowers: '',
        twitterLink: '',
        twitterFollowers: '',
        linkedinLink: '',
        linkedinFollowers: '',
        tiktokLink: '',
        tiktokFollowers: ''
    });
    const [languageInput, setLanguageInput] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [saveMessage, setSaveMessage] = useState('');
    const [instagramConnectionStatus, setInstagramConnectionStatus] = useState<'loading' | 'connected' | 'not_connected'>('loading');
    const [isCheckingConnection, setIsCheckingConnection] = useState(false);

    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);
    const fieldPositions = useRef<{ [key: string]: number }>({});

    const captureFieldPosition = (field: string) => (event: any) => {
        fieldPositions.current[field] = event.nativeEvent.layout.y;
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        // Name validation (min 7 characters)
        if (formData.name.length < 7) {
            newErrors.name = 'Name must be at least 7 characters long';
        }

        // Mobile validation (10 digits)
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(formData.mobile)) {
            newErrors.mobile = 'Mobile number must be exactly 10 digits';
        }

        // Gmail validation
        const emailRegex = /^[^\s@]+@gmail\.com$/;
        if (!emailRegex.test(formData.gmail)) {
            newErrors.gmail = 'Please enter a valid Gmail address';
        }

        // Address validation
        if (formData.address.trim().length < 10) {
            newErrors.address = 'Address must be at least 10 characters long';
        }

        // Pincode validation (6 digits)
        const pincodeRegex = /^\d{6}$/;
        if (!pincodeRegex.test(formData.pincode)) {
            newErrors.pincode = 'Pincode must be exactly 6 digits';
        }

        // Languages validation
        if (formData.languages.length === 0) {
            newErrors.languages = 'Please add at least one language';
        }

        // Charge per post range validation
        if (!formData.chargePerPostMin.trim()) {
            newErrors.chargePerPostMin = 'Please enter minimum charge';
        } else {
            const minAmount = parseFloat(formData.chargePerPostMin);
            if (isNaN(minAmount) || minAmount <= 0) {
                newErrors.chargePerPostMin = 'Please enter a valid amount greater than 0';
            } else if (minAmount > 1000000) {
                newErrors.chargePerPostMin = 'Amount seems too high, please be reasonable';
            }
        }

        if (!formData.chargePerPostMax.trim()) {
            newErrors.chargePerPostMax = 'Please enter maximum charge';
        } else {
            const maxAmount = parseFloat(formData.chargePerPostMax);
            if (isNaN(maxAmount) || maxAmount <= 0) {
                newErrors.chargePerPostMax = 'Please enter a valid amount greater than 0';
            } else if (maxAmount > 1000000) {
                newErrors.chargePerPostMax = 'Amount seems too high, please be reasonable';
            }
        }

        // Cross-validation: max should be greater than or equal to min
        if (formData.chargePerPostMin.trim() && formData.chargePerPostMax.trim()) {
            const minAmount = parseFloat(formData.chargePerPostMin);
            const maxAmount = parseFloat(formData.chargePerPostMax);
            if (!isNaN(minAmount) && !isNaN(maxAmount) && maxAmount < minAmount) {
                newErrors.chargePerPostMax = 'Maximum charge should be greater than or equal to minimum charge';
            }
        }

        // Instagram link validation
        if (formData.instagramLink.trim()) {
            const instagramRegex = /^(https?:\/\/)?(www\.)?(instagram\.com\/)[a-zA-Z0-9._-]+\/?/;
            if (!instagramRegex.test(formData.instagramLink)) {
                newErrors.instagramLink = 'Please enter a valid Instagram profile URL';
            }
            if (!formData.instagramFollowers.trim() || isNaN(Number(formData.instagramFollowers.trim()))) {
                newErrors.instagramFollowers = 'Please enter a valid number of followers';
            }
        }

        // YouTube link validation
        if (formData.youtubeLink.trim()) {
            const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(channel\/|c\/|user\/|@)|youtu\.be\/)/;
            if (!youtubeRegex.test(formData.youtubeLink)) {
                newErrors.youtubeLink = 'Please enter a valid YouTube channel URL';
            }
            if (!formData.youtubeFollowers.trim() || isNaN(Number(formData.youtubeFollowers.trim()))) {
                newErrors.youtubeFollowers = 'Please enter a valid number of followers';
            }
        }

        // Twitter/X link validation
        if (formData.twitterLink.trim()) {
            const twitterRegex = /^(https?:\/\/)?(www\.)?(twitter\.com\/|x\.com\/)[a-zA-Z0-9_]+\/?/;
            if (!twitterRegex.test(formData.twitterLink)) {
                newErrors.twitterLink = 'Please enter a valid Twitter/X profile URL';
            }
            if (!formData.twitterFollowers.trim() || isNaN(Number(formData.twitterFollowers.trim()))) {
                newErrors.twitterFollowers = 'Please enter a valid number of followers';
            }
        }

        // LinkedIn link validation
        if (formData.linkedinLink.trim()) {
            const linkedinRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9_-]+\/?/;
            if (!linkedinRegex.test(formData.linkedinLink)) {
                newErrors.linkedinLink = 'Please enter a valid LinkedIn profile URL';
            }
            if (!formData.linkedinFollowers.trim() || isNaN(Number(formData.linkedinFollowers.trim()))) {
                newErrors.linkedinFollowers = 'Please enter a valid number of followers';
            }
        }

        // TikTok link validation
        if (formData.tiktokLink.trim()) {
            const tiktokRegex = /^(https?:\/\/)?(www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+\/?/;
            if (!tiktokRegex.test(formData.tiktokLink)) {
                newErrors.tiktokLink = 'Please enter a valid TikTok profile URL';
            }
            if (!formData.tiktokFollowers.trim() || isNaN(Number(formData.tiktokFollowers.trim()))) {
                newErrors.tiktokFollowers = 'Please enter a valid number of followers';
            }
        }

        // Ensure at least one social media link is provided
        if (!formData.instagramLink.trim() &&
            !formData.youtubeLink.trim() &&
            !formData.twitterLink.trim() &&
            !formData.linkedinLink.trim() &&
            !formData.tiktokLink.trim()) {
            newErrors.socialMedia = 'Please provide at least one social media link';
        }

        if (Object.keys(newErrors).length > 0) {
            console.log('Validation errors:', newErrors);
            const firstErrorKey = Object.keys(newErrors)[0];
            const yPos = fieldPositions.current[firstErrorKey];
            if (yPos !== undefined && scrollViewRef.current) {
                // Scroll to the field's y-coordinate with a little padding at the top
                scrollViewRef.current.scrollTo({ y: Math.max(0, yPos - 30), animated: true });
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const addLanguage = () => {
        if (languageInput.trim() && !formData.languages.includes(languageInput.trim())) {
            setFormData(prev => ({
                ...prev,
                languages: [...prev.languages, languageInput.trim()]
            }));
            setLanguageInput('');
        }
    };

    const removeLanguage = (language: string) => {
        setFormData(prev => ({
            ...prev,
            languages: prev.languages.filter(lang => lang !== language)
        }));
    };

    // Check Instagram connection status
    const checkInstagramConnection = async () => {
        try {
            console.log('checkInstagramConnection function called');
            setIsCheckingConnection(true);

            // Get user ID from authentication
            const authResult = await isAuthenticated();

            if (!authResult.isAuthenticated || !authResult.userId) {
                console.log('User not authenticated, setting status to not_connected');
                setInstagramConnectionStatus('not_connected');
                return;
            }

            console.log('Checking Instagram connection for user:', authResult.userId);
            const response = await mainapi.post('v1/authorized_subscriber', authResult.userId);
            console.log('Instagram connection check response:', response);

            if (response.success) {
                setInstagramConnectionStatus('connected');
                console.log('Instagram is connected');
            } else {
                setInstagramConnectionStatus('not_connected');
                console.log('Instagram is not connected:', response.message);
            }
        } catch (error) {
            console.error('Error checking Instagram connection:', error);
            setInstagramConnectionStatus('not_connected');
        } finally {
            setIsCheckingConnection(false);
        }
    };

    // Fetch existing creator data
    const fetchCreatorData = async () => {
        try {
            setIsLoadingData(true);

            // Get user ID from authentication
            const authResult = await isAuthenticated();

            if (!authResult.isAuthenticated || !authResult.userId) {
                console.log('User not authenticated, skipping data fetch');
                setIsLoadingData(false);
                return;
            }

            console.log('Fetching creator data for user:', authResult.userId);
            const response = await localapi.get(`creator?user_id=${authResult.userId}`);

            if (response.success && response.data) {
                console.log('Creator data fetched:', response.data);

                // Pre-fill form with existing data
                const creatorData = response.data;
                setFormData({
                    name: creatorData.name || '',
                    mobile: creatorData.mobile || '',
                    gmail: creatorData.gmail || '',
                    address: creatorData.address || '',
                    pincode: creatorData.pincode || '',
                    languages: creatorData.languages || [],
                    chargePerPostMin: creatorData.chargePerPostMin || '',
                    chargePerPostMax: creatorData.chargePerPostMax || '',
                    instagramLink: creatorData.instagramLink || creatorData.instagramId || '',
                    instagramFollowers: creatorData.instagramFollowers ? creatorData.instagramFollowers.toString() : '',
                    youtubeLink: creatorData.youtubeLink || '',
                    youtubeFollowers: creatorData.youtubeFollowers ? creatorData.youtubeFollowers.toString() : '',
                    twitterLink: creatorData.twitterLink || '',
                    twitterFollowers: creatorData.twitterFollowers ? creatorData.twitterFollowers.toString() : '',
                    linkedinLink: creatorData.linkedinLink || '',
                    linkedinFollowers: creatorData.linkedinFollowers ? creatorData.linkedinFollowers.toString() : '',
                    tiktokLink: creatorData.tiktokLink || '',
                    tiktokFollowers: creatorData.tiktokFollowers ? creatorData.tiktokFollowers.toString() : '',
                });
            } else {
                console.log('No existing creator data found or error:', response.message);
            }
        } catch (error) {
            console.error('Error fetching creator data:', error);
            // Don't show error alert for data fetching as it's not critical
        } finally {
            setIsLoadingData(false);
        }
    };

    // Fetch data when component mounts
    useEffect(() => {
        fetchCreatorData();
        checkInstagramConnection();
    }, []);

    const handleInstagramConnect = async () => {
        console.log('handleInstagramConnect function called');
        try {
            // Get user ID from authentication
            const authResult = await isAuthenticated();

            if (!authResult.isAuthenticated || !authResult.userId) {
                Alert.alert(
                    'Authentication Required',
                    'Please log in to connect your Instagram account.',
                    [{ text: 'OK' }]
                );
                return;
            }

            const userId = authResult.userId;
            const instagramUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=581334411142953&redirect_uri=https://api.owlit.in/instagram_redirect&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments&state=id%3D${userId}`;

            console.log('Opening Instagram OAuth URL:', instagramUrl);
            console.log('User ID:', userId);

            // Open Instagram OAuth directly without confirmation dialog
            try {
                const result = await WebBrowser.openBrowserAsync(instagramUrl, {
                    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
                    controlsColor: '#6366F1',
                });

                console.log('WebBrowser result:', result);

                // Check connection status after browser closes
                if (result.type === 'dismiss' || result.type === 'cancel') {
                    console.log('User closed browser, checking connection status');
                    setTimeout(() => {
                        checkInstagramConnection();
                    }, 1000);
                }
            } catch (error) {
                console.error('Error opening Instagram OAuth:', error);
                Alert.alert(
                    'Error',
                    'Unable to open Instagram authorization. Please try again.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Error in handleInstagramConnect:', error);
            Alert.alert(
                'Error',
                'An error occurred while setting up Instagram connection. Please try again.',
                [{ text: 'OK' }]
            );
        }
    };

    const handleSave = async () => {
        console.log('handleSave function called');

        if (!validateForm()) {
            console.log('Form validation failed');
            return;
        }

        console.log('Form validation passed, starting save process');
        setIsLoading(true);

        try {
            // Get user ID from authentication
            const authResult = await isAuthenticated();

            if (!authResult.isAuthenticated || !authResult.userId) {
                setSaveStatus('error');
                setSaveMessage('🔐 Please log in to save your influencer details.');
                setIsLoading(false);

                // Auto-hide error message after 5 seconds
                setTimeout(() => {
                    setSaveStatus('idle');
                    setSaveMessage('');
                }, 5000);
                return;
            }

            const payload = {
                data: {
                    name: formData.name,
                    mobile: formData.mobile,
                    gmail: formData.gmail,
                    address: formData.address,
                    pincode: formData.pincode,
                    languages: formData.languages,
                    chargePerPostMin: formData.chargePerPostMin,
                    chargePerPostMax: formData.chargePerPostMax,
                    instagramLink: formData.instagramLink || undefined,
                    instagramFollowers: formData.instagramFollowers ? Number(formData.instagramFollowers) : undefined,
                    youtubeLink: formData.youtubeLink || undefined,
                    youtubeFollowers: formData.youtubeFollowers ? Number(formData.youtubeFollowers) : undefined,
                    twitterLink: formData.twitterLink || undefined,
                    twitterFollowers: formData.twitterFollowers ? Number(formData.twitterFollowers) : undefined,
                    linkedinLink: formData.linkedinLink || undefined,
                    linkedinFollowers: formData.linkedinFollowers ? Number(formData.linkedinFollowers) : undefined,
                    tiktokLink: formData.tiktokLink || undefined,
                    tiktokFollowers: formData.tiktokFollowers ? Number(formData.tiktokFollowers) : undefined,
                },
                user_id: authResult.userId
            };

            console.log('Sending payload:', payload);
            const response = await localapi.post('creator', payload);

            console.log('Full API response:', response);
            console.log('Response success:', response.success);
            console.log('Response data:', response.data);

            if (response.success) {
                console.log('Save successful');
                setSaveStatus('success');
                setSaveMessage('🎉 Congratulations! You are now in the Owlit Marketplace. Soon you will start getting ad-agencies very quickly!');
                console.log('Creator details saved:', response.data);

                // Auto backward navigation after a brief moment to read success message
                setTimeout(() => {
                    setSaveStatus('idle');
                    setSaveMessage('');
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.push('/(connect)/influencer');
                    }
                }, 2500);
            } else {
                console.log('Save failed');
                setSaveStatus('error');
                setSaveMessage('❌ ' + (response.message || 'Failed to save details. Please try again.'));
                console.error('API Error:', response.message);

                // Jump to top to see error message
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });

                // Auto-hide error message after 5 seconds
                setTimeout(() => {
                    setSaveStatus('idle');
                    setSaveMessage('');
                }, 5000);
            }
        } catch (error) {
            console.error('Save error:', error);
            setSaveStatus('error');
            setSaveMessage('❌ An unexpected error occurred. Please check your connection and try again.');

            // Auto-hide error message after 5 seconds
            setTimeout(() => {
                setSaveStatus('idle');
                setSaveMessage('');
            }, 5000);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.background, COLORS.surface, COLORS.background]}
                style={styles.gradient}
            >
                <SafeAreaView style={styles.safeArea}>
                    <KeyboardAvoidingView
                        style={styles.keyboardAvoidingView}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                    >
                        {isLoadingData ? (
                            <View style={styles.loadingScreen}>
                                <ActivityIndicator size="large" color={COLORS.white} />
                                <Text style={styles.loadingText}>Loading your details...</Text>
                            </View>
                        ) : (
                            <ScrollView
                                ref={scrollViewRef}
                                style={styles.scrollView}
                                contentContainerStyle={styles.scrollViewContent}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                bounces={true}
                                overScrollMode="always"
                            >
                                <View style={styles.content}>
                                    <Text style={styles.title}>Influencer Details</Text>
                                    <Text style={styles.subtitle}>Please fill in your information</Text>

                                    {/* Name Field */}
                                    <View style={styles.inputContainer} onLayout={captureFieldPosition('name')}>
                                        <Text style={styles.label}>Name</Text>
                                        <TextInput
                                            style={[styles.input, errors.name && styles.inputError]}
                                            value={formData.name}
                                            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                                            placeholder="Enter your full name"
                                            placeholderTextColor={COLORS.grey}
                                            returnKeyType="next"
                                            blurOnSubmit={false}
                                            textContentType="name"
                                            autoComplete="name"
                                        />
                                        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                                    </View>

                                    {/* Mobile Field */}
                                    <View style={styles.inputContainer} onLayout={captureFieldPosition('mobile')}>
                                        <Text style={styles.label}>Mobile Number</Text>
                                        <TextInput
                                            style={[styles.input, errors.mobile && styles.inputError]}
                                            value={formData.mobile}
                                            onChangeText={(text) => setFormData(prev => ({ ...prev, mobile: text }))}
                                            placeholder="Enter 10-digit mobile number"
                                            placeholderTextColor={COLORS.grey}
                                            keyboardType="phone-pad"
                                            maxLength={10}
                                            returnKeyType="next"
                                            blurOnSubmit={false}
                                            textContentType="telephoneNumber"
                                            autoComplete="tel"
                                        />
                                        {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
                                    </View>

                                    {/* Gmail Field */}
                                    <View style={styles.inputContainer} onLayout={captureFieldPosition('gmail')}>
                                        <Text style={styles.label}>Gmail</Text>
                                        <TextInput
                                            style={[styles.input, errors.gmail && styles.inputError]}
                                            value={formData.gmail}
                                            onChangeText={(text) => setFormData(prev => ({ ...prev, gmail: text }))}
                                            placeholder="Enter your Gmail address"
                                            placeholderTextColor={COLORS.grey}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            returnKeyType="next"
                                            blurOnSubmit={false}
                                            textContentType="emailAddress"
                                            autoComplete="email"
                                            autoCorrect={false}
                                        />
                                        {errors.gmail && <Text style={styles.errorText}>{errors.gmail}</Text>}
                                    </View>

                                    {/* Address Field */}
                                    <View style={styles.inputContainer} onLayout={captureFieldPosition('address')}>
                                        <Text style={styles.label}>Address</Text>
                                        <TextInput
                                            style={[styles.input, styles.addressInput, errors.address && styles.inputError]}
                                            value={formData.address}
                                            onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                                            placeholder="Enter your complete address"
                                            placeholderTextColor={COLORS.grey}
                                            multiline={true}
                                            numberOfLines={3}
                                            returnKeyType="next"
                                            blurOnSubmit={false}
                                            textContentType="fullStreetAddress"
                                            autoComplete="street-address"
                                            textAlignVertical="top"
                                        />
                                        {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
                                    </View>

                                    {/* Pincode Field */}
                                    <View style={styles.inputContainer} onLayout={captureFieldPosition('pincode')}>
                                        <Text style={styles.label}>Pincode</Text>
                                        <TextInput
                                            style={[styles.input, errors.pincode && styles.inputError]}
                                            value={formData.pincode}
                                            onChangeText={(text) => setFormData(prev => ({ ...prev, pincode: text }))}
                                            placeholder="Enter 6-digit pincode"
                                            placeholderTextColor={COLORS.grey}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            returnKeyType="next"
                                            blurOnSubmit={false}
                                            textContentType="postalCode"
                                            autoComplete="postal-code"
                                        />
                                        {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
                                    </View>

                                    {/* Languages Field */}
                                    <View style={styles.inputContainer} onLayout={captureFieldPosition('languages')}>
                                        <Text style={styles.label}>Languages You Speak</Text>
                                        <View style={styles.languageInputRow}>
                                            <TextInput
                                                style={[styles.input, styles.languageInput]}
                                                value={languageInput}
                                                onChangeText={setLanguageInput}
                                                placeholder="Enter a language"
                                                placeholderTextColor={COLORS.grey}
                                                onSubmitEditing={addLanguage}
                                                returnKeyType="done"
                                                autoCapitalize="words"
                                            />
                                            <TouchableOpacity
                                                style={[styles.addButton, !languageInput.trim() && styles.addButtonDisabled]}
                                                onPress={addLanguage}
                                                disabled={!languageInput.trim()}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.addButtonText, !languageInput.trim() && styles.addButtonTextDisabled]}>Add</Text>
                                            </TouchableOpacity>
                                        </View>
                                        {errors.languages && <Text style={styles.errorText}>{errors.languages}</Text>}

                                        {/* Language Tags */}
                                        {formData.languages.length > 0 && (
                                            <View style={styles.languageTags}>
                                                {formData.languages.map((language, index) => (
                                                    <TouchableOpacity
                                                        key={index}
                                                        style={styles.languageTag}
                                                        onPress={() => removeLanguage(language)}
                                                        activeOpacity={0.7}
                                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                    >
                                                        <Text style={styles.languageTagText}>{language}</Text>
                                                        <Text style={styles.removeTagText}> ×</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </View>

                                    {/* Charge Per Post Range Field */}
                                    <View style={styles.inputContainer} onLayout={captureFieldPosition('chargePerPostMin')}>
                                        <Text style={styles.label}>Charge Per Post Range</Text>
                                        <Text style={styles.warningText}>(Please be genuine - this might affect chances of getting selected by ad-agency)</Text>

                                        <View style={styles.priceRangeContainer}>
                                            {/* Minimum Price */}
                                            <View style={styles.priceInputWrapper}>
                                                <Text style={styles.rangeLabel}>Min</Text>
                                                <View style={styles.priceInputContainer}>
                                                    <Text style={styles.currencySymbol}>₹</Text>
                                                    <TextInput
                                                        style={[styles.input, styles.priceInput, errors.chargePerPostMin && styles.inputError]}
                                                        value={formData.chargePerPostMin}
                                                        onChangeText={(text) => {
                                                            // Only allow numbers and decimal point
                                                            const numericText = text.replace(/[^0-9.]/g, '');
                                                            // Prevent multiple decimal points
                                                            const parts = numericText.split('.');
                                                            const formattedText = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericText;
                                                            setFormData(prev => ({ ...prev, chargePerPostMin: formattedText }));
                                                        }}
                                                        placeholder="Min amount"
                                                        placeholderTextColor={COLORS.grey}
                                                        keyboardType="decimal-pad"
                                                        returnKeyType="next"
                                                        blurOnSubmit={false}
                                                        maxLength={10}
                                                    />
                                                </View>
                                                {errors.chargePerPostMin && <Text style={styles.errorText}>{errors.chargePerPostMin}</Text>}
                                            </View>

                                            {/* Range Separator */}
                                            <View style={styles.rangeSeparator}>
                                                <Text style={styles.separatorText}>to</Text>
                                            </View>

                                            {/* Maximum Price */}
                                            <View style={styles.priceInputWrapper}>
                                                <Text style={styles.rangeLabel}>Max</Text>
                                                <View style={styles.priceInputContainer}>
                                                    <Text style={styles.currencySymbol}>₹</Text>
                                                    <TextInput
                                                        style={[styles.input, styles.priceInput, errors.chargePerPostMax && styles.inputError]}
                                                        value={formData.chargePerPostMax}
                                                        onChangeText={(text) => {
                                                            // Only allow numbers and decimal point
                                                            const numericText = text.replace(/[^0-9.]/g, '');
                                                            // Prevent multiple decimal points
                                                            const parts = numericText.split('.');
                                                            const formattedText = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericText;
                                                            setFormData(prev => ({ ...prev, chargePerPostMax: formattedText }));
                                                        }}
                                                        placeholder="Max amount"
                                                        placeholderTextColor={COLORS.grey}
                                                        keyboardType="decimal-pad"
                                                        returnKeyType="next"
                                                        blurOnSubmit={false}
                                                        maxLength={10}
                                                    />
                                                </View>
                                                {errors.chargePerPostMax && <Text style={styles.errorText}>{errors.chargePerPostMax}</Text>}
                                            </View>
                                        </View>
                                    </View>

                                    {/* Global Social Media Error */}
                                    {errors.socialMedia && (
                                        <Text style={[styles.errorText, { textAlign: 'center', marginBottom: 16, fontSize: 16 }]}>
                                            {errors.socialMedia}
                                        </Text>
                                    )}

                                    {/* --- Instagram Row --- */}
                                    <View style={styles.socialRow}>
                                        <View style={[styles.inputContainer, styles.socialInputContainer]} onLayout={captureFieldPosition('instagramLink')}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Ionicons name="logo-instagram" size={20} color="#E1306C" />
                                                <Text style={[styles.label, { marginBottom: 0, marginLeft: 6 }]}>Link</Text>
                                            </View>
                                            <View style={styles.instagramInputRow}>
                                                <TextInput
                                                    style={[styles.input, styles.instagramInput, errors.instagramLink && styles.inputError]}
                                                    value={formData.instagramLink}
                                                    onChangeText={(text) => setFormData(prev => ({ ...prev, instagramLink: text }))}
                                                    placeholder="https://instagram.com/..."
                                                    placeholderTextColor={COLORS.grey}
                                                    autoCapitalize="none"
                                                    keyboardType="url"
                                                    textContentType="URL"
                                                />
                                                <TouchableOpacity
                                                    style={[
                                                        styles.connectButton,
                                                        instagramConnectionStatus === 'connected' && styles.connectedButton,
                                                        isCheckingConnection && styles.connectButtonDisabled
                                                    ]}
                                                    onPress={() => {
                                                        if (isCheckingConnection) return;
                                                        if (instagramConnectionStatus === 'connected') checkInstagramConnection();
                                                        else handleInstagramConnect();
                                                    }}
                                                    activeOpacity={0.7}
                                                    disabled={isCheckingConnection}
                                                >
                                                    {isCheckingConnection ? (
                                                        <ActivityIndicator size="small" color={COLORS.background} />
                                                    ) : (
                                                        <Text style={[styles.connectButtonText, instagramConnectionStatus === 'connected' && styles.connectedButtonText]} numberOfLines={1}>
                                                            {instagramConnectionStatus === 'connected' ? '✓ Connected' : 'Connect'}
                                                        </Text>
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                            {errors.instagramLink && <Text style={styles.errorText}>{errors.instagramLink}</Text>}
                                        </View>
                                        <View style={[styles.inputContainer, styles.socialFollowerContainer]} onLayout={captureFieldPosition('instagramFollowers')}>
                                            <Text style={[styles.label, { marginBottom: 8, marginTop: 2 }]}>Followers</Text>
                                            <TextInput
                                                style={[styles.input, errors.instagramFollowers && styles.inputError]}
                                                value={formData.instagramFollowers}
                                                onChangeText={(text) => setFormData(prev => ({ ...prev, instagramFollowers: text.replace(/[^0-9]/g, '') }))}
                                                placeholder="10000"
                                                placeholderTextColor={COLORS.grey}
                                                keyboardType="numeric"
                                                maxLength={10}
                                            />
                                            {errors.instagramFollowers && <Text style={styles.errorText}>{errors.instagramFollowers}</Text>}
                                        </View>
                                    </View>

                                    {/* --- YouTube Row --- */}
                                    <View style={styles.socialRow}>
                                        <View style={[styles.inputContainer, styles.socialInputContainer]} onLayout={captureFieldPosition('youtubeLink')}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                                                <Text style={[styles.label, { marginBottom: 0, marginLeft: 6 }]}>Link</Text>
                                            </View>
                                            <TextInput
                                                style={[styles.input, errors.youtubeLink && styles.inputError]}
                                                value={formData.youtubeLink}
                                                onChangeText={(text) => setFormData(prev => ({ ...prev, youtubeLink: text }))}
                                                placeholder="https://youtube.com/..."
                                                placeholderTextColor={COLORS.grey}
                                                keyboardType="url"
                                                autoCapitalize="none"
                                                textContentType="URL"
                                            />
                                            {errors.youtubeLink && <Text style={styles.errorText}>{errors.youtubeLink}</Text>}
                                        </View>
                                        <View style={[styles.inputContainer, styles.socialFollowerContainer]} onLayout={captureFieldPosition('youtubeFollowers')}>
                                            <Text style={[styles.label, { marginBottom: 8, marginTop: 2 }]}>Subscribers</Text>
                                            <TextInput
                                                style={[styles.input, errors.youtubeFollowers && styles.inputError]}
                                                value={formData.youtubeFollowers}
                                                onChangeText={(text) => setFormData(prev => ({ ...prev, youtubeFollowers: text.replace(/[^0-9]/g, '') }))}
                                                placeholder="5000"
                                                placeholderTextColor={COLORS.grey}
                                                keyboardType="numeric"
                                                maxLength={10}
                                            />
                                            {errors.youtubeFollowers && <Text style={styles.errorText}>{errors.youtubeFollowers}</Text>}
                                        </View>
                                    </View>

                                    {/* --- Twitter / X Row --- */}
                                    <View style={styles.socialRow}>
                                        <View style={[styles.inputContainer, styles.socialInputContainer]} onLayout={captureFieldPosition('twitterLink')}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
                                                <Text style={[styles.label, { marginBottom: 0, marginLeft: 6 }]}>Link</Text>
                                            </View>
                                            <TextInput
                                                style={[styles.input, errors.twitterLink && styles.inputError]}
                                                value={formData.twitterLink}
                                                onChangeText={(text) => setFormData(prev => ({ ...prev, twitterLink: text }))}
                                                placeholder="https://x.com/..."
                                                placeholderTextColor={COLORS.grey}
                                                keyboardType="url"
                                                autoCapitalize="none"
                                                textContentType="URL"
                                            />
                                            {errors.twitterLink && <Text style={styles.errorText}>{errors.twitterLink}</Text>}
                                        </View>
                                        <View style={[styles.inputContainer, styles.socialFollowerContainer]} onLayout={captureFieldPosition('twitterFollowers')}>
                                            <Text style={[styles.label, { marginBottom: 8, marginTop: 2 }]}>Followers</Text>
                                            <TextInput
                                                style={[styles.input, errors.twitterFollowers && styles.inputError]}
                                                value={formData.twitterFollowers}
                                                onChangeText={(text) => setFormData(prev => ({ ...prev, twitterFollowers: text.replace(/[^0-9]/g, '') }))}
                                                placeholder="2000"
                                                placeholderTextColor={COLORS.grey}
                                                keyboardType="numeric"
                                                maxLength={10}
                                            />
                                            {errors.twitterFollowers && <Text style={styles.errorText}>{errors.twitterFollowers}</Text>}
                                        </View>
                                    </View>

                                    {/* --- LinkedIn Row --- */}
                                    <View style={styles.socialRow}>
                                        <View style={[styles.inputContainer, styles.socialInputContainer]} onLayout={captureFieldPosition('linkedinLink')}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Ionicons name="logo-linkedin" size={20} color="#0A66C2" />
                                                <Text style={[styles.label, { marginBottom: 0, marginLeft: 6 }]}>Link</Text>
                                            </View>
                                            <TextInput
                                                style={[styles.input, errors.linkedinLink && styles.inputError]}
                                                value={formData.linkedinLink}
                                                onChangeText={(text) => setFormData(prev => ({ ...prev, linkedinLink: text }))}
                                                placeholder="https://linkedin.com/in/..."
                                                placeholderTextColor={COLORS.grey}
                                                keyboardType="url"
                                                autoCapitalize="none"
                                                textContentType="URL"
                                            />
                                            {errors.linkedinLink && <Text style={styles.errorText}>{errors.linkedinLink}</Text>}
                                        </View>
                                        <View style={[styles.inputContainer, styles.socialFollowerContainer]} onLayout={captureFieldPosition('linkedinFollowers')}>
                                            <Text style={[styles.label, { marginBottom: 8, marginTop: 2 }]}>Connections</Text>
                                            <TextInput
                                                style={[styles.input, errors.linkedinFollowers && styles.inputError]}
                                                value={formData.linkedinFollowers}
                                                onChangeText={(text) => setFormData(prev => ({ ...prev, linkedinFollowers: text.replace(/[^0-9]/g, '') }))}
                                                placeholder="500"
                                                placeholderTextColor={COLORS.grey}
                                                keyboardType="numeric"
                                                maxLength={10}
                                            />
                                            {errors.linkedinFollowers && <Text style={styles.errorText}>{errors.linkedinFollowers}</Text>}
                                        </View>
                                    </View>

                                    {/* --- TikTok Row --- */}
                                    <View style={styles.socialRow}>
                                        <View style={[styles.inputContainer, styles.socialInputContainer]} onLayout={captureFieldPosition('tiktokLink')}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Ionicons name="logo-tiktok" size={20} color="#FE2C55" />
                                                <Text style={[styles.label, { marginBottom: 0, marginLeft: 6 }]}>Link</Text>
                                            </View>
                                            <TextInput
                                                style={[styles.input, errors.tiktokLink && styles.inputError]}
                                                value={formData.tiktokLink}
                                                onChangeText={(text) => setFormData(prev => ({ ...prev, tiktokLink: text }))}
                                                placeholder="https://tiktok.com/@..."
                                                placeholderTextColor={COLORS.grey}
                                                keyboardType="url"
                                                autoCapitalize="none"
                                                textContentType="URL"
                                            />
                                            {errors.tiktokLink && <Text style={styles.errorText}>{errors.tiktokLink}</Text>}
                                        </View>
                                        <View style={[styles.inputContainer, styles.socialFollowerContainer]} onLayout={captureFieldPosition('tiktokFollowers')}>
                                            <Text style={[styles.label, { marginBottom: 8, marginTop: 2 }]}>Followers</Text>
                                            <TextInput
                                                style={[styles.input, errors.tiktokFollowers && styles.inputError]}
                                                value={formData.tiktokFollowers}
                                                onChangeText={(text) => setFormData(prev => ({ ...prev, tiktokFollowers: text.replace(/[^0-9]/g, '') }))}
                                                placeholder="10000"
                                                placeholderTextColor={COLORS.grey}
                                                keyboardType="numeric"
                                                maxLength={10}
                                            />
                                            {errors.tiktokFollowers && <Text style={styles.errorText}>{errors.tiktokFollowers}</Text>}
                                        </View>
                                    </View>

                                    {/* Save Status Message */}
                                    {saveStatus !== 'idle' && (
                                        <View style={[styles.statusMessageContainer,
                                        saveStatus === 'success' ? styles.successMessage : styles.errorMessage]}>
                                            <Text style={styles.statusMessageText}>{saveMessage}</Text>
                                        </View>
                                    )}

                                    {/* Save Button */}
                                    <View style={styles.saveButtonContainer}>
                                        <TouchableOpacity
                                            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                                            onPress={handleSave}
                                            activeOpacity={0.8}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <View style={styles.loadingContainer}>
                                                    <ActivityIndicator size="small" color={COLORS.background} />
                                                    <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>Saving...</Text>
                                                </View>
                                            ) : saveStatus === 'success' ? (
                                                <Text style={styles.saveButtonText}>✅ Saved Successfully!</Text>
                                            ) : (
                                                <Text style={styles.saveButtonText}>Save Details</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ScrollView>
                        )}
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};



export default CreatorScreen;


