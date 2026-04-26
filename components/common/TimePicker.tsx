import React, { useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── TYPES ─────────────────────────────────────────────────────────────────

interface TimePickerProps {
  label: string;
  value: string; // Format: "HH:MM:SS"
  onChange: (time: string) => void;
  placeholder?: string;
}

// ─── COMPONENT ─────────────────────────────────────────────────────────────

export default function TimePicker({
  label,
  value,
  onChange,
  placeholder = "Chọn giờ",
}: TimePickerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState("09");
  const [selectedMinute, setSelectedMinute] = useState("00");

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  // Parse current value when opening modal
  const handleOpen = () => {
    if (value) {
      const [h, m] = value.split(":");
      setSelectedHour(h || "09");
      setSelectedMinute(m || "00");

      // Scroll to selected values after modal opens
      setTimeout(() => {
        const hourIndex = parseInt(h || "9");
        const minuteIndex = parseInt(m || "0");

        hourScrollRef.current?.scrollTo({
          y: hourIndex * 44,
          animated: true,
        });

        minuteScrollRef.current?.scrollTo({
          y: minuteIndex * 44,
          animated: true,
        });
      }, 100);
    }
    setIsVisible(true);
  };

  const handleConfirm = () => {
    const timeString = `${selectedHour}:${selectedMinute}:00`;
    onChange(timeString);
    setIsVisible(false);
  };

  const handleCancel = () => {
    setIsVisible(false);
  };

  // Generate hours (00-23)
  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0"),
  );

  // Generate minutes (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0"),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.input} onPress={handleOpen}>
        <Text style={value ? styles.valueText : styles.placeholderText}>
          {value || placeholder}
        </Text>
        <Text style={styles.icon}>🕐</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn giờ</Text>

            <View style={styles.pickerContainer}>
              {/* Hour Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Giờ</Text>
                <ScrollView
                  ref={hourScrollRef}
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.pickerItem,
                        selectedHour === hour && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedHour === hour &&
                            styles.pickerItemTextSelected,
                        ]}
                      >
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.separator}>:</Text>

              {/* Minute Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Phút</Text>
                <ScrollView
                  ref={minuteScrollRef}
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {minutes.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.pickerItem,
                        selectedMinute === minute && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedMinute === minute &&
                            styles.pickerItemTextSelected,
                        ]}
                      >
                        {minute}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Preview */}
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Thời gian đã chọn:</Text>
              <Text style={styles.previewValue}>
                {selectedHour}:{selectedMinute}:00
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
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
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  valueText: {
    fontSize: 14,
    color: "#1E293B",
  },
  placeholderText: {
    fontSize: 14,
    color: "#94A3B8",
  },
  icon: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 20,
  },
  pickerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    alignItems: "center",
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
  },
  scrollView: {
    maxHeight: 200,
    width: "100%",
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderRadius: 8,
    marginVertical: 2,
  },
  pickerItemSelected: {
    backgroundColor: "#3B82F6",
  },
  pickerItemText: {
    fontSize: 16,
    color: "#1E293B",
  },
  pickerItemTextSelected: {
    color: "#FFF",
    fontWeight: "600",
  },
  separator: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginHorizontal: 16,
  },
  previewContainer: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  previewLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F1F5F9",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  confirmButton: {
    backgroundColor: "#3B82F6",
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
});
