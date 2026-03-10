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
import TaskListScreen from "@/screens/worker/TaskListScreen";

// ─── Route params ─────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Home: undefined;
  EmergencyLeave: undefined;
  Profile: undefined;
  Tasks: undefined;
  IssueReport: undefined;
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

// ─── Navigator ────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Home" component={HomeWrapper} />
      <Stack.Screen name="EmergencyLeave" component={EmergencyLeaveScreen} />
      {/* Thêm screen mới vào đây: */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Tasks" component={TaskListScreen} />
      <Stack.Screen name="IssueReport" component={IssueReportScreen} />
    </Stack.Navigator>
  );
}
