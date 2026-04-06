import BottomTabBar, { TabKey } from "@/components/common/BottomTabBar";
import Header from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import {
  EmergencyLeaveRequestDto,
  useEmergencyLeaveRequest,
} from "@/hooks/useEmergencyLeave";
import useEquipment, { EquipmentRequestItem } from "@/hooks/useEquipment";
import { IssueReport, useIssueReport } from "@/hooks/useIssueReport";
import { TaskSwapRequestListItem, useTaskSwap } from "@/hooks/useTaskSwap";
import { WorkerStackParamList } from "@/navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import EmergencyLeaveDetailModal from "./EmergencyLeaveDetailModal";
import EquipmentRequestDetailModal from "./EquipmentRequestDetailModal";
import IssueReportDetailModal from "./IssueReportDetailModal";
import TaskSwapDetailModal from "./TaskSwapDetailModal";

type Props = NativeStackScreenProps<WorkerStackParamList, "ListAllRequests">;

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabKey2 = "equipment" | "issue" | "swap" | "emergency";

interface TabConfig {
  key: TabKey2;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabConfig[] = [
  { key: "equipment", label: "Equipment", icon: "cube-outline" },
  { key: "issue", label: "Issue Reports", icon: "warning-outline" },
  { key: "swap", label: "Task Swaps", icon: "swap-horizontal-outline" },
  { key: "emergency", label: "Emergency Leave", icon: "medkit-outline" },
];

// ─── Status badge ─────────────────────────────────────────────────────────────

function statusColor(status?: string): { bg: string; text: string } {
  const s = (status ?? "").toLowerCase();
  if (s.includes("approved") || s.includes("accepted"))
    return { bg: "#ECFDF5", text: "#15803D" };
  if (s.includes("pending")) return { bg: "#FFFBEB", text: "#B45309" };
  if (
    s.includes("rejected") ||
    s.includes("cancelled") ||
    s.includes("expired")
  )
    return { bg: "#FEF2F2", text: "#DC2626" };
  if (s.includes("open")) return { bg: "#EFF6FF", text: "#1D4ED8" };
  return { bg: "#F1F5F9", text: "#475569" };
}

function StatusBadge({ status }: { status?: string }) {
  const c = statusColor(status);
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{status ?? "—"}</Text>
    </View>
  );
}

// ─── Card primitives ──────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function CardHeader({
  title,
  status,
  date,
}: {
  title: string;
  status?: string;
  date?: string;
}) {
  return (
    <View style={styles.cardHeader}>
      <View style={styles.cardHeaderLeft}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
        {date && (
          <Text style={styles.cardDate}>
            {new Date(date).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Text>
        )}
      </View>
      <StatusBadge status={status} />
    </View>
  );
}

function CardRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.cardRow}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

// ─── Equipment card ───────────────────────────────────────────────────────────

function EquipmentCard({ item }: { item: EquipmentRequestItem }) {
  return (
    <Card>
      <CardHeader
        title={`Equipment · ${item.equipmentId}`}
        status={item.status ?? "Pending"}
        date={item.createdAt}
      />
      <View style={styles.divider} />
      <CardRow label="Task Assignment" value={item.taskAssignmentId} />
      <CardRow label="Quantity" value={String(item.quantity)} />
      <CardRow label="Reason" value={item.reason} />
    </Card>
  );
}

// ─── Issue card ───────────────────────────────────────────────────────────────

function IssueCard({ item }: { item: IssueReport }) {
  const preview =
    item.description.length > 70
      ? item.description.slice(0, 70) + "…"
      : item.description;
  return (
    <Card>
      <CardHeader title={preview} status={item.status} date={item.created} />
      <View style={styles.divider} />
      <CardRow label="Task Assignment" value={item.taskAssignmentId} />
      {item.resolvedAt && (
        <CardRow
          label="Resolved At"
          value={new Date(item.resolvedAt).toLocaleDateString("vi-VN")}
        />
      )}
    </Card>
  );
}

// ─── Emergency card ───────────────────────────────────────────────────────────

