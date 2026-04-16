import AppButton from "@/components/common/AppButton";
import { AuthStackParamList } from "@/navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = NativeStackScreenProps<AuthStackParamList, "ResetSuccess">;

export default function ResetSuccessScreen({ navigation }: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoToLogin = () => {
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <BgCircles />

      <View style={styles.inner}>
        <Animated.View
          style={[styles.checkCircle, { transform: [{ scale }], opacity }]}
        >
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </Animated.View>

        <Animated.View style={{ opacity, alignItems: "center", gap: 12 }}>
          <Text style={styles.title}>Đã cập nhật mật khẩu!</Text>
          <Text style={styles.subtitle}>
            Mật khẩu của bạn đã được thay đổi thành công.{"\n"}Bạn có thể đăng
            nhập bằng mật khẩu mới.
          </Text>
        </Animated.View>

        <AppButton
          label="Quay lại Đăng nhập"
          onPress={handleGoToLogin}
          iconLeft="log-in-outline"
          style={{ backgroundColor: "#4F6EF7", shadowColor: "#4F6EF7" }}
        />
      </View>
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
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
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
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#4A6180",
    textAlign: "center",
    lineHeight: 24,
  },
});
