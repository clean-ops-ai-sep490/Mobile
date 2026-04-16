// src/components/task/steps/PhotoStep.tsx
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

function PhotoComponent({ config, state, onChange }: StepPluginProps) {
  const minPhotos: number = config?.minPhotos ?? 1;
  const maxPhotos: number = config?.maxPhotos ?? 5;
  const phase: string = config?.phase ?? "";
  const photos: string[] = Array.isArray(state.photos) ? state.photos : [];

  const stepExecutionId: string = state.__stepId;
  const taskAssignmentId: string = state.__taskAssignmentId; // 👈 thêm

  const { uploadImages, reUploadImages, getImagesByStep } =
    useTaskStepExecutionImage();

  const [isCameraVisible, setCameraVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSession] = useState(() => ({
    id: Date.now(),
    time: Date.now(),
  }));

  const resolveImageType = (): 0 | 1 | 2 => {
    const p = phase.toLowerCase();
    if (p === "after") return 1;
    if (p === "ppe") return 2;
    return 0;
  };

  const handleCameraSubmit = async (
    capturedPhotos: { uri: string; timestamp: string }[],
  ) => {
    setCameraVisible(false);
    if (capturedPhotos.length === 0) return;

    try {
      setIsUploading(true);

      const imageType = resolveImageType();

      try {
        // 👈 Luôn thử POST trước
        await uploadImages(
          stepExecutionId,
          imageType,
          capturedPhotos,
          minPhotos,
        );
      } catch (postErr: any) {
        const status = postErr?.response?.status;
        // 👈 Nếu BE báo đã có ảnh (400) thì fallback PUT
        if (status === 400) {
          console.log("⚠️ POST thất bại, fallback sang PUT...");
          await reUploadImages(
            stepExecutionId,
            imageType,
            capturedPhotos,
            minPhotos,
          );
        } else {
          throw postErr; // lỗi khác (404, 500...) thì throw lên trên
        }
      }

      const serverUrls = await getImagesByStep(
        taskAssignmentId,
        stepExecutionId,
        imageType,
      );

      onChange({
        photos: Array.from(new Set(serverUrls)).slice(-maxPhotos),
        lastUploadTime: uploadSession.time,
      });
    } catch (err: any) {
      Alert.alert("Lỗi", "Upload ảnh thất bại: " + (err?.message ?? ""));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = (indexToRemove: number) => {
    const updatedPhotos = photos.filter((_, index) => index !== indexToRemove);
    onChange({ photos: updatedPhotos });
  };

  return (
    <View>
      <Text style={s.label}>
        {phase.toUpperCase()} photos (Max {maxPhotos})
      </Text>

      {isUploading && (
        <View style={s.uploadingRow}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={s.uploadingText}>Đang tải ảnh lên...</Text>
        </View>
      )}

      <View style={s.grid}>
        {photos.map((uri, i) => (
          <View key={i} style={s.thumbWrapper}>
            <View style={s.thumb}>
              <Image source={{ uri }} style={s.thumbImage} />
            </View>
            <TouchableOpacity
              style={s.deleteBtn}
              onPress={() => handleDeletePhoto(i)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
        ))}

        {photos.length < maxPhotos && !isUploading && (
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => setCameraVisible(true)}
          >
            <Ionicons name="camera-outline" size={24} color="#94A3B8" />
          </TouchableOpacity>
        )}
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
  label: { fontSize: 13, color: "#64748B", marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  uploadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  uploadingText: { fontSize: 13, color: "#2563EB" },
  thumbWrapper: { position: "relative" },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  thumbImage: { width: "100%", height: "100%", resizeMode: "cover" },
  deleteBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  addBtn: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
});

export const PhotoStepPlugin: StepPlugin = {
  type: "photo",
  label: "Photo Capture",
  detect: (config) => config?.["x-behavior"] === "photo-capture",
  buildInitialState: () => ({ photos: [] }),
  isFulfilled: (state, config) =>
    (state.photos?.length ?? 0) >= (config?.minPhotos ?? 1),
  serialize: (state) => ({ photos: state.photos }),
  Component: PhotoComponent,
};
