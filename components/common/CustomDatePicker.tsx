import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Khai báo kiểu dữ liệu cho Props (Rule: Type Everything)
interface CustomDatePickerProps {
  visible: boolean;
  value?: Date | null;
  minimumDate?: Date | null;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  visible,
  value,
  minimumDate,
  onConfirm,
  onCancel,
}) => {
  // State lưu ngày tạm thời, luôn khởi tạo là Date
  const [tempDate, setTempDate] = useState<Date>(value || new Date());

  // Đồng bộ tempDate mỗi khi Modal được mở
  useEffect(() => {
    if (visible && value) {
      setTempDate(value);
    } else if (visible) {
      setTempDate(new Date());
    }
  }, [visible, value]);

  // Đảm bảo minimumDate luôn bắt đầu từ 00:00:00 để không chặn ngày hiện tại
  const getSafeMinDate = (): Date => {
    if (minimumDate) {
      // minimumDate may be provided as UTC-midnight (Date.UTC). Convert
      // to a local-midnight Date for the same calendar day so the native
      // picker interprets the min correctly in local timezone.
      const y = minimumDate.getUTCFullYear();
      const m = minimumDate.getUTCMonth();
      const d = minimumDate.getUTCDate();
      return new Date(y, m, d); // local midnight of that YYYY-MM-DD
    }

    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const handleDone = () => {
    // Construct UTC midnight for the selected local date so that when
    // converted to ISO (or interpreted by backend) the date component
    // remains the same regardless of timezone.
    const y = tempDate.getFullYear();
    const m = tempDate.getMonth();
    const d = tempDate.getDate();
    const utcMidnight = new Date(Date.UTC(y, m, d));
    onConfirm(utcMidnight);
  };

  if (!visible) return null;

  // Luồng xử lý cho iOS (Dùng Modal + Nút Done/Cancel)
  if (Platform.OS === "ios") {
    return (
      <Modal transparent visible={visible} animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onCancel}
        />
        <View style={styles.modalBottomSheet}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDone}>
              <Text style={styles.modalDoneText}>Xong</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="spinner"
            minimumDate={getSafeMinDate()}
            textColor="#000000"
            themeVariant="light"
            style={{ height: 200, width: "100%" }}
            onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
              if (selectedDate) {
                setTempDate(selectedDate);
              }
            }}
          />
        </View>
      </Modal>
    );
  }

  // Luồng xử lý cho Android (Native Dialog)
  return (
    <DateTimePicker
      value={value || new Date()}
      mode="date"
      display="default"
      minimumDate={getSafeMinDate()}
      textColor="#000000"
      themeVariant="light"
      style={{ height: 200, width: "100%" }}
      onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === "set" && selectedDate) {
          const y = selectedDate.getFullYear();
          const m = selectedDate.getMonth();
          const d = selectedDate.getDate();
          const utcMidnight = new Date(Date.UTC(y, m, d));
          onConfirm(utcMidnight);
        } else {
          // Trigger khi user bấm "Cancel" hoặc bấm ra ngoài Dialog
          onCancel();
        }
      }}
    />
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalBottomSheet: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalCancelText: { color: "#6B7280", fontSize: 16, fontWeight: "500" },
  modalDoneText: { color: "#3B82F6", fontSize: 16, fontWeight: "600" },
});

export default CustomDatePicker;
