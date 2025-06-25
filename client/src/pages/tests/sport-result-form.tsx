import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  TEST_TYPES,
  CONTROL_EXERCISE_TYPES,
  Period,
  SportResult,
  CONTROL_EXERCISE_TYPES_CAMEL,
} from "@shared/schema";
import MainLayout from "@/components/layout/main-layout";
import { useLocation, useParams } from "wouter";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { date } from "drizzle-orm/mysql-core";

interface UserRecord {
  studentId?: number;
  teacherId?: number;
}

interface StudentProfile {
  studentId: number;
  fullName: string;
}

interface Student {
  id: number;
  username: string;
  fullName?: string;
}

interface ResultData {
  studentId: number;
  basketballFreethrow?: number;
  basketballDribble?: number;
  basketballLeading?: number;
  volleyballSoloPass?: number;
  volleyballUpperPass?: number;
  volleyballLowerPass?: number;
  volleyballServe?: number;
  swimming25m?: number;
  swimming50m?: number;
  swimming100m?: number;
  running100m?: number;
  running500m1000m?: number;
  periodId: number;
}

// Form schema for test creation/editing
const testFormSchema = z.object({
  studentId: z.number(),
  periodId: z.number(),
  basketballFreethrow: z.number().optional(),
  basketballDribble: z.number().optional(),
  basketballLeading: z.number().optional(),
  volleyballSoloPass: z.number().optional(),
  volleyballUpperPass: z.number().optional(),
  volleyballLowerPass: z.number().optional(),
  volleyballServe: z.number().optional(),
  swimming25m: z.number().optional(),
  swimming50m: z.number().optional(),
  swimming100m: z.number().optional(),
  running100m: z.number().optional(),
  running500m1000m: z.number().optional(),
  // grade: z.string().optional(),
  // notes: z.string().optional(),
});
console.log(testFormSchema)

type TestFormValues = z.infer<typeof testFormSchema>;

// Функция преобразования времени в миллисекунды
function parseTimeToMs(value: string): number | undefined {
  if (!value) return undefined;
  // Ожидается формат мм.сс,ддд или мм.сс
  const [minPart, secPartRaw] = value.split(".");
  if (!minPart || !secPartRaw) return undefined;
  // Секунды могут быть с запятой (дробные)
  const secPart = secPartRaw.replace(",", ".");
  const minutes = parseInt(minPart, 10);
  const seconds = parseFloat(secPart);
  if (isNaN(minutes) || isNaN(seconds)) return undefined;
  return Math.round((minutes * 60 + seconds) * 1000);
}

export default function SportResultForm() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const isEdit = !!params.id;
  const testId = isEdit && params.id ? parseInt(params.id) : undefined;

  // Get search params to check if we're in grading mode
  const [searchParams] = useLocation();
  const isGrading = searchParams.includes("grade=true");

  // First get the user record to get the studentId
  const { data: userRecord } = useQuery<UserRecord>({
    queryKey: [`/api/users/${user?.id}/record`],
    enabled: user?.role === "student" && !!user?.id,
  });

  // Then fetch student profile using the studentId
  const { data: studentProfile } = useQuery<StudentProfile>({
    queryKey: [`/api/profile/student/${userRecord?.studentId}`],
    enabled: !!userRecord?.studentId,
  });

  const { data: periods = [], isLoading: isLoadingPeriods } = useQuery<
    Period[]
  >({
    queryKey: ["/api/periods"],
    enabled: user?.role !== "student",
  });

  // Fetch students for teacher/admin to select a student
  const { data: students = [], isLoading: isLoadingStudents } = useQuery<
    Student[]
  >({
    queryKey: ["/api/student/users"],
    enabled: user?.role !== "student",
  });

  // Fetch specific test data when editing
  const { data: testData, isLoading: isLoadingTest } = useQuery<ResultData>({
    queryKey: [`/api/sport-results-id/${testId}`],
    enabled: !!isEdit && !!testId,
  });
