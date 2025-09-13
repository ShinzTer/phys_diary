import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { Link, useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  SlidersHorizontal,
  Plus,
  Pencil,
  MoreHorizontal,
  ArrowUpDown,
  Star,
  Trash,
} from "lucide-react";
import {
  TEST_TYPES,
  CONTROL_EXERCISE_TYPES,
  TEST_TYPES_CAMEL,
  CONTROL_EXERCISE_TYPES_CAMEL,
  Student,
  Period,
  SportResult,
  Teacher,
} from "@shared/schema";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export default function Tests() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("tests");
  const { data: teacherProfile, isLoading: isLoadingTeacherProfile } =
    useQuery<{ profile: Teacher; teacherId: number }>({
      queryKey: [`/api/profile/teacher/${user?.id}`],
      enabled: user?.role === "teacher",
    });
  const { data: sport_results, isLoading: isLoadingResults } = useQuery<
    SportResult[]
  >({
    queryKey: [
      user?.role === "student"
        ? `/api/sport-results/${user.id}`
        : `/api/sport-results-period/${periodFilter}`,
    ],
    enabled: !!user && periodFilter !== "all",
  });

  console.log("periodFilter:", periodFilter);
  console.log("sport_results:", sport_results);
  const filteredSportResults = sport_results?.filter(
    (test) => test.periodId === Number(periodFilter)
  );
  const { data: students = [], isLoading: isLoadingStudents } = useQuery<
    Student[]
  >({
    queryKey: ["/api/students"],
    enabled: !!user && user?.role !== "student",
  });

  const { data: periods = [], isLoading: isLoadingPeriods } = useQuery<
    Period[]
  >({
    queryKey: ["/api/periods"],
    enabled: !!user,
  });

  const formatTestType2 = (type: string) => {
    return type
      .split("_")
      .map((word, index) => {
        // Первое слово оставляем в lowercase, остальные с заглавной буквы
        if (index === 0) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join("");
  };

  // Get formatted test type display name
  const formatTestType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const deleteTestMutation = useMutation({
        mutationFn: async (id: number) => {
    
          await apiRequest("DELETE", `/api/physical-tests/${id}`);
        },
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: [user?.role === "student"
          ? `/api/physical-tests/${user.id}`
          : "api/tests/all",],
          });
          toast({
            title: "Физический тест удален",
            description: "Физическое тест успешно удален.",
          });
       
        },
        onError: (error) => {
          toast({
            title: "Ошибка",
            description: error.message || "Не удалось удалить физический тест",
            variant: "destructive",
          });
        },
      });
    
        const deleteSportResultMutation = useMutation({
        mutationFn: async (id: number) => {
    
          await apiRequest("DELETE", `/api/sport-results/${id}`);
        },
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: [user?.role === "student"
        ? `/api/sport-results/${user.id}`
        : `/api/sport-results-period/${periodFilter}`,],
          });
          toast({
            title: "Контрольное упражнение удалено",
            description: "Контрольное упражнение успешно удалено.",
          });
       
        },
        onError: (error) => {
          toast({
            title: "Ошибка",
            description: error.message || "Не удалось удалить контрольное упражнение",
            variant: "destructive",
          });
        },
      });

      // Handle form submission

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Контрольные упражнения</h2>
            <p className="text-gray-500">
              Просмотр и управление результатами контрольных упражнений
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск тестов..."
                className="pl-9 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Link href="/sport_results/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Записать контрольное упражнение
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Записи контрольных упражнений</CardTitle>
              <div className="flex gap-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Период</label>
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите период" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Выберите период</SelectItem>
                      {periods?.map((student) => {
                        if (!student?.periodId) return null; // Skip if no valid ID
                        return (
                          <SelectItem
                            key={student.periodId}
                            value={student.periodId.toString()}
                          >
                            {student.periodOfStudy}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          {periodFilter === "all" ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Выберите период
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Пожалуйста, выберите период из фильтров для просмотра записей.
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center py-16">
                    <CardContent>
                      {isLoadingResults ? (
                        <div className="flex justify-center items-center h-64">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <>
                          {(!filteredSportResults || filteredSportResults.length === 0) ? (
                            <div className="text-center py-12">
                              <p className="text-gray-500 mb-4">Не найдено записей тестов.</p>
                              <Link href="/sport_results/new">
                                <Button>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Записать новое контрольное упражнение 
                                </Button>
                              </Link>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  
                                    <th className="px-4 py-3">Студент</th>
                                    <th className="px-4 py-3">Период</th>
                                    <th className="px-4 py-3">Штрафные броски</th>
                                    <th className="px-4 py-3">Двухшажная техника</th>
                                    <th className="px-4 py-3">Техника быстрого ведения мяча</th>
                                    <th className="px-4 py-3">Передача мяча двумя руками над собой</th>
                                    <th className="px-4 py-3">Верхняя передача мяча в парах</th>
                                    <th className="px-4 py-3">Нижняя передача мяча в парах</th>
                                    <th className="px-4 py-3">Верхняя подача мяча через сетку (юноши).
                                                                  Верхняя, нижняя, боковая подача мяча через сетку (девушки)</th>
                                    <th className="px-4 py-3">Плавание 25 м</th>
                                    <th className="px-4 py-3">Плавание 50 м</th>
                                    <th className="px-4 py-3">Плавание 100 м</th>
                                    <th className="px-4 py-3">Бег 100 м</th>
                                    <th className="px-4 py-3">Бег 500/1000 м</th>
                                    <th className="px-4 py-3">Отжимания</th>
                                    <th className="px-4 py-3">Подтягивания</th>
                                    <th className="px-4 py-3">Планка</th>
                                    <th className="px-4 py-3">Прыжок в длину</th>
                                    <th className="px-4 py-3">Челночный бег 4x9 м</th>
                                    <th className="px-4 py-3">Поднимание туловища за 1 минуту</th>

                                    {/* <th className="px-4 py-3">
                              <div className="flex items-center">
                                Grade
                                <ArrowUpDown className="ml-2 h-3 w-3" />
                              </div>
                            </th>
                            <th className="px-4 py-3">Notes</th> */}
                                    <th className="px-4 py-3 text-right">Действия</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {filteredSportResults?.map((test) => (
                                    <tr key={test.sportResultId}>
                                      <td className="px-4 py-4 whitespace-nowrap font-medium">
                                        {user?.role === "student"
                                          ? user?.username
                                          : students.find((student) => student.userId === test.studentId)?.fullName || 'Unknown'}
                                      </td>
                                    
                                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                                        {periods.find((period) => period.periodId === test.periodId)?.periodOfStudy || '-'}
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap">
                                        {test.basketballFreethrow || '-'}
                                      </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                        {test.basketballDribble || '-'}
                                      </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                        {test.basketballLeading || '-'}
                                      </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                        {test.volleyballSoloPass || '-'}
                                      </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                        {test.volleyballUpperPass || '-'}
                                      </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                        {test.volleyballLowerPass || '-'}
                                      </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                        {test.volleyballServe || '-'}
                                      </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                        {test.swimming25m || '-'}
                                      </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                          {test.swimming50m || '-'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                          {test.swimming100m || '-'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                          {test.running100m || '-'}
                                        </td>
                                      <td className="px-4 py-4 whitespace-nowrap">
                                        {test.running500m1000m || '-'}
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap">
                                        {test.pushUps || '-'}
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap">
                                        {test.pullUps || '-'}
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap">
                                        {test.plank || '-'}
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap">
                                        {test.longJump || '-'}
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap">
                                        {test.shuttleRun49 || '-'}
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap">
                                        {test.sitUps1min || '-'}
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap text-right">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Действия</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => navigate(`/sport_results/edit/${test.sportResultId}`)}>
                                              <Pencil className="mr-2 h-4 w-4" />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() =>
                                                deleteSportResultMutation.mutate(test.sportResultId)
                                              }
                                            >
                                              <Trash className="mr-2 h-4 w-4" />
                                              Удалить
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </div>
                </>
              )}
        </Card>
      </div>
    </MainLayout>
  );
}
