import AppButton from "@/components/common/AppButton";
import Header from "@/components/common/Header";
import ConfirmationBottomSheet from "@/components/forms/confirmation-bottom-sheet";
import { SwapRequest, useTaskSwap } from "@/hooks/useTaskSwap";
import { getRelativeTime, getTimeRemaining } from "@/utils/timeUtils";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface RouteParams {
  requestId: string;
}

export default function SwapRequestDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { requestId } = route.params as RouteParams;
  const { getById, review } = useTaskSwap();

  const [request, setRequest] = useState<SwapRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApproveSheet, setShowApproveSheet] = useState(false);
  const [showRejectSheet, setShowRejectSheet] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchRequestDetail = useCallback(async () => {
    try {
      setError(null);
      const data = await getById(requestId);
      setRequest(data);
    } catch (err: any) {
      setError(err.message || "Failed to load request details");
    } finally {
      setLoading(false);
    }
  }, [getById, requestId]);

  useEffect(() => {
    fetchRequestDetail();
  }, [fetchRequestDetail]);

  // Check if request is expired
  const isExpired = request
    ? new Date(request.expiredAt).getTime() <= Date.now()
    : false;

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleApprove = useCallback(() => {
    setShowApproveSheet(true);
  }, []);

  const handleReject = useCallback(() => {
    setShowRejectSheet(true);
  }, []);

  const confirmApprove = useCallback(
    async (note?: string) => {
      if (!request) return;

      try {
        setSubmitting(true);
        setShowApproveSheet(false);

        await review({
          taskSwapRequestId: request.id,
          isApproved: true,
          reviewNote: note,
        });

        // Navigate back to list on success
        navigation.goBack();
      } catch (err: any) {
        // Show error toast (simplified - in production use a toast library)
        alert(err.message || "Failed to approve request");
        setSubmitting(false);
      }
    },
    [request, review, navigation],
  );

  const confirmReject = useCallback(
    async (note?: string) => {
      if (!request || !note) return;

      try {
        setSubmitting(true);
        setShowRejectSheet(false);

        await review({
          taskSwapRequestId: request.id,
          isApproved: false,
          reviewNote: note,
        });

        // Navigate back to list on success
        navigation.goBack();
      } catch (err: any) {
        // Show error toast (simplified - in production use a toast library)
        alert(err.message || "Failed to reject request");
        setSubmitting(false);
      }
    },
    [request, review, navigation],
  );

  const cancelApprove = useCallback(() => {
    setShowApproveSheet(false);
  }, []);

  const cancelReject = useCallback(() => {
    setShowRejectSheet(false);
  }, []);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Request Details" onBack={handleBack} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !request) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Request Details" onBack={handleBack} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error || "Request not found"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Request Details" onBack={handleBack} />

      <ScrollView style={styles.scrollView}>
        {/* Expired Banner */}
        {isExpired && (
          <View style={styles.expiredBanner}>
            <Text style={styles.expiredBannerText}>
              ⏰ This request has expired
            </Text>
          </View>
        )}

        {/* Worker A Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requester (Worker A)</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>ID</Text>
            <Text style={styles.cardValue}>{request.requesterId}</Text>
          </View>
        </View>

        {/* Worker B Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Worker (Worker B)</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>ID</Text>
            <Text style={styles.cardValue}>{request.targetWorkerId}</Text>
          </View>
        </View>

        {/* Notes */}
        {request.requesterNote && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requester Note</Text>
            <View style={styles.card}>
              <Text style={styles.noteText}>{request.requesterNote}</Text>
            </View>
          </View>
        )}

        {request.reviewNote && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review Note</Text>
            <View style={styles.card}>
              <Text style={styles.noteText}>{request.reviewNote}</Text>
            </View>
          </View>
        )}

        {/* Timestamps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.card}>
            <View style={styles.timestampRow}>
              <Text style={styles.timestampLabel}>Created:</Text>
              <Text style={styles.timestampValue}>
                {getRelativeTime(request.createdAt)}
              </Text>
            </View>
            <View style={styles.timestampRow}>
              <Text style={styles.timestampLabel}>Expires:</Text>
              <Text style={styles.timestampValue}>
                {getTimeRemaining(request.expiredAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.card}>
            <Text style={styles.statusText}>{request.status}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {!isExpired && (
        <View style={styles.actionContainer}>
          <AppButton
            label="Approve"
            onPress={handleApprove}
            variant="primary"
            disabled={submitting}
            loading={submitting}
            fullWidth
          />
          <AppButton
            label="Reject"
            onPress={handleReject}
            variant="danger"
            disabled={submitting}
            fullWidth
          />
        </View>
      )}

      {/* Approve Bottom Sheet */}
      <ConfirmationBottomSheet
        visible={showApproveSheet}
        title="Approve Swap Request"
        noteLabel="Approval Note (Optional)"
        noteRequired={false}
        noteMaxLength={200}
        confirmLabel="Confirm Approve"
        confirmVariant="primary"
        onConfirm={confirmApprove}
        onCancel={cancelApprove}
      />

      {/* Reject Bottom Sheet */}
      <ConfirmationBottomSheet
        visible={showRejectSheet}
        title="Reject Swap Request"
        noteLabel="Rejection Reason"
        noteRequired={true}
        noteMinLength={10}
        noteMaxLength={200}
        confirmLabel="Confirm Reject"
        confirmVariant="danger"
        onConfirm={confirmReject}
        onCancel={cancelReject}
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
  scrollView: {
    flex: 1,
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
  },
  // Expired banner
  expiredBanner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  expiredBannerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
    textAlign: "center",
  },
  // Sections
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  noteText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  timestampRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  timestampLabel: {
    fontSize: 13,
    color: "#94A3B8",
  },
  timestampValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
  // Action buttons
  actionContainer: {
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 12,
  },
});
