import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { Link, useParams, useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  ArrowLeft, 
  UserCheck, 
  Calendar, 
  MapPin, 
  Flag, 
  Home,
  Briefcase,
  GraduationCap,
  Users,
  Heart,
  Activity,
  BookOpen,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { Faculty, Group, PhysicalTest, Student } from "@shared/schema";
import { PhysicalSample } from "@/lib/types";

export default function StudentDetail() {
  const { user } = useAuth();
  const params = useParams();
  const [, navigate] = useLocation();
  const studentId = parseInt(params.id  || "");
  
  const { data: student, isLoading: isLoadingStudent } = useQuery<Student & {username: string, facultyId ?: number, groupId ?: number}>({
    queryKey: [`/api/profile/${studentId}`],
    enabled: !!studentId,
  });

  const { data: tests, isLoading: isLoadingTests } = useQuery<PhysicalTest[]>({
    queryKey: [`/api/tests/${studentId}`],
    enabled: !!studentId,
  });

  const { data: samples, isLoading: isLoadingSamples } = useQuery<PhysicalSample[]>({
    queryKey: [`/api/samples/${studentId}`],
    enabled: !!studentId,
  });

  const { data: faculties } = useQuery<Faculty[]>({
    queryKey: ["/api/faculties"],
  });

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const isLoading = isLoadingStudent || isLoadingTests || isLoadingSamples;

  // Helper function to get faculty name
  const getFacultyName = (facultyId?: number) => {
    if (!facultyId || !faculties) return "Не назначен";
    const faculty = faculties?.find(f => f.facultyId === facultyId);
    return faculty ? faculty.name : "Не найден";
  };

  // Helper function to get group name
  const getGroupName = (groupId?: number) => {
    if (!groupId || !groups) return "Не назначен";
    const group = groups.find(g => g.groupId === groupId);
    return group ? group.name : "Не найден";
  };

  // Helper function to get medical group badge
  const getMedicalGroupBadge = (medicalGroup?: string) => {
    if (!medicalGroup) return null;
    
    switch (medicalGroup) {
      case "basic":
        return <Badge className="bg-green-100 text-green-800">Основная</Badge>;
      case "preparatory":
        return <Badge className="bg-amber-100 text-amber-800">Подготовительная</Badge>;
      case "special":
        return <Badge className="bg-red-100 text-red-800">Специальная</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{medicalGroup}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!student) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Студент не найден</h2>
            <p className="text-gray-500 mb-6">Студент, которого вы ищете, не существует или у вас нет разрешения просматривать его профиль.</p>
            <Button onClick={() => navigate('/students')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к студентам
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/students')} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">Профиль студента</h2>
            <p className="text-gray-500">{student.fullName || student.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Summary Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-center mb-4">
                <div className="h-24 w-24 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {student.fullName
                    ? student.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                    : student.username?.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <CardTitle className="text-center text-xl">{student.fullName || student.username}</CardTitle>
              <p className="text-center text-gray-500 mb-2">{student.username}</p>
              <div className="flex justify-center">
                {getMedicalGroupBadge(student.medicalGroup)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <GraduationCap className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Факультет</p>
                    <p className="font-medium">{getFacultyName(student.facultyId)}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Briefcase className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Группа</p>
                    <p className="font-medium">{getGroupName(student.groupId)}</p>
                  </div>
                </div>
                
                {student.dateOfBirth && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Дата рождения</p>
                      <p className="font-medium">{format(new Date(student.dateOfBirth), 'dd.MM.yyyy')}</p>
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">{tests?.length || 0}</p>
                    <p className="text-xs text-gray-500">Тесты</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">{samples?.length || 0}</p>
                    <p className="text-xs text-gray-500">Пробы</p>
                  </div>
                </div>
                
                <div className="pt-4 space-y-3">
                  <Link href={`/tests/${student.studentId}`}>
                    <Button variant="outline" className="w-full">
                      <Activity className="mr-2 h-4 w-4" />
                      Просмотр тестов
                    </Button>
                  </Link>
                  <Link href={`/reports?userId=${student.studentId}`}>
                    <Button variant="outline" className="w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      Генерация отчета
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Details Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Детали студента</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="personal">
                <TabsList className="mb-4">
                  <TabsTrigger value="personal">Личные данные</TabsTrigger>
                  <TabsTrigger value="education">Образование</TabsTrigger>
                  <TabsTrigger value="medical">Медицинская группа</TabsTrigger>
                  <TabsTrigger value="sports">Спорт</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-4">Основная информация</h3>
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <UserCheck className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">ФИО</p>
                            <p className="font-medium">{student.fullName || "Не указано"}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Дата рождения</p>
                            <p className="font-medium">
                              {student.dateOfBirth ? format(new Date(student.dateOfBirth), 'dd.MM.yyyy') : "Не указано"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <Flag className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Пол</p>
                            <p className="font-medium">{student.gender || "Не указано"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-4">Место рождения</h3>
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Место рождения</p>
                            <p className="font-medium">{student.placeOfBirth || "Не указано"}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <Home className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Адрес</p>
                            <p className="font-medium">{student.address || "Не указано"}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <Flag className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Национальность</p>
                            <p className="font-medium">{student.nationality || "Не указано"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="education">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <GraduationCap className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Школа</p>
                        <p className="font-medium">{student.schoolGraduated || "Не указано"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <BookOpen className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Факультет</p>
                        <p className="font-medium">{getFacultyName(student.facultyId)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Users className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Группа</p>
                        <p className="font-medium">{getGroupName(student.groupId)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <BookOpen className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Учебный отдел</p>
                        <p className="font-medium">{student.educationalDepartment || "Не указано"}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="medical">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Heart className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Медицинская группа</p>
                        <div className="flex items-center mt-1">
                          {getMedicalGroupBadge(student.medicalGroup)}
                        </div>
                      </div>
                    </div>
                    
                    {student.medicalGroup && student.medicalGroup !== "basic" && (
                      <div className="flex items-start">
                        <Heart className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Диагноз</p>
                          <p className="font-medium">{student.medicalDiagnosis || "Не указано"}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start">
                      <Heart className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Предыдущие болезни</p>
                        <p className="font-medium">{student.previousIllnesses || "Не указано"}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="sports">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Activity className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Текущая деятельность</p>
                        <p className="font-medium">{student.activeSports || "Не указано"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Activity className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Предыдущая деятельность</p>
                        <p className="font-medium">{student.previousSports || "Не указано"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Activity className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Дополнительная информация</p>
                        <p className="font-medium">{student.additionalInfo || "Не указано"}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
