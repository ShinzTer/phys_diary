import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./hooks/use-auth";
import { LocalSettingsProvider } from "./components/providers/local-settings-provider";
import AuthPage from "./pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import Dashboard from "./pages/dashboard";
import Profile from "./pages/profile";
import EditProfile from "./pages/profile/edit-profile";
import Students from "./pages/students";
import StudentDetail from "./pages/students/student-detail";
import Tests from "./pages/tests";
import TestForm from "./pages/tests/test-form";
import UserManagement from "./pages/admin/user-management";
import FacultyManagement from "./pages/admin/faculty-management";
import GroupManagement from "./pages/admin/group-management";
import Reports from "./pages/reports";
import Settings from "./pages/settings";
import SportResultForm from "./pages/tests/sport-result-form";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />

      {/* Dashboard routes */}
      <ProtectedRoute path="/" component={Dashboard} />

      {/* Profile routes */}
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/profile/edit" component={EditProfile} />

      {/* Student routes */}
      <ProtectedRoute
        path="/students"
        component={Students}
        allowedRoles={["admin", "teacher"]}
      />
      <ProtectedRoute
        path="/students/:id"
        component={StudentDetail}
        allowedRoles={["admin", "teacher"]}
      />

      {/* Test routes */}
      <ProtectedRoute path="/tests" component={Tests} />
      <ProtectedRoute path="/tests/new" component={TestForm} />
      <ProtectedRoute path="/tests/edit/:id" component={TestForm} />
      <ProtectedRoute path="/sport_results/new" component={SportResultForm} />
      <ProtectedRoute path="/sport_results/edit/:id" component={SportResultForm} />
      {/* Sample routes */}

      {/* Admin routes */}
      <ProtectedRoute
        path="/admin/users"
        component={UserManagement}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/faculties"
        component={FacultyManagement}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/groups"
        component={GroupManagement}
        allowedRoles={["admin"]}
      />

      {/* Report routes */}
      <ProtectedRoute
        path="/reports"
        component={Reports}
        allowedRoles={["admin", "teacher"]}
      />

      {/* Settings route */}
      <ProtectedRoute path="/settings" component={Settings} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocalSettingsProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </LocalSettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
