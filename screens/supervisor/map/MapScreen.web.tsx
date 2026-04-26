import { NativeStackScreenProps } from "@react-navigation/native-stack";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

// Initialize Mapbox
mapboxgl.accessToken = "RS09ui2yXoYiEzBVQ0CkcL3aeFr3OFgtH9preIphup";

// ─── TYPES ─────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<SupervisorStackParamList, "MapScreen">;

type MapMode = "view" | "adhoc";

interface MapScreenParams {
  mode: MapMode;
  workAreaId?: string;
}

// ─── WEB MAP COMPONENT ─────────────────────────────────────────────────────

export default function MapScreen({ navigation, route }: Props) {
  const { mode = "view", workAreaId } = (route.params as MapScreenParams) || {};
  const { user } = useAuth();

  // Map state
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(
    null,
  );
  const [currentWorkAreaId, setCurrentWorkAreaId] = useState<string | null>(
    workAreaId || null,
  );

  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Get work areas for supervisor
  const { workAreas, getWorkAreasBySupervisor } = useWorkAreaSupervisor();

  // Get workAreaId if not provided
  useEffect(() => {
    if (!currentWorkAreaId && user?.userId) {
      getWorkAreasBySupervisor(user.userId);
    }
  }, [currentWorkAreaId, user?.userId, getWorkAreasBySupervisor]);

  // Set first work area as default
  useEffect(() => {
    if (!currentWorkAreaId && workAreas.length > 0) {
      setCurrentWorkAreaId(workAreas[0].workAreaId);
    }
  }, [workAreas, currentWorkAreaId]);

  // GPS tracking
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

  // Nearest worker logic
  const { nearestWorkers, nearestWorker } = useNearestWorker({
    location: selectedLocation || undefined,
    workers,
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [106.6297, 10.8231], // Ho Chi Minh City
      zoom: 14,
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add user location control
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      }),
      "top-right",
    );

    // Handle map click for adhoc mode
    if (mode === "adhoc") {
      map.on("click", (e) => {
        const { lng, lat } = e.lngLat;
        setSelectedLocation({ latitude: lat, longitude: lng });

        // Remove old marker
        if (selectedMarkerRef.current) {
          selectedMarkerRef.current.remove();
        }

        // Add new marker
        const el = document.createElement("div");
        el.className = "marker-selected";
        el.style.backgroundColor = "#3B82F6";
        el.style.width = "30px";
        el.style.height = "30px";
        el.style.borderRadius = "50%";
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
        el.innerHTML = "📍";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";

        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(
            new mapboxgl.Popup().setHTML(
              "<strong>Vị trí đã chọn</strong><br/>Tap để tạo task",
            ),
          )
          .addTo(map);

        selectedMarkerRef.current = marker;
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [mode]);

  // Update worker markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    workers.forEach((worker) => {
      const el = document.createElement("div");
      el.className = "marker-worker";
      el.style.backgroundColor = getMarkerColor(worker.status);
      el.style.width = "30px";
      el.style.height = "30px";
      el.style.borderRadius = "50%";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
      el.innerHTML = "👤";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.cursor = "pointer";

      const marker = new mapboxgl.Marker(el)
        .setLngLat([worker.longitude, worker.latitude])
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<strong>${worker.workerName}</strong><br/>${getStatusText(worker.status)}<br/>Lần cuối: ${new Date(worker.lastSeen).toLocaleTimeString("vi-VN")}`,
          ),
        )
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [workers]);

  // Handlers
  const handleAssignTask = useCallback(
    (workerId: string, workerName: string) => {
      if (!selectedLocation) return;

      navigation.navigate("CreateEmergencyTask", {
        workAreaId: currentWorkAreaId || undefined,
        preselectedWorker: {
          id: workerId,
          name: workerName,
        },
        location: selectedLocation,
      });
    },
    [selectedLocation, currentWorkAreaId, navigation],
  );

  // Render
  if (!currentWorkAreaId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Map Tracking</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#3B82F6" />
          <Text style={styles.loadingText}>Đang tải khu vực làm việc...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {mode === "adhoc" ? "Tạo Task Khẩn Cấp" : "Theo Dõi Nhân Viên"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {totalWorkers} nhân viên • {onlineCount} hoạt động • {offlineCount}{" "}
            ngoại tuyến
          </Text>
        </View>

        <TouchableOpacity onPress={refreshWorkers} style={styles.refreshButton}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        style={{
          flex: 1,
          width: "100%",
          height: "100%",
        }}
      />

      {/* Polling Indicator */}
      {isPolling && (
        <View style={styles.pollingIndicator}>
          <View style={styles.pollingDot} />
          <Text style={styles.pollingText}>Đang cập nhật...</Text>
        </View>
      )}

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        {mode === "view" ? (
          <View style={styles.panelContent}>
            <Text style={styles.panelTitle}>Danh Sách Nhân Viên</Text>

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
                  onPress={refreshWorkers}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && !error && workers.length === 0 && (
              <Text style={styles.emptyText}>Không có nhân viên nào</Text>
            )}

            <View style={styles.workerList}>
              {workers.slice(0, 5).map((worker) => (
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
                    {new Date(worker.lastSeen).toLocaleTimeString("vi-VN")}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.panelContent}>
            {!selectedLocation ? (
              <View style={styles.instructionContainer}>
                <Text style={styles.instructionTitle}>Chọn Vị Trí</Text>
                <Text style={styles.instructionText}>
                  Click vào bản đồ để chọn vị trí cần tạo task khẩn cấp
                </Text>
              </View>
            ) : (
              <View>
                <Text style={styles.panelTitle}>Nhân Viên Gần Nhất</Text>

                {nearestWorkers.length === 0 ? (
                  <Text style={styles.emptyText}>Không có nhân viên nào</Text>
                ) : (
                  <View style={styles.workerList}>
                    {nearestWorkers.slice(0, 3).map((worker, index) => (
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
                              {
                                backgroundColor: getMarkerColor(worker.status),
                              },
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
                        <View
                          style={[
                            styles.assignButton,
                            index === 0 && styles.assignButtonPrimary,
                          ]}
                        >
                          <Text
                            style={[
                              styles.assignButtonText,
                              index === 0 && styles.assignButtonTextPrimary,
                            ]}
                          >
                            Giao việc
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
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
          </View>
        )}
      </View>
    </View>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────

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
    zIndex: 10,
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
    zIndex: 10,
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
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: "40%",
    zIndex: 10,
  },
  panelContent: {
    padding: 16,
  },
  panelTitle: {
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
  workerList: {
    maxHeight: 200,
    overflow: "scroll",
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
