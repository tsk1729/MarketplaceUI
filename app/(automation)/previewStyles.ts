import {StyleSheet} from "react-native";
import {COLORS} from "@/app/(automation)/colors";

export const previewStyles = StyleSheet.create({
    previewCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#eee',
    },
    previewRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    previewUserText: {
        fontWeight: '600',
        color: '#222',
        fontSize: 15,
    },
    previewCommentText: {
        color: '#222',
        fontSize: 15,
        marginTop: 2,
    },
    previewBotText: {
        fontWeight: '600',
        color: '#9CA3AF',
        fontSize: 15,
    },
    previewBotMsgText: {
        color: '#222',
        fontSize: 15,
        marginTop: 2,
    },
    previewStatus: {
        color: '#9CA3AF',
        fontSize: 13,
        marginTop: 2,
    },
    dmBubbleWrapper: {
        flexDirection: 'row',
        marginTop: 10,
        marginLeft: 50,
    },
    dmBubble: {
        backgroundColor: COLORS.instagram.blueBubble,
        borderRadius: 12,
        padding: 12,
        maxWidth: '90%',
        minWidth: 200,
    },
    dmText: {
        color: '#fff',
        fontSize: 15,
        marginBottom: 8,
    },
    buttonGroup: {
        marginTop: 8,
    },
    actionButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
        minWidth: 180,
    },
    actionButtonText: {
        color: '#222',
        fontWeight: 'bold',
        fontSize: 17,
    },
});
