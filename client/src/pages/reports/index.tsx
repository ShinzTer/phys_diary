import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { Link, useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  FileText,
  BarChart,
  PieChart,
  Download,
  Calendar,
  Users,
} from "lucide-react";
import {
  TEST_TYPES,
  SAMPLE_TYPES,
  MEDICAL_GROUP_TYPES,
  PERIODS_OF_STUDY,
  Group,
  PhysicalTest,
  TEST_TYPES_CAMEL,
  Period,
  CONTROL_EXERCISE_TYPES_CAMEL,
} from "@shared/schema";
import { format, subDays } from "date-fns";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  CartesianGrid,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";

interface Faculty {
  id: number;
  name: string;
  facultyId?: number;
  faculty?: {
    facultyId: number;
  };
}


interface Student {
  userId: number;
  username: string;
  fullName?: string;
  medicalGroup?: string;
}


interface Sample {
  id: number;
  date?: string;
  value: string;
}

interface UserData {
  id: number;
  username: string;
  fullName?: string;
}

// Массив соответствия ключей и русских названий контрольных упражнений
const CONTROL_EXERCISE_LABELS = [
  { name: "Штрафные броски", key: "basketballFreethrow" },
  { name: "Двухшажная техника", key: "basketballDribble" },
  { name: "Техника быстрого ведения мяча", key: "basketballLeading" },
  { name: "Передача мяча двумя руками над собой", key: "volleyballSoloPass" },
  { name: "Верхняя передача мяча в парах", key: "volleyballUpperPass" },
  { name: "Нижняя передача мяча в парах", key: "volleyballLowerPass" },
  { name: "Верхняя подача мяча через сетку (юноши).\nВерхняя, нижняя, боковая подача мяча через сетку (девушки)", key: "volleyballServe" },
  { name: "Плавание 25 м", key: "swimming25m" },
  { name: "Плавание 50 м", key: "swimming50m" },
  { name: "Плавание 100 м", key: "swimming100m" },
  { name: "Бег 100 м", key: "running100m" },
  { name: "Бег 500 (девушки)\n1000 м (юноши)", key: "running500m1000m" },
];

