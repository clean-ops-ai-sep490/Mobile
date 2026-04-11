// src/components/task/steps/PhotoStep.tsx
import InspectionCameraScreen from "@/screens/shared/CameraScreen";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StepPlugin, StepPluginProps } from "../StepRegistry";

function PhotoComponent({ config, state, onChange }: StepPluginProps) {
  // `photos` stores server-accessible URLs (strings). CameraScreen now
  // uploads local files and returns server URLs, so this component
  // should treat URIs as remote https URLs.
  const minPhotos: number = config?.minPhotos ?? 1;
  const maxPhotos: number = config?.maxPhotos ?? 5;
  const phase: string = config?.phase ?? "";
  const photos: string[] = Array.isArray(state.photos) ? state.photos : [];

  const [isCameraVisible, setCameraVisible] = useState(false);

  const handleCameraSubmit = (
    // CameraScreen returns an array of objects with `uri` pointing to
    // uploaded server URLs (or local file URIs for older flows).
    capturedPhotos: { uri: string; timestamp: string }[],
  ) => {
    const newUris = capturedPhotos.map((p) => String(p.uri));
    const combinedPhotos = [...photos, ...newUris];

    const limitedPhotos = combinedPhotos.slice(0, maxPhotos);

    onChange({ photos: limitedPhotos });
    setCameraVisible(false);
  };

  const handleDeletePhoto = (indexToRemove: number) => {
    const updatedPhotos = photos.filter((_, index) => index !== indexToRemove);
    onChange({ photos: updatedPhotos });
  };

  return (
    <View>
      <Text style={s.label}>
        {/* 🚀 Cập nhật text để user biết giới hạn */}
        {phase.toUpperCase()} photos (Max {maxPhotos})
      </Text>

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

        {/* 🚀 Chỉ render nút Add khi số ảnh hiện tại nhỏ hơn maxPhotos */}
        {photos.length < maxPhotos && (
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

  thumbWrapper: {
    position: "relative",
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

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
