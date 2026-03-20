import { AuthProvider } from "@/contexts/AuthContext";
import AppNavigator from "@/navigation/AppNavigator";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
