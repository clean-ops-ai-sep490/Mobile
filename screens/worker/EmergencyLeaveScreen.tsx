import AppButton from "@/components/common/AppButton";
import BottomTabBar, { TabKey } from "@/components/common/BottomTabBar";
import CustomDatePicker from "@/components/common/CustomDatePicker";
import Header from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useEmergencyLeaveRequest } from "@/hooks/useEmergencyLeave";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Audio } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────
type RecordState = "idle" | "recording" | "recorded";
type PlayState = "idle" | "playing" | "paused";

interface Props {
  taskAssignmentId: string;
  onClose?: () => void;
  onSubmitSuccess?: (id: string) => void;
}

// ─── Waveform Bars ────────────────────────────────────────────────────────────
const WaveformBars = ({
  active,
  color = "#E8365D",
}: {
  active: boolean;
  color?: string;
}) => {
  const anims = useRef(
    Array.from({ length: 11 }, () => new Animated.Value(0.25)),
  ).current;

  useEffect(() => {
    if (!active) {
      anims.forEach((a) =>
        Animated.timing(a, {
          toValue: 0.25,
          duration: 300,
          useNativeDriver: true,
        }).start(),
      );
      return;
    }
    const loops = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 70),
          Animated.timing(anim, {
            toValue: 0.9 + Math.random() * 0.1,
            duration: 280 + i * 30,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.15,
            duration: 280 + i * 30,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [active]);

  return (
    <View style={styles.waveform}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveBar,
            {
              transform: [{ scaleY: anim }],
              backgroundColor: active ? color : "#E5E7EB",
            },
          ]}
        />
      ))}
    </View>
  );
};

