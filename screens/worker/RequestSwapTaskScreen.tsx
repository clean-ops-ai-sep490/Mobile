import AppButton from "@/components/common/AppButton";
import BottomTabBar, { TabKey } from "@/components/common/BottomTabBar";
import Header from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useTaskSwap } from "@/hooks/useTaskSwap";
import { WorkerStackParamList } from "@/navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = NativeStackScreenProps<WorkerStackParamList, "SwapTask">;

export default function SwapTaskScreen({ navigation, route }: Props) {
  const { create, loading, getSwapCandidates } = useTaskSwap();
  const { user } = useAuth();

  const currentTaskId = route.params?.taskAssignmentId;
  const currentUserId = user?.userId || "";

  const [candidates, setCandidates] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [loadingCandidates, setLoadingCandidates] = useState(true);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleNavigate = (screen: TabKey) => {
    navigation.navigate(screen as never);
  };

  /* ================= FETCH ================= */

  useEffect(() => {
    fetchCandidates();
  }, [currentTaskId]);

  const fetchCandidates = async () => {
    if (!currentTaskId) return;

    setLoadingCandidates(true);

    try {
      const res = await getSwapCandidates(currentTaskId);

      console.log("Swap candidates:", res);

      setCandidates(res?.content || []);
    } catch (err) {
      console.log("Failed to fetch candidates", err);
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  /* ================= RULE ================= */

  const validateCandidate = (task: any) => {
    const now = new Date();
    const start = new Date(task.scheduledStartAt);

    const diffHours = (start.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 12) {
      return { valid: false, reason: "Less than 12h" };
    }

    return { valid: true };
  };

  /* ================= HELPERS ================= */

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* ================= ANIMATION ================= */

  const handleSelect = (item: any) => {
    setSelected(item);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /* ================= POLLING ================= */

  useEffect(() => {
    let interval: any;

    if (selected) {
      interval = setInterval(() => {
        console.log("Checking swap status...");
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [selected]);

  /* ================= SUBMIT ================= */

  const handleSubmit = () => {
    if (!selected) return;

    if (!reason.trim()) {
      Alert.alert("Missing reason", "Please enter a reason.");
      return;
    }

    Alert.alert("Confirm Swap", `Swap with ${selected.workerName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            await create({
              taskAssignmentId: currentTaskId,
              targetTaskAssignmentId: selected.task.taskAssignmentId,
              requesterId: currentUserId,
              targetWorkerId: selected.workerId,
              requesterNote: reason,
            });

            navigation.goBack();
          } catch (e: any) {
            console.error(
              "Error submitting swap request:",
              e.response?.data || "Unknown error",
            );
            // Alert.alert("Error", "Swap failed");
          }
        },
      },
    ]);
  };

  /* ================= RENDER ================= */

  const renderCandidate = (item: any) => {
    const isSelected =
      selected?.task.taskAssignmentId === item.task.taskAssignmentId;

    const validation = validateCandidate(item.task);

    return (
      <Animated.View
        key={item.task.taskAssignmentId}
        style={{ transform: [{ scale: scaleAnim }] }}
      >
        <TouchableOpacity
          style={[
            styles.card,
            isSelected && styles.cardSelected,
            !validation.valid && styles.cardDisabled,
          ]}
          disabled={!validation.valid}
          onPress={() => handleSelect(item)}
        >
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.name}>{item.workerName}</Text>
              <Text style={styles.location}>{item.task.displayLocation}</Text>
              <Text style={styles.time}>
                {formatTime(item.task.scheduledStartAt)} -{" "}
                {formatTime(item.task.scheduledEndAt)}
              </Text>

              {!validation.valid && (
                <Text style={styles.badge}>{validation.reason}</Text>
              )}
            </View>

            {isSelected && (
              <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <Header title="Swap Task" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.container}>
        {/* YOUR TASK */}
        <Text style={styles.section}>Your Task</Text>
        <View style={styles.yourTask}>
          <Text style={styles.bold}>Task ID: {currentTaskId}</Text>
        </View>

        {/* SELECT */}
        <Text style={styles.section}>Select Target Task</Text>

        {loadingCandidates ? (
          <>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeleton} />
            ))}
          </>
        ) : candidates.length === 0 ? (
          <Text style={styles.empty}>No available tasks to swap</Text>
        ) : (
          candidates.map(renderCandidate)
        )}

        {/* PREVIEW */}
        {selected && (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>Swap Preview</Text>
            <Text>Your Task → {currentTaskId}</Text>
            <Text>With → {selected.workerName}</Text>
            <Text>Target → {selected.task.displayLocation}</Text>
          </View>
        )}

        {/* REASON */}
        <Text style={styles.section}>Reason</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter reason..."
          value={reason}
          onChangeText={setReason}
          multiline
        />

        {/* ACTION */}
        <AppButton
          label="Submit Swap Request"
          onPress={handleSubmit}
          loading={loading}
          disabled={!selected || !reason.trim() || loading}
          iconLeft="send"
        />
      </ScrollView>

      <BottomTabBar onNavigate={handleNavigate} />
    </SafeAreaView>
  );
}

/* ================= STYLE ================= */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f6fa" },
  container: { padding: 16 },

  section: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 16,
  },

  yourTask: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  cardSelected: {
    borderColor: "#22C55E",
    backgroundColor: "#ECFDF5",
  },

  cardDisabled: {
    opacity: 0.5,
  },

  badge: {
    marginTop: 6,
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  name: { fontSize: 15, fontWeight: "600" },
  location: { color: "#64748B", marginTop: 4 },
  time: { color: "#94A3B8", marginTop: 2 },

  preview: {
    backgroundColor: "#EEF2FF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },

  previewTitle: {
    fontWeight: "700",
    marginBottom: 6,
  },

  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    marginBottom: 16,
  },

  empty: {
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 20,
  },

  skeleton: {
    height: 80,
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    marginBottom: 12,
  },

  bold: { fontWeight: "700" },
});
