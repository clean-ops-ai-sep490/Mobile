import { useAuth } from "@/contexts/AuthContext";
import { AuthStackParamList } from "@/navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

interface Props {
  onNavigate: (screen: keyof AuthStackParamList) => void;
}

export default function LoginScreen({ onNavigate }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [touched, setTouched] = useState<{
    email?: boolean;
    password?: boolean;
  }>({});
  const [apiError, setApiError] = useState<string>("");

  const buttonScale = useRef(new Animated.Value(1)).current;

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Invalid email format";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const handleBlurEmail = () => {
    setFocusedField(null);
    setTouched((t) => ({ ...t, email: true }));
    setErrors((e) => ({ ...e, email: validateEmail(email) }));
  };

  const handleBlurPassword = () => {
    setFocusedField(null);
    setTouched((t) => ({ ...t, password: true }));
    setErrors((e) => ({ ...e, password: validatePassword(password) }));
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handleLogin = async () => {
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    console.log("=== EMAIL ===", email);
    console.log("=== PASSWORD ===", password);
    setTouched({ email: true, password: true });
    setErrors({ email: emailErr, password: passwordErr });
    setApiError("");
    if (emailErr || passwordErr) return;

    try {
      setLoading(true);
      await login(email, password);
    } catch (e: any) {
      console.log("=== CATCH ERROR ===", e?.response?.data);
      console.log("=== ERROR MESSAGE ===", e?.message);
      console.log("=== ERROR CODE ===", e?.code);
      setApiError(
        e?.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <StatusBar barStyle="light-content" />

      {/* Background shapes */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandSection}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>
            Sign in to your account to continue
          </Text>

          {/* Email */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Email</Text>
            <View
              style={[
                styles.inputContainer,
                focusedField === "email" && styles.inputFocused,
                touched.email && errors.email ? styles.inputError : null,
              ]}
            >
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
                  setApiError("");
                  if (touched.email)
                    setErrors((e) => ({ ...e, email: validateEmail(v) }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField("email")}
                onBlur={handleBlurEmail}
              />
            </View>
            {touched.email && errors.email ? (
              <Text style={styles.errorText}>⚠ {errors.email}</Text>
            ) : null}
          </View>

          {/* Password */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputContainer,
                focusedField === "password" && styles.inputFocused,
                touched.password && errors.password ? styles.inputError : null,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#8899AA"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#8899AA"
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setApiError("");
                  if (touched.password)
                    setErrors((e) => ({ ...e, password: validatePassword(v) }));
                }}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedField("password")}
                onBlur={handleBlurPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#8899AA"
                />
              </TouchableOpacity>
            </View>
            {touched.password && errors.password ? (
              <Text style={styles.errorText}>⚠ {errors.password}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => onNavigate("ForgotPassword")}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {apiError ? (
            <View style={styles.apiErrorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#FF4D6A" />
              <Text style={styles.apiErrorText}>{apiError}</Text>
            </View>
          ) : null}

          {/* Login Button */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonLoading]}
              onPress={handleLogin}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={1}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0A0F1E" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In →</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0F1E",
  },
  inner: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingVertical: 48,
  },

  // Background decorative circles
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

  // Brand
  brandSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoImage: {
    width: 180,
    height: 120,
  },

  // Card
  card: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: "#1E2A3A",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#4A6180",
    marginBottom: 28,
  },

  // Fields
  fieldWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7E93",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1520",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#1E2A3A",
    paddingHorizontal: 14,
    height: 52,
  },
  inputFocused: {
    borderColor: "#00E5FF",
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "400",
  },
  eyeButton: {
    padding: 4,
  },

  inputError: {
    borderColor: "#FF4D6A",
    shadowColor: "#FF4D6A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  errorText: {
    color: "#FF4D6A",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 2,
    fontWeight: "500",
  },

  apiErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,77,106,0.1)",
    borderWidth: 1,
    borderColor: "#FF4D6A",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  apiErrorText: {
    color: "#FF4D6A",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  // Login Button
  loginButton: {
    backgroundColor: "#4F6EF7",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4F6EF7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonLoading: {
    opacity: 0.8,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#1E2A3A",
  },
  dividerText: {
    color: "#3A4A5A",
    fontSize: 12,
    marginHorizontal: 12,
  },

  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: 6,
    marginBottom: 12,
  },
  forgotText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "500",
  },
  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#3A4A5A",
    fontSize: 13,
  },
  footerLink: {
    color: "#00E5FF",
    fontSize: 13,
    fontWeight: "600",
  },
});
