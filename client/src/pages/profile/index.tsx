import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, UserCheck, Award, Calendar, Flag, Home, School, Users, Heart, BookOpen, Activity } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { type User, type StudentProfile, type TeacherProfile, type PhysicalTest, type PhysicalSample } from "@/lib/types";

interface ProfileResponse {
  id: number;
  username: string;
  role: "admin" | "teacher" | "student";
  profile: StudentProfile | TeacherProfile | null;
}

export default function Profile() {
  const { user } = useAuth();
  
  const { data: profileData, isLoading } = useQuery<ProfileResponse>({
    queryKey: [`/api/profile/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: tests } = useQuery<PhysicalTest[]>({
    queryKey: [`/api/tests/${user?.id}`],
    enabled: !!user?.id && user?.role === "student",
  });

  const { data: samples } = useQuery<PhysicalSample[]>({
    queryKey: [`/api/samples/${user?.id}`],
    enabled: !!user?.id && user?.role === "student",
  });

  if (isLoading || !profileData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const profile = profileData.profile;

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Профиль</h1>
          <Link href="/profile/edit">
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Редактировать профиль
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-semibold">
                  {profile?.fullName ? getInitials(profile.fullName) : "??"}
                </div>
                <div>
                  <h3 className="font-semibold">{profile?.fullName}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{profileData.role}</p>
                </div>
              </div>

              {profileData.role === "student" && (
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <UserCheck className="h-4 w-4 mr-2" />
                    <span>Медицинская группа: {(profile as StudentProfile)?.medicalGroup}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Дата рождения: {profile?.dateOfBirth ? format(new Date(profile.dateOfBirth), 'PP') : 'Не установлено'}</span>
                  </div>
                </div>
              )}

              {profileData.role === "teacher" && (
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Award className="h-4 w-4 mr-2" />
                    <span>Должность: {(profile as TeacherProfile)?.position}</span>
                  </div>
                  {profile?.dateOfBirth && (
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Дата рождения: {format(new Date(profile.dateOfBirth), 'PP')}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Info Cards */}
          {profileData.role === "student" && (
            <>
              {/* Physical Tests Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Физические тесты</CardTitle>
                  <CardDescription>Последние результаты тестов</CardDescription>
                </CardHeader>
                <CardContent>
                  {tests && tests.length > 0 ? (
                    <div className="space-y-2">
                      {/* Render test results */}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Нет последних результатов</p>
                  )}
                </CardContent>
              </Card>

              {/* Physical State Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Физические пробы</CardTitle>
                  <CardDescription>Последние измерения</CardDescription>
                </CardHeader>
                <CardContent>
                  {samples && samples.length > 0 ? (
                    <div className="space-y-2">
                      {/* Render physical state measurements */}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Нет последних измерений</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {profileData.role === "teacher" && (
            <>
              {/* Teacher Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Статистика преподавания</CardTitle>
                  <CardDescription>Текущий семестр</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2" />
                      <span>Студенты: 120</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <BookOpen className="h-4 w-4 mr-2" />
                      <span>Группы: 4</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Activity className="h-4 w-4 mr-2" />
                      <span>Проведенные тесты: 240</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Расписание</CardTitle>
                  <CardDescription>Предстоящие занятия</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Нет предстоящих занятий</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
