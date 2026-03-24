// App.tsx
import { AuthProvider } from "@/contexts/AuthContext";
import AppNavigator from "@/navigation/AppNavigator";
import React from "react";

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
