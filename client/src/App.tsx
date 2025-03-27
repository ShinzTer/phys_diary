import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";

// Admin Pages
import UsersPage from "@/pages/admin/users";
import FacultiesPage from "@/pages/admin/faculties";
import GroupsPage from "@/pages/admin/groups";

// Teacher Pages
import StudentProfilesPage from "@/pages/teacher/student-profiles";
import AssessmentPage from "@/pages/teacher/assessment";
import ReportsPage from "@/pages/teacher/reports";

// Student Pages
import MyResultsPage from "@/pages/student/my-results";
import TeachersPage from "@/pages/student/teachers";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected Routes */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/settings" component={Settings} />
      
      {/* Admin Routes */}
      <ProtectedRoute path="/admin/users" component={UsersPage} roles={["admin"]} />
      <ProtectedRoute path="/admin/faculties" component={FacultiesPage} roles={["admin"]} />
      <ProtectedRoute path="/admin/groups" component={GroupsPage} roles={["admin"]} />
      
      {/* Teacher Routes */}
      <ProtectedRoute path="/teacher/student-profiles" component={StudentProfilesPage} roles={["teacher", "admin"]} />
      <ProtectedRoute path="/teacher/assessment" component={AssessmentPage} roles={["teacher", "admin"]} />
      <ProtectedRoute path="/teacher/reports" component={ReportsPage} roles={["teacher", "admin"]} />
      
      {/* Student Routes */}
      <ProtectedRoute path="/student/results" component={MyResultsPage} roles={["student", "admin"]} />
      <ProtectedRoute path="/student/teachers" component={TeachersPage} roles={["student", "admin"]} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
