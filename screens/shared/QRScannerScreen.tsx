// src/screens/QRScannerScreen.tsx
import { useAuth } from "@/contexts/AuthContext";
import { useCheckin } from "@/hooks/useCheckin";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useRef, useState } from "react";
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface QRScanResult {
  valid: boolean;
  message?: string;
  raw?: string;

  stepId?: string;

  // từ BE
  checkinRecordId?: string;
  checkinAt?: string;

  // từ WorkareaCheckinPoint
  checkinPointId?: string;
  workareaId?: string;
  code?: string;

  verifiedAt?: string;
}

// ─── Corner brackets ──────────────────────────────────────────────────────────
function Corners({ color }: { color: string }) {
  const s = StyleSheet.create({
    corner: { position: "absolute", width: 28, height: 28, borderColor: color },
    TL: {
      top: 0,
      left: 0,
      borderTopWidth: 3,
      borderLeftWidth: 3,
      borderTopLeftRadius: 4,
    },
    TR: {
      top: 0,
      right: 0,
      borderTopWidth: 3,
      borderRightWidth: 3,
      borderTopRightRadius: 4,
    },
    BL: {
      bottom: 0,
      left: 0,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
      borderBottomLeftRadius: 4,
    },
    BR: {
      bottom: 0,
      right: 0,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      borderBottomRightRadius: 4,
    },
  });
  return (
    <>
      <View style={[s.corner, s.TL]} />
      <View style={[s.corner, s.TR]} />
      <View style={[s.corner, s.BL]} />
      <View style={[s.corner, s.BR]} />
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function QRScannerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const onScanned: ((result: QRScanResult) => void) | undefined =
    route.params?.onScanned;

  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<QRScanResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const isHandled = useRef(false); // ngăn scan nhiều lần
  const { checkinByQr } = useCheckin();
  const { getWorkerProfile } = useAuth();

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (isHandled.current || verifying) return;

    isHandled.current = true;
    setVerifying(true);

    try {
      const profile = await getWorkerProfile();
      const workerId = profile?.id;

      if (!workerId) throw new Error("Không xác định worker");

      const scanResult = await checkinByQr({
        raw: data,
        workerId,

        taskId: route.params?.taskId,
        taskStepId: route.params?.stepId,

        deviceUuid: undefined, // QR thì không có
        notes: "QR scan",
      });

      setResult(scanResult);

      if (scanResult.valid) {
        setTimeout(() => {
          onScanned?.({
            ...scanResult,
            stepId: route.params?.stepId,
          });
          navigation.goBack();
        }, 800);
      }
    } catch (err: any) {
      setResult({
        valid: false,
        raw: data,
        message: err.message,
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setVerifying(false);
    isHandled.current = false;
  };

  // ── Permission: chưa hỏi ──────────────────────────────────────────────────
  if (!permission) return <View style={styles.root} />;

  // ── Permission: bị từ chối ────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.permissionWrap}>
          <Ionicons name="qr-code-outline" size={56} color="#475569" />
          <Text style={styles.permissionTitle}>Cần quyền Camera</Text>
          <Text style={styles.permissionDesc}>
            Ứng dụng cần camera để quét mã QR check-in.
          </Text>
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={requestPermission}
          >
            <Text style={styles.permissionBtnText}>Cấp quyền</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelBtnText}>Huỷ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Corner color theo trạng thái ──────────────────────────────────────────
  const cornerColor = result
    ? result.valid
      ? "#4ADE80"
      : "#F87171"
    : "#38BDF8";

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Camera full screen */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={!result ? handleBarCodeScanned : undefined}
      />

      {/* Overlay tối 4 góc */}
      <View style={styles.overlay} pointerEvents="none">
        {/* top */}
        <View style={styles.overlayTop} />
        {/* middle row */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          {/* viewfinder trong suốt */}
          <View style={styles.viewfinder}>
            <Corners color={cornerColor} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        {/* bottom */}
        <View style={styles.overlayBottom} />
      </View>

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quét mã QR</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {/* Result overlay */}
      {result && (
        <View style={styles.resultBanner}>
          <View
            style={[
              styles.resultCard,
              result.valid ? styles.resultCardValid : styles.resultCardInvalid,
            ]}
          >
            <Text style={styles.resultIcon}>{result.valid ? "✓" : "✗"}</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.resultTitle,
                  result.valid ? styles.textValid : styles.textInvalid,
                ]}
              >
                {result.valid ? "Check-in thành công!" : "QR không hợp lệ"}
              </Text>
              {!result.valid && result.message && (
                <Text style={styles.resultSub}>{result.message}</Text>
              )}
            </View>
          </View>

          {!result.valid && (
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
              <Ionicons name="refresh" size={16} color="#FFF" />
              <Text style={styles.retryBtnText}>Quét lại</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Hint khi chưa scan */}
      {!result && !verifying && (
        <View style={styles.hintWrap}>
          <Text style={styles.hintText}>
            Hướng camera vào mã QR tại khu vực làm việc
          </Text>
        </View>
      )}

      {verifying && (
        <View style={styles.hintWrap}>
          <Text style={styles.hintText}>Đang xác thực...</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const VIEWFINDER = 260;
const OVERLAY_COLOR = "rgba(0,0,0,0.62)";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },

  // Permission
  permissionWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: "#0A0F1E",
  },
  permissionTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 10,
  },
  permissionDesc: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  permissionBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  cancelBtn: { paddingVertical: 10 },
  cancelBtnText: { color: "#64748B", fontSize: 14, fontWeight: "600" },

  // Header
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0,
    paddingBottom: 12,
  },
  headerTitle: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Overlay
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: OVERLAY_COLOR },
  overlayMiddle: { flexDirection: "row", height: VIEWFINDER },
  overlaySide: { flex: 1, backgroundColor: OVERLAY_COLOR },
  overlayBottom: { flex: 1, backgroundColor: OVERLAY_COLOR },
  viewfinder: { width: VIEWFINDER, height: VIEWFINDER },

  // Hint
  hintWrap: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  hintText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },

  // Result banner
  resultBanner: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    gap: 10,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  resultCardValid: {
    backgroundColor: "rgba(20,83,45,0.95)",
    borderColor: "#4ADE80",
  },
  resultCardInvalid: {
    backgroundColor: "rgba(127,29,29,0.95)",
    borderColor: "#F87171",
  },
  resultIcon: { fontSize: 28, fontWeight: "700" },
  resultTitle: { fontSize: 15, fontWeight: "700" },
  textValid: { color: "#4ADE80" },
  textInvalid: { color: "#F87171" },
  resultSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 3 },

  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  retryBtnText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
});
