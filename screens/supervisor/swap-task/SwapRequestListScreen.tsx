import SwapRequestCard from "@/components/cards/swap-request-card";
import Header from "@/components/common/Header";
import { useTaskSwap } from "@/hooks/useTaskSwap";
import { SupervisorStackParamList } from "@/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SwapRequestListItem {
  id: string;
  workerAName: string;
  workerBName: string;
  taskSummary: string;
  createdAt: string;
  expiredAt: string;
}

export default function SwapRequestListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<SupervisorStackParamList>>();
  const { getList } = useTaskSwap();

  const [requests, setRequests] = useState<SwapRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setError(null);
      const result = await getList({ status: "PendingManagerApproval" });

      // Filter out expired requests client-side
      const now = new Date().getTime();
      const validRequests = result.content
        .filter((req: any) => new Date(req.expiredAt).getTime() > now)
        .map((req: any) => ({
          id: req.id,
          workerAName: req.requesterName || "Worker A",
          workerBName: req.targetWorkerName || "Worker B",
          taskSummary: req.taskSummary || "Task swap request",
          createdAt: req.createdAt,
          expiredAt: req.expiredAt,
        }));

      setRequests(validRequests);
    } catch (err: any) {
      setError(err.message || "Failed to load swap requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getList]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, [fetchRequests]);

  const handleRequestPress = useCallback(
    (requestId: string) => {
      navigation.navigate("SwapRequestDetail", { requestId });
    },
    [navigation],
  );

  const handleRetry = useCallback(() => {
    setLoading(true);
    fetchRequests();
  }, [fetchRequests]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Swap Requests" onBack={handleBack} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Swap Requests" onBack={handleBack} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (requests.length === 0 && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Swap Requests" onBack={handleBack} />
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No pending swap requests</Text>
        </View>
      </SafeAreaView>
    );
  }

  // List view
  return (
    <SafeAreaView style={styles.container}>
      <Header title="Swap Requests" onBack={handleBack} />
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SwapRequestCard
            workerAName={item.workerAName}
            workerBName={item.workerBName}
            taskSummary={item.taskSummary}
            createdAt={item.createdAt}
            expiredAt={item.expiredAt}
            onPress={() => handleRequestPress(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#2563EB"]}
            tintColor="#2563EB"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  // Loading state
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#64748B",
  },
  // Error state
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  // Empty state
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
  },
});
