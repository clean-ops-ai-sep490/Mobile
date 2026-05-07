import AppButton from "@/components/common/AppButton";
import Header from "@/components/common/Header";
import ConfirmationBottomSheet from "@/components/forms/confirmation-bottom-sheet";
import {
    PendingSupervisorCheckDto,
    SupervisorCheckDetailDto,
    useComplianceCheck,
} from "@/hooks/useComplianceCheck";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

const PAGE_SIZE = 20;

function formatDateTime(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("vi-VN");
}

export default function ReviewImagePendingScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 900;

  const navigation = useNavigation();
  const {
    getPendingSupervisorChecks,
    getSupervisorCheckDetail,
    submitSupervisorReview,
  } = useComplianceCheck();

  const [checks, setChecks] = useState<PendingSupervisorCheckDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SupervisorCheckDetailDto | null>(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showApproveSheet, setShowApproveSheet] = useState(false);
  const [showRejectSheet, setShowRejectSheet] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  const selectedCheck = useMemo(
    () => checks.find((x) => x.complianceCheckId === selectedId) ?? null,
    [checks, selectedId],
  );

  const fetchPendingList = useCallback(async () => {
    try {
      setError(null);
      const data = await getPendingSupervisorChecks({
        pageNumber: 1,
        pageSize: PAGE_SIZE,
      });

      setChecks(data.content);

      if (data.content.length === 0) {
        setSelectedId(null);
        setDetail(null);
        return;
      }

      const stillExists = data.content.some(
        (item) => item.complianceCheckId === selectedId,
      );
      const nextSelectedId = stillExists
        ? selectedId
        : data.content[0].complianceCheckId;
      setSelectedId(nextSelectedId ?? null);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Tải danh sách thất bại",
      );
    } finally {
      setLoadingList(false);
      setRefreshing(false);
    }
  }, [getPendingSupervisorChecks, selectedId]);

  const fetchDetail = useCallback(
    async (complianceCheckId: string) => {
      try {
        setLoadingDetail(true);
        const data = await getSupervisorCheckDetail(complianceCheckId);
        setDetail(data);
      } catch (err: any) {
        setDetail(null);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Tải chi tiết thất bại",
        );
      } finally {
        setLoadingDetail(false);
      }
    },
    [getSupervisorCheckDetail],
  );

  useEffect(() => {
    fetchPendingList();
  }, [fetchPendingList]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPendingList();
  }, [fetchPendingList]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleApprove = useCallback(() => {
    if (!selectedId || submitting) return;
    setShowApproveSheet(true);
  }, [selectedId, submitting]);

  const handleReject = useCallback(() => {
    if (!selectedId || submitting) return;
    setShowRejectSheet(true);
  }, [selectedId, submitting]);

  const applyReview = useCallback(
    async (approved: boolean, feedback?: string) => {
      if (!selectedId) return;

      try {
        setSubmitting(true);
        await submitSupervisorReview(selectedId, { approved, feedback });
        setShowApproveSheet(false);
        setShowRejectSheet(false);

        const reviewedId = selectedId;
        setChecks((prev) =>
          prev.filter((item) => item.complianceCheckId !== reviewedId),
        );
        setSelectedId((prevSelected) => {
          if (prevSelected !== reviewedId) return prevSelected;
          const next = checks.find(
            (item) => item.complianceCheckId !== reviewedId,
          );
          return next?.complianceCheckId ?? null;
        });
        setDetail(null);

        fetchPendingList();
      } catch (err: any) {
        Alert.alert(
          "Lỗi",
          err?.response?.data?.message ||
            err?.message ||
            "Gửi đánh giá thất bại",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [selectedId, submitSupervisorReview, checks, fetchPendingList],
  );

  const confirmApprove = useCallback(
    async (note?: string) => {
      await applyReview(true, note);
    },
    [applyReview],
  );

  const confirmReject = useCallback(
    async (note?: string) => {
      await applyReview(false, note);
    },
    [applyReview],
  );

  if (loadingList && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Duyệt ảnh AI" onBack={handleBack} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.mutedText}>Đang tải danh sách cần duyệt...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && checks.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Duyệt ảnh AI" onBack={handleBack} />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton
            label="Thử lại"
            onPress={fetchPendingList}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Duyệt ảnh AI" onBack={handleBack} />

      <View style={[styles.content, isCompact && styles.contentCompact]}>
        <View style={[styles.listPane, isCompact && styles.listPaneCompact]}>
          <Text style={styles.sectionTitle}>
            Chờ supervisor duyệt ({checks.length})
          </Text>
          <FlatList
            data={checks}
            keyExtractor={(item) => item.complianceCheckId}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#2563EB"]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.mutedText}>
                  Không có case nào đang chờ duyệt.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const active = item.complianceCheckId === selectedId;
              return (
                <TouchableOpacity
                  style={[styles.checkCard, active && styles.checkCardActive]}
                  onPress={() => setSelectedId(item.complianceCheckId)}
                >
                  <Text style={styles.cardId} numberOfLines={1}>
                    #{item.complianceCheckId}
                  </Text>
                  <Text style={styles.cardMeta}>
                    Điểm thấp nhất: {item.minScore.toFixed(2)} | Ảnh lỗi:{" "}
                    {item.failedImageCount}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {formatDateTime(item.createdAt)}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <View style={styles.detailPane}>
          {loadingDetail ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.mutedText}>Đang tải chi tiết...</Text>
            </View>
          ) : !detail ? (
            <View style={styles.center}>
              <Text style={styles.mutedText}>
                Chọn một case để xem chi tiết.
              </Text>
            </View>
          ) : (
            <>
              <ScrollView style={styles.detailScroll}>
                <View style={styles.detailCard}>
                  <Text style={styles.detailTitle}>Thông tin kiểm tra AI</Text>
                  <Text style={styles.detailLine}>
                    Mã kiểm tra: {detail.complianceCheckId}
                  </Text>
                  <Text style={styles.detailLine}>
                    Mã bước thực hiện: {detail.taskStepExecutionId}
                  </Text>
                  <Text style={styles.detailLine}>
                    Điểm thấp nhất: {detail.minScore.toFixed(2)}
                  </Text>
                  <Text style={styles.detailLine}>
                    Số ảnh lỗi: {detail.failedImageCount}
                  </Text>
                  <Text style={styles.detailLine}>
                    Thời gian tạo: {formatDateTime(detail.createdAt)}
                  </Text>
                  {!!detail.feedback && (
                    <Text style={styles.detailLine}>
                      Phản hồi cũ: {detail.feedback}
                    </Text>
                  )}
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                  Ảnh AI phân tích
                </Text>
                {detail.images.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.mutedText}>Không có dữ liệu ảnh.</Text>
                  </View>
                ) : (
                  detail.images.map((img, idx) => (
                    <View
                      key={`${img.imageUrl}-${idx}`}
                      style={styles.imageCard}
                    >
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setPreviewImageUri(img.imageUrl)}
                      >
                        <Image
                          source={{ uri: img.imageUrl }}
                          style={styles.image}
                        />
                      </TouchableOpacity>
                      {!!img.visualizationUrl && (
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() =>
                            setPreviewImageUri(img.visualizationUrl || null)
                          }
                        >
                          <Image
                            source={{ uri: img.visualizationUrl }}
                            style={styles.image}
                          />
                        </TouchableOpacity>
                      )}
                      <Text style={styles.imageMeta}>
                        Điểm:{" "}
                        {img.qualityScore?.toFixed?.(2) ?? img.qualityScore} |
                        Kết quả: {img.verdict}
                      </Text>
                    </View>
                  ))
                )}
                <View style={{ height: 24 }} />
              </ScrollView>

              <View style={styles.actionBar}>
                <AppButton
                  label="Chấp thuận"
                  onPress={handleApprove}
                  variant="primary"
                  disabled={submitting}
                  loading={submitting}
                  fullWidth
                />
                <AppButton
                  label="Từ chối"
                  onPress={handleReject}
                  variant="danger"
                  disabled={submitting}
                  loading={submitting}
                  fullWidth
                />
              </View>
            </>
          )}
        </View>
      </View>

      <ConfirmationBottomSheet
        visible={showApproveSheet}
        title="Chấp thuận kiểm tra"
        noteLabel="Phản hồi (Không bắt buộc)"
        noteRequired={false}
        noteMaxLength={300}
        confirmLabel="Xác nhận chấp thuận"
        confirmVariant="primary"
        onConfirm={confirmApprove}
        onCancel={() => setShowApproveSheet(false)}
      />

      <ConfirmationBottomSheet
        visible={showRejectSheet}
        title="Từ chối kiểm tra"
        noteLabel="Phản hồi (Bắt buộc)"
        noteRequired={true}
        noteMinLength={5}
        noteMaxLength={300}
        confirmLabel="Xác nhận từ chối"
        confirmVariant="danger"
        onConfirm={confirmReject}
        onCancel={() => setShowRejectSheet(false)}
      />

      <Modal
        visible={!!previewImageUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View style={styles.previewOverlay}>
          <TouchableOpacity
            style={styles.previewCloseBtn}
            onPress={() => setPreviewImageUri(null)}
          >
            <Text style={styles.previewCloseText}>Đóng</Text>
          </TouchableOpacity>

          {!!previewImageUri && (
            <Image
              source={{ uri: previewImageUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  content: {
    flex: 1,
    flexDirection: "row",
  },
  contentCompact: {
    flexDirection: "column",
  },
  listPane: {
    width: "40%",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    padding: 12,
  },
  listPaneCompact: {
    width: "100%",
    maxHeight: 260,
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  detailPane: {
    flex: 1,
    padding: 12,
  },
  detailScroll: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  checkCard: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  checkCardActive: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  cardId: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 11,
    color: "#64748B",
  },
  detailCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  detailLine: {
    fontSize: 12,
    color: "#334155",
    marginBottom: 4,
  },
  imageCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
    marginBottom: 8,
  },
  imageMeta: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "600",
  },
  actionBar: {
    gap: 10,
    marginTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 10,
  },
  mutedText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },
  errorText: {
    fontSize: 13,
    color: "#B91C1C",
    textAlign: "center",
  },
  emptyBox: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 24,
  },
  previewImage: {
    width: "100%",
    height: "85%",
  },
  previewCloseBtn: {
    position: "absolute",
    top: 48,
    right: 16,
    zIndex: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  previewCloseText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
