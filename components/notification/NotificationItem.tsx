import { NotificationListItemDto } from "@/hooks/useNotification";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FormattedDate from "../common/FormattedDate";

interface Props {
  item: NotificationListItemDto;
  onPress: (item: NotificationListItemDto) => void;
}

export const NotificationItem: React.FC<Props> = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.container, item.isRead ? styles.read : styles.unread]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={[styles.title, !item.isRead && styles.textUnread]}>
          {item.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.time}>{<FormattedDate date={item.created} />}</Text>
      </View>
      {!item.isRead && <View style={styles.dot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  read: { backgroundColor: "#fff" },
  unread: { backgroundColor: "#F0F8FF" }, // Màu xanh lợt cho tin chưa đọc
  content: { flex: 1 },
  title: { fontSize: 16, color: "#333" },
  textUnread: { fontWeight: "bold", color: "#000" },
  body: { fontSize: 14, color: "#666", marginTop: 4 },
  time: { fontSize: 12, color: "#999", marginTop: 8 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF",
    marginLeft: 8,
  },
});
