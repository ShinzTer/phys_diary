import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Users, 
  FileText, 
  TrendingUp, 
  Activity, 
  Search, 
  SlidersHorizontal, 
  ArrowUp, 
  ArrowDown, 
  MoreHorizontal 
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/users?role=student"],
  });

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // For demo purposes: simulate some test and assessment data
  const pendingAssessments = 18;
  const averagePerformance = 72.5;
  const medicalExemptions = 7;

  // Filter students by search term
  const filteredStudents = students?.filter(student =>
    student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Панель преподавателя</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Input
              type="text"
              placeholder="Поиск студентов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {isLoadingStudents ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Всего студентов</p>
                    <p className="text-2xl font-semibold">{students?.length || 0}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-md">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-green-600 font-medium flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  <span>+8% from last semester</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Ожидаемые оценки</p>
                    <p className="text-2xl font-semibold">{pendingAssessments}</p>
                  </div>
                  <div className="p-2 bg-amber-100 rounded-md">
                    <FileText className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-red-600 font-medium flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  <span>+12 since last week</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Средняя успеваемость</p>
                    <p className="text-2xl font-semibold">{averagePerformance}%</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-md">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-green-600 font-medium flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  <span>+3.2% improvement</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Медицинские исключения</p>
                    <p className="text-2xl font-semibold">{medicalExemptions}</p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-md">
                    <Activity className="h-5 w-5 text-red-500" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 font-medium flex items-center">
                  <span className="inline-block w-3 h-0.5 bg-gray-300 mr-1"></span>
                  <span>No change from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities & Upcoming Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Последние активности студентов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-3">Студент</th>
                          <th className="px-4 py-3">Тест/Проба</th>
                          <th className="px-4 py-3">Результат</th>
                          <th className="px-4 py-3">Дата</th>
                          <th className="px-4 py-3">Статус</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {/* Empty state if no data */}
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                            Последние активности отсутствуют
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-center">
                    <Button variant="link" className="text-primary text-sm">
                      Посмотреть все активности
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Предстоящие задания</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 pb-3 border-b">
                      <div className="p-2 bg-blue-100 rounded-md">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Оценить тесты плавания</p>
                        <p className="text-xs text-gray-500">Срок: 2 дня</p>
                        <div className="mt-2 flex items-center">
                          <span className="text-xs text-gray-500 mr-3">Progress: 4/12</span>
                          <Progress value={33} className="h-1.5 w-24" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 pb-3 border-b">
                      <div className="p-2 bg-red-100 rounded-md">
                        <Activity className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Отчеты на конец семестра</p>
                        <p className="text-xs text-gray-500">Срок: завтра</p>
                        <div className="mt-2 flex items-center">
                          <span className="text-xs text-gray-500 mr-3">Progress: 18/25</span>
                          <Progress value={72} className="h-1.5 w-24" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-100 rounded-md">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Обновить медицинские статусы</p>
                        <p className="text-xs text-gray-500">К пятнице</p>
                        <p className="text-xs mt-1.5 text-red-500 font-medium">3 ожидающих сертификатов</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <Button variant="link" className="text-primary text-sm">
                      Посмотреть все задания
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Student Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Прогресс студентов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredStudents?.slice(0, 4).map((student) => (
                  <div key={student.id} className="flex items-center">
                    <Avatar className="h-12 w-12 mr-3">
                      <AvatarImage src="" alt={student.fullName || student.username} />
                      <AvatarFallback>
                        {student.fullName ? getInitials(student.fullName) : student.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 mr-3">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">{student.fullName || student.username}</p>
                        <p className="text-xs text-gray-500">
                          {student.groupId ? `Группа ${student.groupId}` : "Нет группы"}
                        </p>
                      </div>
                      <Progress 
                        value={Math.random() * 100} 
                        className="h-1.5 w-full mt-2" 
                      />
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/students/${student.id}`}>
                            Посмотреть профиль
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Send Message</DropdownMenuItem>
                        <DropdownMenuItem>Generate Report</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
                
                {filteredStudents?.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Нет студентов, соответствующих вашему поиску
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-center">
                <Link href="/students">
                  <Button variant="link" className="text-primary text-sm">
                    Посмотреть всех студентов
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
