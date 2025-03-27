import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, FileBarChart, Activity, Users, BookOpen, Dumbbell } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar for desktop */}
      <div className="hidden md:block h-screen">
        <Sidebar />
      </div>
      
      {/* Mobile navigation */}
      <MobileNav />
      
      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Welcome, {user.fullName || user.username}</h1>
          
          {/* Dashboard content based on role */}
          {user.role === "admin" && <AdminDashboard />}
          {user.role === "teacher" && <TeacherDashboard />}
          {user.role === "student" && <StudentDashboard />}
        </div>
      </main>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              User Management
            </CardTitle>
            <CardDescription>Manage system users</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Add, edit, or remove users with different roles: administrators, teachers, and students.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-indigo-500" />
              Faculties
            </CardTitle>
            <CardDescription>Manage faculty information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Organize faculties and departments within the educational institution.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-500" />
              Groups
            </CardTitle>
            <CardDescription>Manage student groups</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Create and manage student groups associated with faculties.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TeacherDashboard() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Teacher Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              Student Profiles
            </CardTitle>
            <CardDescription>Review student information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Access and review detailed profiles of your students.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <ClipboardList className="h-5 w-5 mr-2 text-indigo-500" />
              Assessment
            </CardTitle>
            <CardDescription>Evaluate student performance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Record and assess student test results, samples, and exercise performance.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileBarChart className="h-5 w-5 mr-2 text-green-500" />
              Reports
            </CardTitle>
            <CardDescription>Generate performance reports</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Create and analyze reports based on student performance data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StudentDashboard() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Student Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-500" />
              My Profile
            </CardTitle>
            <CardDescription>Personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              View and update your personal information, education details, and physical records.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Dumbbell className="h-5 w-5 mr-2 text-indigo-500" />
              My Results
            </CardTitle>
            <CardDescription>Performance data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Track your results in tests, physical measurements, and control exercises.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-500" />
              Teachers
            </CardTitle>
            <CardDescription>View teacher information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              See a list of your teachers and their contact information.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
