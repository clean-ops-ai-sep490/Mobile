import AppButton from "@/components/common/AppButton";
import { useAuth } from "@/contexts/AuthContext";
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

export default function ResetPasswordScreen({ route, navigation }: Props) {
  const { resetPassword } = useAuth();
  const { email, token } = route.params;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const hasLength = password.length >= 8;
  const hasCase = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const allMet = hasLength && hasCase && hasNumber;
  const matchError = touched && !!confirm && password !== confirm;

  const handleSubmit = async () => {
    setTouched(true);
    if (!allMet || password !== confirm) return;

    try {
      setLoading(true);
      setApiError("");
      await resetPassword(email, token, password);
      navigation.navigate("ResetSuccess");
    } catch (e: any) {
      setApiError(
        e?.response?.data?.message ||
          "Đặt lại mật khẩu thất bại. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
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

          <Text style={styles.title}>Đặt lại mật khẩu</Text>
          <Text style={styles.subtitle}>
            Vui lòng nhập mật khẩu mới cho tài khoản của bạn bên dưới.
          </Text>

          <View style={styles.card}>
            {/* New password */}
            <Text style={styles.label}>Mật khẩu mới</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu mới"
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
              Xác nhận mật khẩu mới
            </Text>
            <View
              style={[styles.inputWrap, matchError ? styles.inputError : null]}
            >
              <TextInput
                style={styles.input}
                placeholder="Nhập lại mật khẩu mới"
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
              <Text style={styles.errorText}>⚠ Mật khẩu không khớp</Text>
            ) : null}

            {/* Requirements */}
            <View style={styles.reqBox}>
              <Text style={styles.reqTitle}>Yêu cầu mật khẩu</Text>
              <Requirement met={hasLength} label="Ít nhất 8 ký tự" />
              <Requirement met={hasCase} label="Chữ hoa và chữ thường" />
              <Requirement met={hasNumber} label="Ít nhất một chữ số" />
            </View>

            {apiError ? (
              <Text style={styles.errorText}>⚠ {apiError}</Text>
            ) : null}

            <AppButton
              label="Cập nhật mật khẩu"
              onPress={handleSubmit}
              loading={loading}
              loadingLabel="Đang cập nhật..."
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginBottom: 24,
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
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "rgba(79,110,247,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: "800", color: "#FFFFFF", marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: "#8899AA",
    lineHeight: 22,
    marginBottom: 32,
  },
  card: {
    backgroundColor: "#131929",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1E2D45",
  },
  label: { fontSize: 13, fontWeight: "600", color: "#8899AA", marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1526",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#1E2D45",
    paddingHorizontal: 14,
    height: 52,
  },
  inputError: { borderColor: "#FF4D6A" },
  input: { flex: 1, color: "#FFFFFF", fontSize: 15 },
  errorText: { fontSize: 12, color: "#FF4D6A", marginTop: 6, marginBottom: 8 },
  reqBox: {
    backgroundColor: "#0D1526",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1E2D45",
  },
  reqTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8899AA",
    marginBottom: 10,
  },
  reqRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  reqDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1E2D45",
    marginRight: 10,
  },
  reqDotMet: { backgroundColor: "#22C55E" },
  reqText: { fontSize: 13, color: "#8899AA" },
  reqTextMet: { color: "#22C55E" },
});
