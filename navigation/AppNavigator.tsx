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
import RequestSwapTaskScreen from "@/screens/worker/RequestSwapTaskScreen";
import TaskExecutionScreen from "@/screens/worker/TaskExecutionScreen";
import TaskListScreen from "@/screens/worker/TaskListScreen";

// ─── Import supervisor screens ────────────────────────────────────────────────
import ForgotPasswordScreen from "@/screens/auth/ForgotPasswordScreen";
import LoginScreen from "@/screens/auth/LoginScreen";
import OTPVerificationScreen from "@/screens/auth/OtpVerificationScreen";
import ResetPasswordScreen from "@/screens/auth/ResetPasswordScreen";
import ResetSuccessScreen from "@/screens/auth/ResetSuccessScreen";
import BleScannerScreen from "@/screens/shared/BleScannerScreen";
import BleTestScreen from "@/screens/shared/BleTestScreen";
import InspectionCameraScreen from "@/screens/shared/CameraScreen";
import { NotificationListScreen } from "@/screens/shared/NotificationListScreen";
import QRScannerScreen from "@/screens/shared/QRScannerScreen";
import CreateEmergencyTaskScreen from "@/screens/supervisor/adhoc-task/CreateEmergencyTaskScreen";
import SupervisorHomeScreen from "@/screens/supervisor/home/SupervisorHomeScreen";
import SwapRequestDetailScreen from "@/screens/supervisor/swap-task/SwapRequestDetailScreen";
import SwapRequestListScreen from "@/screens/supervisor/swap-task/SwapRequestListScreen";
import ListAllRequestsScreen from "@/screens/worker/ListAllRequestsScreen";
import WorkerProfileScreen from "@/screens/worker/WorkerProfileScreen";

// ─── Auth Route params ──────────────────────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  OtpVerification: { email: string };
  ResetPassword: { email: string; token: string };
  ResetSuccess: undefined;
};

// ─── Worker Route params ──────────────────────────────────────────────────────
export type WorkerStackParamList = {
  Home: undefined;
  EmergencyLeave: undefined;
  WorkerProfile: undefined;
  Tasks: undefined;
  IssueReport: undefined;
  RequestEquipment: undefined;
  SwapTask: undefined;
  ListAllRequests: undefined;
  EmergencyLeaveDetail: { id: string };
  IssueReportDetail: { id: string };
  TaskSwapDetail: { id: string };
  EquipmentRequestDetail: { id: string; item?: any };
  TaskExecution: { id: string; steps?: any[] };
  QRScannerScreen: {
    onScanned: (result: any) => void;
  };
  InspectionCameraScreen: {
    mode?: "selfie" | "inspection";
    onCaptured?: (photo: any) => void;
  };
  Notifications: undefined;
  BleScannerScreen: {
    checkinPointId: string;
    onResult: (result: any) => void;
  };
  BleTest: undefined;
};

// ─── Supervisor Route params ──────────────────────────────────────────────────
export type SupervisorStackParamList = {
  SupervisorHome: undefined;
  CreateEmergencyTask: undefined;
  SwapRequestList: undefined;
  SwapRequestDetail: { requestId: string };
  Profile: undefined;
  Notifications: undefined;
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
        navigation.navigate(screen as any);
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
        navigation.navigate(screen as any);
      }}
    />
  );
}

// ─── Supervisor Home wrapper — bridge onNavigate → navigation.navigate ───────
type SupervisorHomeProps = NativeStackScreenProps<
  SupervisorStackParamList,
  "SupervisorHome"
>;

function SupervisorHomeWrapper({ navigation }: SupervisorHomeProps) {
  return (
    <SupervisorHomeScreen
      onNavigate={(screen) => {
        if (screen === "create-task") {
          navigation.navigate("CreateEmergencyTask");
        } else if (screen === "SwapRequestList") {
          navigation.navigate("SwapRequestList");
        } else {
          // Handle other navigation cases
          console.log("Navigate to:", screen);
        }
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
      <WorkerStack.Screen
        name="WorkerProfile"
        component={WorkerProfileScreen}
      />
      <WorkerStack.Screen name="Tasks" component={TaskListScreen} />
      <WorkerStack.Screen name="SwapTask" component={RequestSwapTaskScreen} />
      <WorkerStack.Screen
        name="ListAllRequests"
        component={ListAllRequestsScreen}
      />
      <WorkerStack.Screen
        name="TaskExecution"
        component={TaskExecutionScreen}
      />
      <WorkerStack.Screen name="QRScannerScreen" component={QRScannerScreen} />

      <WorkerStack.Screen
        name="InspectionCameraScreen"
        component={InspectionCameraScreen}
      />
      <WorkerStack.Screen
        name="Notifications"
        component={NotificationListScreen}
      />
      <WorkerStack.Screen
        name="BleScannerScreen"
        component={BleScannerScreen}
      />
      <WorkerStack.Screen name="BleTest" component={BleTestScreen} />
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
        component={SupervisorHomeWrapper}
      />
      <SupervisorStack.Screen
        name="CreateEmergencyTask"
        component={CreateEmergencyTaskScreen}
      />
      <SupervisorStack.Screen
        name="SwapRequestList"
        component={SwapRequestListScreen}
      />
      <SupervisorStack.Screen
        name="SwapRequestDetail"
        component={SwapRequestDetailScreen}
      />
      <SupervisorStack.Screen name="Profile" component={ProfileScreen} />
      <SupervisorStack.Screen
        name="Notifications"
        component={NotificationListScreen}
      />
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

  // Fallback: không bao giờ đến đây vì đã check role trong login
  return <AuthNavigator />;
}
