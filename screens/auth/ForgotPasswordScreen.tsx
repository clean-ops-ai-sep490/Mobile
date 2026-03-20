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

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const error =
    touched && !emailRegex.test(email) ? "Invalid email format" : "";

  const handleSubmit = () => {
    // setTouched(true);
    // if (!emailRegex.test(email)) return;
    // setSent(true);
    navigation.navigate("OtpVerification");
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
          {/* Back */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#8899AA" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name="key-outline" size={32} color="#4F6EF7" />
          </View>

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we will send you{"\n"}instructions to
            reset your password.
          </Text>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrap, error ? styles.inputError : null]}>
              <Ionicons
                name="mail-outline"
                size={18}
                color="#8899AA"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="you@company.com"
                placeholderTextColor="#8899AA"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (touched) setTouched(true);
                }}
                onBlur={() => setTouched(true)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {error ? <Text style={styles.errorText}>⚠ {error}</Text> : null}

            {sent && (
              <View style={styles.successHint}>
                <Text style={styles.successHintIcon}>✓</Text>
                <Text style={styles.successHintText}>
                  We will send reset instructions to this email.
                </Text>
              </View>
            )}

            <AppButton
              label="Send"
              onPress={handleSubmit}
              iconRight="arrow-forward"
              style={{
                marginTop: 24,
                backgroundColor: "#4F6EF7",
                shadowColor: "#4F6EF7",
              }}
            />
          </View>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.loginLinkText}>← Back to Sign In</Text>
          </TouchableOpacity>
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
    marginBottom: 4,
  },
  inputError: { borderColor: "#FF4D6A" },
  inputIcon: { fontSize: 16, marginRight: 10, opacity: 0.6, color: "#FFF" },
  input: { flex: 1, color: "#FFFFFF", fontSize: 15 },
  errorText: {
    color: "#FF4D6A",
    fontSize: 12,
    marginBottom: 12,
    fontWeight: "500",
  },

  successHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    marginTop: 4,
  },
  successHintIcon: { color: "#22C55E", fontWeight: "700", fontSize: 14 },
  successHintText: { color: "#22C55E", fontSize: 13, fontWeight: "500" },

  submitBtn: {
    backgroundColor: "#4F6EF7",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#4F6EF7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },

  loginLink: { alignItems: "center", marginBottom: 32 },
  loginLinkText: { color: "#4A6180", fontSize: 14, fontWeight: "500" },
});
