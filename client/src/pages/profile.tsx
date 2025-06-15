import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Student, Teacher } from "@shared/schema";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface UserRecord {
  teacherId?: number;
  studentId?: number;
}

interface ProfileResponse {
  id: number;
  username: string;
  role: "admin" | "teacher" | "student";
  profile: Student | Teacher;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // First get the teacher/student record by userId
  const {
    data: userRecord,
    isLoading: isLoadingRecord,
    error: recordError,
  } = useQuery<UserRecord>({
    queryKey: [`/api/users/${user?.id}/record`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && (user.role === "teacher" || user.role === "student"),
  });
  
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useQuery<ProfileResponse>({
    queryKey: [
      `/api/profile/${user?.role}/${
        userRecord?.teacherId || userRecord?.studentId
      }`,
    ],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!userRecord && (!!userRecord.teacherId || !!userRecord.studentId),
  });

  if (!user) return null;

  if (isLoadingRecord || isLoadingProfile) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
        </div>
      </MainLayout>
    );
  }

  if (recordError) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">
            Error loading user record: {(recordError as Error).message}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (profileError) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">
            Error loading profile: {(profileError as Error).message}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">Profile not found</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <Button onClick={() => navigate("/profile/edit")} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
        <div className="grid gap-6">
          {profile.role === "teacher" ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Teacher Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="text-lg">{profile.profile.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="text-lg">
                    {(profile.profile as Teacher).position}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-lg">{profile.profile.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Educational Department
                  </p>
                  <p className="text-lg">
                    {profile.profile.educationalDepartment || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nationality</p>
                  <p className="text-lg">
                    {profile.profile.nationality || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="text-lg">
                    {profile.profile.dateOfBirth || "-"}
                  </p>
                </div>
              </div>
            </div>
          ) : ( //Добавить адрес и т.д.
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Student Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="text-lg">{profile.profile.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Medical Group</p>
                  <p className="text-lg">
                    {(profile.profile as Student).medicalGroup}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-lg">{profile.profile.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-lg">
                    {profile.profile. || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Educational Department
                  </p>
                  <p className="text-lg">
                    {profile.profile.educationalDepartment || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nationality</p>
                  <p className="text-lg">
                    {profile.profile.nationality || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="text-lg">
                    {profile.profile.dateOfBirth || "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
