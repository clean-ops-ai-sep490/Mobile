import TimePicker from "@/components/common/TimePicker";
import WorkerSelector from "@/components/forms/worker-selector";
import { useEmergencyTaskForm } from "@/hooks/useEmergencyTaskForm";
import { SupervisorStackParamList } from "@/navigation/AppNavigator";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── TYPES ─────────────────────────────────────────────────────────────────

type UrgencyLevel = "Normal" | "High" | "Critical";

type Props = NativeStackScreenProps<
  SupervisorStackParamList,
  "CreateEmergencyTask"
>;

// ─── COMPONENT ─────────────────────────────────────────────────────────────

export default function CreateEmergencyTaskScreen({
  navigation,
  route,
}: Props) {
  const { workAreaId, workAreaName, preselectedWorker, location } =
    route.params || {};

  const {
    selectedWorkerName,
    displayLocation,
    taskName,
    startDate,
    startTime,
    durationMinutes,
    urgency,
    showWorkerDropdown,
    workers,
    loadingWorkers,
    loading,
    error,
    assigneeId,
    setDisplayLocation,
    setTaskName,
    setStartTime,
    setDurationMinutes,
    setUrgency,
    setShowWorkerDropdown,
    handleSelectWorker,
    handleReset,
    handleCreate,
  } = useEmergencyTaskForm({
    workAreaId,
    preselectedWorker,
    location,
    onSuccess: () => navigation.goBack(),
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Tạo Task Khẩn Cấp</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetButton}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Preselected Worker Info */}
          {preselectedWorker && (
            <View style={styles.preselectedContainer}>
              <Text style={styles.preselectedLabel}>Nhân viên được chọn:</Text>
              <Text style={styles.preselectedName}>
                {preselectedWorker.name}
              </Text>
              {location && (
                <Text style={styles.preselectedLocation}>
                  📍 Vị trí: {location.latitude.toFixed(6)},{" "}
                  {location.longitude.toFixed(6)}
                </Text>
              )}
            </View>
          )}

          {/* Selected Work Area */}
          {workAreaId && (
            <View style={styles.selectedAreaContainer}>
              <Text style={styles.selectedAreaLabel}>Khu vực đã chọn:</Text>
              <Text style={styles.selectedAreaName}>
                {workAreaName || workAreaId}
              </Text>
            </View>
          )}

          {/* Display Location */}
          <View style={styles.section}>
            <Text style={styles.label}>Địa điểm hiển thị *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập địa điểm hiển thị..."
              placeholderTextColor="#94A3B8"
              value={displayLocation}
              onChangeText={setDisplayLocation}
            />
          </View>

          {/* Task Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Tên task *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên task..."
              placeholderTextColor="#94A3B8"
              value={taskName}
              onChangeText={setTaskName}
            />
          </View>

          {/* Start Date - Readonly */}
          <View style={styles.section}>
            <Text style={styles.label}>Ngày bắt đầu</Text>
            <View style={[styles.input, styles.inputReadonly]}>
              <Text style={styles.inputReadonlyText}>
                {startDate || "Đang tải..."}
              </Text>
            </View>
          </View>

          {/* Start Time */}
          <TimePicker
            label="Giờ bắt đầu *"
            value={startTime}
            onChange={setStartTime}
            placeholder="Chọn giờ bắt đầu"
          />

          {/* Duration */}
          <View style={styles.section}>
            <Text style={styles.label}>Thời lượng (phút) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số phút..."
              placeholderTextColor="#94A3B8"
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              keyboardType="numeric"
            />
          </View>

          {/* Worker Selector */}
          <WorkerSelector
            selectedWorkerName={selectedWorkerName}
            workers={workers}
            loading={loadingWorkers}
            isOpen={showWorkerDropdown}
            onToggle={() => setShowWorkerDropdown(!showWorkerDropdown)}
            onSelect={handleSelectWorker}
            selectedWorkerId={assigneeId}
          />

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Bottom Spacer */}
          <View style={{ height: 40 }} />

          {/* Create Button */}
          <TouchableOpacity
            style={[
              styles.createButton,
              loading && styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.createButtonText}>Tạo Task Khẩn Cấp</Text>
            )}
          </TouchableOpacity>
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
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    fontSize: 20,
    color: "#64748B",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  resetButton: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputReadonly: {
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
  },
  inputReadonlyText: {
    fontSize: 14,
    color: "#64748B",
  },
  selectedAreaContainer: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  selectedAreaLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E40AF",
    marginBottom: 4,
  },
  selectedAreaName: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "500",
  },
  preselectedContainer: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  preselectedLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#15803D",
    marginBottom: 4,
  },
  preselectedName: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "600",
    marginBottom: 4,
  },
  preselectedLocation: {
    fontSize: 12,
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
  createButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: "#94A3B8",
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});
