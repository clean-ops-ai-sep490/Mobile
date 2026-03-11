import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import React from "react";

// ─── Import screens ───────────────────────────────────────────────────────────
import ProfileScreen from "@/screens/shared/ProfileScreen";
import EmergencyLeaveScreen from "@/screens/worker/EmergencyLeaveScreen";
import HomeScreen from "@/screens/worker/HomeScreen";
import IssueReportScreen from "@/screens/worker/IssueReportScreen";
import RequestEquipmentScreen from "@/screens/worker/RequestEquipmentScreen";
import TaskListScreen from "@/screens/worker/TaskListScreen";

import { useAuth } from "@/contexts/AuthContext";
import { SupervisorHomeScreen } from "@/screens/supervisor";

// ─── Route params ─────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Home: undefined;
  SupervisorHome: undefined;
  EmergencyLeave: undefined;
  Profile: undefined;
  Tasks: undefined;
  IssueReport: undefined;
  RequestEquipment: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Home wrapper — bridge onNavigate → navigation.navigate ──────────────────
type HomeProps = NativeStackScreenProps<RootStackParamList, "Home">;

function HomeWrapper({ navigation }: HomeProps) {
  return (
    <HomeScreen
      onNavigate={(screen) => {
        navigation.navigate(screen as keyof RootStackParamList);
      }}
    />
  );
}

// ─── Supervisor Home wrapper ──────────────────────────────────────────────────
type SupervisorHomeProps = NativeStackScreenProps<
  RootStackParamList,
  "SupervisorHome"
>;

function SupervisorHomeWrapper({ navigation }: SupervisorHomeProps) {
  return (
    <SupervisorHomeScreen
      onNavigate={(screen) => {
        navigation.navigate(screen as keyof RootStackParamList);
      }}
    />
  );
}

// ─── Navigator Content (sử dụng useAuth hook) ────────────────────────────────
function AppNavigatorContent() {
  const { isWorker, isSupervisor } = useAuth();

  // Xác định initial route dựa trên role
  const initialRouteName = isSupervisor ? "SupervisorHome" : "Home";

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      {/* Worker screens */}
      {isWorker && (
        <>
          <Stack.Screen name="Home" component={HomeWrapper} />
          <Stack.Screen
            name="EmergencyLeave"
            component={EmergencyLeaveScreen}
          />
          <Stack.Screen name="Tasks" component={TaskListScreen} />
          <Stack.Screen name="IssueReport" component={IssueReportScreen} />
          <Stack.Screen
            name="RequestEquipment"
            component={RequestEquipmentScreen}
          />
        </>
      )}

      {/* Supervisor screens */}
      {isSupervisor && (
        <>
          <Stack.Screen
            name="SupervisorHome"
            component={SupervisorHomeWrapper}
          />
        </>
      )}

      {/* Shared screens */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// ─── Main Navigator ───────────────────────────────────────────────────────────
export default function AppNavigator() {
  return <AppNavigatorContent />;
}
