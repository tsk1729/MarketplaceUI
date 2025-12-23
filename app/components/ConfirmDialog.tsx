import React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/theme";

export type ConfirmDialogProps = {
  visible: boolean;

  header?: string;
  description?: string;

  cancelLabel?: string;
  proceedLabel?: string;

  onCancel: () => void;
  onProceed: () => void;

  loading?: boolean;
  disableProceed?: boolean;

  dismissOnBackdropPress?: boolean;

  proceedButtonColor?: string;
  cancelButtonColor?: string;

  testID?: string;
};

/**
 * ConfirmDialog - reusable modal dialog for cancel/proceed flows.
 *
 * Usage:
 *  const [show, setShow] = React.useState(false);
 *
 *  <ConfirmDialog
 *    visible={show}
 *    header="Discard changes?"
 *    description="You have unsaved changes. This action cannot be undone."
 *    cancelLabel="Keep editing"
 *    proceedLabel="Discard"
 *    onCancel={() => setShow(false)}
 *    onProceed={handleDiscard}
 *  />
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  header = "Are you sure?",
  description = "This action cannot be undone.",
  cancelLabel = "Cancel",
  proceedLabel = "Proceed",
  onCancel,
  onProceed,
  loading = false,
  disableProceed = false,
  dismissOnBackdropPress = false,
  proceedButtonColor,
  cancelButtonColor,
  testID,
}) => {
  const isProceedDisabled = loading || disableProceed;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={dismissOnBackdropPress ? onCancel : undefined}
        testID={testID ? `${testID}-backdrop` : undefined}
      >
        {/* Inner container - capture presses so backdrop doesn't receive them */}
        <Pressable
          style={styles.dialog}
          onPress={() => {}}
          testID={testID ? `${testID}-container` : undefined}
        >
          <Text style={styles.header} numberOfLines={2}>
            {header}
          </Text>

          {!!description && (
            <Text style={styles.description}>{description}</Text>
          )}

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { backgroundColor: cancelButtonColor ?? COLORS.surfaceLight },
              ]}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              testID={testID ? `${testID}-cancel` : undefined}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.proceedButton,
                {
                  backgroundColor: proceedButtonColor ?? COLORS.primary,
                  opacity: isProceedDisabled ? 0.6 : 1,
                },
              ]}
              onPress={onProceed}
              disabled={isProceedDisabled}
              accessibilityRole="button"
              accessibilityLabel={proceedLabel}
              testID={testID ? `${testID}-proceed` : undefined}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.proceedText}>{proceedLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  header: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    marginTop: 8,
    color: COLORS.grey,
    fontSize: 14,
    lineHeight: 20,
  },
  buttonsRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  cancelButton: {
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  proceedButton: {},
  cancelText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "600",
  },
  proceedText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
});

export default ConfirmDialog;
