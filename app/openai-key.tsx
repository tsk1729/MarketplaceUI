import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Modal, ScrollView, Dimensions, Animated, Easing } from "react-native";
import { COLORS } from "@/constants/theme";
import api from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import {isAuthenticated} from "@/app/utils/auth";
import { Picker } from '@react-native-picker/picker';

export default function OpenAIKeyScreen() {
    const [key, setKey] = useState("");
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatPrompt, setChatPrompt] = useState('');
    const [chatMessages, setChatMessages] = useState<{role: 'user'|'ai', text: string}[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [metrics, setMetrics] = useState<any>(null);
    const [metricsLoading, setMetricsLoading] = useState(true);
    const [metricsError, setMetricsError] = useState<string | null>(null);
    const [models, setModels] = useState<any[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [modelsLoading, setModelsLoading] = useState(true);
    const [modelsError, setModelsError] = useState<string | null>(null);
    const [slideAnim] = useState(new Animated.Value(100)); // Start 100px below
    const [showKeyConfig, setShowKeyConfig] = useState(false);
    const [showTip, setShowTip] = useState(true); // Popup notification state

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const { userId } = await isAuthenticated();
                if (!userId) throw new Error('User not authenticated');
                const res = await api.post('key', userId);
                if (res.success && res.data?.key) {
                    setKey(res.data.key);
                    setInput(res.data.key);
                    setShowKeyConfig(true); // Show config if user already has a key
                    // If model_id is present, strip ':nitro' and set as selectedModel if in models
                    if (res.data.model_id) {
                        let modelId = res.data.model_id;
                        if (modelId.endsWith(':nitro')) {
                            modelId = modelId.slice(0, -6);
                        }
                        // Check if modelId exists in models
                        const found = models.find(m => m.id === modelId);
                        if (found) {
                            setSelectedModel(modelId);
                        } else if (models.length > 0) {
                            setSelectedModel(models[0].id);
                        }
                    } else if (models.length > 0) {
                        setSelectedModel(models[0].id);
                    }
                } else {
                    setKey("");
                    setInput("");
                    setShowKeyConfig(false); // Hide config if no key
                    if (models.length > 0) {
                        setSelectedModel(models[0].id);
                    }
                }
            } catch (e: any) {
                setKey("");
                setInput("");
                setShowKeyConfig(false);
                if (models.length > 0) {
                    setSelectedModel(models[0].id);
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [models]); // Depend on models so we can set selectedModel after models are loaded

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 1200, // Slowed down from 600ms to 1200ms
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
        }).start();
    }, []);

    // Fetch metrics
    useEffect(() => {
        (async () => {
            setMetricsLoading(true);
            setMetricsError(null);
            try {
                const { userId } = await isAuthenticated();
                if (!userId) throw new Error('User not authenticated');
                const res = await api.post('metrics', userId);
                if (res.success && res.data) {
                    setMetrics(res.data);
                } else {
                    setMetricsError(res.message || 'Failed to fetch metrics');
                }
            } catch (e: any) {
                setMetricsError(e.message || 'Failed to fetch metrics');
            } finally {
                setMetricsLoading(false);
            }
        })();
    }, []);

    // Fetch models on mount
    useEffect(() => {
        (async () => {
            setModelsLoading(true);
            setModelsError(null);
            try {
                const response = await fetch('https://openrouter.ai/api/v1/models');
                const data = await response.json();
                if (response.ok && data.data) {
                    // Sort all models alphabetically by id only (no filtering)
                    const sorted = data.data.slice().sort((a: any, b: any) => {
                        return a.id.localeCompare(b.id);
                    });
                    setModels(sorted);
                    if (sorted.length > 0) setSelectedModel(sorted[0].id);
                } else {
                    setModelsError('Failed to fetch models');
                }
            } catch (e: any) {
                setModelsError(e.message || 'Failed to fetch models');
            } finally {
                setModelsLoading(false);
            }
        })();
    }, []);

    // Helper to test the key with a given prompt and update chat area
    // Accepts an optional overrideModel for custom model string
    const testKeyWithPrompt = async (testKey: string, prompt: string, overrideModel?: string) => {
        setShowChat(true);
        setChatLoading(true);
        setChatMessages(prev => [...prev, { role: 'user', text: prompt }]);
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${testKey}`,
                },
                body: JSON.stringify({
                    model: overrideModel || (selectedModel ? selectedModel + ':nitro' : 'meta-llama/llama-3.2-3b-instruct:free:nitro'),
                    messages: [
                        ...chatMessages.map(m => ({ role: m.role, content: m.text })),
                        { role: 'user', content: prompt },
                    ]
                }),
            });
            const data = await response.json();
            if (response.ok && data.choices && data.choices[0]?.message?.content) {
                setChatMessages(prev => [
                    ...prev,
                    { role: 'ai', text: data.choices[0].message.content.trim() }
                ]);
                return { success: true, aiText: data.choices[0].message.content.trim() };
            } else {
                setChatMessages(prev => [
                    ...prev,
                    { role: 'ai', text: `Error: ${data.error?.message || JSON.stringify(data)}` }
                ]);
                return { success: false };
            }
        } catch (e: any) {
            setChatMessages(prev => [
                ...prev,
                { role: 'ai', text: `Error: ${e.message}` }
            ]);
            return { success: false };
        } finally {
            setChatLoading(false);
        }
    };

    const saveKey = async () => {
        if (!input.trim()) {
            setFeedback("Please enter a valid API key.");
            return;
        }
        setLoading(true);
        setFeedback(null);
        setShowChat(true);
        setChatPrompt("");
        // Test the key before saving
        const testPrompt = "how many planets in solar system";
        setChatMessages([]); // Clear chat for new test
        // Always append ':nitro' to the model for testing
        const testResult = await testKeyWithPrompt(input.trim(), testPrompt, selectedModel ? selectedModel + ':nitro' : undefined);
        if (!testResult.success) {
            setFeedback("API key test failed. Please check your key and try again.");
            setLoading(false);
            return;
        }
        try {
            const { userId } = await isAuthenticated();
            if (!userId) throw new Error('User not authenticated');
            // Always append ':nitro' to the model_id when saving
            const res = await api.put('key', {
                user_id: userId,
                open_key: input.trim(),
                model_id: selectedModel ? selectedModel + ':nitro' : '',
            });
            if (res.success) {
                setKey(input.trim());
                setFeedback("OpenAI key saved successfully!");
                setShowKeyConfig(true); // Show config if key is saved
            } else {
                throw new Error(res.message || 'API error');
            }
        } catch (e: any) {
            setFeedback("Error: " + (e.message || "Failed to save key."));
        } finally {
            setLoading(false);
        }
    };

    const deleteKey = async () => {
        setShowConfirm(false);
        setLoading(true);
        setFeedback(null);
        try {
            const { userId } = await isAuthenticated();
            if (!userId) throw new Error('User not authenticated');
            const res = await api.del('key', userId); // Pass as string, not object
            if (res.success) {
                setKey("");
                setInput("");
                setShowChat(false);
                setChatMessages([]);
                setFeedback("OpenAI key deleted from server.");
                setShowKeyConfig(false); // Hide config if key is deleted
            } else {
                throw new Error(res.message || 'API error');
            }
        } catch (e: any) {
            setFeedback("Error: " + (e.message || "Failed to delete key."));
        } finally {
            setLoading(false);
        }
    };

    const testKey = async () => {
        setShowChat(true);
        setChatMessages([]);
        setChatPrompt('');
        setFeedback(null);
    };

    const sendChatPrompt = async () => {
        if (!chatPrompt.trim()) return;
        setChatLoading(true);
        const prompt = chatPrompt.trim();
        // Append the latest user message
        setChatMessages(prev => [...prev, { role: 'user', text: prompt }]);
        setChatPrompt('');
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`,
                    // Optionally add:
                    // 'HTTP-Referer': '<YOUR_SITE_URL>',
                    // 'X-Title': '<YOUR_SITE_NAME>',
                },
                body: JSON.stringify({
                    model: selectedModel || 'meta-llama/llama-3.2-3b-instruct:free:nitro',
                    messages: [
                        ...chatMessages.map(m => ({ role: m.role, content: m.text })),
                        { role: 'user', content: prompt },
                    ]
                }),
            });
            const data = await response.json();
            if (response.ok && data.choices && data.choices[0]?.message?.content) {
                setChatMessages(prev => [
                    ...prev,
                    { role: 'ai', text: data.choices[0].message.content.trim() }
                ]);
            } else {
                setChatMessages(prev => [
                    ...prev,
                    { role: 'ai', text: `Error: ${data.error?.message || JSON.stringify(data)}` }
                ]);
            }
        } catch (e: any) {
            setChatMessages(prev => [
                ...prev,
                { role: 'ai', text: `Error: ${e.message}` }
            ]);
        } finally {
            setChatLoading(false);
        }
    };

    const windowHeight = Dimensions.get('window').height;

    return (
        <SafeAreaView style={styles.container}>
            {/* Popup Notification */}
            {showTip && (
                <View style={styles.popupNotification}>
                    <Text style={styles.popupText}>

                         You can add credits to your <Text style={styles.link} onPress={() => window.open('https://openrouter.ai/credits', '_blank')}>OpenRouter account</Text> and we will use only best high throughput provider models by default.{"\n"}You are always ready to choose powerful paid models, you can upgrade anytime.
                        <Text style={styles.link} onPress={() => window.open('https://openrouter.ai/docs/api-reference/limits#rate-limits-and-credits-remaining', '_blank')}> See rate limits</Text> or explore the <Text style={styles.link} onPress={() => window.open('https://openrouter.ai/models', '_blank')}>wide range of models</Text> available on OpenRouter.
                    </Text>
                    <TouchableOpacity style={styles.popupClose} onPress={() => setShowTip(false)}>
                        <Ionicons name="close" size={20} color={COLORS.background} />
                    </TouchableOpacity>
                </View>
            )}
            <Animated.View
                style={{
                    flex: 1,
                    transform: [{ translateY: slideAnim }],
                }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {/* Main Row: Stats left, Key right */}
                    <View style={styles.mainRow}>
                        {/* Left Column: Stats */}
                        <View style={styles.leftCol}>
                            <View style={styles.statsCardContainer}>
                                {metricsLoading ? (
                                    <Text style={styles.statsLoading}>Loading your usage stats...</Text>
                                ) : metricsError ? (
                                    <Text style={styles.statsError}>{metricsError}</Text>
                                ) : metrics ? (
                                    <View style={styles.statsCard}>
                                        <Text style={styles.statsTitle}>Your Usage Stats</Text>
                                        <View style={styles.statsRow}>
                                            <Ionicons name="stats-chart" size={18} color={COLORS.white} style={styles.statsIcon} />
                                            <Text style={styles.statsLabel}>Tokens Used:</Text>
                                            <Text style={styles.statsValue}>{metrics.usage}</Text>
                                        </View>
                                        <View style={styles.statsRow}>
                                            <Ionicons name="layers" size={18} color={COLORS.white} style={styles.statsIcon} />
                                            <Text style={styles.statsLabel}>Embeddings:</Text>
                                            <Text style={styles.statsValue}>{metrics.embedding_count}</Text>
                                        </View>
                                        <View style={styles.statsRow}>
                                            <Ionicons name="cash" size={18} color={COLORS.white} style={styles.statsIcon} />
                                            <Text style={styles.statsLabel}>Embedding Cost:</Text>
                                            <Text style={styles.statsValue}>${metrics.embedding_cost?.toFixed(6)} | ₹{(metrics.embedding_cost * 83).toFixed(4)}</Text>
                                        </View>
                                        <View style={styles.statsRow}>
                                            <Ionicons name="cash-outline" size={18} color={COLORS.white} style={styles.statsIcon} />
                                            <Text style={styles.statsLabel}>LLM Cost:</Text>
                                            <Text style={styles.statsValue}>${metrics.llm_cost?.toFixed(6)} | ₹{(metrics.llm_cost * 83).toFixed(4)}</Text>
                                        </View>
                                        <View style={[styles.statsRow, { borderTopWidth: 1, borderTopColor: COLORS.surfaceLight, marginTop: 8, paddingTop: 8 }]}>
                                            <Ionicons name="trophy" size={18} color={COLORS.white} style={styles.statsIcon} />
                                            <Text style={[styles.statsLabel, { fontWeight: 'bold' }]}>Total Cost:</Text>
                                            <Text style={[styles.statsValue, styles.strikeThroughCost]}>${metrics.total_cost?.toFixed(6)} | ₹{(metrics.total_cost * 83).toFixed(4)}</Text>
                                            <Text style={styles.statsZeroCost}> 0</Text>
                                        </View>
                                        <Text style={styles.statsFreeMsg}>🎉 Owlit is offering this entirely free for you!</Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>
                        {/* Right Column: Key Management */}
                        <View style={styles.rightCol}>
                            <View style={styles.content}>
                                {!showKeyConfig && !key ? (
                                    <View style={{ alignItems: 'center', marginTop: 24 }}>
                                        <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>You are using owlit keys</Text>
                                        <TouchableOpacity
                                            style={{ backgroundColor: COLORS.primary, borderRadius: 24, paddingVertical: 10, paddingHorizontal: 24 }}
                                            onPress={() => setShowKeyConfig(true)}
                                        >
                                            <Text style={{ color: COLORS.background, fontWeight: 'bold', fontSize: 16 }}>Do you want to configure your own key?</Text>
                                        </TouchableOpacity>
                                        {/* Pros of using your own key */}
                                        <View style={{ marginTop: 24, alignItems: 'flex-start', maxWidth: 340 }}>
                                            <Text style={{ color: COLORS.white, fontSize: 15, marginBottom: 8 }}>Why use your own key?</Text>
                                            <Text style={{ color: COLORS.primary, fontSize: 15, marginBottom: 4 }}>• Select your own key</Text>
                                            <Text style={{ color: COLORS.primary, fontSize: 15, marginBottom: 4 }}>• Select any model you want <Text style={{ fontWeight: 'bold' }}>(powerful)</Text></Text>
                                            <Text style={{ color: COLORS.primary, fontSize: 15, marginBottom: 4 }}>
                                                • Powered by <Text style={{ textDecorationLine: 'underline' }} onPress={() => window.open('https://openrouter.ai', '_blank')}>OpenRouter</Text>
                                            </Text>
                                            <Text
                                                style={{
                                                    color: '#FFD700', // gold/yellow for warning
                                                    fontSize: 14,
                                                    fontStyle: 'italic',
                                                    backgroundColor: 'rgba(255, 215, 0, 0.08)',
                                                    borderRadius: 8,
                                                    paddingVertical: 6,
                                                    paddingHorizontal: 12,
                                                    marginBottom: 10,
                                                    marginTop: 4,
                                                }}
                                            >
                                                Please select paid model.{"\n"}
                                                Free models have <Text style={{ textDecorationLine: 'underline', color: '#FFD700' }} onPress={() => window.open('https://openrouter.ai/docs/api-reference/limits#rate-limits-and-credits-remaining', '_blank')}>ratelimits</Text>.
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <>
                                        <Text style={styles.bringYourOwnKeyLabel}>Bring your own key</Text>
                                        <View style={{ position: 'relative' }}>
                                            <TextInput
                                                value={input}
                                                onChangeText={setInput}
                                                placeholder="Enter your API key"
                                                placeholderTextColor={COLORS.grey}
                                                style={styles.input}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                secureTextEntry={!showKey}
                                            />
                                            <TouchableOpacity
                                                style={styles.eyeIcon}
                                                onPress={() => setShowKey(v => !v)}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Ionicons name={showKey ? 'eye-off' : 'eye'} size={22} color={COLORS.grey} />
                                            </TouchableOpacity>
                                        </View>
                                        {/* Model Dropdown */}
                                        <View style={{ marginBottom: 12 }}>
                                            {modelsLoading ? (
                                                <Text style={{ color: COLORS.grey, marginBottom: 8 }}>Loading models...</Text>
                                            ) : modelsError ? (
                                                <Text style={{ color: COLORS.error, marginBottom: 8 }}>{modelsError}</Text>
                                            ) : (
                                                <Picker
                                                    selectedValue={selectedModel}
                                                    onValueChange={setSelectedModel}
                                                    style={{ color: COLORS.white, backgroundColor: COLORS.surface, borderRadius: 8 ,height:30}}
                                                    itemStyle={{ color: COLORS.white }}
                                                >
                                                    {models.map((model) => (
                                                        <Picker.Item
                                                            key={model.id}
                                                            label={model.id}
                                                            value={model.id}
                                                        />
                                                    ))}
                                                </Picker>
                                            )}
                                        </View>
                                        <View style={styles.buttonRow}>
                                            <TouchableOpacity style={styles.saveButton} onPress={saveKey} disabled={loading}>
                                                <Text style={styles.buttonText}>Save</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.deleteButton} onPress={() => setShowConfirm(true)} disabled={loading}>
                                                <Text style={styles.deleteButtonText}>Delete</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.testButton} onPress={testKey} disabled={loading || !input}>
                                                <Text style={styles.buttonText}>Test</Text>
                                            </TouchableOpacity>
                                        </View>
                                        {loading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 16 }} />}
                                        {feedback && <Text style={styles.feedback}>{feedback}</Text>}
                                        {showChat && (
                                            <View style={styles.chatBox}>
                                                <Text style={styles.chatTitle}>Test your OpenAI Key</Text>
                                                <ScrollView style={styles.chatMessages} contentContainerStyle={{ paddingBottom: 10 }}>
                                                    {chatMessages.map((msg, idx) => (
                                                        <View key={idx} style={[styles.chatMessage, msg.role === 'user' ? styles.chatUser : styles.chatAI]}>
                                                            <Text style={styles.chatMessageText}>{msg.text}</Text>
                                                        </View>
                                                    ))}
                                                </ScrollView>
                                                <View style={styles.chatInputRow}>
                                                    <TextInput
                                                        value={chatPrompt}
                                                        onChangeText={setChatPrompt}
                                                        placeholder="Type your prompt..."
                                                        placeholderTextColor={COLORS.grey}
                                                        style={styles.chatInput}
                                                        editable={!chatLoading}
                                                        onSubmitEditing={sendChatPrompt}
                                                    />
                                                    <TouchableOpacity style={styles.chatSendButton} onPress={sendChatPrompt} disabled={chatLoading || !chatPrompt.trim()}>
                                                        <Text style={styles.chatSendText}>{chatLoading ? '...' : 'Send'}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                    </>
                                )}
                            </View>
                        </View>
                    </View>
                    <Modal
                        visible={showConfirm}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setShowConfirm(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContentCustom}>
                                <Text style={styles.modalTitle}>Delete OpenAI Key</Text>
                                <Text style={styles.modalMessage}>Are you sure you want to delete your OpenAI key?</Text>
                                <View style={styles.modalButtonRow}>
                                    <TouchableOpacity onPress={() => setShowConfirm(false)} style={styles.modalCancelButton}>
                                        <Text style={styles.modalCancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={deleteKey} style={styles.modalDeleteButton}>
                                        <Text style={styles.modalDeleteText}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </ScrollView>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surface,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.white,
        textAlign: "center",
    },
    infoBox: {
        backgroundColor: 'rgba(74,222,128,0.08)',
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginHorizontal: 'auto',
        marginTop: 18,
        marginBottom: 12,
        maxWidth: '70%',
        width: '70%',
        minWidth: 320,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoText: {
        color: COLORS.white,
        fontSize: 13,
        lineHeight: 18,
        flex: 1,
    },
    link: {
        color: COLORS.background,
        textDecorationLine: 'underline',
    },
    content: {
        flex: 1,
        padding: 0,
        marginHorizontal: 0,
        width: '100%',
        minWidth: 0,
        maxWidth: '100%',
        alignSelf: 'stretch',
        display: 'flex',
        justifyContent: 'center',
    },
    input: {
        backgroundColor: COLORS.surface,
        color: COLORS.white,
        borderRadius: 8,
        padding: 10,
        fontSize: 15,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        marginBottom: 12,
        minHeight: 40,
    },
    eyeIcon: {
        position: 'absolute',
        right: 12,
        top: '50%',
        marginTop: -11,
        zIndex: 2,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 18,
        marginBottom: 8,
    },
    saveButton: {
        backgroundColor: COLORS.white,
        borderRadius: 32,
        paddingVertical: 12,
        width: 140,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 0,
    },
    testButton: {
        backgroundColor: COLORS.white,
        borderRadius: 32,
        paddingVertical: 12,
        width: 140,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 0,
    },
    deleteButton: {
        backgroundColor: COLORS.error,
        borderRadius: 32,
        paddingVertical: 12,
        width: 140,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 0,
    },
    buttonText: {
        color: COLORS.background,
        fontWeight: 'bold',
        fontSize: 18,
    },
    deleteButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 18,
    },
    feedback: {
        marginTop: 16,
        color: COLORS.primary,
        fontSize: 15,
        textAlign: 'center',
        minHeight: 20,
    },
    chatBox: {
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        padding: 18,
        marginTop: 28,
        marginBottom: 12,
        shadowColor: COLORS.background,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    chatTitle: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 17,
        marginBottom: 10,
    },
    chatMessages: {
        minHeight: 60,
        maxHeight: 180,
        marginBottom: 10,
    },
    chatMessage: {
        borderRadius: 32,
        paddingVertical: 8,
        paddingHorizontal: 18,
        marginBottom: 6,
        maxWidth: '90%',
    },
    chatUser: {
        alignSelf: 'flex-end',
        backgroundColor: COLORS.white,
        borderRadius: 32,
        paddingVertical: 8,
        paddingHorizontal: 18,
        marginBottom: 6,
        maxWidth: '90%',
    },
    chatAI: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.white,
        borderRadius: 32,
        paddingVertical: 8,
        paddingHorizontal: 18,
        marginBottom: 6,
        maxWidth: '90%',
    },
    chatMessageText: {
        color: COLORS.background,
        fontWeight: 'bold',
        fontSize: 16,
    },
    chatInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    chatInput: {
        flex: 1,
        backgroundColor: COLORS.surfaceLight,
        color: COLORS.white,
        borderRadius: 8,
        padding: 10,
        fontSize: 15,
        marginRight: 8,
        borderWidth: 1,
        borderColor: COLORS.surface,
    },
    chatSendButton: {
        backgroundColor: COLORS.white,
        borderRadius: 32,
        paddingVertical: 12,
        width: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 0,
    },
    chatSendText: {
        color: COLORS.background,
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContentCustom: {
        backgroundColor: COLORS.background,
        padding: 32,
        borderRadius: 28,
        width: 360,
        maxWidth: '95%',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
        shadowColor: COLORS.background,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 16,
    },
    modalTitle: {
        color: COLORS.white,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 14,
        textAlign: 'center',
    },
    modalMessage: {
        color: COLORS.white,
        fontSize: 16,
        marginBottom: 28,
        textAlign: 'center',
    },
    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        gap: 20,
        marginTop: 8,
    },
    modalCancelButton: {
        backgroundColor: 'rgba(156,163,175,0.15)',
        borderRadius: 8,
        paddingVertical: 12,
        minWidth: 110,
        alignItems: 'center',
        marginHorizontal: 8,
    },
    modalDeleteButton: {
        backgroundColor: COLORS.error,
        borderRadius: 8,
        paddingVertical: 12,
        minWidth: 110,
        alignItems: 'center',
        marginHorizontal: 8,
    },
    modalCancelText: {
        color: COLORS.grey,
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalDeleteText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    statsCardContainer: {
        flex: 1,
        marginTop: 0,
        marginBottom: 0,
        alignSelf: 'stretch',
        width: '100%',
        minWidth: 0,
        maxWidth: '100%',
        display: 'flex',
        justifyContent: 'center',
    },
    statsCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 20,
        shadowColor: COLORS.background,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 8,
    },
    statsTitle: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 12,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statsIcon: {
        marginRight: 8,
    },
    statsLabel: {
        color: COLORS.white,
        fontSize: 15,
        flex: 1,
    },
    statsValue: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 15,
        marginLeft: 8,
    },
    statsFreeMsg: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 15,
        marginTop: 16,
        textAlign: 'center',
    },
    statsLoading: {
        color: COLORS.white,
        fontSize: 15,
        textAlign: 'center',
        padding: 18,
    },
    statsError: {
        color: COLORS.error,
        fontSize: 15,
        textAlign: 'center',
        padding: 18,
    },
    statsZeroCost: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 18,
        marginLeft: 6,
    },
    strikeThroughCost: {
        textDecorationLine: 'line-through',
        color: COLORS.error,
        marginRight: 4,
    },
    bringYourOwnKeyLabel: {
        backgroundColor: COLORS.white,
        color: COLORS.background,
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 22,
        marginTop: 0,
        marginBottom: 8,
        alignSelf: 'center',
        letterSpacing: 0.5,
        shadowColor: COLORS.instagram,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 2,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        alignItems: 'center',
        width: '100%',
        minHeight: Dimensions.get('window').height,
    },
    tipBox: {
        backgroundColor: 'rgba(74,222,128,0.08)',
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginBottom: 24,
        maxWidth: 900,
        width: '100%',
        alignSelf: 'center',
    },
    mainRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'stretch',
        gap: 32,
        width: '100%',
        alignSelf: 'center',
        marginBottom: 32,
        minHeight: Dimensions.get('window').height * 0.6,
        flex: 1,
    },
    leftCol: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
    },
    rightCol: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
    },
    popupNotification: {
        position: 'absolute',
        top: 24,
        left: 0,
        right: 0,
        marginHorizontal: 24,
        backgroundColor: COLORS.white,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 18,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'flex-start',
        shadowColor: COLORS.background,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 8,
    },
    popupText: {
        color: COLORS.background,
        fontSize: 13,
        lineHeight: 18,
        flex: 1,
    },
    popupClose: {
        marginLeft: 12,
        marginTop: 2,
        padding: 4,
    },
});
