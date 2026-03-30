import Header from "@/components/common/Header";
import { SwapRequest, useTaskSwap } from "@/hooks/useTaskSwap";
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

type Props = NativeStackScreenProps<WorkerStackParamList, "TaskSwapDetail">;

export default function TaskSwapDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const { getById } = useTaskSwap();
  const [item, setItem] = useState<SwapRequest | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getById(id);
        setItem(res);
      } catch (e) {
        console.warn("Failed to load swap request", e);
      }
    })();
  }, [id]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <Header title="Task Swap" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        {!item ? (
          <Text>Loading...</Text>
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>SwapId: {item.id}</Text>
            <Text style={styles.row}>Note: {item.requesterNote ?? "—"}</Text>
            <Text style={styles.row}>Requester: {item.requesterName}</Text>
            <Text style={styles.row}>
              Target Worker: {item.targetWorkerName ?? "—"}
            </Text>
            <Text style={styles.row}>Status: {item.status}</Text>
            <Text style={styles.row}>Created: {item.createdAt}</Text>
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
