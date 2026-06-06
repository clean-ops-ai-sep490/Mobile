import { useAuth } from "@/contexts/AuthContext";
import { useWorkAreaSupervisor } from "@/hooks/useWorkAreaSupervisor";
import { SupervisorStackParamList } from "@/navigation/AppNavigator";
import { WorkAreaSupervisor } from "@/types/workAreaSupervisor.types";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
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

type Props = NativeStackScreenProps<
  SupervisorStackParamList,
  "WorkAreaSupervisor"
>;

export default function WorkareaSupervisorScreen({ navigation }: Props) {
  const { user } = useAuth();
  const {
    workAreas,
    workers,
    loading,
    error,
    getWorkAreasBySupervisor,
    getWorkersByWorkArea,
  } = useWorkAreaSupervisor();

  const [selectedWorkArea, setSelectedWorkArea] =
    useState<WorkAreaSupervisor | null>(null);

  useEffect(() => {
    if (user?.userId) {
      getWorkAreasBySupervisor(user.userId, { pageNumber: 1, pageSize: 50 });
    }
  }, [getWorkAreasBySupervisor, user?.userId]);

  const handleSelectWorkArea = async (workArea: WorkAreaSupervisor) => {
    setSelectedWorkArea(workArea);
    await getWorkersByWorkArea(workArea.workAreaId, {
      pageNumber: 1,
      pageSize: 100,
    });
  };

  const handleBack = () => {
    if (selectedWorkArea) {
      setSelectedWorkArea(null);
      return;
    }

    navigation.goBack();
  };

  const isWorkAreaListView = !selectedWorkArea;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isWorkAreaListView ? "Khu vực quản lý" : "Danh sách công nhân"}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {loading && isWorkAreaListView ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : (
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

            {isWorkAreaListView ? (
              <>
                {workAreas.length === 0 && !loading && !error && (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>
                      Bạn chưa có khu vực nào
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      Hiện chưa có khu vực được phân công cho tài khoản của bạn.
                    </Text>
                  </View>
                )}

                {workAreas.map((workArea) => (
                  <TouchableOpacity
                    key={workArea.workAreaId}
                    style={styles.card}
                    activeOpacity={0.85}
                    onPress={() => handleSelectWorkArea(workArea)}
                  >
                    <Text style={styles.cardTitle}>
                      {workArea.workAreaName}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                      {workArea.displayLocation}
                    </Text>
                    <Text style={styles.cardAction}>Xem công nhân</Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {selectedWorkArea?.workAreaName}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {selectedWorkArea?.displayLocation}
                  </Text>
                </View>

                {loading ? (
                  <View style={styles.loadingContainerInline}>
                    <ActivityIndicator size="small" color="#2563EB" />
                    <Text style={styles.loadingText}>
                      Đang tải danh sách công nhân...
                    </Text>
                  </View>
                ) : workers.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>Chưa có công nhân</Text>
                    <Text style={styles.emptySubtitle}>
                      Khu vực này hiện chưa có công nhân được phân công.
                    </Text>
                  </View>
                ) : (
                  workers.map((worker) => (
                    <TouchableOpacity
                      key={worker.id}
                      style={styles.workerCard}
                      activeOpacity={0.75}
                      onPress={() =>
                        navigation.navigate("WorkerCalendar", {
                          workerId: worker.workerId,
                          workerName: worker.workerName,
                        })
                      }
                    >
                      <View style={styles.workerCardInner}>
                        <Text style={styles.workerName}>
                          {worker.workerName}
                        </Text>
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color="#2563EB"
                        />
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 20,
    color: "#334155",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  placeholder: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 10,
  },
  cardAction: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#64748B",
  },
  workerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    marginBottom: 10,
  },
  workerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 4,
  },
  workerId: {
    fontSize: 13,
    color: "#475569",
  },
  workerCardInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainerInline: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748B",
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
});