console.log(testData?.basketballFreethrow)
  // Setup form with default values
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      studentId: user?.role === "student" ? user.id : (testData?.studentId ?? 0),
      periodId: testData?.periodId ?? 0,
      basketballFreethrow: testData?.basketballFreethrow ?? 0,
      basketballDribble: testData?.basketballDribble ?? 0,
      basketballLeading: testData?.basketballLeading ?? 0,
      volleyballSoloPass: testData?.volleyballSoloPass ?? 0,
      volleyballUpperPass: testData?.volleyballUpperPass ?? 0,
      volleyballLowerPass: testData?.volleyballLowerPass ?? 0,
      volleyballServe: testData?.volleyballServe ?? 0,
      swimming25m: testData?.swimming25m ?? 0,
      swimming50m: testData?.swimming50m ?? 0,
      swimming100m: testData?.swimming100m ?? 0,
      running100m: testData?.running100m ?? 0,
      running500m1000m: testData?.running500m1000m ?? 0,
    },
  });

  // Update form when student profile or edit data is loaded
  useEffect(() => {
    if (user?.role === "student" && testData) {
      form.setValue("studentId", testData?.studentId);
    }

    if (isEdit && testData) {
      const testType = Object.keys(testData).find((key) =>
        [ ...CONTROL_EXERCISE_TYPES_CAMEL].includes(key as any)
      );
        console.log(testData)
      if (testType) {
        form.reset({
          studentId: user?.role === "student" ? user.id : (testData.studentId),
          periodId: testData.periodId,
        basketballFreethrow: testData?.basketballFreethrow ?? 0,
        basketballDribble: testData?.basketballDribble ?? 0,
        basketballLeading: testData?.basketballLeading ?? 0,
        volleyballSoloPass: testData?.volleyballSoloPass ?? 0,
        volleyballUpperPass: testData?.volleyballUpperPass ?? 0,
        volleyballLowerPass: testData?.volleyballLowerPass ?? 0,
        volleyballServe: testData?.volleyballServe ?? 0,
        swimming25m: testData?.swimming25m ?? 0,
        swimming50m: testData?.swimming50m ?? 0,
        swimming100m: testData?.swimming100m ?? 0,
        running100m: testData?.running100m ?? 0,
        running500m1000m: testData?.running500m1000m ?? 0,
        });
      }
    }
  }, [isEdit, testData, form, user?.role, studentProfile]);

  // All test types (physical tests + control exercises)
  const allTestTypes = [...TEST_TYPES, ...CONTROL_EXERCISE_TYPES];

  // Get formatted test type display name
  const formatTestType = (type: string) => {
    const ret = type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return ret;
  };
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

  // Create test mutation
  const createTestMutation = useMutation({
    mutationFn: async (data: TestFormValues) => {
      let studentId: number;
      console.log(data)
      if (user?.role === "student") {
        if (!studentProfile?.studentId) {
          throw new Error(
            "Профиль студента не найден. Пожалуйста, свяжитесь с администратором."
          );
        }
        studentId = studentProfile.studentId;
      } else {
        studentId = data.studentId;
      }

      if (!studentId) {
        throw new Error("Требуется ID студента");
      }

      // Create test data object
      const resultData: ResultData = {
        studentId: data.studentId,
        periodId: data.periodId,
        
      basketballFreethrow: data?.basketballFreethrow ?? 0,
      basketballDribble: data?.basketballDribble ?? 0,
      basketballLeading: data?.basketballLeading ?? 0,
      volleyballSoloPass: data?.volleyballSoloPass ?? 0,
      volleyballUpperPass: data?.volleyballUpperPass ?? 0,
      volleyballLowerPass: data?.volleyballLowerPass ?? 0,
      volleyballServe: data?.volleyballServe ?? 0,
      swimming25m: data?.swimming25m ?? 0,
      swimming50m: data?.swimming50m ?? 0,
      swimming100m: data?.swimming100m ?? 0,
      running100m: data?.running100m ?? 0,
      running500m1000m: data?.running500m1000m ?? 0,
      };

      await apiRequest("POST", "/api/sport-results", resultData);
    },
    onSuccess: () => {
      const studentId =
        user?.role === "student"
          ? user?.id
          : form.getValues("studentId");
      queryClient.invalidateQueries({
        queryKey: [`/api/sport-results/${studentId}`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sport-results"] });
      toast({
        title: "Тест записан",
        description: "Результат теста был успешно записан.",
      });
      navigate("/tests");
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Ошибка в записи результата теста",
        variant: "destructive",
      });
    },
  });

  // Update test mutation
  const updateTestMutation = useMutation({
    mutationFn: async (data: TestFormValues) => {
      let studentId: number;

      if (user?.role === "student") {
        if (!studentProfile?.studentId) {
          throw new Error("Профиль студента не найден");
        }
        studentId = studentProfile.studentId;
      } else {
        studentId = data.studentId;
      }

      if (!studentId) {
        throw new Error("Требуется ID студента");
      }

      const resultData: ResultData = {
        studentId: data.studentId,
        periodId: data.periodId,
        basketballFreethrow: data?.basketballFreethrow ?? 0,
        basketballDribble: data?.basketballDribble ?? 0,
        basketballLeading: data?.basketballLeading ?? 0,
        volleyballSoloPass: data?.volleyballSoloPass ?? 0,
        volleyballUpperPass: data?.volleyballUpperPass ?? 0,
        volleyballLowerPass: data?.volleyballLowerPass ?? 0,
        volleyballServe: data?.volleyballServe ?? 0,
        swimming25m: data?.swimming25m ?? 0,
        swimming50m: data?.swimming50m ?? 0,
        swimming100m: data?.swimming100m ?? 0,
        running100m: data?.running100m ?? 0,
        running500m1000m: data?.running500m1000m ?? 0,
      };

      await apiRequest("PUT", `/api/sport-results/${testId}`, resultData);
    },
    onSuccess: () => {
      const studentId =
        user?.role === "student"
          ? studentProfile?.studentId
          : form.getValues("studentId");
      queryClient.invalidateQueries({
        queryKey: [`/api/sport-results/${studentId}`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sport-results"] });
      toast({
        title: isGrading ? "Тест оценен" : "Тест обновлён",
        description: isGrading
          ? "Тест был успешно оценен."
          : "Тест был успешно обновлён.",
      });
      navigate("/tests");
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Ошибка обновления теста",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(data: TestFormValues) {
    // Клонируем данные, чтобы не мутировать оригинал
    const newData = { ...data };
    if (isEdit) {
      updateTestMutation.mutate(newData);
    } else {
      createTestMutation.mutate(newData);
    }
  }

  // Новый стейт для выбора категории
  const [category, setCategory] = useState<'physical' | 'sport'>('sport');

  if (isEdit && isLoadingTest && isLoadingStudents) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const pageTitle = isEdit
    ? isGrading
      ? "Выставить оценку теста"
      : "Изменить результаты теста"
    : "Записать новый тест";

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/tests")}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">{pageTitle}</h2>
            <p className="text-gray-500">
              {isEdit
                ? isGrading
                  ? "Выставить оценку данному тесту"
                  : "Обновить информацию о тесте"
                : "Записать результаты тестов или проб"}
            </p>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{pageTitle}</CardTitle>
            <CardDescription>
              {isEdit
                ? isGrading
                  ? "Выставить оценку данному тесту"
                  : "Обновить информацию о тесте"
                : "Записать результаты тестов или проб"}
            </CardDescription>
          </CardHeader>
          <Form {...form} >
            <form className="px-4"
              onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.log("FORM ERRORS:", errors);
              })}
            >
              {user?.role !== "student" && (
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        defaultValue={field.value.toString()}
                        disabled={isEdit}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите студента" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students?.map((student) => (
                            <SelectItem
                              key={student.id}
                              value={student.id.toString()}
                            >
                              {student.fullName || student.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Выберите студента для записи теста
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Период теперь после выбора категории */}
              <FormField 
                control={form.control}
                name="periodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Период</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                      disabled={isEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите студента" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {periods?.map((period) => (
                          <SelectItem
                            key={period.periodId}
                            value={period.periodId.toString()}
                          >
                            {period.periodOfStudy}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                    Выберите студента для записи теста
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Табличный ввод для контрольных упражнений */}
              {category === 'sport' && (
                <CardContent className="space-y-4 py-2">
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto border border-gray-200 text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-2 text-left">Название теста</th>
                          <th className="p-2 text-left">Результат</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Каждое поле с нужным форматом и названием */}
                        {[ 
                          { name: "Штрафные броски (кол-во попаданий из 5 попыток)", key: "basketballFreethrow", inputProps: { type: "number", min: 1, max: 5, step: 1 } },
                          { name: "Двухшажная техника (кол-во попаданий из 5 попыток)", key: "basketballDribble", inputProps: { type: "number", min: 1, max: 5, step: 1 } },
                          { name: "Техника быстрого ведения мяча, с", key: "basketballLeading", inputProps: { type: "number", step: 0.1, min: 0 } },
                          { name: "Передача мяча двумя руками над собой (кол-во раз)", key: "volleyballSoloPass", inputProps: { type: "number", step: 1, min: 1 } },
                          { name: "Верхняя передача мяча в парах (кол-во передач)", key: "volleyballUpperPass", inputProps: { type: "number", step: 1, min: 1 } },
                          { name: "Нижняя передача мяча в парах (кол-во передач)", key: "volleyballLowerPass", inputProps: { type: "number", step: 1, min: 1 } },
                          { name: "Верхняя подача мяча через сетку (юноши), Верхняя, нижняя, боковая подача мяча через сетку (девушки) (кол-во подач через сетку)", key: "volleyballServe", inputProps: { type: "number", min: 1, max: 5, step: 1 } },
                          { name: "Плавание 25 м, с", key: "swimming25m", inputProps: { type: "number", step: 0.1, min: 0 } },
                          { name: "Плавание 50 м, с", key: "swimming50m", inputProps: { type: "number", step: 0.1, min: 0 } },
                          { name: "Плавание 100 м", key: "swimming100m", inputProps: { type: "number", step: 0.1, min: 0 } },
                          { name: "Бег 100 м, с", key: "running100m", inputProps: { type: "number", step: 0.1, min: 0 } },
                          { name: "Бег 500 (девушки)/1000 м (юноши)", key: "running500m1000m", inputProps: { type: "number", step: 0.1, min: 0 } },
                        ].map((test) => (
                          <tr key={test.key} className="border-t border-gray-100">
                            <td className="p-2 font-medium">{test.name}</td>
                            <td className="p-2">
                              <FormField
                                control={form.control}
                                name={test.key as keyof TestFormValues}
                                render={({ field }) => (
                                  <Input
                                    {...test.inputProps}
                                    value={field.value ?? ""}
                                    onChange={(e) => {
                                      const inputValue = e.target.value;
                                      field.onChange(
                                        inputValue === ""
                                        ? String(inputValue)
                                        : Number(inputValue)
                                      );
                                    }}
                                  />
                                )}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
              {/* Здесь можно добавить аналогичный блок для физ. тестов, если потребуется */}

              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/tests")}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createTestMutation.isPending || updateTestMutation.isPending
                  }
                >
                  {createTestMutation.isPending ||
                  updateTestMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEdit
                        ? isGrading
                          ? "Сохранение оценки..."
                          : "Обновление..."
                        : "Сохранение..."}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEdit
                        ? isGrading
                          ? "Сохранить оценку"
                          : "Обновить тест"
                        : "Сохранить тест"}
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </MainLayout>
  );
}
