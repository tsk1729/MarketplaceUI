import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { marketapi } from '../../utils/api';
import { isAuthenticated } from '../utils/auth';
import { styles } from './styles';

interface FormData {
    companyName: string;
    domain: string;
    pincode: string;
    gmail: string;
    website: string;
    contactPerson: string;
    mobile: string;
    address: string;
    companySize: string;
    budgetRangeMin: string;
    budgetRangeMax: string;
    industries: string[];
    preferredPlatforms: string[];
    description: string;
}

const AgencyScreen = () => {
    const [formData, setFormData] = useState<FormData>({
        companyName: '',
        domain: '',
        pincode: '',
        gmail: '',
        website: '',
        contactPerson: '',
        mobile: '',
        address: '',
        companySize: '',
        budgetRangeMin: '',
        budgetRangeMax: '',
        industries: [],
        preferredPlatforms: [],
        description: ''
    });
    const [industryInput, setIndustryInput] = useState('');
    const [platformInput, setPlatformInput] = useState('');
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [saveMessage, setSaveMessage] = useState('');

    const validateForm = (): boolean => {
        const newErrors: {[key: string]: string} = {};

        // Company Name validation (min 3 characters)
        if (formData.companyName.length < 3) {
            newErrors.companyName = 'Company name must be at least 3 characters long';
        }

        // Domain validation
        if (formData.domain.trim().length < 3) {
            newErrors.domain = 'Domain/Industry must be at least 3 characters long';
        }

        // Contact Person validation (min 3 characters)
        if (formData.contactPerson.length < 3) {
            newErrors.contactPerson = 'Contact person name must be at least 3 characters long';
        }

        // Mobile validation (10 digits)
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(formData.mobile)) {
            newErrors.mobile = 'Mobile number must be exactly 10 digits';
        }

        // Gmail validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.gmail)) {
            newErrors.gmail = 'Please enter a valid email address';
        }

        // Website validation (optional but if provided, should be valid URL)
        if (formData.website.trim()) {
            const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            if (!urlRegex.test(formData.website)) {
                newErrors.website = 'Please enter a valid website URL';
            }
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

        // Company Size validation
        if (!formData.companySize.trim()) {
            newErrors.companySize = 'Please select company size';
        }

        // Budget range validation
        if (!formData.budgetRangeMin.trim()) {
            newErrors.budgetRangeMin = 'Please enter minimum budget';
        } else {
            const minAmount = parseFloat(formData.budgetRangeMin);
            if (isNaN(minAmount) || minAmount <= 0) {
                newErrors.budgetRangeMin = 'Please enter a valid amount greater than 0';
            }
        }

        if (!formData.budgetRangeMax.trim()) {
            newErrors.budgetRangeMax = 'Please enter maximum budget';
        } else {
            const maxAmount = parseFloat(formData.budgetRangeMax);
            if (isNaN(maxAmount) || maxAmount <= 0) {
                newErrors.budgetRangeMax = 'Please enter a valid amount greater than 0';
            }
        }

        // Cross-validation: max should be greater than or equal to min
        if (formData.budgetRangeMin.trim() && formData.budgetRangeMax.trim()) {
            const minAmount = parseFloat(formData.budgetRangeMin);
            const maxAmount = parseFloat(formData.budgetRangeMax);
            if (!isNaN(minAmount) && !isNaN(maxAmount) && maxAmount < minAmount) {
                newErrors.budgetRangeMax = 'Maximum budget should be greater than or equal to minimum budget';
            }
        }

        // Industries validation
        if (formData.industries.length === 0) {
            newErrors.industries = 'Please add at least one industry you work with';
        }

        // Preferred platforms validation
        if (formData.preferredPlatforms.length === 0) {
            newErrors.preferredPlatforms = 'Please add at least one preferred platform';
        }

        // Description validation
        if (formData.description.trim().length < 20) {
            newErrors.description = 'Description must be at least 20 characters long';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const addIndustry = () => {
        if (industryInput.trim() && !formData.industries.includes(industryInput.trim())) {
            setFormData(prev => ({
                ...prev,
                industries: [...prev.industries, industryInput.trim()]
            }));
            setIndustryInput('');
        }
    };

    const removeIndustry = (industry: string) => {
        setFormData(prev => ({
            ...prev,
            industries: prev.industries.filter(ind => ind !== industry)
        }));
    };

    const addPlatform = () => {
        if (platformInput.trim() && !formData.preferredPlatforms.includes(platformInput.trim())) {
            setFormData(prev => ({
                ...prev,
                preferredPlatforms: [...prev.preferredPlatforms, platformInput.trim()]
            }));
            setPlatformInput('');
        }
    };

    const removePlatform = (platform: string) => {
        setFormData(prev => ({
            ...prev,
            preferredPlatforms: prev.preferredPlatforms.filter(plat => plat !== platform)
        }));
    };

    // Fetch existing agency data
    const fetchAgencyData = async () => {
        try {
            setIsLoadingData(true);
            
            // Get user ID from authentication
            const authResult = await isAuthenticated();
            
            if (!authResult.isAuthenticated || !authResult.userId) {
                console.log('User not authenticated, skipping data fetch');
                setIsLoadingData(false);
                return;
            }

            console.log('Fetching agency data for user:', authResult.userId);
            const response = await marketapi.get(`agency?user_id=${authResult.userId}`);
            
            if (response.success && response.data) {
                console.log('Agency data fetched:', response.data);
                
                // Pre-fill form with existing data
                const agencyData = response.data;
                setFormData({
                    companyName: agencyData.companyName || '',
                    domain: agencyData.domain || '',
                    pincode: agencyData.pincode || '',
                    gmail: agencyData.gmail || '',
                    website: agencyData.website || '',
                    contactPerson: agencyData.contactPerson || '',
                    mobile: agencyData.mobile || '',
                    address: agencyData.address || '',
                    companySize: agencyData.companySize || '',
                    budgetRangeMin: agencyData.budgetRangeMin || '',
                    budgetRangeMax: agencyData.budgetRangeMax || '',
                    industries: agencyData.industries || [],
                    preferredPlatforms: agencyData.preferredPlatforms || [],
                    description: agencyData.description || '',
                });
            } else {
                console.log('No existing agency data found or error:', response.message);
            }
        } catch (error) {
            console.error('Error fetching agency data:', error);
        } finally {
            setIsLoadingData(false);
        }
    };

    // Fetch data when component mounts
    useEffect(() => {
        fetchAgencyData();
    }, []);

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        
        try {
            const authResult = await isAuthenticated();
            
            if (!authResult.isAuthenticated || !authResult.userId) {
                setSaveStatus('error');
                setSaveMessage('🔐 Please log in to save your agency details.');
                setIsLoading(false);
                
                setTimeout(() => {
                    setSaveStatus('idle');
                    setSaveMessage('');
                }, 5000);
                return;
            }
            
            const payload = {
                data: {
                    companyName: formData.companyName,
                    domain: formData.domain,
                    pincode: formData.pincode,
                    gmail: formData.gmail,
                    website: formData.website || undefined,
                    contactPerson: formData.contactPerson,
                    mobile: formData.mobile,
                    address: formData.address,
                    companySize: formData.companySize,
                    budgetRangeMin: formData.budgetRangeMin,
                    budgetRangeMax: formData.budgetRangeMax,
                    industries: formData.industries,
                    preferredPlatforms: formData.preferredPlatforms,
                    description: formData.description,
                },
                user_id: authResult.userId
            };

            const response = await marketapi.post('agency', payload);
            
            if (response.success) {
                setSaveStatus('success');
                setSaveMessage('🎉 Congratulations! Your agency is now registered in the Owlit Marketplace. You will start connecting with talented creators soon!');
                
                setTimeout(() => {
                    setSaveStatus('idle');
                    setSaveMessage('');
                }, 5000);
            } else {
                setSaveStatus('error');
                setSaveMessage('❌ ' + (response.message || 'Failed to save details. Please try again.'));
                
                setTimeout(() => {
                    setSaveStatus('idle');
                    setSaveMessage('');
                }, 5000);
            }
        } catch (error) {
            setSaveStatus('error');
            setSaveMessage('❌ An unexpected error occurred. Please check your connection and try again.');
            
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
                                <Text style={styles.loadingText}>Loading your agency details...</Text>
                            </View>
                        ) : (
                        <ScrollView 
                            style={styles.scrollView} 
                            contentContainerStyle={styles.scrollViewContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                    <View style={styles.content}>
                                <Text style={styles.title}>Agency Details</Text>
                                <Text style={styles.subtitle}>Register your agency in the marketplace</Text>

                                {/* Company Name Field */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Company Name</Text>
                                    <TextInput
                                        style={[styles.input, errors.companyName && styles.inputError]}
                                        value={formData.companyName}
                                        onChangeText={(text) => setFormData(prev => ({...prev, companyName: text}))}
                                        placeholder="Enter your company name"
                                        placeholderTextColor={COLORS.grey}
                                    />
                                    {errors.companyName && <Text style={styles.errorText}>{errors.companyName}</Text>}
                                </View>

                                {/* Domain Field */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Domain/Industry</Text>
                                    <TextInput
                                        style={[styles.input, errors.domain && styles.inputError]}
                                        value={formData.domain}
                                        onChangeText={(text) => setFormData(prev => ({...prev, domain: text}))}
                                        placeholder="e.g., Digital Marketing, Advertising, PR"
                                        placeholderTextColor={COLORS.grey}
                                    />
                                    {errors.domain && <Text style={styles.errorText}>{errors.domain}</Text>}
                                </View>

                                {/* Contact Person Field */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Contact Person</Text>
                                    <TextInput
                                        style={[styles.input, errors.contactPerson && styles.inputError]}
                                        value={formData.contactPerson}
                                        onChangeText={(text) => setFormData(prev => ({...prev, contactPerson: text}))}
                                        placeholder="Enter contact person name"
                                        placeholderTextColor={COLORS.grey}
                                    />
                                    {errors.contactPerson && <Text style={styles.errorText}>{errors.contactPerson}</Text>}
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
                                    />
                                    {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
                                </View>

                                {/* Gmail Field */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Email</Text>
                                    <TextInput
                                        style={[styles.input, errors.gmail && styles.inputError]}
                                        value={formData.gmail}
                                        onChangeText={(text) => setFormData(prev => ({...prev, gmail: text}))}
                                        placeholder="Enter your business email"
                                        placeholderTextColor={COLORS.grey}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                    {errors.gmail && <Text style={styles.errorText}>{errors.gmail}</Text>}
                                </View>

                                {/* Website Field */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Website (Optional)</Text>
                                    <TextInput
                                        style={[styles.input, errors.website && styles.inputError]}
                                        value={formData.website}
                                        onChangeText={(text) => setFormData(prev => ({...prev, website: text}))}
                                        placeholder="https://yourcompany.com"
                                        placeholderTextColor={COLORS.grey}
                                        keyboardType="url"
                                        autoCapitalize="none"
                                    />
                                    {errors.website && <Text style={styles.errorText}>{errors.website}</Text>}
                                </View>

                                {/* Address Field */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Address</Text>
                                    <TextInput
                                        style={[styles.input, styles.addressInput, errors.address && styles.inputError]}
                                        value={formData.address}
                                        onChangeText={(text) => setFormData(prev => ({...prev, address: text}))}
                                        placeholder="Enter your company address"
                                        placeholderTextColor={COLORS.grey}
                                        multiline={true}
                                        numberOfLines={3}
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
                                    />
                                    {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
                                </View>

                                {/* Company Size Field */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Company Size</Text>
                                    <View style={styles.companySizeContainer}>
                                        {['1-10', '11-50', '51-200', '201-500', '500+'].map((size) => (
                                            <TouchableOpacity
                                                key={size}
                                                style={[
                                                    styles.companySizeOption,
                                                    formData.companySize === size && styles.companySizeSelected
                                                ]}
                                                onPress={() => setFormData(prev => ({...prev, companySize: size}))}
                                            >
                                                <Text style={[
                                                    styles.companySizeText,
                                                    formData.companySize === size && styles.companySizeTextSelected
                                                ]}>
                                                    {size}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {errors.companySize && <Text style={styles.errorText}>{errors.companySize}</Text>}
                                </View>

                                {/* Budget Range Field */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Monthly Marketing Budget Range</Text>
                                    <Text style={styles.warningText}>(This helps creators understand your project scale)</Text>
                                    
                                    <View style={styles.priceRangeContainer}>
                                        {/* Minimum Budget */}
                                        <View style={styles.priceInputWrapper}>
                                            <Text style={styles.rangeLabel}>Min</Text>
                                            <View style={styles.priceInputContainer}>
                                                <Text style={styles.currencySymbol}>₹</Text>
                                                <TextInput
                                                    style={[styles.input, styles.priceInput, errors.budgetRangeMin && styles.inputError]}
                                                    value={formData.budgetRangeMin}
                                                    onChangeText={(text) => {
                                                        const numericText = text.replace(/[^0-9.]/g, '');
                                                        const parts = numericText.split('.');
                                                        const formattedText = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericText;
                                                        setFormData(prev => ({...prev, budgetRangeMin: formattedText}));
                                                    }}
                                                    placeholder="Min budget"
                                                    placeholderTextColor={COLORS.grey}
                                                    keyboardType="decimal-pad"
                                                    maxLength={10}
                                                />
                                            </View>
                                            {errors.budgetRangeMin && <Text style={styles.errorText}>{errors.budgetRangeMin}</Text>}
                                        </View>

                                        {/* Range Separator */}
                                        <View style={styles.rangeSeparator}>
                                            <Text style={styles.separatorText}>to</Text>
                                        </View>

                                        {/* Maximum Budget */}
                                        <View style={styles.priceInputWrapper}>
                                            <Text style={styles.rangeLabel}>Max</Text>
                                            <View style={styles.priceInputContainer}>
                                                <Text style={styles.currencySymbol}>₹</Text>
                                                <TextInput
                                                    style={[styles.input, styles.priceInput, errors.budgetRangeMax && styles.inputError]}
                                                    value={formData.budgetRangeMax}
                                                    onChangeText={(text) => {
                                                        const numericText = text.replace(/[^0-9.]/g, '');
                                                        const parts = numericText.split('.');
                                                        const formattedText = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericText;
                                                        setFormData(prev => ({...prev, budgetRangeMax: formattedText}));
                                                    }}
                                                    placeholder="Max budget"
                                                    placeholderTextColor={COLORS.grey}
                                                    keyboardType="decimal-pad"
                                                    maxLength={10}
                                                />
                                            </View>
                                            {errors.budgetRangeMax && <Text style={styles.errorText}>{errors.budgetRangeMax}</Text>}
                                        </View>
                                    </View>
                                </View>

                                {/* Industries Field */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Industries You Work With</Text>
                                    <View style={styles.languageInputRow}>
                                        <TextInput
                                            style={[styles.input, styles.languageInput]}
                                            value={industryInput}
                                            onChangeText={setIndustryInput}
                                            placeholder="e.g., Fashion, Tech, Food"
                                            placeholderTextColor={COLORS.grey}
                                            onSubmitEditing={addIndustry}
                                        />
                                        <TouchableOpacity 
                                            style={[styles.addButton, !industryInput.trim() && styles.addButtonDisabled]} 
                                            onPress={addIndustry}
                                            disabled={!industryInput.trim()}
                                        >
                                            <Text style={[styles.addButtonText, !industryInput.trim() && styles.addButtonTextDisabled]}>Add</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {errors.industries && <Text style={styles.errorText}>{errors.industries}</Text>}
                                    
                                    {/* Industry Tags */}
                                    {formData.industries.length > 0 && (
                                        <View style={styles.languageTags}>
                                            {formData.industries.map((industry, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    style={styles.languageTag}
                                                    onPress={() => removeIndustry(industry)}
                                                >
                                                    <Text style={styles.languageTagText}>{industry}</Text>
                                                    <Text style={styles.removeTagText}> ×</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {/* Preferred Platforms Field */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Preferred Platforms</Text>
                                    <View style={styles.languageInputRow}>
                                        <TextInput
                                            style={[styles.input, styles.languageInput]}
                                            value={platformInput}
                                            onChangeText={setPlatformInput}
                                            placeholder="e.g., Instagram, YouTube, TikTok"
                                            placeholderTextColor={COLORS.grey}
                                            onSubmitEditing={addPlatform}
                                        />
                                        <TouchableOpacity 
                                            style={[styles.addButton, !platformInput.trim() && styles.addButtonDisabled]} 
                                            onPress={addPlatform}
                                            disabled={!platformInput.trim()}
                                        >
                                            <Text style={[styles.addButtonText, !platformInput.trim() && styles.addButtonTextDisabled]}>Add</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {errors.preferredPlatforms && <Text style={styles.errorText}>{errors.preferredPlatforms}</Text>}
                                    
                                    {/* Platform Tags */}
                                    {formData.preferredPlatforms.length > 0 && (
                                        <View style={styles.languageTags}>
                                            {formData.preferredPlatforms.map((platform, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    style={styles.languageTag}
                                                    onPress={() => removePlatform(platform)}
                                                >
                                                    <Text style={styles.languageTagText}>{platform}</Text>
                                                    <Text style={styles.removeTagText}> ×</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {/* Description Field */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Company Description</Text>
                                    <TextInput
                                        style={[styles.input, styles.descriptionInput, errors.description && styles.inputError]}
                                        value={formData.description}
                                        onChangeText={(text) => setFormData(prev => ({...prev, description: text}))}
                                        placeholder="Tell creators about your company, services, and what makes you unique..."
                                        placeholderTextColor={COLORS.grey}
                                        multiline={true}
                                        numberOfLines={5}
                                        textAlignVertical="top"
                                    />
                                    {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
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
                                    <Text style={styles.saveButtonText}>Register Agency</Text>
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

export default AgencyScreen;