// ─── Pulse Ring ───────────────────────────────────────────────────────────────
const PulseRing = ({ isRecording }: { isRecording: boolean }) => {
  const s1 = useRef(new Animated.Value(1)).current;
  const s2 = useRef(new Animated.Value(1)).current;
  const o1 = useRef(new Animated.Value(0)).current;
  const o2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isRecording) {
      [s1, s2].forEach((s) =>
        Animated.timing(s, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(),
      );
      [o1, o2].forEach((o) =>
        Animated.timing(o, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(),
      );
      return;
    }
    const p1 = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(s1, {
            toValue: 1.45,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(s1, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(o1, {
            toValue: 0.3,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(o1, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    const p2 = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.delay(450),
          Animated.timing(s2, {
            toValue: 1.8,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(s2, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(450),
          Animated.timing(o2, {
            toValue: 0.18,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(o2, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    p1.start();
    p2.start();
    return () => {
      p1.stop();
      p2.stop();
    };
  }, [isRecording]);

  return (
    <View style={styles.pulseContainer} pointerEvents="none">
      <Animated.View
        style={[
          styles.pulseRing,
          styles.pulseOuter,
          { transform: [{ scale: s2 }], opacity: o2 },
        ]}
      />
      <Animated.View
        style={[
          styles.pulseRing,
          styles.pulseInner,
          { transform: [{ scale: s1 }], opacity: o1 },
        ]}
      />
    </View>
  );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.progressTrack}>
    <View
      style={[
        styles.progressFill,
        { width: `${Math.min(progress * 100, 100)}%` },
      ]}
    />
  </View>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    Pending: { bg: "#FEF3C7", text: "#92400E" },
    Approved: { bg: "#D1FAE5", text: "#065F46" },
    Rejected: { bg: "#FEE2E2", text: "#991B1B" },
  };
  const c = colors[status] ?? { bg: "#F3F4F6", text: "#374151" };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{status}</Text>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EmergencyLeaveScreen({
  taskAssignmentId,
  onClose,
  onSubmitSuccess,
}: Props) {
  const { getWorkerProfile } = useAuth();
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [loadingWorker, setLoadingWorker] = useState(true);
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [recSeconds, setRecSeconds] = useState(0);
  const [playSeconds, setPlaySeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [leaveDateFrom, setLeaveDateFrom] = useState<Date | undefined>(
    undefined,
  );
  const [leaveDateTo, setLeaveDateTo] = useState<Date | undefined>(undefined);
  const [transcription, setTranscription] = useState<string>("");

  const [showDatePicker, setShowDatePicker] = useState<"from" | "to" | null>(
    null,
  );
  const [tempDate, setTempDate] = useState(new Date());
  // Track result after successful submission
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const navigation = useNavigation();
  const {
    loading: submitting,
    error: submitError,
    createRequest,
  } = useEmergencyLeaveRequest();

  const handleNavigate = (screen: TabKey) =>
    navigation.navigate(screen as never);

  const isRecording = recordState === "recording";
  const isRecorded = recordState === "recorded";
  const isPlaying = playState === "playing";
  const isPaused = playState === "paused";

  const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
  const recMin = Math.floor(recSeconds / 60);
  const recSec = recSeconds % 60;
  const progress = duration > 0 ? playSeconds / duration : 0;

  useEffect(() => {
    const fetchWorkerId = async () => {
      try {
        setLoadingWorker(true);
        const profile = await getWorkerProfile();

        // Nếu lấy thành công, gán id vào state workerId
        if (profile && profile.id) {
          setWorkerId(profile.id);
        }
      } catch (error) {
        console.error("Error fetching worker profile:", error);
      } finally {
        setLoadingWorker(false);
      }
    };

    fetchWorkerId();
  }, []);

  useEffect(() => {
    return () => {
      recTimerRef.current && clearInterval(recTimerRef.current);
      playTimerRef.current && clearInterval(playTimerRef.current);
      soundRef.current?.unloadAsync();
      recordingRef.current?.stopAndUnloadAsync();
    };
  }, []);

  // ── Recording ──────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Cần quyền", "Cần quyền truy cập micro.");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setRecordState("recording");
      setRecSeconds(0);
      setPlayState("idle");
      setPlaySeconds(0);
      setRecordingUri(null);
      recTimerRef.current = setInterval(
        () => setRecSeconds((s) => s + 1),
        1000,
      );
    } catch {
      Alert.alert("Lỗi", "Không thể bắt đầu ghi âm.");
    }
  };

  const stopRecording = async () => {
    try {
      recTimerRef.current && clearInterval(recTimerRef.current);
      if (!recordingRef.current) return;
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const status = await recordingRef.current.getStatusAsync();
      setRecordingUri(uri ?? null);
      setDuration((status as any).durationMillis / 1000 || recSeconds);
      recordingRef.current = null;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      setRecordState("recorded");
    } catch {
      Alert.alert("Lỗi", "Không thể dừng ghi âm.");
    }
  };

  const handleMicPress = () => {
    if (recordState === "idle") startRecording();
    else if (recordState === "recording") stopRecording();
  };

  const handleReRecord = async () => {
    try {
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      clearInterval(playTimerRef.current!);
      setPlayState("idle");
      setPlaySeconds(0);
      setRecordState("idle");
      setRecSeconds(0);
      setRecordingUri(null);
      setDuration(0);
      setSubmittedStatus(null);
    } catch {}
  };

  // ── Playback ───────────────────────────────────────────────────────────────
  const handlePlayPause = async () => {
    if (!recordingUri) return;
    if (playState === "idle") {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: recordingUri },
          { shouldPlay: true },
        );
        soundRef.current = sound;
        setPlayState("playing");
        setPlaySeconds(0);
        playTimerRef.current = setInterval(async () => {
          const s = await sound.getStatusAsync();
          if (!s.isLoaded) return;
          setPlaySeconds(s.positionMillis / 1000);
          if (s.didJustFinish) {
            clearInterval(playTimerRef.current!);
            setPlayState("idle");
            setPlaySeconds(0);
          }
        }, 200);
        sound.setOnPlaybackStatusUpdate((s) => {
          if (s.isLoaded && s.didJustFinish) {
            clearInterval(playTimerRef.current!);
            setPlayState("idle");
            setPlaySeconds(0);
          }
        });
      } catch {
        Alert.alert("Lỗi", "Không thể phát bản ghi.");
      }
    } else if (playState === "playing") {
      await soundRef.current?.pauseAsync();
      clearInterval(playTimerRef.current!);
      setPlayState("paused");
    } else if (playState === "paused") {
      await soundRef.current?.playAsync();
      playTimerRef.current = setInterval(async () => {
        const s = await soundRef.current?.getStatusAsync();
        if (!s?.isLoaded) return;
        setPlaySeconds(s.positionMillis / 1000);
      }, 200);
      setPlayState("playing");
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (loadingWorker) {
      Alert.alert("Đang tải", "Đang lấy thông tin cá nhân. Vui lòng đợi.");
      return;
    }
    if (!workerId) {
      Alert.alert(
        "Phiên hết hạn",
        "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để gửi yêu cầu.",
      );
      return;
    }
    if (!isRecorded || !recordingUri) {
      Alert.alert("Chưa có bản ghi", "Vui lòng ghi âm lý do trước khi gửi.");
      return;
    }

    // ✅ Validate: nếu không có taskAssignmentId thì phải có dates
    if (!taskAssignmentId && (!leaveDateFrom || !leaveDateTo)) {
      Alert.alert(
        "Thiếu ngày",
        "Vui lòng chọn cả ngày bắt đầu và kết thúc cho kỳ nghỉ.",
      );
      return;
    }

    // ✅ Khai báo fromDate và toDate ở ngoài để dùng sau
    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    // ✅ Validate và chuẩn bị dates
    if (leaveDateFrom && leaveDateTo) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      fromDate = new Date(leaveDateFrom);
      fromDate.setHours(0, 0, 0, 0);

      toDate = new Date(leaveDateTo);
      toDate.setHours(23, 59, 59, 999); // ✅ Cuối ngày

      // Validate: không được ở quá khứ
      if (fromDate < today) {
        Alert.alert(
          "Ngày không hợp lệ",
          "Ngày bắt đầu không được trước ngày hiện tại.",
        );
        return;
      }

      // Validate: fromDate <= toDate
      if (fromDate > toDate) {
        Alert.alert(
          "Ngày không hợp lệ",
          "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.",
        );
        return;
      }
    }

    const uriParts = recordingUri.split("/");
    const rawName =
      uriParts[uriParts.length - 1] ?? `recording_${Date.now()}.m4a`;

    try {
      const result = await createRequest({
        workerId,
        taskAssignmentId: taskAssignmentId || null,
        // ✅ Dùng fromDate và toDate đã set giờ chính xác
        leaveDateFrom: fromDate ? fromDate.toISOString() : undefined,
        leaveDateTo: toDate ? toDate.toISOString() : undefined,
        audioFile: {
          uri: recordingUri,
          name: rawName,
          type: "audio/m4a",
        },
        transcription: transcription || null,
      });

      setSubmittedStatus(result.status);

      Alert.alert(
        "Đã gửi yêu cầu",
        "Yêu cầu nghỉ khẩn cấp đã được gửi tới quản lý. Trạng thái: Đang chờ.",
        [
          {
            text: "OK",
            onPress: () => {
              onSubmitSuccess?.(result.id);
              onClose?.();
              navigation.goBack();
            },
          },
        ],
      );
    } catch (err: any) {
      const beErr =
        submitError ||
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0] ||
        err?.message ||
        "Could not submit the request. Please try again.";
      Alert.alert("Gửi thất bại", beErr);
    }
  };
  const handleConfirmDate = (selectedDate: Date) => {
    // Component con đã đảm bảo selectedDate là 00:00:00
    console.debug("[EmergencyLeave] handleConfirmDate called", {
      showDatePicker,
      selectedDateIso: selectedDate?.toISOString(),
      leaveDateFromIso: leaveDateFrom?.toISOString(),
      leaveDateToIso: leaveDateTo?.toISOString(),
    });

    if (showDatePicker === "from") {
      setLeaveDateFrom(selectedDate);

      // UX Logic: Tự đẩy ngày 'To' lên nếu 'From' vượt qua 'To' hiện tại
      if (leaveDateTo && selectedDate > leaveDateTo) {
        setLeaveDateTo(selectedDate);
      }
    } else if (showDatePicker === "to") {
      setLeaveDateTo(selectedDate);
    }

    // Log after state updates (note: state updates are async; log current values)
    console.debug("[EmergencyLeave] after handleConfirmDate (post set)", {
      selectedDateIso: selectedDate?.toISOString(),
      leaveDateFromIso: leaveDateFrom?.toISOString(),
      leaveDateToIso: leaveDateTo?.toISOString(),
    });

    // Đóng Modal/Dialog
    setShowDatePicker(null);
  };
  // Thêm helper này trong EmergencyLeaveScreen
  const toLocalMidnight = (date: Date): Date => {
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    );
  };

  // ── Mic icon ───────────────────────────────────────────────────────────────
  const micIconName = (): keyof typeof Ionicons.glyphMap => {
    if (isRecording) return "stop";
    if (isRecorded) return "refresh";
    return "mic";
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#db0614" />

      <Header
        title="Yêu cầu nghỉ khẩn cấp"
        onBack={() => handleNavigate("Home")}
        style={{ backgroundColor: "#db0614" }}
        titleStyle={{ color: "#FFFFFF" }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Title ── */}
        <Text style={styles.title}>
          {isRecording
            ? "Đang ghi âm..."
            : isRecorded
              ? "Đã ghi âm"
              : "Chạm để bắt đầu ghi âm"}
        </Text>

        <Text style={styles.subtitle}>
          {isRecorded
            ? "Nghe lại hoặc ghi lại nếu cần."
            : "Nêu rõ lý do. Quản lý của bạn\nsẽ được thông báo ngay lập tức."}
        </Text>

        {/* ── Status badge (shown after submit) ── */}
        {submittedStatus && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Trạng thái yêu cầu: </Text>
            <StatusBadge status={submittedStatus} />
          </View>
        )}

        {/* ── Mic + Pulse ── */}
        <View style={styles.micSection}>
          <PulseRing isRecording={isRecording} />
          <TouchableOpacity
            style={[
              styles.micBtn,
              isRecording && styles.micBtnRecording,
              isRecorded && styles.micBtnRecorded,
            ]}
            onPress={isRecorded ? handleReRecord : handleMicPress}
            activeOpacity={0.85}
          >
            <Ionicons name={micIconName()} size={38} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ── Recording timer ── */}
        {!isRecorded && (
          <View style={styles.timerRow}>
            <View style={styles.timerBox}>
              <Text style={styles.timerNum}>{pad(recMin)}</Text>
              <Text style={styles.timerLabel}>MINUTES</Text>
            </View>
            <Text style={styles.timerColon}>:</Text>
            <View style={styles.timerBox}>
              <Text style={styles.timerNum}>{pad(recSec)}</Text>
              <Text style={styles.timerLabel}>SECONDS</Text>
            </View>
          </View>
        )}

        {/* ── Waveform ── */}
        <WaveformBars
          active={isRecording || isPlaying}
          color={isPlaying ? "#6366F1" : "#E8365D"}
        />

        {/* ── Playback card ── */}
        {isRecorded && (
          <View style={styles.playbackCard}>
            <View style={styles.playbackTop}>
              <TouchableOpacity
                style={styles.playBtn}
                onPress={handlePlayPause}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              <View style={styles.playbackInfo}>
                <Text style={styles.playbackTitle}>Bản ghi của bạn</Text>
                <Text style={styles.playbackDuration}>
                  {pad(Math.floor(playSeconds / 60))}:{pad(playSeconds % 60)}
                  {" / "}
                  {pad(Math.floor(duration / 60))}:{pad(duration % 60)}
                </Text>
              </View>
            </View>
            <ProgressBar progress={progress} />
            <Text style={styles.playbackHint}>
              {isPlaying
                ? "Đang phát..."
                : isPaused
                  ? "Tạm dừng"
                  : "Chạm phát để nghe lại"}
            </Text>
          </View>
        )}

        {/* ── Re-record ── */}
        {isRecorded && (
          <TouchableOpacity onPress={handleReRecord} style={styles.reRecordBtn}>
            <Ionicons name="refresh" size={13} color="#6B7280" />
            <Text style={styles.reRecordText}>Ghi lại</Text>
          </TouchableOpacity>
        )}

        {/* ── Audio size note ── */}
        {isRecorded && (
          <Text style={styles.audioNote}>
            Âm thanh sẽ được gửi tới quản lý để xem xét (khuyến nghị tối đa 10
            MB).
          </Text>
        )}

        {/* ── Leave Dates (chỉ hiện khi không có taskAssignmentId) ── */}
        {!taskAssignmentId && (
          <View style={styles.datesSection}>
            <Text style={styles.datesSectionTitle}>Thời gian nghỉ</Text>

            {/* Nút bấm From Date */}
            <TouchableOpacity
              style={styles.dateInputRow}
              onPress={() => setShowDatePicker("from")}
            >
              <Ionicons name="calendar-outline" size={18} color="#6B7280" />
              <View style={styles.dateInputContent}>
                <Text style={styles.dateInputLabel}>Ngày bắt đầu *</Text>
                <Text style={styles.dateInputValue}>
                  {leaveDateFrom
                    ? leaveDateFrom.toLocaleDateString("vi-VN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Chọn ngày bắt đầu"}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Nút bấm To Date */}
            <TouchableOpacity
              style={[
                styles.dateInputRow,
                !leaveDateFrom && { opacity: 0.5, backgroundColor: "#F3F4F6" },
              ]}
              disabled={!leaveDateFrom}
              onPress={() => setShowDatePicker("to")}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={!leaveDateFrom ? "#9CA3AF" : "#6B7280"}
              />
              <View style={styles.dateInputContent}>
                <Text style={styles.dateInputLabel}>Ngày kết thúc *</Text>
                <Text
                  style={[
                    styles.dateInputValue,
                    !leaveDateFrom && { color: "#9CA3AF" },
                  ]}
                >
                  {leaveDateTo
                    ? leaveDateTo.toLocaleDateString("vi-VN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Chọn ngày kết thúc"}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <CustomDatePicker
              key={showDatePicker ?? "closed"}
              visible={showDatePicker !== null}
              value={
                showDatePicker === "from"
                  ? leaveDateFrom
                    ? toLocalMidnight(leaveDateFrom)
                    : new Date()
                  : leaveDateTo
                    ? toLocalMidnight(leaveDateTo)
                    : leaveDateFrom
                      ? toLocalMidnight(leaveDateFrom)
                      : new Date()
              }
              minimumDate={showDatePicker === "to" ? leaveDateFrom : null}
              onConfirm={handleConfirmDate}
              onCancel={() => setShowDatePicker(null)}
            />
          </View>
        )}

        {/* ── Submit ── */}
        <AppButton
          label="Gửi yêu cầu nghỉ khẩn cấp"
          onPress={handleSubmit}
          loading={submitting}
          loadingLabel="Đang gửi..."
          iconLeft="send"
          style={{ backgroundColor: "#db0614" }}
          disabled={!isRecorded || submitting}
        />
      </ScrollView>

      <BottomTabBar
        activeTab="Home"
        onNavigate={handleNavigate}
        onEmergencyPress={() => {
          navigation.navigate(
            "EmergencyLeave" as never,
            {
              taskAssignmentId: selectedTaskId || null,
            } as never,
          );
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f6fa" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  statusLabel: { fontSize: 13, color: "#6B7280" },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "600" },

  micSection: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
    height: 140,
  },
  pulseContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: { position: "absolute", borderRadius: 100 },
  pulseOuter: { width: 130, height: 130, backgroundColor: "#E8365D" },
  pulseInner: { width: 110, height: 110, backgroundColor: "#E8365D" },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8365D",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#E8365D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  micBtnRecording: { backgroundColor: "#C0143C", shadowOpacity: 0.6 },
  micBtnRecorded: { backgroundColor: "#6366F1" },

  timerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  timerBox: { alignItems: "center", minWidth: 60 },
  timerNum: { fontSize: 36, fontWeight: "700", color: "#111827" },
  timerLabel: { fontSize: 10, color: "#9CA3AF", letterSpacing: 1.5 },
  timerColon: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    marginHorizontal: 8,
    marginBottom: 12,
  },

  waveform: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    gap: 4,
    marginBottom: 20,
  },
  waveBar: { width: 4, height: 32, borderRadius: 2 },

  playbackCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  playbackTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  playbackInfo: { flex: 1 },
  playbackTitle: { fontSize: 14, fontWeight: "600", color: "#4338CA" },
  playbackDuration: { fontSize: 12, color: "#7C3AED", marginTop: 2 },
  progressTrack: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#6366F1", borderRadius: 2 },
  playbackHint: { fontSize: 12, color: "#9CA3AF", marginTop: 8 },

  reRecordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: 8,
  },
  reRecordText: { fontSize: 13, color: "#6B7280" },

  audioNote: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 16,
    fontStyle: "italic",
  },

  datesSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  datesSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  dateInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dateInputContent: {
    flex: 1,
    marginLeft: 10,
  },
  dateInputLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateInputValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalBottomSheet: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 20, // SafeArea padding cho iPhone
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalCancelText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "500",
  },
  modalDoneText: {
    color: "#3B82F6", // Màu xanh lam nổi bật
    fontSize: 16,
    fontWeight: "600",
  },
});
