import { useAuth } from "@/contexts/AuthContext";
import LoginScreen from "@/screens/auth/LoginScreen";
import SupervisorHomeScreen from "@/screens/supervisor/home/SupervisorHomeScreen";
import HomeScreen from "@/screens/worker/HomeScreen";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function HomeTab() {
  const { isAuthenticated, isWorker, isSupervisor, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const handleNavigate = (screen: string) => {
    // Convert React Navigation routes to Expo Router routes
    // Tạm thời log để debug, sau này sẽ implement đầy đủ
    console.log("Navigate to:", screen);

    // TODO: Implement proper routing when we have all Expo Router screens
    switch (screen) {
      case "Tasks":
        // router.push("/tasks");
        break;
      case "Profile":
      case "WorkerProfile":
        // router.push("/profile");
        break;
      case "Notifications":
        // router.push("/notifications");
        break;
      default:
        console.log("Route not implemented yet:", screen);
    }
  };

  // Not authenticated - show login
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onNavigate={(screen) => {
          console.log("Auth navigate to:", screen);
          // TODO: Implement auth navigation
        }}
      />
    );
  }

  // Worker role - show Worker Home
  if (isWorker) {
    return <HomeScreen onNavigate={handleNavigate} />;
  }

  // Supervisor role - show Supervisor Home
  if (isSupervisor) {
    return <SupervisorHomeScreen onNavigate={handleNavigate} />;
  }

  // Fallback - should not reach here if roles are properly set
  return (
    <LoginScreen
      onNavigate={(screen) => {
        console.log("Fallback navigate to:", screen);
      }}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F6FA",
  },
});
