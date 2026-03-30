import Header from "@/components/common/Header";
import {
    EmergencyLeaveRequestDto,
    useEmergencyLeaveRequest,
} from "@/hooks/useEmergencyLeave";
import { WorkerStackParamList } from "@/navigation/AppNavigator";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Props = NativeStackScreenProps<
  WorkerStackParamList,
  "EmergencyLeaveDetail"
>;

export default function EmergencyLeaveDetailScreen({
  navigation,
  route,
}: Props) {
  const { id } = route.params;
  const { getById } = useEmergencyLeaveRequest();
  const [item, setItem] = useState<EmergencyLeaveRequestDto | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getById(id);
        setItem(res);
      } catch (e) {
        console.warn("Failed to load emergency leave", e);
      }
    })();
  }, [id]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <Header title="Emergency Leave" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        {!item ? (
          <Text>Loading...</Text>
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>Request #{item.id}</Text>
            <Text style={styles.row}>Worker: {item.workerId}</Text>
            <Text style={styles.row}>
              Task Assignment: {item.taskAssignmentId ?? "—"}
            </Text>
            <Text style={styles.row}>Status: {item.status}</Text>
            {item.audioUrl && (
              <Text style={styles.row}>Audio: {item.audioUrl}</Text>
            )}
            {item.transcription && (
              <Text style={styles.row}>
                Transcription: {item.transcription}
              </Text>
            )}
            <Text style={styles.row}>Created: {item.created}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f6fa" },
  container: { padding: 16 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 8 },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  row: { marginTop: 6, color: "#333" },
});
