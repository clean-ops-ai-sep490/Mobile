import AppButton from "@/components/common/AppButton";
import { AuthStackParamList } from "@/navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Props = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;

const Requirement = ({ met, label }: { met: boolean; label: string }) => (
  <View style={styles.reqRow}>
    <View style={[styles.reqDot, met && styles.reqDotMet]} />
    <Text style={[styles.reqText, met && styles.reqTextMet]}>{label}</Text>
  </View>
);

export default function ResetPasswordScreen({ navigation }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [touched, setTouched] = useState(false);

  const hasLength = password.length >= 8;
  const hasCase = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const allMet = hasLength && hasCase && hasNumber;
  const matchError = touched && !!confirm && password !== confirm;

  const handleSubmit = () => {
    setTouched(true);
    // if (!allMet || password !== confirm) return;
    navigation.navigate("ResetSuccess");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <BgCircles />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#8899AA" />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <Ionicons name="lock-open-outline" size={32} color="#4F6EF7" />
          </View>

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Please enter a new password for your account below.
          </Text>

          <View style={styles.card}>
            {/* New password */}
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor="#8899AA"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                <Ionicons
                  name={showPw ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#8899AA"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm password */}
            <Text style={[styles.label, { marginTop: 16 }]}>
              Confirm New Password
            </Text>
            <View
              style={[styles.inputWrap, matchError ? styles.inputError : null]}
            >
              <TextInput
                style={styles.input}
                placeholder="Re-enter new password"
                placeholderTextColor="#8899AA"
                value={confirm}
                onChangeText={setConfirm}
                onBlur={() => setTouched(true)}
                secureTextEntry={!showCf}
              />
              <TouchableOpacity onPress={() => setShowCf(!showCf)}>
                <Ionicons
                  name={showCf ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#8899AA"
                />
              </TouchableOpacity>
            </View>
            {matchError ? (
              <Text style={styles.errorText}>⚠ Passwords do not match</Text>
            ) : null}

            {/* Requirements */}
            <View style={styles.reqBox}>
              <Text style={styles.reqTitle}>Password Requirements</Text>
              <Requirement met={hasLength} label="At least 8 characters" />
              <Requirement met={hasCase} label="Upper and lowercase letters" />
              <Requirement met={hasNumber} label="At least one number" />
            </View>

            <AppButton
              label="Update Password"
              onPress={handleSubmit}
              disabled={!allMet || !confirm}
              iconRight="checkmark-circle-outline"
              style={{
                backgroundColor: "#4F6EF7",
                shadowColor: "#4F6EF7",
                marginBottom: 0,
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const BgCircles = () => (
  <>
    <View style={styles.bgCircle1} />
    <View style={styles.bgCircle2} />
    <View style={styles.bgCircle3} />
  </>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0A0F1E" },
  inner: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: "center",
  },
  bgCircle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#00E5FF",
    opacity: 0.06,
    top: -80,
    right: -80,
  },
  bgCircle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#6C63FF",
    opacity: 0.08,
    bottom: 100,
    left: -60,
  },
  bgCircle3: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#00E5FF",
    opacity: 0.05,
    bottom: 200,
    right: 20,
  },
  backBtn: { marginBottom: 32 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#111827",
    borderWidth: 1.5,
    borderColor: "#1E2A3A",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#4A6180",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1E2A3A",
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7E93",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1520",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#1E2A3A",
    paddingHorizontal: 14,
    height: 52,
  },
  inputError: { borderColor: "#FF4D6A" },
  input: { flex: 1, color: "#FFFFFF", fontSize: 15 },
  errorText: {
    color: "#FF4D6A",
    fontSize: 12,
    marginTop: 6,
    marginBottom: 4,
    fontWeight: "500",
  },
  reqBox: {
    backgroundColor: "#0D1520",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    gap: 10,
  },
  reqTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4A6180",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  reqDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1E2A3A",
    borderWidth: 1.5,
    borderColor: "#4A6180",
  },
  reqDotMet: { backgroundColor: "#22C55E", borderColor: "#22C55E" },
  reqText: { fontSize: 13, color: "#4A6180" },
  reqTextMet: { color: "#22C55E", fontWeight: "600" },
});
