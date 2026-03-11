import { Ionicons } from "@expo/vector-icons";
import { CameraView, FlashMode, useCameraPermissions } from "expo-camera";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  PinchGestureHandlerGestureEvent,
  State,
} from "react-native-gesture-handler";

const { height } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────
interface CapturedPhoto {
  uri: string;
  timestamp: string;
}

interface Props {
  onClose?: () => void;
  onSubmit?: (photos: CapturedPhoto[]) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_ZOOM = 0;
const MAX_ZOOM = 1;
const ZOOM_SENSITIVITY = 0.005;

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function InspectionCameraScreen({ onClose, onSubmit }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<FlashMode>("off");
  const [gridVisible, setGridVisible] = useState(true);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const [zoom, setZoom] = useState(MIN_ZOOM);
  const zoomRef = useRef(MIN_ZOOM);
  const showZoomBar = useRef(false);
  const [zoomBarVisible, setZoomBarVisible] = useState(false);
  const zoomBarOpacity = useRef(new Animated.Value(0)).current;
  const zoomBarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cameraRef = useRef<CameraView>(null);

  // ── No permission yet ──────────────────────────────────────────────────────
  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <View style={styles.permissionIconWrap}>
          <Ionicons name="camera-outline" size={52} color="#94A3B8" />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          CleanOps needs camera access to capture inspection photos.
        </Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.permissionCancel} onPress={onClose}>
          <Text style={styles.permissionCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Zoom helpers ───────────────────────────────────────────────────────────
  const showZoomIndicator = () => {
    if (zoomBarTimer.current) clearTimeout(zoomBarTimer.current);
    if (!showZoomBar.current) {
      showZoomBar.current = true;
      setZoomBarVisible(true);
      Animated.timing(zoomBarOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
    zoomBarTimer.current = setTimeout(() => {
      Animated.timing(zoomBarOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        showZoomBar.current = false;
        setZoomBarVisible(false);
      });
    }, 1800);
  };

  const onPinchGestureEvent = (event: PinchGestureHandlerGestureEvent) => {
    const { scale } = event.nativeEvent;
    const delta = (scale - 1) * ZOOM_SENSITIVITY * 30;
    const newZoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, zoomRef.current + delta),
    );
    setZoom(newZoom);
    showZoomIndicator();
  };

  const onPinchHandlerStateChange = (
    event: PinchGestureHandlerGestureEvent,
  ) => {
    if (event.nativeEvent.state === State.BEGAN) {
      zoomRef.current = zoom;
    }
    if (
      event.nativeEvent.state === State.END ||
      event.nativeEvent.state === State.CANCELLED
    ) {
      zoomRef.current = zoom;
    }
  };

  const zoomLabel = `${(1 + zoom * 9).toFixed(1)}×`;

