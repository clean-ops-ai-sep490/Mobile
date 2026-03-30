import Header from "@/components/common/Header";
import { IssueReport, useIssueReport } from "@/hooks/useIssueReport";
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

type Props = NativeStackScreenProps<WorkerStackParamList, "IssueReportDetail">;

export default function IssueReportDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const { getById } = useIssueReport();
  const [item, setItem] = useState<IssueReport | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getById(id);
        setItem(res);
      } catch (e) {
        console.warn("Failed to load issue report", e);
      }
    })();
  }, [id]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <Header title="Issue Report" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        {!item ? (
          <Text>Loading...</Text>
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>Issue #{item.id}</Text>
            <Text style={styles.row}>
              Reported by: {item.reportedByWorkerId}
            </Text>
            <Text style={styles.row}>
              Task Assignment: {item.taskAssignmentId}
            </Text>
            <Text style={styles.row}>Status: {item.status}</Text>
            <Text style={styles.row}>Created: {item.created}</Text>
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontWeight: "700" }}>Description</Text>
              <Text style={{ marginTop: 6 }}>{item.description}</Text>
            </View>
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
