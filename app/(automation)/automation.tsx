import api from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, Animated, Switch } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import {styles} from "@/app/(automation)/styles";
import {previewStyles} from "@/app/(automation)/previewStyles";

export const COLORS = {
    primary: "#4ADE80",
    secondary: "#2DD4BF",
    background: "#000000",
    surface: "#1A1A1A",
    surfaceLight: "#2A2A2A",
    white: "#FFFFFF",
    grey: "#9CA3AF",
    instagram: {
        purple: "#833AB4",
        pink: "#C13584",
        red: "#E1306C",
        orange: "#FD1D1D",
        yellow: "#FCAF45",
        blue: "#405DE6",
        blueBubble: "#0095F6"
    }
} as const;

const AVATAR1 = 'https://randomuser.me/api/portraits/men/32.jpg';
const AVATAR2 = 'https://randomuser.me/api/portraits/men/44.jpg';
const AVATAR3 = 'https://randomuser.me/api/portraits/women/68.jpg';

const DEFAULT_VALUES = {
    commentReply: 'Thank you for your interest! Check your DM for exclusive content 📸',
    directMessage: "Hey! Thanks for your comment!\nHere's your exclusive link:",
    linkLabel: 'RTC Label Pdf',
    linkToSend: 'https://example.com/special-offer',
    triggerSubstring: ''
};

const PLACEHOLDER_HINTS = {
    commentReply: 'Example: "Thanks for your comment! Check your DM for exclusive content 📸"',
    directMessage: 'Example: "Hey! Thanks for your comment!\nHere\'s your exclusive link:"',
    linkLabel: 'Example: "Download PDF" or "Get Started"',
    linkToSend: 'Example: "https://your-domain.com/special-offer"',
    triggerSubstring: 'Example: "interested" or "how to"'
};

// Utility functions to normalize params
function getStringParam(param: string | string[] | undefined, fallback = ''): string {
    if (Array.isArray(param)) return param[0] || fallback;
    if (typeof param === 'string') return param;
    return fallback;
}
function getBooleanParam(param: string | string[] | undefined): boolean {
    if (Array.isArray(param)) return param[0] === 'true';
    return param === 'true';
}