  // ── Capture ────────────────────────────────────────────────────────────────
  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) return;
      setPhotos((prev) => [
        ...prev,
        {
          uri: photo.uri,
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch {
      Alert.alert("Error", "Failed to capture photo. Please try again.");
    } finally {
      setCapturing(false);
    }
  };

  const handleDelete = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (photos.length === 0) {
      Alert.alert(
        "No Photos",
        "Please capture at least one photo before submitting.",
      );
      return;
    }
    onSubmit?.(photos);
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <PinchGestureHandler
        onGestureEvent={onPinchGestureEvent}
        onHandlerStateChange={onPinchHandlerStateChange}
      >
        <Animated.View style={styles.container}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            flash={flash}
            zoom={zoom}
          >
            {/* Grid */}
            {gridVisible && (
              <View style={styles.grid} pointerEvents="none">
                {[0, 1, 2].map((row) => (
                  <View
                    key={row}
                    style={[styles.gridRow, row === 1 && styles.gridRowMiddle]}
                  >
                    {[0, 1, 2].map((col) => (
                      <View
                        key={col}
                        style={[
                          styles.gridCell,
                          col === 1 && styles.gridCellMiddle,
                        ]}
                      />
                    ))}
                  </View>
                ))}
              </View>
            )}

            {/* Focus corners */}
            <View style={styles.focusFrame} pointerEvents="none">
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>

            {/* ── Top bar ── */}
            <SafeAreaView style={styles.topBar}>
              <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
                <Ionicons name="close" size={18} color="#FFF" />
              </TouchableOpacity>

              {photos.length > 0 && (
                <View style={styles.countPill}>
                  <Ionicons name="camera" size={13} color="#FFF" />
                  <Text style={styles.countPillText}>
                    {photos.length} photo{photos.length > 1 ? "s" : ""}
                  </Text>
                </View>
              )}

              <View style={styles.topRight}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => setGridVisible((v) => !v)}
                >
                  <Ionicons name="grid-outline" size={18} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.iconBtn,
                    flash === "on" && styles.iconBtnFlashOn,
                  ]}
                  onPress={() => setFlash((f) => (f === "off" ? "on" : "off"))}
                >
                  <Ionicons
                    name={flash === "on" ? "flash" : "flash-off-outline"}
                    size={18}
                    color="#FFF"
                  />
                </TouchableOpacity>
              </View>
            </SafeAreaView>

            {/* ── Zoom indicator ── */}
            {zoomBarVisible && (
              <Animated.View
                style={[styles.zoomContainer, { opacity: zoomBarOpacity }]}
              >
                <Text style={styles.zoomLabel}>{zoomLabel}</Text>
                <View style={styles.zoomTrack}>
                  <View
                    style={[styles.zoomFill, { width: `${zoom * 100}%` }]}
                  />
                </View>
                <View style={styles.zoomTicks}>
                  {[0, 0.111, 0.444, 1].map((pos, i) => (
                    <View
                      key={i}
                      style={[styles.zoomTick, { left: `${pos * 100}%` }]}
                    >
                      <Text style={styles.zoomTickLabel}>
                        {["1×", "2×", "5×", "10×"][i]}
                      </Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* ── Bottom bar ── */}
            <View style={styles.bottomBar}>
              {/* Thumbnail */}
              <TouchableOpacity
                style={styles.thumbnail}
                onPress={() => photos.length > 0 && setShowPreview((v) => !v)}
                activeOpacity={photos.length > 0 ? 0.7 : 1}
              >
                {photos.length > 0 ? (
                  <>
                    <Image
                      source={{ uri: photos[photos.length - 1].uri }}
                      style={styles.thumbnailImg}
                    />
                    <View style={styles.thumbnailBadge}>
                      <Text style={styles.thumbnailBadgeText}>
                        {photos.length}
                      </Text>
                    </View>
                  </>
                ) : (
                  <Ionicons
                    name="images-outline"
                    size={22}
                    color="rgba(255,255,255,0.6)"
                  />
                )}
              </TouchableOpacity>

              {/* Shutter */}
              <TouchableOpacity
                style={[styles.shutter, capturing && styles.shutterBusy]}
                onPress={handleCapture}
                activeOpacity={0.85}
                disabled={capturing}
              >
                <View
                  style={[
                    styles.shutterInner,
                    capturing && styles.shutterInnerBusy,
                  ]}
                />
              </TouchableOpacity>

              {/* Submit */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  photos.length > 0 && styles.submitBtnReady,
                ]}
                onPress={handleSubmit}
              >
                <Ionicons name="checkmark" size={26} color="#FFF" />
              </TouchableOpacity>
            </View>
          </CameraView>
        </Animated.View>
      </PinchGestureHandler>

      {/* ── Preview Drawer ── */}
      {showPreview && (
        <View style={styles.drawer}>
          <View style={styles.drawerHandle} />
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Photos ({photos.length})</Text>
            <TouchableOpacity onPress={() => setShowPreview(false)}>
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.drawerScroll}
          >
            {photos.map((p, i) => (
              <View key={i} style={styles.drawerItem}>
                <Image source={{ uri: p.uri }} style={styles.drawerImg} />
                <Text style={styles.drawerTime}>{p.timestamp}</Text>
                <TouchableOpacity
                  style={styles.drawerDelete}
                  onPress={() => handleDelete(i)}
                >
                  <Ionicons name="close" size={10} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.drawerSubmit,
              photos.length > 0 && styles.drawerSubmitReady,
            ]}
            onPress={handleSubmit}
          >
            <Text style={styles.drawerSubmitText}>
              Submit {photos.length} photo{photos.length > 1 ? "s" : ""} for AI
              Review
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },

  // Permission screen
  permissionScreen: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  permissionIconWrap: { marginBottom: 16 },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 10,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  permissionBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  permissionCancel: { paddingVertical: 10 },
  permissionCancelText: { color: "#64748B", fontSize: 14, fontWeight: "600" },

  // Grid
  grid: { ...StyleSheet.absoluteFillObject, flexDirection: "column" },
  gridRow: { flex: 1, flexDirection: "row" },
  gridRowMiddle: {
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  gridCell: { flex: 1 },
  gridCellMiddle: {
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: "rgba(255,255,255,0.2)",
  },

  // Focus corners
  focusFrame: {
    position: "absolute",
    top: "28%",
    left: "12%",
    right: "12%",
    bottom: "32%",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "rgba(255,255,255,0.9)",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 4,
  },

  // Top bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 12,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconBtnFlashOn: { backgroundColor: "rgba(251,191,36,0.75)" },
  topRight: { flexDirection: "row", gap: 10 },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  countPillText: { color: "#FFF", fontSize: 13, fontWeight: "700" },

  // Zoom indicator
  zoomContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 148 : 130,
    left: 24,
    right: 24,
    alignItems: "center",
  },
  zoomLabel: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  zoomTrack: {
    width: "70%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  zoomFill: { height: "100%", backgroundColor: "#FACC15", borderRadius: 2 },
  zoomTicks: {
    width: "70%",
    flexDirection: "row",
    marginTop: 4,
    position: "relative",
    height: 16,
  },
  zoomTick: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -10 }],
  },
  zoomTickLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "600",
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 36,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
    paddingTop: 16,
  },

  // Thumbnail
  thumbnail: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
  },
  thumbnailImg: { width: 54, height: 54, borderRadius: 10 },
  thumbnailBadge: {
    position: "absolute",
    top: -7,
    right: -7,
    backgroundColor: "#2563EB",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
  thumbnailBadgeText: { fontSize: 10, fontWeight: "700", color: "#FFF" },

  // Shutter
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 3,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterBusy: { opacity: 0.5 },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFF",
  },
  shutterInnerBusy: { backgroundColor: "#CBD5E1" },

  // Submit
  submitBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(107,114,128,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnReady: {
    backgroundColor: "#22C55E",
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },

  // Drawer
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    maxHeight: height * 0.5,
  },
  drawerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#334155",
    alignSelf: "center",
    marginBottom: 16,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  drawerTitle: { fontSize: 16, fontWeight: "800", color: "#FFF" },
  drawerScroll: { marginBottom: 16 },
  drawerItem: { marginRight: 10, position: "relative" },
  drawerImg: {
    width: 80,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#1E293B",
  },
  drawerTime: {
    fontSize: 10,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },
  drawerDelete: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  drawerSubmit: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  drawerSubmitReady: {
    backgroundColor: "#2563EB",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  drawerSubmitText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
});
