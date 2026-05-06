import { AuthProvider } from "@/contexts/AuthContext";
import { SelectedTaskProvider } from "@/contexts/SelectedTaskContext";
import AppNavigator from "@/navigation/AppNavigator";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SelectedTaskProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </SelectedTaskProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
