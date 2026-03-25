import AppButton from "@/components/common/AppButton";
import { useAuth } from "@/contexts/AuthContext";
import { AuthStackParamList } from "@/navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
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

type Props = NativeStackScreenProps<AuthStackParamList, "OtpVerification">;

const OTPInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => {
  const inputs = useRef<(TextInput | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      const digits = text.replace(/[^0-9]/g, "").slice(0, 6);
      onChange(digits);
      const lastIndex = Math.min(digits.length - 1, 5);
      inputs.current[lastIndex]?.focus();
      return;
    }

    const clean = text.replace(/[^0-9]/g, "").slice(-1);
    const arr = Array.from({ length: 6 }, (_, i) => value[i] || "");
    arr[index] = clean;
    onChange(arr.join(""));
    if (clean && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.otpRow}>
      {digits.map((d, i) => (
        <TextInput
          key={i}
          ref={(r) => (inputs.current[i] = r)}
          style={[styles.otpBox, d ? styles.otpBoxFilled : null]}
          value={d}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={i === 0 ? 6 : 1}
          textAlign="center"
          selectionColor="#4F6EF7"
          autoComplete={i === 0 ? "one-time-code" : "off"}
        />
      ))}
    </View>
  );
};

export default function OTPVerificationScreen({ route, navigation }: Props) {
  const email = route.params?.email;
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const { forgotPassword } = useAuth();
  const { verifyOtp } = useAuth();

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleResend = async () => {
    try {
      setResendLoading(true);
      await forgotPassword(email);
      setCountdown(59);
      setCanResend(false);
      setOtp("");
      setError("");
    } catch (e) {
      setError("Send email failed. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length < 6) {
      setError("Please enter all 6 digits");
      return;
    }
    try {
      setVerifyLoading(true);
      setError("");
      const token = await verifyOtp(email, otp);
      navigation.navigate("ResetPassword", { email, token });
    } catch (e: any) {
      setError(e?.response?.data?.message || "OTP is incorrect or expired");
    } finally {
      setVerifyLoading(false);
    }
  };

  const pad = (n: number) => String(n).padStart(2, "0");

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
            <Ionicons
              name="shield-checkmark-outline"
              size={32}
              color="#4F6EF7"
            />
          </View>

          <Text style={styles.title}>OTP Verification</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{"\n"}your email address:
          </Text>
          <Text style={styles.emailHighlight}>{email}</Text>

          <View style={styles.card}>
            <OTPInput value={otp} onChange={setOtp} />
            {error ? <Text style={styles.errorText}>⚠ {error}</Text> : null}

            <View style={styles.resendRow}>
              <Text style={styles.resendLabel}>Did not receive the code? </Text>
              {canResend ? (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendLink}>Resend</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendTimer}>
                  Resend in {pad(countdown)}s
                </Text>
              )}
            </View>

            <AppButton
              label="Verify Code"
              onPress={handleVerify}
              loading={verifyLoading}
              loadingLabel="Verifying..."
              disabled={otp.length < 6}
              iconRight="checkmark"
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
  backIcon: { fontSize: 22, color: "#8899AA" },
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
  iconEmoji: { fontSize: 30 },
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
  },
  emailHighlight: {
    color: "#4F6EF7",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 28,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1E2A3A",
    marginBottom: 28,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#0D1520",
    borderWidth: 1.5,
    borderColor: "#1E2A3A",
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  otpBoxFilled: { borderColor: "#4F6EF7", backgroundColor: "#0D1A35" },
  errorText: {
    color: "#FF4D6A",
    fontSize: 12,
    marginBottom: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  resendLabel: { color: "#4A6180", fontSize: 13 },
  resendLink: { color: "#4F6EF7", fontSize: 13, fontWeight: "700" },
  resendTimer: { color: "#4F6EF7", fontSize: 13, fontWeight: "600" },
});
