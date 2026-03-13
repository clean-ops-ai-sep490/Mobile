import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import React from "react";

// ─── Import contexts ──────────────────────────────────────────────────────────
import { useAuth } from "@/contexts/AuthContext";

// ─── Import shared screens ────────────────────────────────────────────────────
import ProfileScreen from "@/screens/shared/ProfileScreen";

// ─── Import worker screens ────────────────────────────────────────────────────
import EmergencyLeaveScreen from "@/screens/worker/EmergencyLeaveScreen";
import HomeScreen from "@/screens/worker/HomeScreen";
import IssueReportScreen from "@/screens/worker/IssueReportScreen";
import RequestEquipmentScreen from "@/screens/worker/RequestEquipmentScreen";
import TaskListScreen from "@/screens/worker/TaskListScreen";

// ─── Import supervisor screens ────────────────────────────────────────────────
import ForgotPasswordScreen from "@/screens/auth/ForgotPasswordScreen";
import LoginScreen from "@/screens/auth/LoginScreen";
import OTPVerificationScreen from "@/screens/auth/OtpVerificationScreen";
import ResetPasswordScreen from "@/screens/auth/ResetPasswordScreen";
import ResetSuccessScreen from "@/screens/auth/ResetSuccessScreen";
import SupervisorHomeScreen from "@/screens/supervisor/SupervisorHomeScreen";
// ─── Auth Route params ──────────────────────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  OtpVerification: undefined;
  ResetPassword: undefined;
  ResetSuccess: undefined;
};

// ─── Worker Route params ──────────────────────────────────────────────────────
export type WorkerStackParamList = {
  Home: undefined;
  EmergencyLeave: undefined;
  Profile: undefined;
  Tasks: undefined;
  IssueReport: undefined;
  RequestEquipment: undefined;
};

// ─── Supervisor Route params ──────────────────────────────────────────────────
export type SupervisorStackParamList = {
  SupervisorHome: undefined;
  Profile: undefined;
};

// ─── Combined Route params ────────────────────────────────────────────────────
export type RootStackParamList = WorkerStackParamList &
  SupervisorStackParamList &
  AuthStackParamList;

const WorkerStack = createNativeStackNavigator<WorkerStackParamList>();
const SupervisorStack = createNativeStackNavigator<SupervisorStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

type LoginProps = NativeStackScreenProps<AuthStackParamList, "Login">;

function LoginWrapper({ navigation }: LoginProps) {
  return (
    <LoginScreen
      onNavigate={(screen) => {
        navigation.navigate(screen as keyof AuthStackParamList);
      }}
    />
  );
}

// ─── Worker Home wrapper — bridge onNavigate → navigation.navigate ──────────
type WorkerHomeProps = NativeStackScreenProps<WorkerStackParamList, "Home">;

function WorkerHomeWrapper({ navigation }: WorkerHomeProps) {
  return (
    <HomeScreen
      onNavigate={(screen) => {
        navigation.navigate(screen as keyof WorkerStackParamList);
      }}
    />
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name="Login" component={LoginWrapper} />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
      <AuthStack.Screen
        name="OtpVerification"
        component={OTPVerificationScreen}
      />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <AuthStack.Screen name="ResetSuccess" component={ResetSuccessScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Worker Navigator ─────────────────────────────────────────────────────────
function WorkerNavigator() {
  return (
    <WorkerStack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
    >
      <WorkerStack.Screen name="Home" component={WorkerHomeWrapper} />
      <WorkerStack.Screen
        name="EmergencyLeave"
        component={EmergencyLeaveScreen}
      />
      <WorkerStack.Screen name="Profile" component={ProfileScreen} />
      <WorkerStack.Screen name="Tasks" component={TaskListScreen} />
      <WorkerStack.Screen name="IssueReport" component={IssueReportScreen} />
      <WorkerStack.Screen
        name="RequestEquipment"
        component={RequestEquipmentScreen}
      />
    </WorkerStack.Navigator>
  );
}

// ─── Supervisor Navigator ─────────────────────────────────────────────────────
function SupervisorNavigator() {
  return (
    <SupervisorStack.Navigator
      initialRouteName="SupervisorHome"
      screenOptions={{ headerShown: false }}
    >
      <SupervisorStack.Screen
        name="SupervisorHome"
        component={SupervisorHomeScreen}
      />
      <SupervisorStack.Screen name="Profile" component={ProfileScreen} />
    </SupervisorStack.Navigator>
  );
}

// ─── Main Navigator — chọn dựa trên role ──────────────────────────────────────
export default function AppNavigator() {
  const { isAuthenticated, isWorker, isSupervisor } = useAuth();

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  if (isWorker) {
    return <WorkerNavigator />;
  }

  if (isSupervisor) {
    return <SupervisorNavigator />;
  }

  // Fallback: hiển thị worker navigator nếu role không xác định
  return <WorkerNavigator />;
}
