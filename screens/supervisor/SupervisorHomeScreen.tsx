import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function SupervisorHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Supervisor Home</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0F1E",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