function EmergencyCard({ item }: { item: EmergencyLeaveRequestDto }) {
  const preview = item.transcription
    ? item.transcription.length > 70
      ? item.transcription.slice(0, 70) + "…"
      : item.transcription
    : `Emergency Leave · #${item.id.slice(0, 8)}`;
  return (
    <Card>
      <CardHeader title={preview} status={item.status} date={item.created} />
      <View style={styles.divider} />
      <CardRow label="Task Assignment" value={item.taskAssignmentId} />
      {item.transcription && (
        <CardRow label="Transcription" value={item.transcription} />
      )}
      <CardRow label="Reviewed By" value={item.reviewedByUserId ?? undefined} />
    </Card>
  );
}

// ─── Swap card ────────────────────────────────────────────────────────────────

function SwapCard({ item }: { item: TaskSwapRequestListItem }) {
  return (
    <Card>
      <CardHeader
        title={`Swap · #${item.id.slice(0, 8)}`}
        status={item.status}
      />
      <View style={styles.divider} />
      <CardRow label="Task Assignment" value={item.taskAssignmentId} />
      <CardRow label="Target Worker" value={item.targetWorkerId ?? "—"} />
      <CardRow label="Reviewed By" value={item.reviewedByUserId ?? undefined} />
    </Card>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeleton} />
      ))}
    </>
  );
}

// ─── Empty ────────────────────────────────────────────────────────────────────

