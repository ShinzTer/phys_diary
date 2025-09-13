import { useState, useRef } from "react";
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
  LabelList,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  { name: "Штрафные броски", shortName: "Штр. броски", key: "basketballFreethrow" },
  { name: "Двухшажная техника", shortName: "Двухшажная", key: "basketballDribble" },
  { name: "Техника быстрого ведения мяча", shortName: "Быстрое ведение", key: "basketballLeading" },
  { name: "Передача мяча двумя руками над собой", shortName: "Передача над собой", key: "volleyballSoloPass" },
  { name: "Верхняя передача мяча в парах", shortName: "Верх. передача", key: "volleyballUpperPass" },
  { name: "Нижняя передача мяча в парах", shortName: "Ниж. передача", key: "volleyballLowerPass" },
  { name: "Верхняя подача мяча через сетку (юноши).\nВерхняя, нижняя, боковая подача мяча через сетку (девушки)", shortName: "Подача через сетку", key: "volleyballServe" },
  { name: "Плавание 25 м", shortName: "Плав. 25м", key: "swimming25m" },
  { name: "Плавание 50 м", shortName: "Плав. 50м", key: "swimming50m" },
  { name: "Плавание 100 м", shortName: "Плав. 100м", key: "swimming100m" },
  { name: "Бег 100 м", shortName: "Бег 100м", key: "running100m" },
  { name: "Бег 500 (девушки)\n1000 м (юноши)", shortName: "Бег 500/1000м", key: "running500m1000m" },
  { name: "Отжимания", shortName: "Отжимания", key: "pushUps" },
  { name: "Подтягивания", shortName: "Подтягивания", key: "pullUps" },
  { name: "Планка", shortName: "Планка", key: "plank" },
  { name: "Прыжок в длину", shortName: "Прыжок в длину", key: "longJump" },
  { name: "Челночный бег 4x9 м", shortName: "Челночный бег", key: "shuttleRun49" },
  { name: "Поднимание туловища за 1 минуту", shortName: "Поднимание туловища", key: "sitUps1min" },
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
  
  // Fetch students (filtered by group and faculty if selected)
  const { data: students = [], isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students", selectedFaculty, selectedGroup],
    enabled: user?.role !== "student",
    queryFn: async () => {
      let url = "/api/students";
      if (selectedGroup !== "all") {
        url += `?groupId=${selectedGroup}`;
      } else if (selectedFaculty !== "all") {
        url += `?facultyId=${selectedFaculty}`;
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Не удалось получить студентов");
      return res.json();
    },
  });

    const { data: periods = [], isLoading: isLoadingPeriods } = useQuery<
    Period[]
  >({
    queryKey: ["/api/periods"],
    enabled: user?.role !== "student",
  });

  // Get data for selected student
  const { data: userData } = useQuery<UserData>({
    queryKey: [`/api/profile/student/${selectedUser}`],
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

  // const isLoading =
  //   isLoadingSportResults ||
  //   (selectedUser !== "" && selectedUser !== "all" && !userData);

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

  // Функция преобразования результата в оценку (1-10) с отдельными нормами для каждого упражнения
  function getScoreForExercise(key: string, value: any): number {
    if (value == null || value === "") return 0;
    
    const num = parseFloat(value);
    if (isNaN(num)) return 0;
    
    // Штрафные броски, двухшажная техника, подачи через сетку - 10 за значение 5; 7 за 4; 5 за 3; 3 за 2; 1 за 1
    if (["basketballFreethrow", "basketballDribble", "volleyballServe"].includes(key)) {
      if (num >= 5) return 10;
      if (num >= 4) return 7;
      if (num >= 3) return 5;
      if (num >= 2) return 3;
      return 1;
    }
    
    // Верхняя и нижняя передача - 10 за 26 и 1 за 6 (шаг для каждой оценки - 2)
    if (["volleyballUpperPass", "volleyballLowerPass"].includes(key)) {
      if (num >= 26) return 10;
      if (num >= 24) return 9;
      if (num >= 22) return 8;
      if (num >= 20) return 7;
      if (num >= 18) return 6;
      if (num >= 16) return 5;
      if (num >= 14) return 4;
      if (num >= 12) return 3;
      if (num >= 10) return 2;
      return 1;
    }
    
    // Плавание 25 м - 10 за 18, 1 за 31.5 (шаг для оценки - 1.5)
    if (key === "swimming25m") {
      if (num <= 18) return 10;
      if (num <= 19.5) return 9;
      if (num <= 21) return 8;
      if (num <= 22.5) return 7;
      if (num <= 24) return 6;
      if (num <= 25.5) return 5;
      if (num <= 27) return 4;
      if (num <= 28.5) return 3;
      if (num <= 30) return 2;
      return 1;
    }
    
    // Плавание 50 м - 10 за 35, 1 за 70 (с равномерным шагом оценки)
    if (key === "swimming50m") {
      if (num <= 35) return 10;
      if (num <= 38.9) return 9;
      if (num <= 42.8) return 8;
      if (num <= 46.7) return 7;
      if (num <= 50.6) return 6;
      if (num <= 54.5) return 5;
      if (num <= 58.4) return 4;
      if (num <= 62.3) return 3;
      if (num <= 66.2) return 2;
      return 1;
    }
    
    // Плавание 100 м - 10 за 105, 1 за 190 (с равномерным шагом оценки)
    if (key === "swimming100m") {
      if (num <= 105) return 10;
      if (num <= 114.4) return 9;
      if (num <= 123.8) return 8;
      if (num <= 133.2) return 7;
      if (num <= 142.6) return 6;
      if (num <= 152) return 5;
      if (num <= 161.4) return 4;
      if (num <= 170.8) return 3;
      if (num <= 180.2) return 2;
      return 1;
    }
    
    // Бег на 100 м - 10 за 13, 1 за 15 (с шагом в 0.2)
    if (key === "running100m") {
      if (num <= 13) return 10;
      if (num <= 13.2) return 9;
      if (num <= 13.4) return 8;
      if (num <= 13.6) return 7;
      if (num <= 13.8) return 6;
      if (num <= 14) return 5;
      if (num <= 14.2) return 4;
      if (num <= 14.4) return 3;
      if (num <= 14.6) return 2;
      return 1;
    }
    
    // Бег на 500/1000 м - 10 за 215, 1 за 345 (с равномерным шагом)
    if (key === "running500m1000m") {
      if (num <= 215) return 10;
      if (num <= 229.4) return 9;
      if (num <= 243.8) return 8;
      if (num <= 258.2) return 7;
      if (num <= 272.6) return 6;
      if (num <= 287) return 5;
      if (num <= 301.4) return 4;
      if (num <= 315.8) return 3;
      if (num <= 330.2) return 2;
      return 1;
    }
    if (key === "pushUps") {
      if (num >= 42) return 10;
      if (num >= 40) return 9;
      if (num >= 37) return 8;
      if (num >= 33) return 7;
      if (num >= 30) return 6;
      if (num >= 27) return 5;
      if (num >= 24) return 4;
      if (num >= 20) return 3;
      if (num >= 15) return 2;
      return 1;
    }
    if (key === "pullUps") {
      if (num >= 17) return 10;
      if (num >= 14) return 9;
      if (num >= 11) return 8;
      if (num >= 8) return 7;
      if (num >= 7) return 6;
      if (num >= 6) return 5;
      if (num >= 5) return 4;
      if (num >= 4) return 3;
      if (num >= 3) return 2;
      return 1;
    }
    if (key === "plank") {
      if (num >= 180) return 10;
      if (num >= 165) return 9;
      if (num >= 150) return 8;
      if (num >= 135) return 7;
      if (num >= 120) return 6;
      if (num >= 110) return 5;
      if (num >= 80) return 4;
      if (num >= 60) return 3;
      if (num >= 45) return 2;
      return 1;
    }
    if (key === "longJump") {
      if (num >= 260) return 10;
      if (num >= 250) return 9;
      if (num >= 245) return 8;
      if (num >= 240) return 7;
      if (num >= 235) return 6;
      if (num >= 230) return 5;
      if (num >= 225) return 4;
      if (num >= 220) return 3;
      if (num >= 215) return 2;
      return 1;
    }
    if (key === "shuttleRun49") {
      if (num <= 8.6) return 10;
      if (num <= 8.8) return 9;
      if (num <= 8.9) return 8;
      if (num <= 9.0) return 7;
      if (num <= 9.1) return 6;
      if (num <= 9.3) return 5;
      if (num <= 9.5) return 4;
      if (num <= 9.7) return 3;
      if (num <= 9.9) return 2;
      return 1;
    }
    if (key === "sitUps1min") {
      if (num >= 57) return 10;
      if (num >= 55) return 9;
      if (num >= 53) return 8;
      if (num >= 52) return 7;
      if (num >= 50) return 6;
      if (num >= 47) return 5;
      if (num >= 44) return 4;
      if (num >= 41) return 3;
      if (num >= 38) return 2;
      return 1;
    }
    // Для остальных упражнений (передача мяча двумя руками над собой, техника быстрого ведения мяча)
    // используем старую логику - больше = лучше
    return Math.max(1, Math.min(10, Math.round(num / 2)));
  }

  // Новый getPerformanceData для sport results
  const getPerformanceData = () => {
    if (!sportResults || sportResults.length === 0)
      return CONTROL_EXERCISE_LABELS.map(({ name, shortName }) => ({ name, shortName, value: 0 }));

    // Фильтруем по выбранному периоду
    const filteredSportResults = sportResults.filter(
      (result) => result.periodId === Number(selectedDateRange)
    );
    if (!filteredSportResults.length)
      return CONTROL_EXERCISE_LABELS.map(({ name, shortName }) => ({ name, shortName, value: 0 }));

    const lastResult = filteredSportResults[filteredSportResults.length - 1];
    return CONTROL_EXERCISE_LABELS.map(({ name, shortName, key }) => {
      const value = lastResult?.[key] ?? null;
      return {
        name,
        shortName,
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

  const reportRef = useRef<HTMLDivElement>(null);

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("report.pdf");
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
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant="outline"
                onClick={exportToPDF}
                disabled={!selectedUser}
              >
                <Download className="mr-2 h-4 w-4" />
                Экспортировать как PDF
              </Button>
            </CardFooter>
          </Card>

          {/* Report Content */}
          <Card className="lg:col-span-3">
            <div ref={reportRef}>
              <CardHeader>
                <CardTitle>
                  {selectedUser && userData ? (
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-primary" />
                      {userData.fullName || userData.username}
                    </div>
                  ) : (
                    "Результаты отчета"
                  )}
                </CardTitle>
                <CardDescription>
                  Аналитика результатов тестов и контрольных упражнений
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                      <div>
                        <h3 className="text-lg font-medium mb-4">
                          Производительность по контрольным упражнениям
                        </h3>
                        <div className="w-full h-96">
                          <ResponsiveContainer width="100%" height="100%" minWidth={700}>
                            <ReBarChart
                              data={getPerformanceData()}
                              margin={{
                                top: 20,
                                right: 40,
                                left: 20,
                                bottom: 60,
                              }}
                              barCategoryGap="20%"
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="shortName"
                                angle={-45}
                                textAnchor="end"
                                interval={0}
                                height={90}
                                dy={20}
                              />
                              <YAxis domain={[0, 10]} />
                              <Tooltip />
                              <Legend verticalAlign="top" height={36} />
                              <Bar
                                dataKey="value"
                                name="Оценка (1-10)"
                                fill="#1565C0"
                                maxBarSize={40}
                              >
                                <LabelList dataKey="value" position="top" fontSize={16} fill="#222" />
                              </Bar>
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
                  </>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
