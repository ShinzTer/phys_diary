import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import AdminDashboard from "./admin-dashboard";
import TeacherDashboard from "./teacher-dashboard";
import StudentDashboard from "./student-dashboard";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {user?.role === "admin" && <AdminDashboard />}
      {user?.role === "teacher" && <TeacherDashboard />}
      {user?.role === "student" && <StudentDashboard />}
    </MainLayout>
  );
}
