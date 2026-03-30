import Header from "@/components/common/Header";
import { WorkerStackParamList } from "@/navigation/AppNavigator";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
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
  "EquipmentRequestDetail"
>;

export default function EquipmentRequestDetailScreen({
  navigation,
  route,
}: Props) {
  const { id, item } = route.params as any;
  const data = item || {};

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <Header title="Equipment Request" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Request #{id}</Text>
          <Text style={styles.row}>
            Task Assignment: {data.taskAssignmentId ?? "—"}
          </Text>
          <Text style={styles.row}>Equipment: {data.equipmentId ?? "—"}</Text>
          <Text style={styles.row}>Quantity: {data.quantity ?? "—"}</Text>
          <Text style={styles.row}>Reason: {data.reason ?? "—"}</Text>
          <Text style={styles.row}>Status: {data.status ?? "—"}</Text>
          <Text style={styles.row}>Created: {data.createdAt ?? "—"}</Text>
        </View>
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
