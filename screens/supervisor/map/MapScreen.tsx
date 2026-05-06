import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import MapboxGL from "@rnmapbox/maps";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { useNearestWorker } from "@/hooks/useNearestWorker";
import { useWorkAreaSupervisor } from "@/hooks/useWorkAreaSupervisor";
import { useWorkerGPS } from "@/hooks/useWorkerGps";
import { SupervisorStackParamList } from "@/navigation/AppNavigator";
import { MapLocation } from "@/types/gps.types";
import {
  formatDistance,
  getMarkerColor,
  getStatusText,
} from "@/utils/gpsUtils";

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN as string);

type Props = NativeStackScreenProps<SupervisorStackParamList, "MapScreen">;
type MapMode = "view" | "adhoc";
interface MapScreenParams {
  mode: MapMode;
  workAreaId?: string;
}
const formatLastSeenTime = (lastSeen: string) =>
  new Date(lastSeen).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

export default function MapScreen({ navigation, route }: Props) {
  const { mode = "view", workAreaId } = (route.params as MapScreenParams) || {};
  const { user } = useAuth();

  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(
    null,
  );
  const [currentWorkAreaId, setCurrentWorkAreaId] = useState<string | null>(
    workAreaId || null,
  );

  const cameraRef = useRef<MapboxGL.Camera>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const {
    workAreas,
    getWorkAreasBySupervisor,
    loading: workAreasLoading,
    error: workAreasError,
  } = useWorkAreaSupervisor();

  // ✅ Chỉ fetch 1 lần khi chưa có workAreaId
  useEffect(() => {
    if (!currentWorkAreaId && user?.userId) {
      getWorkAreasBySupervisor(user.userId);
    }
  }, []); // ✅ empty deps — chỉ chạy 1 lần lúc mount

  // ✅ Set workArea đầu tiên làm default
  useEffect(() => {
    if (!currentWorkAreaId && workAreas.length > 0) {
      setCurrentWorkAreaId(workAreas[0].workAreaId);
    }
  }, [workAreas]); // ✅ chỉ phụ thuộc workAreas

  const {
    workers,
    loading,
    error,
    isPolling,
    totalWorkers,
    onlineCount,
    offlineCount,
    refreshWorkers,
  } = useWorkerGPS({
    workAreaId: currentWorkAreaId || undefined,
    pollingInterval: 8000,
    autoStart: true,
  });

  const { nearestWorkers, nearestWorker } = useNearestWorker({
    location: selectedLocation || undefined,
    workers,
  });

  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

  // ─── HANDLERS ──────────────────────────────────────────────────────────

  const handleMapPress = useCallback(
    (event: any) => {
      if (mode !== "adhoc") return;
      const { geometry } = event;
      const [longitude, latitude] = geometry.coordinates;
      setSelectedLocation({ latitude, longitude });
      bottomSheetRef.current?.snapToIndex(1);
    },
    [mode],
  );

  const handleWorkerMarkerPress = useCallback((worker: any) => {
    Alert.alert(
      worker.workerName,
      `Trạng thái: ${getStatusText(worker.status)}\nLần cuối: ${formatLastSeenTime(worker.lastSeen)}`,
      [{ text: "OK" }],
    );
  }, []);

  const handleAssignTask = useCallback(
    (workerId: string, workerName: string) => {
      if (!selectedLocation) return;
      navigation.navigate("CreateEmergencyTask", {
        workAreaId: currentWorkAreaId || undefined,
        preselectedWorker: { id: workerId, name: workerName },
        location: selectedLocation,
      });
    },
    [selectedLocation, currentWorkAreaId, navigation],
  );

  const handleRefresh = useCallback(() => {
    refreshWorkers();
  }, [refreshWorkers]);

  const handleRetryLoadWorkAreas = useCallback(() => {
    if (user?.userId) getWorkAreasBySupervisor(user.userId);
  }, [user?.userId, getWorkAreasBySupervisor]);

  // ─── RENDER METHODS ────────────────────────────────────────────────────

  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {mode === "adhoc" ? "Tạo Công Việc Khẩn Cấp" : "Theo Dõi Nhân Viên"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {totalWorkers} nhân viên • {onlineCount} hoạt động • {offlineCount}{" "}
            ngoại tuyến
          </Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>
    ),
    [mode, totalWorkers, onlineCount, offlineCount, handleRefresh, navigation],
  );

  const renderWorkerMarkers = useCallback(() => {
    return workers.map((worker) => (
      <MapboxGL.PointAnnotation
        key={worker.workerId}
        id={worker.workerId}
        coordinate={[worker.longitude, worker.latitude]}
        onSelected={() => handleWorkerMarkerPress(worker)}
      >
        <View
          style={[
            styles.markerContainer,
            { backgroundColor: getMarkerColor(worker.status) },
          ]}
        >
          <Text style={styles.markerText}>👤</Text>
        </View>
        <MapboxGL.Callout title={worker.workerName}>
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>{worker.workerName}</Text>
            <Text style={styles.calloutText}>
              {getStatusText(worker.status)}
            </Text>
          </View>
        </MapboxGL.Callout>
      </MapboxGL.PointAnnotation>
    ));
  }, [workers, handleWorkerMarkerPress]);

  const renderSelectedLocationMarker = useCallback(() => {
    if (!selectedLocation || mode !== "adhoc") return null;
    return (
      <MapboxGL.PointAnnotation
        id="selected-location"
        coordinate={[selectedLocation.longitude, selectedLocation.latitude]}
      >
        <View style={[styles.markerContainer, { backgroundColor: "#3B82F6" }]}>
          <Text style={styles.markerText}>📍</Text>
        </View>
        <MapboxGL.Callout title="Vị trí đã chọn">
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>Vị trí đã chọn</Text>
            <Text style={styles.calloutText}>Tap để tạo task tại đây</Text>
          </View>
        </MapboxGL.Callout>
      </MapboxGL.PointAnnotation>
    );
  }, [selectedLocation, mode]);

  const renderBottomSheetContent = useCallback(() => {
    if (mode === "view") {
      return (
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>Danh Sách Nhân Viên</Text>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#3B82F6" />
              <Text style={styles.loadingText}>Đang tải vị trí...</Text>
            </View>
          )}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                onPress={handleRefresh}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          )}
          {!loading && !error && workers.length === 0 && (
            <Text style={styles.emptyText}>Không có nhân viên nào</Text>
          )}
          {workers.map((worker) => (
            <View key={worker.workerId} style={styles.workerItem}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getMarkerColor(worker.status) },
                ]}
              />
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{worker.workerName}</Text>
                <Text style={styles.workerStatus}>
                  {getStatusText(worker.status)}
                </Text>
              </View>
              <Text style={styles.lastSeen}>
                {formatLastSeenTime(worker.lastSeen)}
              </Text>
            </View>
          ))}
        </BottomSheetView>
      );
    }

    return (
      <BottomSheetView style={styles.bottomSheetContent}>
        {!selectedLocation ? (
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionTitle}>Chọn Vị Trí</Text>
            <Text style={styles.instructionText}>
              Tap vào bản đồ để chọn vị trí cần tạo task khẩn cấp
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.bottomSheetTitle}>Nhân Viên Gần Nhất</Text>
            {nearestWorkers.length === 0 ? (
              <Text style={styles.emptyText}>Không có nhân viên nào</Text>
            ) : (
              nearestWorkers.slice(0, 5).map((worker, index) => (
                <TouchableOpacity
                  key={worker.workerId}
                  style={[
                    styles.nearestWorkerItem,
                    index === 0 && styles.nearestWorkerItemFirst,
                  ]}
                  onPress={() =>
                    handleAssignTask(worker.workerId, worker.workerName)
                  }
                >
                  <View style={styles.nearestWorkerLeft}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getMarkerColor(worker.status) },
                      ]}
                    />
                    <View>
                      <Text style={styles.nearestWorkerName}>
                        {index === 0 && "🎯 "}
                        {worker.workerName}
                      </Text>
                      <Text style={styles.nearestWorkerStatus}>
                        {getStatusText(worker.status)} •{" "}
                        {formatDistance(worker.distance)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.assignButton,
                      index === 0 && styles.assignButtonPrimary,
                    ]}
                    onPress={() =>
                      handleAssignTask(worker.workerId, worker.workerName)
                    }
                  >
                    <Text
                      style={[
                        styles.assignButtonText,
                        index === 0 && styles.assignButtonTextPrimary,
                      ]}
                    >
                      Giao việc
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
            {nearestWorker && (
              <TouchableOpacity
                style={styles.quickAssignButton}
                onPress={() =>
                  handleAssignTask(
                    nearestWorker.workerId,
                    nearestWorker.workerName,
                  )
                }
              >
                <Text style={styles.quickAssignText}>
                  ⚡ Giao cho {nearestWorker.workerName} (
                  {formatDistance(nearestWorker.distance)})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </BottomSheetView>
    );
  }, [
    mode,
    loading,
    error,
    workers,
    selectedLocation,
    nearestWorkers,
    nearestWorker,
    handleRefresh,
    handleAssignTask,
  ]);

  // ─── RENDER ────────────────────────────────────────────────────────────

  if (workAreasError) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {workAreasError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetryLoadWorkAreas}
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!currentWorkAreaId) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#3B82F6" />
          <Text style={styles.loadingText}>
            {workAreasLoading
              ? "Đang tải khu vực làm việc..."
              : "Không tìm thấy khu vực làm việc"}
          </Text>
          {!workAreasLoading && (
            <TouchableOpacity
              style={[styles.retryButton, { marginTop: 12 }]}
              onPress={handleRetryLoadWorkAreas}
            >
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
      {renderHeader()}
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        onPress={handleMapPress}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={14}
          centerCoordinate={[106.6297, 10.8231]}
          animationMode="flyTo"
          animationDuration={1000}
        />
        <MapboxGL.UserLocation visible={true} />
        {renderWorkerMarkers()}
        {renderSelectedLocationMarker()}
      </MapboxGL.MapView>

      {isPolling && (
        <View style={styles.pollingIndicator}>
          <View style={styles.pollingDot} />
          <Text style={styles.pollingText}>Đang cập nhật...</Text>
        </View>
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
      >
        {renderBottomSheetContent()}
      </BottomSheet>
    </View>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 20,
    color: "#64748B",
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  refreshIcon: {
    fontSize: 18,
    color: "#3B82F6",
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerText: {
    fontSize: 16,
  },
  callout: {
    padding: 8,
    backgroundColor: "#FFF",
    borderRadius: 8,
    minWidth: 120,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  calloutText: {
    fontSize: 12,
    color: "#64748B",
  },
  pollingIndicator: {
    position: "absolute",
    top: 80,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pollingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  pollingText: {
    fontSize: 12,
    color: "#64748B",
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#64748B",
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    paddingVertical: 20,
  },
  workerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  workerStatus: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  lastSeen: {
    fontSize: 12,
    color: "#64748B",
  },
  instructionContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  nearestWorkerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginBottom: 8,
  },
  nearestWorkerItemFirst: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  nearestWorkerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  nearestWorkerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  nearestWorkerStatus: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  assignButton: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  assignButtonPrimary: {
    backgroundColor: "#3B82F6",
  },
  assignButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  assignButtonTextPrimary: {
    color: "#FFF",
  },
  quickAssignButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  quickAssignText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});
