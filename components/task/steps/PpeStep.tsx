// src/components/task/steps/PpeStep.tsx
import InspectionCameraScreen from "@/screens/shared/CameraScreen"; // Import Camera của bạn
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

  // Local UI States
  const [isCameraVisible, setCameraVisible] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ─── 1. XỬ LÝ CHỤP ẢNH & GỌI AI ──────────────────────────────────────
  const handleCameraSubmit = async (capturedPhotos: { uri: string }[]) => {
    setCameraVisible(false); // Đóng camera ngay lập tức

    if (capturedPhotos.length === 0) return;
    // CameraScreen now uploads and returns server URLs; coerce to string
    const uri = String(capturedPhotos[0].uri);

    // Cập nhật state có ảnh, nhưng reset lại các tick về false để bắt đầu phân tích
    const resetTicks = Object.fromEntries(items.map((item) => [item, false]));
    onChange({ photoUri: uri, checkedItems: resetTicks });

    // Bắt đầu gọi AI (backend should accept a public URL for analysis)
    await analyzeImageWithAI(uri);
  };

  // ─── 2. MOCK API GỌI AI (Giả lập delay 2 giây) ──────────────────────
  const analyzeImageWithAI = async (uri: string) => {
    setIsAnalyzing(true);
    try {
      // Recommended: call your backend analysis endpoint with the server URL
      // Example (backend should accept { imageUrl } and return detected items):
      // const res = await axiosInstance.post('/ai/ppe-analyze', { imageUrl: uri });
      // const result = res.data; // expect { itemName: boolean }

      // Fallback mock (keeps current behavior while backend is not ready)
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const mockAiResult: Record<string, boolean> = {};
      items.forEach((item) => {
        mockAiResult[item] = Math.random() > 0.3;
      });

      onChange({ photoUri: uri, checkedItems: mockAiResult });
    } catch (error) {
      Alert.alert(
        "Lỗi phân tích",
        "Không thể phân tích hình ảnh. Vui lòng thử lại.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── 3. MANUAL OVERRIDE (Dự phòng khi AI sai) ───────────────────────
  const toggleItem = (item: string) => {
    // Chỉ cho phép user tự tick khi ĐÃ có ảnh chụp (Không cho ăn gian tick chay)
    if (!photoUri) {
      Alert.alert(
        "Lỗi",
        "Vui lòng chụp ảnh để AI phân tích trước khi xác nhận thủ công.",
      );
      return;
    }

    const updated = {
      ...state,
      checkedItems: {
        ...checkedItems,
        [item]: !checkedItems[item],
      },
    };
    onChange(updated);
  };

  // ─── 4. XÓA ẢNH (RESET STATE) ────────────────────────────────────────
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
            // Reset ảnh về null và clear toàn bộ tick
            const resetTicks = Object.fromEntries(
              items.map((item) => [item, false]),
            );
            onChange({ photoUri: null, checkedItems: resetTicks });
          },
        },
      ],
    );
  };

  return (
    <View>
      <Text style={s.label}>Take a photo for AI PPE verification</Text>

      {/* KHU VỰC ẢNH & LOADING */}
      <View style={s.photoArea}>
        {photoUri ? (
          <View style={s.imageWrapper}>
            <Image source={{ uri: photoUri }} style={s.image} />
            {isAnalyzing && (
              <View style={s.analyzingOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={s.analyzingText}>AI is analyzing...</Text>
              </View>
            )}
            {!isAnalyzing && (
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
          >
            <Ionicons name="camera-outline" size={32} color="#94A3B8" />
            <Text style={s.cameraText}>Open Camera</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* KHU VỰC CHECKLIST */}
      <View style={s.checklistContainer}>
        {items.map((item) => {
          const isChecked = checkedItems[item];
          return (
            <TouchableOpacity
              key={item}
              style={[s.row, isChecked && s.rowDone]}
              onPress={() => toggleItem(item)}
              disabled={isAnalyzing} // Khoá nút khi đang load
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

      {/* MODAL CAMERA */}
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

  // Photo Area Styles
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
  // Thay thế các style của retakeBtn cũ bằng cụm này:
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
    backgroundColor: "rgba(220, 38, 38, 0.8)", // Màu đỏ bordeaux (Red-600)
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  actionText: { color: "#FFF", fontSize: 12, fontWeight: "600" },

  // Checklist Styles
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
  boxDone: { backgroundColor: "#16A34A", borderColor: "#16A34A" }, // Màu xanh lá Success
  check: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  text: { fontSize: 14, color: "#1E293B", flex: 1, fontWeight: "500" },
  textDone: { color: "#166534" },
});

export const PpeStepPlugin: StepPlugin = {
  type: "ppe",
  label: "PPE Check",
  detect: (config) => config?.["x-behavior"] === "ai-ppe-check",

  // 🚀 1. State ban đầu phải chuẩn
  buildInitialState: (config) => ({
    photoUri: null,
    checkedItems: Object.fromEntries(
      (config.requiredPPE as string[]).map((item) => [item, false]),
    ),
  }),

  // 🚀 2. Phải có ảnh VÀ tick đủ thì mới tính là fulfilled
  isFulfilled: (state) => {
    if (!state.photoUri) return false;
    const items = state.checkedItems || {};
    return Object.keys(items).length > 0 && Object.values(items).every(Boolean);
  },

  // 🚀 3. Khi gửi về BE, gửi cả ảnh và list đã tick
  serialize: (state) => ({
    photoUri: state.photoUri,
    checkedItems: state.checkedItems,
  }),

  Component: PpeComponent,
};
