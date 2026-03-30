import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import AppButton from "../common/AppButton";

interface ConfirmationBottomSheetProps {
  visible: boolean;
  title: string;
  noteLabel?: string;
  noteRequired?: boolean;
  noteMinLength?: number;
  noteMaxLength?: number;
  confirmLabel: string;
  confirmVariant?: "primary" | "danger";
  onConfirm: (note?: string) => void;
  onCancel: () => void;
}

export default function ConfirmationBottomSheet({
  visible,
  title,
  noteLabel,
  noteRequired = false,
  noteMinLength = 0,
  noteMaxLength = 200,
  confirmLabel,
  confirmVariant = "primary",
  onConfirm,
  onCancel,
}: ConfirmationBottomSheetProps) {
  const [note, setNote] = useState("");

  const handleConfirm = () => {
    onConfirm(note || undefined);
    setNote(""); // Reset note after confirm
  };

  const handleCancel = () => {
    onCancel();
    setNote(""); // Reset note after cancel
  };

  const isConfirmDisabled = noteRequired && note.trim().length < noteMinLength;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.keyboardView}
            >
              <View style={styles.sheet}>
                {/* Title */}
                <Text style={styles.title}>{title}</Text>

                {/* Note Input (if noteLabel provided) */}
                {noteLabel && (
                  <View style={styles.noteContainer}>
                    <Text style={styles.noteLabel}>
                      {noteLabel}
                      {noteRequired && <Text style={styles.required}> *</Text>}
                    </Text>
                    <TextInput
                      style={styles.noteInput}
                      placeholder={
                        noteRequired
                          ? `Minimum ${noteMinLength} characters`
                          : "Optional"
                      }
                      placeholderTextColor="#94A3B8"
                      value={note}
                      onChangeText={setNote}
                      multiline
                      maxLength={noteMaxLength}
                      textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>
                      {note.length}/{noteMaxLength}
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <AppButton
                    label={confirmLabel}
                    onPress={handleConfirm}
                    variant={confirmVariant}
                    disabled={isConfirmDisabled}
                    fullWidth
                  />
                  <AppButton
                    label="Cancel"
                    onPress={handleCancel}
                    variant="secondary"
                    fullWidth
                  />
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  keyboardView: {
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 20,
    textAlign: "center",
  },
  noteContainer: {
    marginBottom: 24,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  required: {
    color: "#DC2626",
  },
  noteInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1E293B",
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "right",
    marginTop: 6,
  },
  buttonContainer: {
    gap: 12,
  },
});
