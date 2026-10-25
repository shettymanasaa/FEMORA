import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AppProviders, useAppContext } from "./providers";
import AppShell from "../ui/layout/AppShell";

import WelcomePage from "../pages/WelcomePage";
import ProfilePickerPage from "../pages/ProfilePickerPage";
import ProfileCreatePage from "../pages/ProfileCreatePage";
import OnboardingPage from "../pages/OnboardingPage";
import JourneySelectPage from "../pages/JourneySelectPage";
import HomePage from "../pages/HomePage";
import LearnPage from "../pages/LearnPage";
import AppointmentsPage from "../pages/AppointmentsPage";
import HealthHistoryPage from "../pages/HealthHistoryPage";
import SettingsPage from "../pages/SettingsPage";
import PrivacySettingsPage from "../pages/PrivacySettingsPage";
import PrivacyPolicyPage from "../pages/legal/PrivacyPolicyPage";
import TermsPage from "../pages/legal/TermsPage";

import MenstrualDashboard from "../pages/menstrual/MenstrualDashboard";
import CyclePage from "../pages/menstrual/CyclePage";
import CheckInPage from "../pages/menstrual/CheckInPage";
import InsightsPage from "../pages/menstrual/InsightsPage";
import SexualWellbeingPage from "../pages/menstrual/SexualWellbeingPage";
import MenstrualReportPage from "../pages/menstrual/MenstrualReportPage";

import MaternityDashboard from "../pages/maternity/MaternityDashboard";
import MaternityCheckInPage from "../pages/maternity/MaternityCheckInPage";
import BirthPlanPage from "../pages/maternity/BirthPlanPage";
import HospitalChecklistPage from "../pages/maternity/HospitalChecklistPage";
import PostpartumPage from "../pages/maternity/PostpartumPage";
import MaternityReportPage from "../pages/maternity/MaternityReportPage";

import MenopauseDashboard from "../pages/menopause/MenopauseDashboard";
import MenopauseCheckInPage from "../pages/menopause/MenopauseCheckInPage";
import MenopauseInsightsPage from "../pages/menopause/MenopauseInsightsPage";
import MenopauseCarePage from "../pages/menopause/MenopauseCarePage";
import MenopauseReportPage from "../pages/menopause/MenopauseReportPage";

function ProfileGate({ children }: { children: React.ReactNode }) {
  const { activeProfile } = useAppContext();
  const location = useLocation();

  if (!activeProfile) {
    return (
      <Navigate
        to="/profiles"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}

function JourneyGate({
  journey,
  children,
}: {
  journey: "menstrual" | "maternity" | "menopause";
  children: React.ReactNode;
}) {
  const { activeProfile } = useAppContext();

  if (!activeProfile) return <Navigate to="/profiles" replace />;

  if (activeProfile.journey !== journey) {
    return <Navigate to="/select-journey" replace />;
  }

  return <>{children}</>;
}

function ProtectedShell() {
  return (
    <ProfileGate>
      <AppShell />
    </ProfileGate>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/profiles" element={<ProfilePickerPage />} />
      <Route path="/profiles/new" element={<ProfileCreatePage />} />

      <Route element={<ProtectedShell />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/select-journey" element={<JourneySelectPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/profile/health-history" element={<HealthHistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/privacy" element={<PrivacySettingsPage />} />

        <Route
          path="/menstrual"
          element={<JourneyGate journey="menstrual"><MenstrualDashboard /></JourneyGate>}
        />
        <Route
          path="/menstrual/profile"
          element={<JourneyGate journey="menstrual"><MenstrualDashboard /></JourneyGate>}
        />
        <Route
          path="/menstrual/cycle"
          element={<JourneyGate journey="menstrual"><CyclePage /></JourneyGate>}
        />
        <Route
          path="/menstrual/check-in"
          element={<JourneyGate journey="menstrual"><CheckInPage /></JourneyGate>}
        />
        <Route
          path="/menstrual/insights"
          element={<JourneyGate journey="menstrual"><InsightsPage /></JourneyGate>}
        />
        <Route
          path="/menstrual/safety"
          element={<JourneyGate journey="menstrual"><InsightsPage /></JourneyGate>}
        />
        <Route
          path="/menstrual/sexual-wellbeing"
          element={<JourneyGate journey="menstrual"><SexualWellbeingPage /></JourneyGate>}
        />
        <Route
          path="/menstrual/report"
          element={<JourneyGate journey="menstrual"><MenstrualReportPage /></JourneyGate>}
        />
        <Route
          path="/menstrual/learn"
          element={<JourneyGate journey="menstrual"><LearnPage /></JourneyGate>}
        />

        <Route
          path="/maternity"
          element={<JourneyGate journey="maternity"><MaternityDashboard /></JourneyGate>}
        />
        <Route
          path="/maternity/profile"
          element={<JourneyGate journey="maternity"><MaternityDashboard /></JourneyGate>}
        />
        <Route
          path="/maternity/dashboard"
          element={<JourneyGate journey="maternity"><MaternityDashboard /></JourneyGate>}
        />
        <Route
          path="/maternity/check-in"
          element={<JourneyGate journey="maternity"><MaternityCheckInPage /></JourneyGate>}
        />
        <Route
          path="/maternity/safety"
          element={<JourneyGate journey="maternity"><MaternityCheckInPage /></JourneyGate>}
        />
        <Route
          path="/maternity/learn"
          element={<JourneyGate journey="maternity"><LearnPage /></JourneyGate>}
        />
        <Route
          path="/maternity/birth-plan"
          element={<JourneyGate journey="maternity"><BirthPlanPage /></JourneyGate>}
        />
        <Route
          path="/maternity/hospital-checklist"
          element={<JourneyGate journey="maternity"><HospitalChecklistPage /></JourneyGate>}
        />
        <Route
          path="/maternity/postpartum"
          element={<JourneyGate journey="maternity"><PostpartumPage /></JourneyGate>}
        />
        <Route
          path="/maternity/appointments"
          element={<JourneyGate journey="maternity"><AppointmentsPage /></JourneyGate>}
        />
        <Route
          path="/maternity/report"
          element={<JourneyGate journey="maternity"><MaternityReportPage /></JourneyGate>}
        />

        <Route
          path="/menopause"
          element={<JourneyGate journey="menopause"><MenopauseDashboard /></JourneyGate>}
        />
        <Route
          path="/menopause/profile"
          element={<JourneyGate journey="menopause"><MenopauseDashboard /></JourneyGate>}
        />
        <Route
          path="/menopause/dashboard"
          element={<JourneyGate journey="menopause"><MenopauseDashboard /></JourneyGate>}
        />
        <Route
          path="/menopause/check-in"
          element={<JourneyGate journey="menopause"><MenopauseCheckInPage /></JourneyGate>}
        />
        <Route
          path="/menopause/insights"
          element={<JourneyGate journey="menopause"><MenopauseInsightsPage /></JourneyGate>}
        />
        <Route
          path="/menopause/learn"
          element={<JourneyGate journey="menopause"><LearnPage /></JourneyGate>}
        />
        <Route
          path="/menopause/safety"
          element={<JourneyGate journey="menopause"><MenopauseCheckInPage /></JourneyGate>}
        />
        <Route
          path="/menopause/report"
          element={<JourneyGate journey="menopause"><MenopauseReportPage /></JourneyGate>}
        />
        <Route
          path="/menopause/care"
          element={<JourneyGate journey="menopause"><MenopauseCarePage /></JourneyGate>}
        />
      </Route>

      <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/legal/terms" element={<TermsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  );
}