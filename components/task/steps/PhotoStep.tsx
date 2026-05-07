// src/components/task/steps/PhotoStep.tsx
import {
  ComplianceCheckStatusResponse,
  ComplianceStatus,
  useComplianceCheck,
} from "@/hooks/useComplianceCheck";
import { useTaskStepExecutionImage } from "@/hooks/useTaskStepExecutionImage";
import InspectionCameraScreen from "@/screens/shared/CameraScreen";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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

// ─── Compliance Result Banner ──────────────────────────────────────────────────

interface ComplianceBannerProps {
  isChecking: boolean;
  status: ComplianceStatus | null;
  result: ComplianceCheckStatusResponse | null;
  error: string | null;
  onRetake: () => void;
  onRetry: () => void;
}

function ComplianceBanner({
  isChecking,
  status,
  result,
  error,
  onRetake,
  onRetry,
}: ComplianceBannerProps) {
  // ── Đang chờ AI ────────────────────────────────────────────────────────────
  if (isChecking) {
    return (
      <View style={[bs.banner, bs.bannerPending]}>
        <ActivityIndicator size="small" color="#2563EB" />
        <View style={bs.bannerTextWrap}>
          <Text style={bs.bannerTitle}>AI đang kiểm tra ảnh…</Text>
          <Text style={bs.bannerSub}>
            Vui lòng chờ, kết quả sẽ hiển thị ngay khi hoàn tất.
          </Text>
        </View>
      </View>
    );
  }

  // ── Lỗi kết nối / timeout ──────────────────────────────────────────────────
  if (error) {
    return (
      <View style={[bs.banner, bs.bannerError]}>
        <Ionicons name="alert-circle-outline" size={22} color="#B91C1C" />
        <View style={bs.bannerTextWrap}>
          <Text style={[bs.bannerTitle, { color: "#B91C1C" }]}>
            Lỗi kiểm tra
          </Text>
          <Text style={bs.bannerSub}>{error}</Text>
        </View>
        <TouchableOpacity style={bs.actionBtn} onPress={onRetry}>
          <Text style={bs.actionBtnText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!status || !result) return null;

  // ── Passed ─────────────────────────────────────────────────────────────────
  if (status === "Passed") {
    return (
      <View style={[bs.banner, bs.bannerPassed]}>
        <Ionicons name="checkmark-circle-outline" size={22} color="#166534" />
        <View style={bs.bannerTextWrap}>
          <Text style={[bs.bannerTitle, { color: "#166534" }]}>
            Ảnh đạt chuẩn ✓
          </Text>
          <Text style={bs.bannerSub}>
            Điểm thấp nhất: {result.minScore.toFixed(1)} — Không có ảnh lỗi.
          </Text>
        </View>
      </View>
    );
  }

  // ── PendingSupervisor ──────────────────────────────────────────────────────
  if (status === "PendingSupervisor") {
    return (
      <View style={[bs.banner, bs.bannerWarn]}>
        <Ionicons name="time-outline" size={22} color="#92400E" />
        <View style={bs.bannerTextWrap}>
          <Text style={[bs.bannerTitle, { color: "#92400E" }]}>
            Đang chờ supervisor xét duyệt…
          </Text>
          <Text style={bs.bannerSub}>
            {result.failedImageCount} ảnh cần xem xét (điểm thấp nhất:{" "}
            {result.minScore.toFixed(2)}). Nút hoàn thành sẽ mở sau khi
            supervisor duyệt.
          </Text>
        </View>
        {/* Không có nút action — worker chỉ có thể chờ */}
      </View>
    );
  }

  // ── Failed ─────────────────────────────────────────────────────────────────
  if (status === "Failed") {
    return (
      <View style={[bs.banner, bs.bannerFailed]}>
        <Ionicons name="close-circle-outline" size={22} color="#B91C1C" />
        <View style={bs.bannerTextWrap}>
          <Text style={[bs.bannerTitle, { color: "#B91C1C" }]}>
            Ảnh không đạt — Chụp lại
          </Text>
          <Text style={bs.bannerSub}>
            {result.failedImageCount} ảnh có điểm dưới 50. Vui lòng chụp lại
            toàn bộ.
          </Text>
        </View>
        <TouchableOpacity
          style={[bs.actionBtn, bs.actionBtnDanger]}
          onPress={onRetake}
        >
          <Text style={[bs.actionBtnText, { color: "#FFF" }]}>Chụp lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

// ─── Banner StyleSheet ─────────────────────────────────────────────────────────

const bs = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 10,
    borderWidth: 1,
  },
  bannerPending: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  bannerPassed: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  bannerWarn: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  bannerFailed: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  bannerError: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  bannerTextWrap: { flex: 1 },
  bannerTitle: { fontSize: 13, fontWeight: "700", color: "#1E293B" },
  bannerSub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
  },
  actionBtnDanger: { backgroundColor: "#EF4444" },
  actionBtnText: { fontSize: 12, fontWeight: "600", color: "#1E293B" },
});

// ─── PhotoComponent ────────────────────────────────────────────────────────────

function PhotoComponent({ config, state, onChange }: StepPluginProps) {
  const minPhotos: number = config?.minPhotos ?? 1;
  const maxPhotos: number = config?.maxPhotos ?? 5;
  const phase: string = config?.phase ?? "";
  const photos: string[] = Array.isArray(state.photos) ? state.photos : [];

  const stepExecutionId: string = state.__stepId;
  const taskAssignmentId: string = state.__taskAssignmentId;

  const isAfterPhase = phase.toLowerCase() === "after";

  const { uploadImages, reUploadImages, getImagesByStep, deleteImagesByStep } =
    useTaskStepExecutionImage();

  const {
    isChecking,
    status: complianceStatus,
    result: complianceResult,
    error: complianceError,
    initiateCheck,
    reset: resetCompliance,
  } = useComplianceCheck();

  const [isCameraVisible, setCameraVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSession] = useState(() => ({
    id: Date.now(),
    time: Date.now(),
  }));

  // Sync complianceStatus vào stepState để isFulfilled có thể đọc được
  useEffect(() => {
    if (!isAfterPhase) return;
    onChange({
      ...state,
      __complianceStatus: complianceStatus ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complianceStatus, isAfterPhase]);

  const resolveImageType = (): 0 | 1 | 2 => {
    const p = phase.toLowerCase();
    if (p === "after") return 1;
    if (p === "ppe") return 2;
    return 0;
  };

  // Sau khi upload After photos thành công → tự động trigger AI check
  const handleCameraSubmit = async (
    capturedPhotos: { uri: string; timestamp: string }[],
  ) => {
    setCameraVisible(false);
    if (capturedPhotos.length === 0) return;

    // Nếu chụp lại sau khi Failed → reset compliance state cũ
    if (isAfterPhase) {
      console.log("[PhotoStep] resetCompliance() before upload (retake)");
      resetCompliance();
    }

    try {
      setIsUploading(true);

      const imageType = resolveImageType();

      try {
        await uploadImages(
          stepExecutionId,
          imageType,
          capturedPhotos,
          minPhotos,
        );
      } catch (postErr: any) {
        const status = postErr?.response?.status;
        if (status === 400) {
          console.log("⚠️ POST thất bại, fallback sang PUT...");
          await reUploadImages(
            stepExecutionId,
            imageType,
            capturedPhotos,
            minPhotos,
          );
        } else {
          throw postErr;
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

      // ── Trigger AI compliance check sau khi upload After photo ──────────
      if (isAfterPhase && serverUrls.length > 0) {
        console.log(
          "[PhotoStep] Triggering AI compliance check for After photos...",
          stepExecutionId,
        );
        try {
          await initiateCheck(stepExecutionId);
          console.log(
            "[PhotoStep] initiateCheck returned for",
            stepExecutionId,
          );
        } catch (e: any) {
          console.error("[PhotoStep] initiateCheck failed:", e?.message ?? e);
        }
      }
    } catch (err: any) {
      Alert.alert("Lỗi", "Upload ảnh thất bại: " + (err?.message ?? ""));
    } finally {
      setIsUploading(false);
    }
  };

  /** Người dùng bấm "Chụp lại" từ banner Failed */
  const handleRetakeFromFailed = () => {
    console.log(
      "[PhotoStep] handleRetakeFromFailed called — resetting compliance and deleting server images",
    );
    resetCompliance();
    // Xoá ảnh cũ trên server (soft-delete) rồi clear state để buộc chụp lại
    (async () => {
      try {
        if (stepExecutionId) {
          console.log("[PhotoStep] deleting images by step", stepExecutionId);
          await deleteImagesByStep(stepExecutionId);
          console.log(
            "[PhotoStep] deleteImagesByStep succeeded",
            stepExecutionId,
          );
        }
      } catch (e: any) {
        console.warn("Failed to delete images on server:", e?.message ?? e);
      } finally {
        onChange({ photos: [], lastUploadTime: null });
        setCameraVisible(true);
      }
    })();
  };

  const handleDeleteAllServer = () => {
    if (!stepExecutionId) {
      onChange({ photos: [], lastUploadTime: null });
      return;
    }

    Alert.alert(
      "Xóa ảnh đã tải lên",
      "Xoá toàn bộ ảnh đã upload cho bước này trên server? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            // Reset first to ensure any active polling / SignalR are torn down
            // and we start from a clean state before deleting server images.
            resetCompliance();

            try {
              await deleteImagesByStep(stepExecutionId);
            } catch (e: any) {
              console.warn(
                "Failed to delete images on server:",
                e?.message ?? e,
              );
              Alert.alert(
                "Lỗi",
                "Xóa ảnh trên server thất bại. Vui lòng thử lại.",
              );
              return;
            }

            // Clear local photos and immediately open camera for retake
            onChange({ photos: [], lastUploadTime: null });
            setCameraVisible(true);
          },
        },
      ],
    );
  };

  /** Người dùng bấm "Thử lại" khi có lỗi poll */
  const handleRetryCheck = () => {
    if (stepExecutionId) {
      initiateCheck(stepExecutionId);
    }
  };

  const handleDeletePhoto = (indexToRemove: number) => {
    const updatedPhotos = photos.filter((_, index) => index !== indexToRemove);
    onChange({ photos: updatedPhotos });
    // Khi xoá ảnh → reset compliance state vì ảnh đã thay đổi
    if (isAfterPhase) resetCompliance();
  };

  // ── Điều kiện disable nút camera ────────────────────────────────────────
  // Không cho chụp thêm khi AI đang chạy hoặc đã Passed/PendingSupervisor
  const isCameraDisabled =
    isUploading ||
    isChecking ||
    complianceStatus === "Passed" ||
    complianceStatus === "PendingSupervisor";

  return (
    <View>
      <View style={s.labelRow}>
        <Text style={s.label}>
          {phase.toUpperCase()} photos (Tối đa: {maxPhotos})
        </Text>
        {(photos.length > 0 ||
          (isAfterPhase && complianceStatus === "Failed")) &&
          (!isAfterPhase || complianceStatus === "Failed") && (
            <TouchableOpacity
              style={s.deleteAllBtn}
              onPress={handleDeleteAllServer}
            >
              <Text style={s.deleteAllBtnText}>Xóa tất cả ảnh</Text>
            </TouchableOpacity>
          )}
      </View>

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
            {/* <TouchableOpacity
              style={s.deleteBtn}
              onPress={() => handleDeletePhoto(i)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={14} color="#FFF" />
            </TouchableOpacity> */}
          </View>
        ))}

        {photos.length < maxPhotos && !isCameraDisabled && (
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => setCameraVisible(true)}
          >
            <Ionicons name="camera-outline" size={24} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Compliance banner — chỉ hiển thị cho After phase ──────────── */}
      {isAfterPhase && photos.length > 0 && (
        <ComplianceBanner
          isChecking={isChecking}
          status={complianceStatus}
          result={complianceResult}
          error={complianceError}
          onRetake={handleRetakeFromFailed}
          onRetry={handleRetryCheck}
        />
      )}

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
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deleteAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  deleteAllBtnText: { fontSize: 12, color: "#DC2626", fontWeight: "700" },
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
  label: "Chụp ảnh",
  detect: (config) => config?.["x-behavior"] === "photo-capture",
  buildInitialState: () => ({ photos: [] }),
  isFulfilled: (state, config) => {
    const hasEnoughPhotos =
      (state.photos?.length ?? 0) >= (config?.minPhotos ?? 1);

    // Với After phase: chỉ fulfilled khi AI check đã chạy xong
    // và status không phải Failed
    // (isChecking === false được đảm bảo bởi hook khi status terminal)
    // Lưu ý: isFulfilled không có access trực tiếp vào hook state,
    // nên chúng ta lưu complianceStatus vào stepState qua onChange.
    const phase: string = config?.phase ?? "";
    if (phase.toLowerCase() === "after") {
      const compliance = state.__complianceStatus as string | undefined;
      // Nếu chưa có compliance check → chưa fulfilled
      if (!compliance) return false;
      // Failed → chưa fulfilled
      if (compliance === "Failed") return false;
      // Pending / Processing → chưa fulfilled
      if (compliance === "Pending" || compliance === "Processing") return false;
      if (compliance === "PendingSupervisor") return false;
      return hasEnoughPhotos;
    }

    return hasEnoughPhotos;
  },
  serialize: (state) => ({ photos: state.photos }),
  Component: PhotoComponent,
};
