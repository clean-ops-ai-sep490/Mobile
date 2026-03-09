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
type ScreenMode = "voice";
type RecordState = "idle" | "recording" | "recorded";
type PlayState = "idle" | "playing" | "paused";

interface Props {
  location?: string;
  onClose?: () => void;
  onSubmit?: (data: {
    type: "voice";
    uri?: string;
    content: string;
    location: string;
  }) => void;
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EmergencyLeaveScreen({
  location = "Central Park Plaza - North Wing",
  onClose,
  onSubmit,
}: Props) {
  const [mode, setMode] = useState<ScreenMode>("voice");
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [recSeconds, setRecSeconds] = useState(0);
  const [playSeconds, setPlaySeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [textReason, setTextReason] = useState("");
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRecording = recordState === "recording";
  const isRecorded = recordState === "recorded";
  const isPlaying = playState === "playing";
  const isPaused = playState === "paused";

  const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
  const recMin = Math.floor(recSeconds / 60);
  const recSec = recSeconds % 60;
  const progress = duration > 0 ? playSeconds / duration : 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recTimerRef.current && clearInterval(recTimerRef.current);
      playTimerRef.current && clearInterval(playTimerRef.current);
      soundRef.current?.unloadAsync();
      recordingRef.current?.stopAndUnloadAsync();
    };
  }, []);

  // ── Recording ──
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission required", "Microphone permission is needed.");
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
    } catch (e) {
      Alert.alert("Error", "Could not start recording.");
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
    } catch (e) {
      Alert.alert("Error", "Could not stop recording.");
    }
  };

  const handleMicPress = () => {
    if (recordState === "idle") {
      startRecording();
    } else if (recordState === "recording") {
      stopRecording();
    }
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
    } catch {}
  };

  // ── Playback ──
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
          const status = await sound.getStatusAsync();
          if (!status.isLoaded) return;
          setPlaySeconds(status.positionMillis / 1000);
          if (status.didJustFinish) {
            clearInterval(playTimerRef.current!);
            setPlayState("idle");
            setPlaySeconds(0);
          }
        }, 200);

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            clearInterval(playTimerRef.current!);
            setPlayState("idle");
            setPlaySeconds(0);
          }
        });
      } catch {
        Alert.alert("Error", "Could not play recording.");
      }
    } else if (playState === "playing") {
      await soundRef.current?.pauseAsync();
      clearInterval(playTimerRef.current!);
      setPlayState("paused");
    } else if (playState === "paused") {
      await soundRef.current?.playAsync();
      playTimerRef.current = setInterval(async () => {
        const status = await soundRef.current?.getStatusAsync();
        if (!status?.isLoaded) return;
        setPlaySeconds(status.positionMillis / 1000);
      }, 200);
      setPlayState("playing");
    }
  };

  // ── Submit ──
  const handleSubmit = () => {
    if (mode === "voice" && !isRecorded) {
      Alert.alert("No Recording", "Please record your reason first.");
      return;
    }
    onSubmit?.({
      type: mode,
      uri: recordingUri ?? undefined,
      content: "[voice]",
      location,
    });
    Alert.alert(
      "Submitted ✓",
      "Your emergency leave request has been sent to your manager.",
      [{ text: "OK", onPress: onClose }],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#E8365D" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Leave Request</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <>
          <Text style={styles.title}>
            {isRecording
              ? "Recording..."
              : isRecorded
                ? "Recording Complete"
                : "Tap to Start Recording"}
          </Text>

          <Text style={styles.subtitle}>
            {isRecorded
              ? "Play back your recording or re-record if needed."
              : "State your reason clearly. Your manager\nwill be notified immediately."}
          </Text>

          {/* Mic + Pulse */}
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
              <Text style={styles.micIcon}>
                {isRecording ? "⏹" : isRecorded ? "↺" : "🎙"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Timer (recording) */}
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

          {/* Waveform */}
          <WaveformBars
            active={isRecording || isPlaying}
            color={isPlaying ? "#6366F1" : "#E8365D"}
          />

          {/* Playback card */}
          {isRecorded && (
            <View style={styles.playbackCard}>
              <View style={styles.playbackTop}>
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={handlePlayPause}
                >
                  <Text style={styles.playBtnIcon}>
                    {isPlaying ? "⏸" : "▶"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.playbackInfo}>
                  <Text style={styles.playbackTitle}>Your Recording</Text>

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
                  ? "Playing..."
                  : isPaused
                    ? "Paused"
                    : "Tap ▶ to listen back"}
              </Text>
            </View>
          )}

          {/* Re-record */}
          {isRecorded && (
            <TouchableOpacity
              onPress={handleReRecord}
              style={styles.reRecordBtn}
            >
              <Text style={styles.reRecordText}>↺ Re-record</Text>
            </TouchableOpacity>
          )}
        </>

        {/* Location */}
        <View style={styles.locationRow}>
          <Text style={styles.locationDot}>📍</Text>
          <Text style={styles.locationText}>
            Location captured:{" "}
            <Text style={styles.locationBold}>{location}</Text>
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          activeOpacity={0.88}
        >
          <Text style={styles.submitBtnText}>Submit Emergency Request</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E8365D",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 36,
  },

  // Mic
  micSection: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
    height: 180,
  },
  pulseContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  pulseInner: { width: 130, height: 130, borderRadius: 65 },
  pulseOuter: { width: 175, height: 175, borderRadius: 88 },
  pulseRing: { position: "absolute", backgroundColor: "#E8365D" },
  micBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#E8365D",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#E8365D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 10,
  },
  micBtnRecording: { backgroundColor: "#C0143C", shadowOpacity: 0.6 },
  micBtnRecorded: { backgroundColor: "#6366F1", shadowColor: "#6366F1" },
  micIcon: { fontSize: 34 },

  // Timer
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  timerBox: {
    width: 80,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  timerNum: { fontSize: 24, fontWeight: "800", color: "#111827" },
  timerLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1,
    marginTop: 2,
  },
  timerColon: {
    fontSize: 24,
    fontWeight: "800",
    color: "#D1D5DB",
    marginBottom: 12,
  },

  // Waveform
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 40,
    marginBottom: 20,
  },
  waveBar: { width: 4, height: 30, borderRadius: 2 },

  // Playback card
  playbackCard: {
    width: "100%",
    backgroundColor: "#F5F3FF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#DDD6FE",
    marginBottom: 12,
  },
  playbackTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  playBtnIcon: { fontSize: 20, color: "#FFFFFF" },
  playbackInfo: { flex: 1 },
  playbackTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4338CA",
    marginBottom: 2,
  },
  playbackDuration: { fontSize: 12, color: "#7C3AED", fontWeight: "600" },
  playbackHint: {
    fontSize: 12,
    color: "#8B5CF6",
    textAlign: "center",
    marginTop: 8,
  },

  // Progress bar
  progressTrack: {
    height: 4,
    backgroundColor: "#DDD6FE",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#6366F1", borderRadius: 2 },

  // Re-record
  reRecordBtn: { paddingVertical: 6, paddingHorizontal: 16, marginBottom: 12 },
  reRecordText: { fontSize: 13, color: "#6B7280", fontWeight: "600" },

  // Location
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: "100%",
    marginBottom: 24,
    gap: 8,
  },
  locationDot: { fontSize: 14, marginTop: 1 },
  locationText: { fontSize: 13, color: "#6B7280", flex: 1, lineHeight: 20 },
  locationBold: { fontWeight: "700", color: "#374151" },

  // Submit
  submitBtn: {
    width: "100%",
    backgroundColor: "#E8365D",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#E8365D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },

  // Mode toggle
  modeToggle: { paddingVertical: 8 },
  modeToggleText: {
    color: "#E8365D",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
