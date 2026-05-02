// src/components/task/steps/PpeStep.tsx
import {
  PpeCheckStatus,
  PpeRequiredItem,
  useCheckPpe,
} from "@/hooks/useCheckPpe";
import { useTaskStepExecutionImage } from "@/hooks/useTaskStepExecutionImage";
import InspectionCameraScreen from "@/screens/shared/CameraScreen";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StepPlugin, StepPluginProps } from "../StepRegistry";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CapturedPhoto {
  uri: string; // local URI sau khi chụp
  serverUri?: string; // URI sau khi upload thành công
  uploaded: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────

function PpeComponent({ config, state, onChange }: StepPluginProps) {
  // config.requiredPPE có thể là string[] hoặc {actionKey, name}[]
  // Normalize sang {actionKey, name}[]
  const requiredItems: PpeRequiredItem[] = (config?.requiredPPE ?? []).map(
    (item: any): PpeRequiredItem => {
      if (typeof item === "string") return { actionKey: item, name: item };
      return {
        actionKey: item.actionKey ?? item,
        name: item.name ?? item.actionKey ?? item,
      };
    },
  );

  const maxPhotos = requiredItems.length; // Số ảnh tối đa = số món PPE
  const stepExecutionId: string = state.__stepId;
  const taskAssignmentId: string = state.__taskAssignmentId;

  const { uploadImages, reUploadImages, getImagesByStep, deleteImagesByStep } =
    useTaskStepExecutionImage();

  const { status, result, isRequesting, isConnected, requestPpeCheck, reset } =
    useCheckPpe(stepExecutionId);

  const [photos, setPhotos] = useState<CapturedPhoto[]>(
    (state.photos as CapturedPhoto[]) ?? [],
  );
  const [isCameraVisible, setCameraVisible] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const isUploading = uploadingIndex !== null;
  const isBusy = isUploading || isRequesting || status === "PENDING";
  const canAddPhoto = photos.length < maxPhotos && !isBusy;
  const allUploaded = photos.length > 0 && photos.every((p) => p.uploaded);
  const canSendCheck = allUploaded && !isBusy && status !== "PASS";

  useEffect(() => {
    onChange({
      ...state,
      ppeStatus: status,
    });
  }, [status]);

  // Sync state lên parent mỗi khi photos hoặc status thay đổi
  const syncParent = (nextPhotos: CapturedPhoto[]) => {
    onChange({
      ...state,
      photos: nextPhotos,
      ppeStatus: status,
    });
  };

  // ─── Xử lý chụp ảnh ────────────────────────────────────────────────────────
  const handleCameraSubmit = async (capturedPhotos: { uri: string }[]) => {
    setCameraVisible(false);
    if (capturedPhotos.length === 0) return;

    const newPhoto: CapturedPhoto = {
      uri: capturedPhotos[0].uri,
      uploaded: false,
    };

    const nextPhotos = [...photos, newPhoto];
    setPhotos(nextPhotos);
    syncParent(nextPhotos);

    // Upload ngay sau khi chụp
    await uploadPhoto(nextPhotos, nextPhotos.length - 1);
  };

  const uploadPhoto = async (currentPhotos: CapturedPhoto[], index: number) => {
    const photo = currentPhotos[index];
    if (!photo || photo.uploaded) return;

    setUploadingIndex(index);
    try {
      // POST trước, nếu 400 thì fallback PUT
      try {
        await uploadImages(stepExecutionId, 2, [{ uri: photo.uri }], 1);
      } catch (postErr: any) {
        if (postErr?.response?.status === 400) {
          await reUploadImages(stepExecutionId, 2, [{ uri: photo.uri }], 1);
        } else {
          throw postErr;
        }
      }

      // Lấy lại URL thật từ server
      const serverUrls = await getImagesByStep(
        taskAssignmentId,
        stepExecutionId,
        2,
      );
      const serverUri = serverUrls[index] ?? photo.uri;

      const updated = currentPhotos.map((p, i) =>
        i === index ? { ...p, serverUri, uploaded: true } : p,
      );
      setPhotos(updated);
      syncParent(updated);
    } catch (err: any) {
      Alert.alert("Lỗi upload", err?.message ?? "Không thể tải ảnh lên.");
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleDeleteAllPhotos = async () => {
    if (isBusy || photos.length === 0) return;

    Alert.alert("Xoá tất cả", "Bạn có chắc muốn xoá toàn bộ ảnh?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteImagesByStep(stepExecutionId);

            setPhotos([]);
            reset(); // reset PPE status

            syncParent([]);
          } catch (err: any) {
            Alert.alert("Lỗi", err?.message ?? "Không thể xoá ảnh.");
          }
        },
      },
    ]);
  };

  // ─── Gửi kiểm tra AI ────────────────────────────────────────────────────────
  const handleSendPpeCheck = async () => {
    if (!canSendCheck) return;
    try {
      await requestPpeCheck();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.title ??
        err?.message ??
        "Không thể gửi kiểm tra PPE.";
      Alert.alert("Lỗi", msg);
    }
  };

  // ─── Render status banner ────────────────────────────────────────────────────
  const renderStatusBanner = () => {
    if (status === "IDLE") return null;

    const configs: Record<
      Exclude<PpeCheckStatus, "IDLE">,
      {
        bg: string;
        border: string;
        icon: keyof typeof Ionicons.glyphMap;
        color: string;
        label: string;
      }
    > = {
      PENDING: {
        bg: "#FFF7ED",
        border: "#FED7AA",
        icon: "hourglass-outline",
        color: "#C2410C",
        label: "Đang phân tích...",
      },
      PASS: {
        bg: "#F0FDF4",
        border: "#BBF7D0",
        icon: "checkmark-circle",
        color: "#16A34A",
        label: "Đạt yêu cầu PPE ✓",
      },
      FAIL: {
        bg: "#FFF1F2",
        border: "#FECDD3",
        icon: "close-circle",
        color: "#DC2626",
        label: "Chưa đạt – Thiếu trang bị",
      },
      ERROR: {
        bg: "#FFF7ED",
        border: "#FED7AA",
        icon: "warning-outline",
        color: "#D97706",
        label: "Lỗi kiểm tra – Thử lại",
      },
    };

    const cfg = configs[status as Exclude<PpeCheckStatus, "IDLE">];
    if (!cfg) return null;

    return (
      <View
        style={[
          banner.wrap,
          { backgroundColor: cfg.bg, borderColor: cfg.border },
        ]}
      >
        <View style={banner.row}>
          {status === "PENDING" ? (
            <ActivityIndicator
              size="small"
              color={cfg.color}
              style={{ marginRight: 8 }}
            />
          ) : (
            <Ionicons
              name={cfg.icon}
              size={18}
              color={cfg.color}
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={[banner.label, { color: cfg.color }]}>{cfg.label}</Text>
        </View>

        {result?.message ? (
          <Text style={[banner.message, { color: cfg.color }]}>
            {result.message}
          </Text>
        ) : null}

        {status === "FAIL" &&
          result?.missingItems &&
          result.missingItems.length > 0 && (
            <View style={banner.missingList}>
              {result.missingItems.map((m) => (
                <Text key={m.actionKey} style={banner.missingItem}>
                  • {m.name}
                </Text>
              ))}
            </View>
          )}
      </View>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <View>
      {/* Tiêu đề & hướng dẫn */}
      <Text style={s.sectionTitle}>Kiểm tra trang bị bảo hộ (PPE)</Text>
      <Text style={s.hint}>
        Chụp tối đa {maxPhotos} ảnh thể hiện đầy đủ trang bị, sau đó bấm{" "}
        <Text style={{ fontWeight: "700" }}>Gửi kiểm tra AI</Text>.
      </Text>

      {/* Danh sách PPE yêu cầu */}
      <View style={s.ppeList}>
        {requiredItems.map((item) => {
          const detected = result?.detectedItems?.some(
            (d) => d.actionKey.toLowerCase() === item.actionKey.toLowerCase(),
          );
          const missing =
            status === "FAIL" &&
            result?.missingItems?.some(
              (m) => m.actionKey.toLowerCase() === item.actionKey.toLowerCase(),
            );

          return (
            <View
              key={item.actionKey}
              style={[
                s.ppeRow,
                status === "PASS" && s.ppeRowPass,
                missing && s.ppeRowFail,
              ]}
            >
              <View
                style={[
                  s.ppeIcon,
                  status === "PASS" && { backgroundColor: "#DCFCE7" },
                  missing && { backgroundColor: "#FEE2E2" },
                ]}
              >
                <Ionicons
                  name={
                    status === "PASS"
                      ? "checkmark-circle"
                      : missing
                        ? "close-circle"
                        : "shield-outline"
                  }
                  size={18}
                  color={
                    status === "PASS"
                      ? "#16A34A"
                      : missing
                        ? "#DC2626"
                        : "#64748B"
                  }
                />
              </View>
              <Text
                style={[
                  s.ppeText,
                  status === "PASS" && { color: "#166534" },
                  missing && { color: "#DC2626" },
                ]}
              >
                {item.name}
              </Text>
              {detected && status !== "FAIL" && (
                <Text style={s.confidence}>
                  {Math.round(
                    (result?.detectedItems?.find(
                      (d) =>
                        d.actionKey.toLowerCase() ===
                        item.actionKey.toLowerCase(),
                    )?.confidence ?? 0) * 100,
                  )}
                  %
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Khu vực ảnh */}
      <View style={s.photoSection}>
        <Text style={s.photoCount}>
          Ảnh đã chụp: {photos.length}/{maxPhotos}
        </Text>

        {photos.length > 0 && !isBusy && status !== "PASS" && (
          <TouchableOpacity onPress={handleDeleteAllPhotos}>
            <Text style={{ color: "#DC2626", fontWeight: "600", fontSize: 12 }}>
              Xoá tất cả
            </Text>
          </TouchableOpacity>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.photoScroll}
        >
          {photos.map((photo, index) => (
            <View key={index} style={s.thumbWrap}>
              <Image source={{ uri: photo.uri }} style={s.thumb} />

              {/* Overlay khi đang upload ảnh này */}
              {uploadingIndex === index && (
                <View style={s.thumbOverlay}>
                  <ActivityIndicator size="small" color="#FFF" />
                </View>
              )}

              {/* Badge uploaded */}
              {photo.uploaded && uploadingIndex !== index && (
                <View style={s.uploadedBadge}>
                  <Ionicons name="checkmark" size={10} color="#FFF" />
                </View>
              )}
            </View>
          ))}

          {/* Nút thêm ảnh */}
          {canAddPhoto && (
            <TouchableOpacity
              style={s.addPhotoBtn}
              onPress={() => setCameraVisible(true)}
              disabled={isBusy}
            >
              <Ionicons name="camera-outline" size={24} color="#94A3B8" />
              <Text style={s.addPhotoText}>Chụp ảnh</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Status banner */}
      {renderStatusBanner()}

      {/* Nút gửi kiểm tra AI */}
      {status !== "PASS" && (
        <TouchableOpacity
          style={[s.checkBtn, !canSendCheck && s.checkBtnDisabled]}
          onPress={handleSendPpeCheck}
          disabled={!canSendCheck}
          activeOpacity={0.8}
        >
          {isRequesting || status === "PENDING" ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons
              name="scan-outline"
              size={18}
              color="#FFF"
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={s.checkBtnText}>
            {status === "PENDING"
              ? "Đang phân tích..."
              : status === "ERROR"
                ? "Thử lại kiểm tra AI"
                : "Gửi kiểm tra AI"}
          </Text>
        </TouchableOpacity>
      )}

      {/* SignalR badge */}
      <View style={s.signalRow}>
        <View style={[s.signalDot, isConnected ? s.signalOn : s.signalOff]} />
        <Text style={s.signalText}>
          {isConnected ? "Đang lắng nghe kết quả..." : "Đang kết nối..."}
        </Text>
      </View>

      {/* Camera modal */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 14,
    lineHeight: 18,
  },

  // PPE list
  ppeList: { marginBottom: 16 },
  ppeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  ppeRowPass: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  ppeRowFail: { backgroundColor: "#FFF1F2", borderColor: "#FECDD3" },
  ppeIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  ppeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  confidence: {
    fontSize: 11,
    color: "#16A34A",
    fontWeight: "700",
    marginLeft: 4,
  },

  // Photos
  photoSection: { marginBottom: 14 },
  photoCount: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
    fontWeight: "500",
  },
  photoScroll: { flexDirection: "row" },
  thumbWrap: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 8,
    position: "relative",
  },
  thumb: { width: "100%", height: "100%", resizeMode: "cover" },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadedBadge: {
    position: "absolute",
    bottom: 5,
    left: 5,
    backgroundColor: "#16A34A",
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoBtn: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addPhotoText: { fontSize: 11, color: "#64748B", fontWeight: "500" },

  // Check button
  checkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingVertical: 13,
    marginTop: 4,
    marginBottom: 8,
  },
  checkBtnDisabled: { backgroundColor: "#94A3B8" },
  checkBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },

  // SignalR indicator
  signalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    gap: 6,
  },
  signalDot: { width: 7, height: 7, borderRadius: 4 },
  signalOn: { backgroundColor: "#22C55E" },
  signalOff: { backgroundColor: "#94A3B8" },
  signalText: { fontSize: 11, color: "#94A3B8" },
});

const banner = StyleSheet.create({
  wrap: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  label: { fontWeight: "700", fontSize: 14 },
  message: { fontSize: 12, marginTop: 2, lineHeight: 18 },
  missingList: { marginTop: 6 },
  missingItem: {
    fontSize: 13,
    fontWeight: "600",
    color: "#DC2626",
    marginTop: 2,
  },
});

// ─── Plugin export ─────────────────────────────────────────────────────────────

export const PpeStepPlugin: StepPlugin = {
  type: "ppe",
  label: "PPE Check",
  detect: (config) => config?.["x-behavior"] === "ai-ppe-check",

  buildInitialState: (config) => ({
    photos: [] as CapturedPhoto[],
    ppeStatus: "IDLE" as PpeCheckStatus,
  }),

  /**
   * Fulfilled khi SignalR đã trả về PASS.
   * Step hoàn thành → BE không cần resultData (truyền {} là đủ).
   */
  isFulfilled: (state) => state.ppeStatus === "PASS",

  /**
   * Truyền object rỗng, BE tự lấy resultData từ DB.
   */
  serialize: (_state) => ({}),

  Component: PpeComponent,
};
