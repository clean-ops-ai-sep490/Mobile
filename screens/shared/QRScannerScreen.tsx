// src/screens/QRScannerScreen.tsx
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_VALID: Record<string, { locationId: string; name: string }> = {
  "LOC-FLOOR1-A": { locationId: "floor1-zone-a", name: "Tầng 1 - Khu A" },
  "LOC-FLOOR2-B": { locationId: "floor2-zone-b", name: "Tầng 2 - Khu B" },
  "LOC-LOBBY-01": { locationId: "lobby-01", name: "Sảnh chính" },
};

interface QRScanResult {
  valid: boolean;
  message?: string;
  raw?: string;
  locationId?: string;
  verifiedAt?: string;
}

function mockVerifyQR(raw: string): QRScanResult {
  const entry = MOCK_VALID[raw];
  if (entry) {
    return {
      valid: true,
      raw,
      locationId: entry.locationId,
      verifiedAt: new Date().toISOString(),
    };
  }
  return {
    valid: false,
    raw,
    message: "QR không hợp lệ hoặc không thuộc khu vực được phân công.",
  };
}

// ─── Scan line animation ──────────────────────────────────────────────────────
function ScanLine() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });
  return (
    <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
  );
}

function Corners() {
  return (
    <>
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function QRScannerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // returnScreen: tên screen cần navigate về để trả kết quả
  const returnScreen = route.params?.returnScreen;

  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<QRScanResult | null>(null);

  const handleSelect = (raw: string) => {
    setScanning(true);
    setLastResult(null);

    setTimeout(() => {
      const result = mockVerifyQR(raw);
      setLastResult(result);
      setScanning(false);

      if (result.valid) {
        setTimeout(() => {
          if (returnScreen) {
            // ← Trả kết quả về màn hình gọi qua params thay vì callback
            navigation.navigate(returnScreen, { qrResult: result });
          } else {
            navigation.goBack();
          }
        }, 900);
      }
    }, 800);
  };

  const demos = [
    ...Object.keys(MOCK_VALID).map((k) => ({ raw: k, valid: true })),
    { raw: "INVALID-QR-XYZ", valid: false },
  ];

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quét mã QR</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Viewfinder */}
      <View style={styles.viewfinderWrapper}>
        <View style={styles.viewfinder}>
          <Corners />
          {scanning ? (
            <ScanLine />
          ) : lastResult ? (
            <View style={styles.resultOverlay}>
              <Text style={styles.resultIcon}>
                {lastResult.valid ? "✓" : "✗"}
              </Text>
              <Text
                style={[
                  styles.resultText,
                  lastResult.valid ? styles.resultValid : styles.resultInvalid,
                ]}
              >
                {lastResult.valid
                  ? "Hợp lệ!"
                  : (lastResult.message ?? "Không hợp lệ")}
              </Text>
            </View>
          ) : (
            <Text style={styles.hint}>Hướng camera vào mã QR</Text>
          )}
        </View>
        <Text style={styles.subHint}>
          {scanning
            ? "Đang xác thực..."
            : "Camera thật sẽ tích hợp sau khi có API"}
        </Text>
      </View>

      {/* Demo buttons */}
      {!scanning && !lastResult?.valid && (
        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>
            🧪 Demo — Chọn QR để giả lập quét
          </Text>
          {demos.map((d) => (
            <TouchableOpacity
              key={d.raw}
              style={[
                styles.demoBtn,
                d.valid ? styles.demoBtnValid : styles.demoBtnInvalid,
              ]}
              onPress={() => handleSelect(d.raw)}
              activeOpacity={0.75}
            >
              <Text style={styles.demoBtnText}>
                {d.valid ? "✅" : "❌"} {d.raw}
              </Text>
              {d.valid && (
                <Text style={styles.demoBtnSub}>{MOCK_VALID[d.raw].name}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Retry nếu invalid */}
      {lastResult && !lastResult.valid && (
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => setLastResult(null)}
        >
          <Text style={styles.retryBtnText}>Thử lại</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0F1E" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  headerTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { color: "#94A3B8", fontSize: 15, fontWeight: "600" },

  viewfinderWrapper: {
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 24,
  },
  viewfinder: {
    width: 240,
    height: 240,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  hint: {
    color: "rgba(248,250,252,0.4)",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  subHint: {
    color: "#475569",
    fontSize: 12,
    marginTop: 16,
    textAlign: "center",
  },

  scanLine: {
    position: "absolute",
    top: 0,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: "#38BDF8",
    borderRadius: 1,
    shadowColor: "#38BDF8",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },

  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: "#38BDF8",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 4,
  },

  resultOverlay: { alignItems: "center", gap: 8 },
  resultIcon: { fontSize: 40, fontWeight: "700" },
  resultText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  resultValid: { color: "#4ADE80" },
  resultInvalid: { color: "#F87171" },

  demoBox: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: "#0F172A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 16,
    gap: 10,
  },
  demoTitle: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  demoBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 2,
  },
  demoBtnValid: {
    backgroundColor: "#0F2820",
    borderWidth: 1,
    borderColor: "#166534",
  },
  demoBtnInvalid: {
    backgroundColor: "#1F0F0F",
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },
  demoBtnText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  demoBtnSub: { color: "#64748B", fontSize: 11, marginTop: 2 },

  retryBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  retryBtnText: { color: "#F8FAFC", fontWeight: "600", fontSize: 14 },
});
