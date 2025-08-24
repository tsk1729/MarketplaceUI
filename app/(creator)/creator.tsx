import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { marketapi, mainapi } from '../../utils/api';
import { isAuthenticated } from '../utils/auth';
import { styles } from './styles';

interface FormData {
    name: string;
    mobile: string;
    gmail: string;
    address: string;
    pincode: string;
    languages: string[];
    chargePerPostMin: string;
    chargePerPostMax: string;
    instagramId: string;
    youtubeLink: string;
    twitterLink: string;
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
        instagramId: '',
        youtubeLink: '',
        twitterLink: ''
    });
    const [languageInput, setLanguageInput] = useState('');
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [saveMessage, setSaveMessage] = useState('');
    const [instagramConnectionStatus, setInstagramConnectionStatus] = useState<'loading' | 'connected' | 'not_connected'>('loading');
    const [isCheckingConnection, setIsCheckingConnection] = useState(false);

    const validateForm = (): boolean => {
        const newErrors: {[key: string]: string} = {};

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

        // Instagram ID validation (optional but if provided, should be valid format)
        if (formData.instagramId.trim() && !/^[a-zA-Z0-9._]+$/.test(formData.instagramId)) {
            newErrors.instagramId = 'Instagram ID can only contain letters, numbers, dots, and underscores';
        }

        // YouTube link validation (optional but if provided, should be valid YouTube URL)
        if (formData.youtubeLink.trim()) {
            const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(channel\/|c\/|user\/|@)|youtu\.be\/)/;
            if (!youtubeRegex.test(formData.youtubeLink)) {
                newErrors.youtubeLink = 'Please enter a valid YouTube channel URL';
            }
        }

        // Twitter link validation (optional but if provided, should be valid Twitter URL)
        if (formData.twitterLink.trim()) {
            const twitterRegex = /^(https?:\/\/)?(www\.)?(twitter\.com\/|x\.com\/)/;
            if (!twitterRegex.test(formData.twitterLink)) {
                newErrors.twitterLink = 'Please enter a valid Twitter/X profile URL';
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
            const response = await marketapi.get(`creator?user_id=${authResult.userId}`);
            
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
                    instagramId: creatorData.instagramId || '',
                    youtubeLink: creatorData.youtubeLink || '',
                    twitterLink: creatorData.twitterLink || '',
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
                setSaveMessage('🔐 Please log in to save your creator details.');
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
                    instagramId: formData.instagramId,
                    youtubeLink: formData.youtubeLink || undefined,
                    twitterLink: formData.twitterLink || undefined,
                },
                user_id: authResult.userId
            };

            console.log('Sending payload:', payload);
            const response = await marketapi.post('creator', payload);
            
            console.log('Full API response:', response);
            console.log('Response success:', response.success);
            console.log('Response data:', response.data);
            
            if (response.success) {
                console.log('Save successful');
                setSaveStatus('success');
                setSaveMessage('🎉 Congratulations! You are now in the Owlit Marketplace. Soon you will start getting ad-agencies very quickly!');
                console.log('Creator details saved:', response.data);
                
                // Auto-hide success message after 5 seconds (longer for congratulations message)
                setTimeout(() => {
                    setSaveStatus('idle');
                    setSaveMessage('');
                }, 5000);
            } else {
                console.log('Save failed');
                setSaveStatus('error');
                setSaveMessage('❌ ' + (response.message || 'Failed to save details. Please try again.'));
                console.error('API Error:', response.message);
                
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
                            style={styles.scrollView} 
                            contentContainerStyle={styles.scrollViewContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            bounces={true}
                            overScrollMode="always"
                        >
                    <View style={styles.content}>
                                <Text style={styles.title}>Creator Details</Text>
                                <Text style={styles.subtitle}>Please fill in your information</Text>

                                {/* Name Field */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Name</Text>
                                    <TextInput
                                        style={[styles.input, errors.name && styles.inputError]}
                                        value={formData.name}
                                        onChangeText={(text) => setFormData(prev => ({...prev, name: text}))}
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
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Mobile Number</Text>
                                    <TextInput
                                        style={[styles.input, errors.mobile && styles.inputError]}
                                        value={formData.mobile}
                                        onChangeText={(text) => setFormData(prev => ({...prev, mobile: text}))}
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
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Gmail</Text>
                                    <TextInput
                                        style={[styles.input, errors.gmail && styles.inputError]}
                                        value={formData.gmail}
                                        onChangeText={(text) => setFormData(prev => ({...prev, gmail: text}))}
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
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Address</Text>
                                    <TextInput
                                        style={[styles.input, styles.addressInput, errors.address && styles.inputError]}
                                        value={formData.address}
                                        onChangeText={(text) => setFormData(prev => ({...prev, address: text}))}
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
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Pincode</Text>
                                    <TextInput
                                        style={[styles.input, errors.pincode && styles.inputError]}
                                        value={formData.pincode}
                                        onChangeText={(text) => setFormData(prev => ({...prev, pincode: text}))}
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
                                <View style={styles.inputContainer}>
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
                                <View style={styles.inputContainer}>
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
                                                        setFormData(prev => ({...prev, chargePerPostMin: formattedText}));
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
                                                        setFormData(prev => ({...prev, chargePerPostMax: formattedText}));
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

                                {/* Instagram ID Field */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Instagram ID (Optional)</Text>
                                    <View style={styles.instagramInputRow}>
                                        <TextInput
                                            style={[styles.input, styles.instagramInput, errors.instagramId && styles.inputError]}
                                            value={formData.instagramId}
                                            onChangeText={(text) => setFormData(prev => ({...prev, instagramId: text}))}
                                            placeholder="@your_instagram_handle"
                                            placeholderTextColor={COLORS.grey}
                                            autoCapitalize="none"
                                            returnKeyType="next"
                                            blurOnSubmit={false}
                                            autoCorrect={false}
                                            textContentType="username"
                                        />
                                        <TouchableOpacity 
                                            style={[
                                                styles.connectButton,
                                                instagramConnectionStatus === 'connected' && styles.connectedButton,
                                                isCheckingConnection && styles.connectButtonDisabled
                                            ]} 
                                            onPress={() => {
                                                console.log('Connect button pressed, status:', instagramConnectionStatus);
                                                console.log('isCheckingConnection:', isCheckingConnection);
                                                
                                                if (isCheckingConnection) {
                                                    console.log('Button is disabled due to checking connection');
                                                    return;
                                                }
                                                
                                                if (instagramConnectionStatus === 'connected') {
                                                    console.log('Status is connected, checking connection...');
                                                    checkInstagramConnection();
                                                } else {
                                                    console.log('Status is not connected, starting Instagram connect...');
                                                    handleInstagramConnect();
                                                }
                                            }}
                                            activeOpacity={0.7}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            disabled={isCheckingConnection}
                                        >
                                            {isCheckingConnection ? (
                                                <ActivityIndicator size="small" color={COLORS.background} />
                                            ) : (
                                                <Text style={[
                                                    styles.connectButtonText,
                                                    instagramConnectionStatus === 'connected' && styles.connectedButtonText
                                                ]}>
                                                    {instagramConnectionStatus === 'connected' ? '✓ Connected' : 'Connect'}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                    {errors.instagramId && <Text style={styles.errorText}>{errors.instagramId}</Text>}
                                </View>

                                {/* YouTube Link Field */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>YouTube Channel (Optional)</Text>
                                    <TextInput
                                        style={[styles.input, errors.youtubeLink && styles.inputError]}
                                        value={formData.youtubeLink}
                                        onChangeText={(text) => setFormData(prev => ({...prev, youtubeLink: text}))}
                                        placeholder="https://youtube.com/channel/your-channel"
                                        placeholderTextColor={COLORS.grey}
                                        keyboardType="url"
                                        autoCapitalize="none"
                                        returnKeyType="next"
                                        blurOnSubmit={false}
                                        autoCorrect={false}
                                        textContentType="URL"
                                        autoComplete="url"
                                    />
                                    {errors.youtubeLink && <Text style={styles.errorText}>{errors.youtubeLink}</Text>}
                                </View>

                                {/* Twitter Link Field */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Twitter/X Profile (Optional)</Text>
                                    <TextInput
                                        style={[styles.input, errors.twitterLink && styles.inputError]}
                                        value={formData.twitterLink}
                                        onChangeText={(text) => setFormData(prev => ({...prev, twitterLink: text}))}
                                        placeholder="https://twitter.com/your_handle or https://x.com/your_handle"
                                        placeholderTextColor={COLORS.grey}
                                        keyboardType="url"
                                        autoCapitalize="none"
                                        returnKeyType="done"
                                        blurOnSubmit={false}
                                        autoCorrect={false}
                                        textContentType="URL"
                                        autoComplete="url"
                                    />
                                    {errors.twitterLink && <Text style={styles.errorText}>{errors.twitterLink}</Text>}
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