function Empty({ label }: { label: string }) {
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name="document-outline" size={40} color="#CBD5E1" />
      <Text style={styles.emptyText}>No {label} found</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function MyRequestsScreen({ navigation }: Props) {
  const { getWorkerProfile } = useAuth();
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [loadingWorker, setLoadingWorker] = useState(true);

  const [activeTab, setActiveTab] = useState<TabKey2>("equipment");
  const [refreshing, setRefreshing] = useState(false);

  const { loading: eqLoading, getByWorker: eqGet } = useEquipment();
  const { loading: issLoading, getByWorker: issGet } = useIssueReport();
  const { loading: swLoading, getMine: swGet } = useTaskSwap();
  const { loading: elLoading, getListByWorkerId: elGet } =
    useEmergencyLeaveRequest();

  const [eqItems, setEqItems] = useState<EquipmentRequestItem[]>([]);
  const [issItems, setIssItems] = useState<IssueReport[]>([]);
  const [swItems, setSwItems] = useState<TaskSwapRequestListItem[]>([]);
  const [elItems, setElItems] = useState<EmergencyLeaveRequestDto[]>([]);
  const [emModalVisible, setEmModalVisible] = useState(false);
  const [emModalId, setEmModalId] = useState<string | null>(null);
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [issueModalId, setIssueModalId] = useState<string | null>(null);
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [swapModalId, setSwapModalId] = useState<string | null>(null);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [equipmentModalItem, setEquipmentModalItem] = useState<any>(null);

  const isLoading =
    eqLoading || issLoading || swLoading || elLoading || loadingWorker;

  useEffect(() => {
    const fetchWorkerId = async () => {
      try {
        setLoadingWorker(true);
        const profile = await getWorkerProfile();
        if (profile && profile.id) {
          setWorkerId(profile.id);
        }
      } catch (error) {
        console.error("Error fetching worker profile:", error);
      } finally {
        setLoadingWorker(false);
      }
    };

    fetchWorkerId();
  }, []);

  const fetchAll = useCallback(async () => {
    // don't fetch if we don't have a valid workerId yet — avoids returning all users
    if (!workerId) return;
    const p = { pageNumber: 1, pageSize: PAGE_SIZE };
    const [eq, iss, sw, el] = await Promise.allSettled([
      eqGet(workerId, p),
      issGet(workerId, p),
      swGet(workerId, "All", p),
      elGet(workerId, p),
    ]);
    if (eq.status === "fulfilled") setEqItems(eq.value?.content ?? []);
    if (iss.status === "fulfilled") setIssItems(iss.value?.content ?? []);
    if (sw.status === "fulfilled") setSwItems(sw.value?.content ?? []);
    if (el.status === "fulfilled") setElItems(el.value?.content ?? []);
  }, [workerId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openEmergencyModal = (item: EmergencyLeaveRequestDto) => {
    setEmModalId(item.id);
    setEmModalVisible(true);
  };
  const openIssueModal = (item: IssueReport) => {
    setIssueModalId(item.id);
    setIssueModalVisible(true);
  };
  const openSwapModal = (item: TaskSwapRequestListItem) => {
    setSwapModalId(item.id);
    setSwapModalVisible(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };
  const openEquipmentModal = (item: EquipmentRequestItem) => {
    setEquipmentModalItem(item);
    setEquipmentModalVisible(true);
  };

  const counts: Record<TabKey2, number> = {
    equipment: eqItems.length,
    issue: issItems.length,
    swap: swItems.length,
    emergency: elItems.length,
  };

  const handleNavigate = (screen: TabKey) => {
    navigation.navigate(screen as never);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <Header title="My Requests" onBack={() => navigation.goBack()} />

      {/* ── Tab bar ── */}
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={15}
                  color={active ? "#4F46E5" : "#94A3B8"}
                />
                <Text
                  style={[styles.tabLabel, active && styles.tabLabelActive]}
                >
                  {tab.label}
                </Text>
                {counts[tab.key] > 0 && (
                  <View
                    style={[
                      styles.countBadge,
                      { backgroundColor: active ? "#EEF2FF" : "#F1F5F9" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.countText,
                        { color: active ? "#4F46E5" : "#64748B" },
                      ]}
                    >
                      {counts[tab.key]}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4F46E5"
          />
        }
      >
        {isLoading && !refreshing ? (
          <Skeleton />
        ) : (
          <>
            {activeTab === "equipment" &&
              (eqItems.length === 0 ? (
                <Empty label="equipment requests" />
              ) : (
                eqItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => openEquipmentModal(item)}
                  >
                    <EquipmentCard item={item} />
                  </TouchableOpacity>
                ))
              ))}

            {activeTab === "issue" &&
              (issItems.length === 0 ? (
                <Empty label="issue reports" />
              ) : (
                issItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => openIssueModal(item)}
                  >
                    <IssueCard item={item} />
                  </TouchableOpacity>
                ))
              ))}

            {activeTab === "swap" &&
              (swItems.length === 0 ? (
                <Empty label="task swap requests" />
              ) : (
                swItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => openSwapModal(item)}
                  >
                    <SwapCard item={item} />
                  </TouchableOpacity>
                ))
              ))}

            {activeTab === "emergency" &&
              (elItems.length === 0 ? (
                <Empty label="emergency leave requests" />
              ) : (
                elItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => openEmergencyModal(item)}
                  >
                    <EmergencyCard item={item} />
                  </TouchableOpacity>
                ))
              ))}
          </>
        )}
      </ScrollView>
      <EmergencyLeaveDetailModal
        visible={emModalVisible}
        leaveId={emModalId!}
        onClose={() => setEmModalVisible(false)}
      />
      <IssueReportDetailModal
        visible={issueModalVisible}
        reportId={issueModalId!}
        onClose={() => setIssueModalVisible(false)}
      />
      <EquipmentRequestDetailModal
        visible={equipmentModalVisible}
        requestId={equipmentModalItem?.id}
        item={equipmentModalItem}
        onClose={() => setEquipmentModalVisible(false)}
      />
      <TaskSwapDetailModal
        visible={swapModalVisible}
        swapId={swapModalId!}
        onClose={() => setSwapModalVisible(false)}
      />
      <BottomTabBar onNavigate={handleNavigate} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F6FA" },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 4,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginRight: 8,
    minWidth: 110,
  },
  tabActive: {
    borderBottomColor: "#4F46E5",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#94A3B8",
  },
  tabLabelActive: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
  },
  countText: {
    fontSize: 10,
    fontWeight: "700",
  },

  tabBarContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },

  // List
  list: {
    padding: 16,
    paddingBottom: 100,
  },

  // Card
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    flexShrink: 1,
  },
  cardDate: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5,
    gap: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
    minWidth: 100,
  },
  cardValue: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },

  // Badge
  badge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Skeleton
  skeleton: {
    height: 110,
    backgroundColor: "#E5E7EB",
    borderRadius: 14,
    marginBottom: 12,
  },

  // Empty
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
  },
});
