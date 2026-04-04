import { AuthProvider } from "@/contexts/AuthContext";
import { SelectedTaskProvider } from "@/contexts/SelectedTaskContext";
import AppNavigator from "@/navigation/AppNavigator";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SelectedTaskProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </SelectedTaskProvider>
    </AuthProvider>
  );
}
