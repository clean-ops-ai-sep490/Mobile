import WorkAreaCard from "@/components/cards/work-area-card";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkAreaSupervisor } from "@/hooks/useWorkAreaSupervisor";
import { SupervisorStackParamList } from "@/navigation/AppNavigator";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── PROPS ─────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<SupervisorStackParamList, "WorkAreaList">;

// ─── COMPONENT ─────────────────────────────────────────────────────────────

export default function WorkAreaListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { workAreas, loading, error, getWorkAreasBySupervisor } =
    useWorkAreaSupervisor();

  useEffect(() => {
    if (user?.userId) {
      getWorkAreasBySupervisor(user.userId, { pageNumber: 1, pageSize: 10 });
    }
  }, [user?.userId]);

  const handleCreateAdhocTask = (workAreaId: string) => {
    const workArea = workAreas.find((wa) => wa.workAreaId === workAreaId);
    navigation.navigate("CreateEmergencyTask", {
      workAreaId,
      workAreaName: workArea?.workAreaName,
    });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải khu vực...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Chọn Khu Vực</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {workAreas.length === 0 && !loading && !error && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📍</Text>
              <Text style={styles.emptyTitle}>Không có khu vực nào</Text>
              <Text style={styles.emptySubtitle}>
                Bạn chưa được phân công quản lý khu vực nào
              </Text>
            </View>
          )}

          {workAreas.map((workArea) => (
            <WorkAreaCard
              key={workArea.workAreaId}
              workArea={workArea}
              onCreateAdhocTask={handleCreateAdhocTask}
            />
          ))}

          {/* Bottom Spacer */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 20,
    color: "#64748B",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  placeholder: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F6FA",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
});