const AutomationSettingsScreen = () => {
    const params = useLocalSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(true);
    const [notification, setNotification] = useState<{show: boolean, type: 'success' | 'error', message: string}>({
        show: false,
        type: 'success',
        message: ''
    });
    const modalFadeAnim = React.useRef(new Animated.Value(0)).current;
    const screenFadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(50)).current;
    console.log('Received params:', params); // For debugging

    // Screen entry animation
    useEffect(() => {
        Animated.parallel([
            Animated.timing(screenFadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Custom notification function
    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ show: true, type, message });
        // Fade in animation
        Animated.timing(modalFadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const hideNotification = (callback?: () => void) => {
        // Fade out animation
        Animated.timing(modalFadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start(() => {
            setNotification({ show: false, type: 'success', message: '' });
            if (callback) {
                // Small delay to ensure modal is fully closed before navigation
                setTimeout(() => {
                    callback();
                }, 50);
            }
        });
    };

    useEffect(() => {
        const checkSubscription = async () => {
            try {
                const response = await api.post('paid_subscriber', params.id);
                setIsSubscribed(response.success);
            } catch (error) {
                console.error('Error checking subscription:', error);
                setIsSubscribed(false);
            }
        };

        checkSubscription();
    }, [params.id]);

    useEffect(() => {
        const checkAuthorization = async () => {
            try {
                const response = await api.post('authorized_subscriber', params.id);
                setIsAuthorized(response.success);
            } catch (error) {
                console.error('Error checking authorization:', error);
                setIsAuthorized(false);
            }
        };

        checkAuthorization();
    }, [params.id]);

    const [commentReply, setCommentReply] = useState(getStringParam(params.botComment));
    const [directMessage, setDirectMessage] = useState(getStringParam(params.botMessage));
    const [linkLabel, setLinkLabel] = useState(getStringParam(params.botLinkLabel));
    const [linkToSend, setLinkToSend] = useState(getStringParam(params.botLink));
    const [triggerSubstring, setTriggerSubstring] = useState(getStringParam(params.subString));
    const [useRag, setUseRag] = useState(getBooleanParam(params.useRag));
    const [automatedDm, setAutomatedDm] = useState(getBooleanParam(params.automatedDmFlag));
    const [automatedComment, setAutomatedComment] = useState(getBooleanParam(params.automatedCommentFlag));
    const [enableLink, setEnableLink] = useState(getBooleanParam(params.linkEnable));
    const [includeAiNotice, setIncludeAiNotice] = useState(getBooleanParam(params.includeAiNotice));
    const [fileName, setFileName] = useState(getStringParam(params.fileName));
    // const [useExistingResource, setUseExistingResource] = useState(false);
    const [useExistingResource, setUseExistingResource] = useState(Boolean(getStringParam(params.fileName)));

    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const handlePickFile = async () => {
        setFileError(null);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
                multiple: false,
            });
            if (result.canceled) return;
            if (result.assets && result.assets.length > 0) {
                setSelectedFile(result.assets[0]);
                setFileName(result.assets[0].name);
                setUseExistingResource(false);
            } else {
                setFileError('No file selected.');
            }
        } catch (e) {
            setFileError('Failed to pick file.');
        }
    };

    const handleClearFile = () => {
        setUseExistingResource(false);
        setSelectedFile(null);
        setFileError(null);
        setFileName(''); // Always clear fileName, regardless of source
    };

    const changeAutomatedDm = (value: boolean) => {
        setAutomatedDm(value);
        if (useRag && !value && !automatedComment) {
            setAutomatedComment(true);
        }
    };
    const changeAutomatedComment = (value: boolean) => {
        setAutomatedComment(value);
        if (useRag && !value && !automatedDm) {
            setAutomatedDm(true);
        }
    };
    console.log("List of all params:", params)

    const handleGoLive = async () => {
        if (!useRag){
            if (!triggerSubstring || triggerSubstring.trim() === ''){
                showNotification('error', 'Trigger Substring is required');
                return;
            }
            if (!directMessage || directMessage.trim() === ''){
                showNotification('error', 'Direct Message is required');
                return;
            }
            if (!commentReply || commentReply.trim() === ''){
                showNotification('error', 'Comment Reply is required');
                return;
            }
        }
        else{
            if (!useExistingResource && !selectedFile) {
                showNotification('error', 'File is required');
                return;
            }
            if (!automatedDm &&(!directMessage||directMessage.trim() === '')){
                showNotification('error', 'Direct Message is required');
                return;
            }
            if (!automatedComment && (!commentReply || commentReply.trim() === '')){
                showNotification('error', 'Comment Reply is required');
                return;
            }
        }
        if (enableLink) {
            if (!linkLabel || linkLabel.trim() === '') {
                showNotification('error', 'Link Label is required');
                return;
            }
            if (!linkToSend || linkToSend.trim() === '') {
                showNotification('error', 'Link to Send is required');
                return;
            }
        }
        setIsLoading(true);
        try {
            const payload: any = {
                user_id: getStringParam(params.id),
                post_id: getStringParam(params.postId),
                use_rag: useRag,
                automated_dm_flag: automatedDm,
                automated_comment_flag: automatedComment,
                bot_message: directMessage,
                bot_comment: commentReply,
                link_enable: enableLink,
                bot_link: linkToSend,
                bot_link_label: linkLabel,
                include_ai_notice: includeAiNotice,
                use_existing_resource: useExistingResource
            };
            if (!useRag){
                payload.sub_string = triggerSubstring;
            }
            console.log("payload:", payload); // Debug log

            const response = await api.postMultipart(
                'subscribe_post_to_webhook',
                payload,
                selectedFile
                    ? { uri: selectedFile.uri, name: selectedFile.name, type: selectedFile.mimeType || 'application/pdf' }
                    : undefined
            );

            console.log('API Response:', response); // Debug log
            console.log('Response success:', response?.success); // Debug log

            // Check for success patterns
            const isSuccess = response && (
                response.success === true ||
                (response as any)?.status === 'success' ||
                (response as any)?.message === 'success'
            );

            if (isSuccess) {
                showNotification(
                    'success',
                    'Automation successful'
                );
            } else {
                showNotification(
                    'error',
                    'Something went wrong'
                );
            }
        } catch (error) {
            console.error('Error activating automation:', error);
            showNotification(
                'error',
                'Something went wrong'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleStopLive = async () => {

        try {
            const payload = {
                user_id: getStringParam(params.id),
                post_id: getStringParam(params.postId)
            };

            const response = await api.post('unsubscribe_post_to_webhook', payload);

            if (response.success) {
                // Reset all fields to default values
                // setCommentReply(DEFAULT_VALUES.commentReply);
                // setDirectMessage(DEFAULT_VALUES.directMessage);
                // setLinkLabel(DEFAULT_VALUES.linkLabel);
                // setLinkToSend(DEFAULT_VALUES.linkToSend);
                // setTriggerSubstring(DEFAULT_VALUES.triggerSubstring);

                showNotification(
                    'success',
                    'Automation has been stopped successfully!'
                );
            } else {
                showNotification(
                    'error',
                    'Failed to stop automation. Please try again.'
                );
            }
        } catch (error) {
            console.error('Error stopping automation:', error);
            showNotification(
                'error',
                'An error occurred while stopping automation. Please try again.'
            );
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
            <Animated.View style={[styles.header, {
                opacity: screenFadeAnim,
                transform: [{ translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, -20],
                }) }]
            }]}>
                <Text style={styles.title}>Automation Settings</Text>
                <LinearGradient
                    colors={[COLORS.instagram.purple, COLORS.instagram.pink, COLORS.instagram.red, COLORS.instagram.orange]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.stopLiveButton}
                >
                    <TouchableOpacity
                        style={styles.stopLiveTouchable}
                        onPress={handleStopLive}
                    >
                        <Text style={styles.stopLive}>Stop Live</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </Animated.View>

            {/* Loading Overlay */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.white} />
                    <Text style={styles.loadingText}>Activating Automation...</Text>
                </View>
            )}

            {/* Custom Modal Dialog */}
            {notification.show && (
                <Animated.View style={[styles.modalOverlay, { opacity: modalFadeAnim }]}>
                    <Animated.View style={[styles.modalContainer, {
                        opacity: modalFadeAnim,
                        transform: [{
                            scale: modalFadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.8, 1]
                            })
                        }]
                    }]}>
                        <Text style={styles.modalTitle}>
                            {notification.type === 'success' ? 'Success' : 'Error'}
                        </Text>
                        <Text style={styles.modalMessage}>
                            {notification.message}
                        </Text>
                        <LinearGradient
                            colors={[COLORS.instagram.purple, COLORS.instagram.pink, COLORS.instagram.red, COLORS.instagram.orange]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.modalButton}
                        >
                            <TouchableOpacity
                                style={styles.modalButtonTouchable}
                                onPress={() => {
                                    if (notification.type === 'success') {
                                        hideNotification(() => router.back());
                                    } else {
                                        hideNotification();
                                    }
                                }}
                            >
                                <Text style={styles.modalButtonText}>OK</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </Animated.View>
                </Animated.View>
            )}

            {/* Main horizontal layout for web, vertical for mobile */}
            <Animated.View style={[styles.mainContainer, {
                opacity: screenFadeAnim,
                transform: [{ translateY: slideAnim }]
            }]}>
                {/* Left: Fields */}
                <KeyboardAwareScrollView
                    style={styles.leftColumn}
                    contentContainerStyle={styles.leftColumnContent}
                    enableOnAndroid
                    extraScrollHeight={100}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
                    {!isAuthorized && (
                        <View style={styles.warningContainer}>
                            <Ionicons name="warning-outline" size={24} color={COLORS.instagram.orange} />
                            <Text style={styles.warningText}>You are not authorized to use automation features</Text>
                        </View>
                    )}

                    {/* Automation Options Switches */}
                    <Text style={styles.sectionHeader}>Automation Options</Text>
                    <View style={{ marginBottom: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                            <Text style={[styles.sectionTitle, { flex: 1, marginTop: 0, marginBottom: 0 }]}>Use Owlit Premium Smart AI</Text>
                            <Switch
                                value={useRag}
                                onValueChange={setUseRag}
                                trackColor={{ false: COLORS.surfaceLight, true: COLORS.instagram.blueBubble }}
                                thumbColor={useRag ? COLORS.white : COLORS.grey}
                            />
                        </View>
                        {(useRag)&&(<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                            <Text style={[styles.sectionTitle, { flex: 1, marginTop: 0, marginBottom: 0 }]}>Automated DM</Text>
                            <Switch
                                value={automatedDm}
                                onValueChange={changeAutomatedDm}
                                trackColor={{ false: COLORS.surfaceLight, true: COLORS.instagram.blueBubble }}
                                thumbColor={automatedDm ? COLORS.white : COLORS.grey}
                            />
                        </View>)}
                        {(useRag)&&(<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                                <Text style={[styles.sectionTitle, { flex: 1, marginTop: 0, marginBottom: 0 }]}>Automated Comment</Text>
                                <Switch
                                    value={automatedComment}
                                    onValueChange={changeAutomatedComment}
                                    trackColor={{ false: COLORS.surfaceLight, true: COLORS.instagram.blueBubble }}
                                    thumbColor={automatedComment ? COLORS.white : COLORS.grey}
                                />
                            </View>
                        )}

                        {(!useRag) &&(<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                            <Text style={[styles.sectionTitle, { flex: 1, marginTop: 0, marginBottom: 0 }]}>Enable Link</Text>
                            <Switch
                                value={enableLink}
                                onValueChange={setEnableLink}
                                trackColor={{ false: COLORS.surfaceLight, true: COLORS.instagram.blueBubble }}
                                thumbColor={enableLink ? COLORS.white : COLORS.grey}
                            />
                        </View>)}

                        {/*{(useRag) &&(<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>*/}
                        {/*    <Text style={[styles.sectionTitle, { flex: 1, marginTop: 0, marginBottom: 0 }]}>Use Existing Resource</Text>*/}
                        {/*    <Switch*/}
                        {/*        value={useExistingResource}*/}
                        {/*        onValueChange={setUseExistingResource}*/}
                        {/*        trackColor={{ false: COLORS.surfaceLight, true: COLORS.instagram.blueBubble }}*/}
                        {/*        thumbColor={useExistingResource ? COLORS.white : COLORS.grey}*/}
                        {/*    />*/}
                        {/*</View>)}*/}

                        {(useRag) && (<View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 14}}>
                                <Text style={[styles.sectionTitle, {flex: 1, marginTop: 0, marginBottom: 0}]}>Include powered by Owlit Smart-AI in automation responses</Text>
                                <Switch
                                    value={includeAiNotice}
                                    onValueChange={setIncludeAiNotice}
                                    trackColor={{false: COLORS.surfaceLight, true: COLORS.instagram.blueBubble}}
                                    thumbColor={includeAiNotice ? COLORS.white : COLORS.grey}
                                />
                            </View>
                        )}
                    </View>
                    {/* End Automation Options Switches */}

                    {!useRag && (
                        <>
                            <Text style={styles.sectionTitle}>Trigger Substring</Text>
                            <TextInput
                                placeholder={PLACEHOLDER_HINTS.triggerSubstring}
                                placeholderTextColor={COLORS.grey}
                                style={styles.input}
                                value={triggerSubstring}
                                onChangeText={setTriggerSubstring}
                            />
                            <Text style={styles.inputHint}>Bot will respond when this text appears in comments</Text>
                        </>
                    )}
                    {(useRag)&&(
                    <>
                    {/* File Picker Section */}
                    <Text style={styles.sectionTitle}>Upload Pdf File Only</Text>
                    <View style={{ marginBottom: 18 }}>
                        <TouchableOpacity
                            style={{
                                backgroundColor: COLORS.surface,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: COLORS.surfaceLight,
                                paddingVertical: 12,
                                paddingHorizontal: 18,
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 8,
                            }}
                            onPress={handlePickFile}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="document-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                            <Text style={{ color: COLORS.white, fontSize: 16, flex: 1 }}>
                                {fileName ? 'Change File' : 'Select File'}
                            </Text>
                        </TouchableOpacity>
                        {fileName && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                                <Text style={{ color: COLORS.white, fontSize: 15, flex: 1 }} numberOfLines={1}>
                                    {fileName}
                                </Text>
                                <TouchableOpacity onPress={handleClearFile} style={{ marginLeft: 8 }} accessibilityLabel="Cancel Upload">
                                    <Ionicons name="close" size={20} color={COLORS.instagram.red} />
                                </TouchableOpacity>
                            </View>
                        )}
                        {fileError && (
                            <Text style={{ color: COLORS.instagram.red, fontSize: 13, marginTop: 2 }}>{fileError}</Text>
                        )}
                    </View>
                    </>
                    )}

                    <Text style={styles.sectionTitle}>Response Configuration</Text>

                    {(!useRag || !automatedComment) && (
                        <>
                            <Text style={styles.label}>Comment Reply</Text>
                            <TextInput
                                placeholder={PLACEHOLDER_HINTS.commentReply}
                                placeholderTextColor={COLORS.grey}
                                style={[styles.input, styles.multilineInput]}
                                value={commentReply}
                                onChangeText={setCommentReply}
                                multiline
                                numberOfLines={3}
                            />
                        </>
                    )}

                    {(!useRag || !automatedDm) && (
                        <>
                            <Text style={styles.label}>Direct Message</Text>
                            <TextInput
                                placeholder={PLACEHOLDER_HINTS.directMessage}
                                placeholderTextColor={COLORS.grey}
                                style={[styles.input, styles.multilineInput]}
                                value={directMessage}
                                onChangeText={setDirectMessage}
                                multiline
                                numberOfLines={3}
                            />
                        </>
                    )}

                    {!useRag && enableLink && (
                        <>
                            <Text style={styles.label}>Link Label</Text>
                            <TextInput
                                placeholder={PLACEHOLDER_HINTS.linkLabel}
                                placeholderTextColor={COLORS.grey}
                                style={styles.input}
                                value={linkLabel}
                                onChangeText={setLinkLabel}
                            />
                            <Text style={styles.label}>Link to Send</Text>
                            <TextInput
                                placeholder={PLACEHOLDER_HINTS.linkToSend}
                                placeholderTextColor={COLORS.grey}
                                style={styles.input}
                                value={linkToSend}
                                onChangeText={setLinkToSend}
                            />
                        </>
                    )}

                    <LinearGradient
                        colors={[COLORS.instagram.purple, COLORS.instagram.pink, COLORS.instagram.red, COLORS.instagram.orange]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.goLiveButton, !isSubscribed && styles.disabledButton]}
                    >
                        <TouchableOpacity
                            style={styles.goLiveTouchable}
                            onPress={handleGoLive}
                            disabled={isLoading || !isSubscribed}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.goLiveText, !isSubscribed && styles.disabledText]}>
                                {isSubscribed ? 'Go Live' : 'Subscription Required'}
                            </Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </KeyboardAwareScrollView>

                {/* Divider */}
                <View style={styles.verticalDivider} />

                {/* Right: Live Preview */}
                <View style={styles.rightColumn}>
                    <Text style={styles.sectionTitle}>Live Preview</Text>

                    {/* Preview Card 1 */}
                    <View style={previewStyles.previewCard}>
                        <View style={previewStyles.previewRow}>
                            <Image source={{ uri: AVATAR1 }} style={previewStyles.avatar} />
                            <View style={{ flex: 1 }}>
                                <Text style={previewStyles.previewUserText}>user.name</Text>
                                <Text style={previewStyles.previewCommentText}>This is an amazing post! #photography</Text>
                            </View>
                        </View>
                        <View style={[previewStyles.previewRow, { marginTop: 8 }]}>
                            <Image source={{ uri: AVATAR2 }} style={previewStyles.avatar} />
                            <View style={{ flex: 1 }}>
                                <Text style={previewStyles.previewBotText}>your.bot</Text>
                                <Text style={previewStyles.previewBotMsgText}>
                                    {commentReply || DEFAULT_VALUES.commentReply}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Preview Card 2 */}
                    <View style={previewStyles.previewCard}>
                        <View style={previewStyles.previewRow}>
                            <Image source={{ uri: AVATAR3 }} style={previewStyles.avatar} />
                            <View style={{ flex: 1 }}>
                                <Text style={previewStyles.previewUserText}>user.name</Text>
                                <Text style={previewStyles.previewStatus}>Active now</Text>
                            </View>
                        </View>
                        <View style={previewStyles.dmBubbleWrapper}>
                            <View style={previewStyles.dmBubble}>
                                <Text style={previewStyles.dmText}>
                                    {directMessage || DEFAULT_VALUES.directMessage}
                                </Text>
                                <View style={previewStyles.buttonGroup}>
                                    <TouchableOpacity
                                        style={previewStyles.actionButton}
                                        onPress={() => Linking.openURL(linkToSend || DEFAULT_VALUES.linkToSend)}
                                    >
                                        <Text style={previewStyles.actionButtonText}>
                                            {linkLabel || DEFAULT_VALUES.linkLabel}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.statusRow}>
                        <Text style={styles.statusDot}>•</Text>
                        <Text style={styles.statusOffline}>Offline</Text>
                        <Text style={styles.statusDot}>•</Text>
                        <Text style={styles.statusOffline}>Offline</Text>
                    </View>
                </View>
            </Animated.View>
        </SafeAreaView>
    );
};


// Instagram-like preview styles (light theme)

export default AutomationSettingsScreen;
