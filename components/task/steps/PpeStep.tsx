// src/components/task/steps/PpeStep.tsx
import { useTaskStepExecutionImage } from "@/hooks/useTaskStepExecutionImage";
import InspectionCameraScreen from "@/screens/shared/CameraScreen";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StepPlugin, StepPluginProps } from "../StepRegistry";

function PpeComponent({ config, state, onChange }: StepPluginProps) {
  const items: string[] = config?.requiredPPE ?? [];
  const checkedItems = state.checkedItems || {};
  const photoUri = state.photoUri;

  const stepExecutionId: string = state.__stepId;
  const taskAssignmentId: string = state.__taskAssignmentId;

  const { uploadImages, reUploadImages, getImagesByStep } =
    useTaskStepExecutionImage();

  const [isCameraVisible, setCameraVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCameraSubmit = async (capturedPhotos: { uri: string }[]) => {
    setCameraVisible(false);
    if (capturedPhotos.length === 0) return;

    const localUri = String(capturedPhotos[0].uri);
    const resetTicks = Object.fromEntries(items.map((item) => [item, false]));

    let serverUri = localUri; // fallback

    try {
      setIsUploading(true);

      // 👈 Luôn thử POST trước, nếu BE báo 400 thì fallback PUT
      try {
        await uploadImages(stepExecutionId, 2, [{ uri: localUri }], 1);
      } catch (postErr: any) {
        const status = postErr?.response?.status;
        if (status === 400) {
          console.log("⚠️ POST thất bại, fallback sang PUT...");
          await reUploadImages(stepExecutionId, 2, [{ uri: localUri }], 1);
        } else {
          throw postErr;
        }
      }

      // Lấy server URL thật
      const serverUrls = await getImagesByStep(
        taskAssignmentId,
        stepExecutionId,
        2,
      );
      serverUri = serverUrls[0] ?? localUri;

      onChange({ photoUri: serverUri, checkedItems: resetTicks });
    } catch (err: any) {
      Alert.alert("Lỗi", "Upload ảnh thất bại: " + (err?.message ?? ""));
      return;
    } finally {
      setIsUploading(false);
    }

    // Upload xong mới gọi AI với serverUri
    await analyzeImageWithAI(serverUri);
  };

  const analyzeImageWithAI = async (uri: string) => {
    setIsAnalyzing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const mockAiResult: Record<string, boolean> = {};
      items.forEach((item) => {
        mockAiResult[item] = Math.random() > 0.3;
      });
      onChange({ photoUri: uri, checkedItems: mockAiResult });
    } catch {
      Alert.alert(
        "Lỗi phân tích",
        "Không thể phân tích hình ảnh. Vui lòng thử lại.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleItem = (item: string) => {
    if (!photoUri) {
      Alert.alert(
        "Lỗi",
        "Vui lòng chụp ảnh để AI phân tích trước khi xác nhận thủ công.",
      );
      return;
    }
    onChange({
      ...state,
      checkedItems: { ...checkedItems, [item]: !checkedItems[item] },
    });
  };

  const handleDeletePhoto = () => {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove this photo? All checked items will be reset.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const resetTicks = Object.fromEntries(items.map((i) => [i, false]));
            onChange({ photoUri: null, checkedItems: resetTicks });
          },
        },
      ],
    );
  };

  const isBusy = isUploading || isAnalyzing;

  // phần return và styles giữ nguyên hoàn toàn
  return (
    <View>
      <Text style={s.label}>Take a photo for AI PPE verification</Text>

      <View style={s.photoArea}>
        {photoUri ? (
          <View style={s.imageWrapper}>
            <Image source={{ uri: photoUri }} style={s.image} />
            {isBusy && (
              <View style={s.analyzingOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={s.analyzingText}>
                  {isUploading ? "Đang tải ảnh lên..." : "AI is analyzing..."}
                </Text>
              </View>
            )}
            {!isBusy && (
              <View style={s.photoActions}>
                <TouchableOpacity
                  style={s.retakeBtn}
                  onPress={() => setCameraVisible(true)}
                >
                  <Ionicons name="refresh" size={16} color="#FFF" />
                  <Text style={s.actionText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.deleteBtn}
                  onPress={handleDeletePhoto}
                >
                  <Ionicons name="trash-outline" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={s.cameraBtnPlaceholder}
            onPress={() => setCameraVisible(true)}
            disabled={isUploading}
          >
            <Ionicons name="camera-outline" size={32} color="#94A3B8" />
            <Text style={s.cameraText}>Open Camera</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={s.checklistContainer}>
        {items.map((item) => {
          const isChecked = checkedItems[item];
          return (
            <TouchableOpacity
              key={item}
              style={[s.row, isChecked && s.rowDone]}
              onPress={() => toggleItem(item)}
              disabled={isBusy}
              activeOpacity={0.7}
            >
              <View style={[s.box, isChecked && s.boxDone]}>
                {isChecked && <Text style={s.check}>✓</Text>}
              </View>
              <Text style={[s.text, isChecked && s.textDone]}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal
        visible={isCameraVisible}
        animationType="slide"
        onRequestClose={() => setCameraVisible(false)}
      >
        <InspectionCameraScreen
          onClose={() => setCameraVisible(false)}
          onSubmit={handleCameraSubmit}
        />
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 13, color: "#64748B", marginBottom: 12 },
  photoArea: { marginBottom: 16 },
  cameraBtnPlaceholder: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  cameraText: { color: "#64748B", marginTop: 8, fontWeight: "500" },
  imageWrapper: {
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  analyzingText: { color: "#FFF", marginTop: 8, fontWeight: "600" },
  photoActions: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    gap: 8,
  },
  retakeBtn: {
    backgroundColor: "rgba(0,0,0,0.6)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  deleteBtn: {
    backgroundColor: "rgba(220, 38, 38, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  actionText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  checklistContainer: { marginTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#FFF",
  },
  rowDone: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  box: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  boxDone: { backgroundColor: "#16A34A", borderColor: "#16A34A" },
  check: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  text: { fontSize: 14, color: "#1E293B", flex: 1, fontWeight: "500" },
  textDone: { color: "#166534" },
});

export const PpeStepPlugin: StepPlugin = {
  type: "ppe",
  label: "PPE Check",
  detect: (config) => config?.["x-behavior"] === "ai-ppe-check",
  buildInitialState: (config) => ({
    photoUri: null,
    checkedItems: Object.fromEntries(
      (config.requiredPPE as string[]).map((item) => [item, false]),
    ),
  }),
  isFulfilled: (state) => {
    if (!state.photoUri) return false;
    const items = state.checkedItems || {};
    return Object.keys(items).length > 0 && Object.values(items).every(Boolean);
  },
  serialize: (state) => ({
    photoUri: state.photoUri,
    checkedItems: state.checkedItems,
  }),
  Component: PpeComponent,
};