export default function Reports() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [location] = useLocation();

  // Extract userId from URL query params if present
  const params = new URLSearchParams(
    location.includes("?") ? location.substring(location.indexOf("?")) : ""
  );
  const userIdFromUrl = params.get("userId");

  const [selectedFaculty, setSelectedFaculty] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedDateOfCreation, setSelectedDateOfCreation] = useState<string>("all");

  const [selectedUser, setSelectedUser] = useState<string>(
    userIdFromUrl || "all"
  );
  const [selectedDateRange, setSelectedDateRange] =
    useState<string>("semester");
  const [selectedReportType, setSelectedReportType] =
    useState<string>("performance");

  // Fetch faculties for dropdown
  const { data: faculties } = useQuery<Faculty[]>({
    queryKey: ["/api/faculties"],
  });

  // Fetch groups (filtered by faculty if selected)
  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups", selectedFaculty],
    queryFn: async () => {
      const url =
        selectedFaculty !== "all"
          ? `/api/groups?facultyId=${selectedFaculty}`
          : "/api/groups";

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Не удалось получить группы");
      return res.json();
    },
  });
  
  // Fetch students (filtered by group if selected)
  const { data: students = [], isLoading: isLoadingStudents } = useQuery<
    Student[]
  >({
    queryKey: ["/api/students"],
    enabled: user?.role !== "student",
  });

    const { data: periods = [], isLoading: isLoadingPeriods } = useQuery<
    Period[]
  >({
    queryKey: ["/api/periods"],
    enabled: user?.role !== "student",
  });
  // Fetch all tests and samples
  const { data: tests, isLoading: isLoadingTests } = useQuery<PhysicalTest[]>({
    queryKey: ["/api/physical-tests/", selectedUser],
    enabled: selectedUser !== "" && selectedUser !== "all",
    queryFn: async () => {
      const res = await fetch(`/api/physical-tests/${selectedUser}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Не удалось получить тесты");
      return res.json();
    },
  });


const filteredTests = tests?.filter(test => test.periodId === Number(selectedDateRange));

  const { data: samples, isLoading: isLoadingSamples } = useQuery<Sample[]>({
    queryKey: ["/api/samples", selectedUser],
    enabled: selectedUser !== "",
    queryFn: async () => {
      const res = await fetch(`/api/samples/${selectedUser}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Не удалось получить пробы");
      return res.json();
    },
  });

  // Get data for selected student
  const { data: userData } = useQuery<UserData>({
    queryKey: [`/api/profile/studen/${selectedUser}`],
    enabled: selectedUser !== "" && selectedUser !== "all",
  });

  // Добавляю запрос sport results для выбранного студента
  const { data: sportResults, isLoading: isLoadingSportResults } = useQuery<any[]>({
    queryKey: ["/api/sport-results", selectedUser],
    enabled: selectedUser !== "" && selectedUser !== "all",
    queryFn: async () => {
      const res = await fetch(`/api/sport-results/${selectedUser}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Не удалось получить контрольные упражнения");
      return res.json();
    },
  });

  const isLoading =
    isLoadingTests ||
    isLoadingSamples ||
    isLoadingSportResults ||
    (selectedUser !== "" && selectedUser !== "all" && !userData);

  // Format test type display name
  const formatTestType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatTestType2 = (type: string) => {
  return type.split('_').map((word, index) => {
    // Первое слово оставляем в lowercase, остальные с заглавной буквы
    if (index === 0) {
      return word.toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
};

  // Временная функция преобразования результата в оценку (1-10)
  function getScoreForExercise(key: string, value: any): number {
    if (value == null || value === "") return 0;
    // ВРЕМЕННО: чем меньше значение, тем выше оценка (для времени)
    // Для бросков/очков — наоборот
    // TODO: заменить на реальные таблицы
    const num = parseFloat(value);
    if (isNaN(num)) return 0;
    // Пример: для беговых/плавательных — меньше = лучше
    if (["swimming25m", "swimming50m", "swimming100m", "running100m", "running500m1000m"].includes(key)) {
      if (num <= 10) return 10;
      if (num <= 12) return 9;
      if (num <= 14) return 8;
      if (num <= 16) return 7;
      if (num <= 18) return 6;
      if (num <= 20) return 5;
      if (num <= 22) return 4;
      if (num <= 24) return 3;
      if (num <= 26) return 2;
      return 1;
    }
    // Для бросков и техники — больше = лучше
    return Math.max(1, Math.min(10, Math.round(num / 2)));
  }

  // Новый getPerformanceData для sport results
  const getPerformanceData = () => {
    if (!sportResults || sportResults.length === 0) return CONTROL_EXERCISE_LABELS.map(({ name }) => ({ name, value: 0 }));
    // Берём последний результат (или можно средний)
    const lastResult = sportResults[sportResults.length - 1];
    return CONTROL_EXERCISE_LABELS.map(({ name, key }) => {
      const value = lastResult?.[key] ?? null;
      return {
        name,
        value: getScoreForExercise(key, value),
      };
    });
  };

  // Generate medical group distribution data
  const getMedicalGroupData = () => {
    // Count students by medical group
    const counts = {
      basic: 0,
      preparatory: 0,
      special: 0,
    };

    students?.forEach((student) => {
      if (
        student.medicalGroup &&
        counts[student.medicalGroup as keyof typeof counts] !== undefined
      ) {
        counts[student.medicalGroup as keyof typeof counts]++;
      } else {
        counts.basic++; // Default to basic if not specified
      }
    });

    return [
      { name: "Основная", value: counts.basic },
      { name: "Подготовительная", value: counts.preparatory },
      { name: "Специальная", value: counts.special },
    ];
  };

  // Generate progress data based on tests
  const getProgressData = () => {
    if (!tests) return [];

    // Group by date (month/year) and count average performance
    const groupedByDate: Record<string, { count: number; total: number }> = {};

    tests.forEach((test) => {
      if (!test.date) return;

      // Format date as month/year
      const date = new Date(test.date);
      const dateKey = format(date, "MMM yyyy");

      // Convert test grade to numeric value if possible
      let score = 0;
      // if (test.grade) {
      //   if (["A", "EXCELLENT", "5"].includes(test.grade.toUpperCase()))
      //     score = 5;
      //   else if (["B", "GOOD", "4"].includes(test.grade.toUpperCase()))
      //     score = 4;
      //   else if (["C", "SATISFACTORY", "3"].includes(test.grade.toUpperCase()))
      //     score = 3;
      //   else if (["D", "POOR", "2"].includes(test.grade.toUpperCase()))
      //     score = 2;
      //   else score = 3; // Default score
      // } else {
      //   score = 3; // Default for ungraded tests
      // }

      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = { count: 0, total: 0 };
      }

      groupedByDate[dateKey].count++;
      groupedByDate[dateKey].total += score;
    });

    // Convert to array and calculate averages
    return Object.entries(groupedByDate)
      .map(([date, data]) => ({
        date,
        performance: Math.round((data.total / data.count) * 20), // Scale to percentage (1-5 -> 20-100)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Generate mock data for sample trends
  const getSampleTrendData = () => {
    if (!samples || samples.length === 0) {
      // Generate some placeholder data
      return Array.from({ length: 6 }, (_, i) => ({
        date: format(subDays(new Date(), 30 * (5 - i)), "MMM yyyy"),
        value: Math.floor(Math.random() * 20) + 70, // Random value between 70-90
      }));
    }

    // Group samples by date for the selected sample type
    const samplesByDate: Record<string, number[]> = {};
    samples.forEach((sample) => {
      if (!sample.date) return;

      // Format date as month/year
      const date = new Date(sample.date);
      const dateKey = format(date, "MMM yyyy");

      if (!samplesByDate[dateKey]) {
        samplesByDate[dateKey] = [];
      }

      // Try to extract numeric value
      const numericValue = parseFloat(sample.value.replace(/[^\d.-]/g, ""));
      if (!isNaN(numericValue)) {
        samplesByDate[dateKey].push(numericValue);
      }
    });

    // Convert to array and calculate averages
    return Object.entries(samplesByDate)
      .map(([date, values]) => {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        return {
          date,
          value: Math.round(avg * 100) / 100, // Round to 2 decimal places
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // For the pie chart colors
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  // Select a student and generate report
  const generateReport = () => {
    if (selectedUser) {
      // This would typically generate a PDF or detailed report
      // For now we'll just show an alert
      alert(`Report generated for user ID: ${selectedUser}`);
    } else {
      alert("Please select a student to generate a report");
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Отчеты</h2>
            <p className="text-gray-500">
              Генерируйте и просматривайте отчеты о прогрессе студентов
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={generateReport} disabled={!selectedUser}>
              <FileText className="mr-2 h-4 w-4" />
              Сгенерировать отчет
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Фильтры отчета</CardTitle>
              <CardDescription>Выберите критерии для вашего отчета</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Факультет</label>
                <Select
                  value={selectedFaculty}
                  onValueChange={setSelectedFaculty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Все факультеты" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все факультеты</SelectItem>
                    {faculties?.map((faculty) => {
                      // Handle both possible faculty ID structures and ensure we have a valid ID
                      const facultyId =
                        faculty.faculty?.facultyId ||
                        faculty.facultyId ||
                        faculty.id;
                      if (!facultyId) return null; // Skip if no valid ID
                      return (
                        <SelectItem
                          key={facultyId}
                          value={facultyId.toString()}
                        >
                          {faculty.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Группа</label>
                <Select
                  value={selectedGroup}
                  onValueChange={(groupId) => {
                    setSelectedGroup(groupId);

                    const selected = groups?.find(
                      (g) => g.groupId.toString() === groupId
                    );
                    if (selected) {
                      setSelectedDateOfCreation(selected.dateOfCreation); // или selected.createdAt
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Все группы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все группы</SelectItem>
                    {groups?.map((group) => {
                      //.data
                      if (!group?.groupId) return null; // Skip if no valid ID
                      return (
                        <SelectItem
                          key={group.groupId}
                          value={group.groupId.toString()}
                        >
                          {group.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Студент</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите студента" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Выберите студента</SelectItem>
                    {students?.map((student) => {
                      if (!student?.userId) return null; // Skip if no valid ID
                      return (
                        <SelectItem
                          key={student.userId}
                          value={student.userId.toString()}
                        >
                          {student.fullName || student.username}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Период</label>
                <Select
                  value={selectedDateRange}
                  onValueChange={setSelectedDateRange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите период" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem value={String(period.periodId)}>
                        {formatTestType(period.periodOfStudy)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Тип отчета</label>
                <Select
                  value={selectedReportType}
                  onValueChange={setSelectedReportType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип отчета" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">
                      Анализ производительности
                    </SelectItem>
                    <SelectItem value="progress">Прогресс по времени</SelectItem>
                    <SelectItem value="samples">Физические измерения</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant="outline"
                onClick={generateReport}
                disabled={!selectedUser}
              >
                <Download className="mr-2 h-4 w-4" />
                Экспортировать как PDF
              </Button>
            </CardFooter>
          </Card>

          {/* Report Content */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>
                {selectedUser && userData ? (
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    {userData.fullName || userData.username}
                    <span className="ml-2 text-sm text-gray-500">
                      (ID: {userData.id})
                    </span>
                  </div>
                ) : (
                  "Report Results"
                )}
              </CardTitle>
              <CardDescription>
                {selectedReportType === "performance" &&
                  "Test performance analysis across different exercises"}
                {selectedReportType === "progress" &&
                  "Student progress over time"}
                {selectedReportType === "samples" &&
                  "Physical measurement trends"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {!selectedUser || selectedUser === "all" ? (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Выберите студента
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Пожалуйста, выберите студента из 
                        панели фильтров для генерации отчета.
                      </p>
                    </div>
                  ) : (
                    <>
                      {selectedReportType === "performance" && (
                        <div>
                          <h3 className="text-lg font-medium mb-4">
                            Производительность по контрольным упражнениям
                          </h3>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <ReBarChart
                                data={getPerformanceData()}
                                margin={{
                                  top: 5,
                                  right: 30,
                                  left: 20,
                                  bottom: 5,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 10]} />
                                <Tooltip />
                                <Legend />
                                <Bar
                                  dataKey="value"
                                  name="Оценка (1-10)"
                                  fill="#1565C0"
                                />
                              </ReBarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="mt-6">
                            <h4 className="font-medium mb-2">Сводка</h4>
                            <p className="text-gray-600">
                              Этот график показывает оценки студента по контрольным упражнениям (1 — худший, 10 — лучший результат). Таблицы соответствия будут настроены позже.
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedReportType === "progress" && (
                        <div>
                          <h3 className="text-lg font-medium mb-4">
                            Прогресс по времени
                          </h3>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={getProgressData()}
                                margin={{
                                  top: 10,
                                  right: 30,
                                  left: 0,
                                  bottom: 0,
                                }}
                              >
                                <defs>
                                  <linearGradient
                                    id="colorPerformance"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="5%"
                                      stopColor="#1565C0"
                                      stopOpacity={0.8}
                                    />
                                    <stop
                                      offset="95%"
                                      stopColor="#1565C0"
                                      stopOpacity={0.1}
                                    />
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="date" />
                                <YAxis domain={[0, 100]} />
                                <CartesianGrid strokeDasharray="3 3" />
                                <Tooltip />
                                <Area
                                  type="monotone"
                                  dataKey="performance"
                                  stroke="#1565C0"
                                  fillOpacity={1}
                                  fill="url(#colorPerformance)"
                                  name="Производительность"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="mt-6">
                            <h4 className="font-medium mb-2">
                              Анализ прогресса
                            </h4>
                            <p className="text-gray-600">
                              Этот график отслеживает прогресс студента
                              по разным физическим тестам. Более высокие оценки
                              указывают на лучшую производительность по сравнению
                              со стандартами для возраста и пола студента.
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedReportType === "samples" && (
                        <div>
                          <h3 className="text-lg font-medium mb-4">
                            Тренды физических измерений
                          </h3>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={getSampleTrendData()}
                                margin={{
                                  top: 10,
                                  right: 30,
                                  left: 0,
                                  bottom: 0,
                                }}
                              >
                                <defs>
                                  <linearGradient
                                    id="colorValue"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="5%"
                                      stopColor="#4CAF50"
                                      stopOpacity={0.8}
                                    />
                                    <stop
                                      offset="95%"
                                      stopColor="#4CAF50"
                                      stopOpacity={0.1}
                                    />
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="date" />
                                <YAxis />
                                <CartesianGrid strokeDasharray="3 3" />
                                <Tooltip />
                                <Area
                                  type="monotone"
                                  dataKey="value"
                                  stroke="#4CAF50"
                                  fillOpacity={1}
                                  fill="url(#colorValue)"
                                  name="Значение измерения"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="mt-6">
                            <h4 className="font-medium mb-2">
                              Анализ измерений
                            </h4>
                            <p className="text-gray-600">
                              Этот график показывает тренды в физических измерениях
                              во времени, помогая отслеживать рост, уровни
                              физической подготовки и показатели здоровья.
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
