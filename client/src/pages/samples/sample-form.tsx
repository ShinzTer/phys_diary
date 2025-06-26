import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Period,
  period,
  PhysicalState,
  SAMPLE_TYPES,
  SAMPLE_TYPES_CAMEL,
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
import { or } from "drizzle-orm";

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

interface SampleData {
  studentId: number;
  date: string;
  height: number;
  weight: number;
  ketleIndex: number;
  chestCircumference: string;
  waistCircumference: number;
  posture: string;
  vitalCapacity: number;
  handStrength: string;
  orthostaticTest: number;
  shtangeTest: number;
  genchiTest: number;
  martineTest: string;
  heartRate: number;
  bloodPressure: number;
  pulsePressure: string;
  periodId: number;
}

// Form schema for sample creation/editing
const sampleFormSchema = z.object({
  studentId: z.number(),
  date: z.string(),
  height: z.number().optional(),
  weight: z.number().optional(),
  ketleIndex: z.number().optional(),
  chestCircumference: z.string().optional(),
  waistCircumference: z.number().optional(),
  posture: z.string().optional(),
  vitalCapacity: z.number().optional(),
  handStrength: z.string().optional(),
  orthostaticTest: z.number().optional(),
  shtangeTest: z.number().optional(),
  genchiTest: z.number().optional(),
  martineTest: z.string().optional(),
  heartRate: z.number().optional(),
  bloodPressure: z.number().optional(),
  pulsePressure: z.string().optional(),
  periodId: z.number(),
});

type SampleFormValues = z.infer<typeof sampleFormSchema>;

export default function SampleForm() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const isEdit = !!params.id;
  const sampleId = isEdit && params.id ? parseInt(params.id) : undefined;

  // First get the user record to get the studentId
  const { data: userRecord } = useQuery<any>({
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

  // Fetch specific sample data when editing
  const { data: sampleData, isLoading: isLoadingSample } = useQuery<SampleData>({
      queryKey: [`/api/physical-states-by-id/${sampleId}`],
      enabled: !!isEdit && !!sampleId,
    });

  // Setup form with default values
  const form = useForm<SampleFormValues>({
    resolver: zodResolver(sampleFormSchema),
    defaultValues: {
      studentId: user?.role === "student" ? user.id || 0 : 0,
      date: new Date().toISOString().split("T")[0],
      height: sampleData?.height ?? 0,
      weight: sampleData?.weight ?? 0,
      ketleIndex: sampleData?.ketleIndex ?? 0,
      chestCircumference: sampleData?.chestCircumference ?? "0",
      waistCircumference: sampleData?.waistCircumference ?? 0,
      posture: sampleData?.posture ?? "",
      vitalCapacity: sampleData?.vitalCapacity ?? 0,
      handStrength: sampleData?.handStrength ?? "0",
      orthostaticTest: sampleData?.orthostaticTest ?? 0,
      shtangeTest: sampleData?.shtangeTest ?? 0,
      genchiTest: sampleData?.genchiTest ?? 0,
      martineTest: sampleData?.martineTest ?? "0",
      heartRate: sampleData?.heartRate ?? 0,
      bloodPressure: sampleData?.bloodPressure ?? 0,
      pulsePressure: sampleData?.pulsePressure ?? "0",
      periodId: sampleData?.periodId ?? 0,
    },
  });

  // Update form when student profile or edit data is loaded
  useEffect(() => {
    if (user?.role === "student" && sampleData) {
      form.setValue("studentId", sampleData?.studentId);
    }

    if (isEdit && sampleData) {
      const testType = Object.keys(sampleData).find((key) =>
        [...SAMPLE_TYPES_CAMEL].includes(key as any)
      );

      if (testType) {
        form.reset({
          studentId: user?.role === "student" ? user.id : (sampleData.studentId),
          date: new Date().toISOString().split("T")[0],
          height: sampleData.height ?? 0,
          weight: sampleData.weight ?? 0,
          ketleIndex: sampleData.ketleIndex ?? 0,
          chestCircumference: sampleData.chestCircumference ?? "0",
          waistCircumference: sampleData.waistCircumference ?? 0,
          posture: sampleData.posture ?? "",
          vitalCapacity: sampleData.vitalCapacity ?? 0,
          handStrength: sampleData.handStrength ?? "0",
          orthostaticTest: sampleData.orthostaticTest ?? 0,
          shtangeTest: sampleData.shtangeTest ?? 0,
          genchiTest: sampleData.genchiTest ?? 0,
          martineTest: sampleData.martineTest ?? "0",
          heartRate: sampleData.heartRate ?? 0,
          bloodPressure: sampleData.bloodPressure ?? 0,
          pulsePressure: sampleData.pulsePressure ?? "0",
        });
      }
    }
  }, [isEdit, sampleData, form, user?.role, studentProfile]);

  // Get formatted sample type display name
  const formatSampleType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Create sample mutation
  const createSampleMutation = useMutation({
    mutationFn: async (data: SampleFormValues) => {
      let studentId: number;
      console.log(data)
      if (user?.role === "student") {
        if (!studentProfile?.studentId) {
          throw new Error(
            "Профиль студента не найден. Обратитесь к администратору."
          );
        }
        studentId = studentProfile.studentId;
      } else {
        studentId = data.studentId;
      }

      if (!studentId) {
        throw new Error("Требуется ID студента");
      }

      // Create sample data object
      const sampleData: SampleData = {
        studentId: user?.role === "student" ? user.id || 0 : data.studentId,
        date: new Date().toISOString().split("T")[0],
        height: data.height ?? 0,
        weight: data.weight ?? 0,
        ketleIndex: data.ketleIndex ?? 0,
        chestCircumference: data.chestCircumference ?? "0",
        waistCircumference: data.waistCircumference ?? 0,
        posture: data.posture ?? "",
        vitalCapacity: data.vitalCapacity ?? 0,
        handStrength: data.handStrength ?? "0",
        orthostaticTest: data.orthostaticTest ?? 0,
        shtangeTest: data.shtangeTest ?? 0,
        genchiTest: data.genchiTest ?? 0,
        martineTest: data.martineTest ?? "0",
        heartRate: data.heartRate ?? 0,
        bloodPressure: data.bloodPressure ?? 0,
        pulsePressure: data.pulsePressure ?? "0",
        periodId: data.periodId,
      };
      await apiRequest("POST", "/api/physical-states", sampleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/physical-states/${user?.id || user?.id}`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/physical-states"] });
      toast({
        title: "Проба записана",
        description: "Ваше физическое измерение успешно записано.",
      });
      navigate("/samples");
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось записать пробу",
        variant: "destructive",
      });
    },
  });

  // Update sample mutation
  const updateSampleMutation = useMutation({
    mutationFn: async (data: SampleFormValues) => {
      let studentId: number;
   console.log(studentProfile)
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

      const sampleData: SampleData = {
        studentId: user?.role === "student" ? user.id || 0 : data.studentId,
        date: new Date().toISOString().split("T")[0],
        height: data.height ?? 0,
        weight: data.weight ?? 0,
        ketleIndex: data.ketleIndex ?? 0,
        chestCircumference: data.chestCircumference ?? "0",
        waistCircumference: data.waistCircumference ?? 0,
        posture: data.posture ?? "",
        vitalCapacity: data.vitalCapacity ?? 0,
        handStrength: data.handStrength ?? "0",
        orthostaticTest: data.orthostaticTest ?? 0,
        shtangeTest: data.shtangeTest ?? 0,
        genchiTest: data.genchiTest ?? 0,
        martineTest: data.martineTest ?? "0",
        heartRate: data.heartRate ?? 0,
        bloodPressure: data.bloodPressure ?? 0,
        pulsePressure: data.pulsePressure ?? "0",
        periodId: data.periodId,
      };

      await apiRequest("PUT", `/api/physical-states/${sampleId}`, sampleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/physical-states/${user?.id || user?.id}`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/physical-states"] });
      toast({
        title: "Проба обновлена",
        description: "Физическое измерение успешно обновлено.",
      });
      navigate("/samples");
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить пробу",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(data: SampleFormValues) {
    if (isEdit) {
      updateSampleMutation.mutate(data);
    } else {
      createSampleMutation.mutate(data);
    }
  }

  if (isEdit && isLoadingSample) {
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
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/samples")}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">
              {isEdit ? "Редактировать пробу" : "Записать новую пробу"}
            </h2>
            <p className="text-gray-500">
              {isEdit
                ? "Обновить информацию о физическом измерении"
                : "Записать новое физическое измерение или показатель здоровья"}
            </p>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {isEdit ? "Редактировать пробу" : "Записать новую пробу"}
            </CardTitle>
            <CardDescription>
              {isEdit
                ? "Внесите изменения в запись пробы"
                : "Заполните детали для нового физического измерения"}
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                {/* Student selection (for teachers/admins only) */}
                {user?.role !== "student" && (
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Студент</FormLabel>
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
                          Выберите студента, для которого записывается это
                          измерение
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="periodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Период обучения</FormLabel>
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
                      <FormDescription className="py-2">
                        Выберите студента для записи результатов теста
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <CardContent className="space-y-4 py-2">
                  {/* Табличный ввод */}
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto border border-gray-200 text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-2 text-left">Название теста</th>
                          <th className="p-2 text-left">Результат</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: "Рост", key: "height" },
                          { name: "Вес", key: "weight" },
                          {
                            name: "Весоростовой индекс Кетле",
                            key: "ketleIndex",
                          },
                          {
                            name: "Окружность грудной клетки",
                            key: "chestCircumference",
                          },
                          {
                            name: "Окружность талии",
                            key: "waistCircumference",
                          },
                          { name: "Осанка", key: "posture" },
                          {
                            name: "Жизненная емкость легких",
                            key: "vitalCapacity",
                          },
                          { name: "Сила кисти", key: "handStrength" },
                          {
                            name: "Ортостатическая проба",
                            key: "orthostaticTest",
                          },
                          { name: "Проба Штанге", key: "shtangeTest" },
                          { name: "Проба Генчи", key: "genchiTest" },
                            { name: "Проба Мартине-Кушелевского", key: "martineTest" },
                          { name: "Частота сердечных сокращений", key: "heartRate" },
                          { name: "Артериальное давление", key: "bloodPressure" },
                            { name: "Пульсовое давление", key: "pulsePressure" },
                      ].map((test) => (
                        <tr key={test.key} className="border-t border-gray-100">
                          <td className="p-2 font-medium">{test.name}</td>
                          <td className="p-2">
                            <FormField
                              control={form.control}
                              name={test.key as keyof SampleFormValues}
                              render={({ field }) => (
                                <Input
                                  type="number"
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const inputValue = e.target.value;
                                    field.onChange(
                                      inputValue === ""
                                        ? inputValue
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
                

              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/samples")}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createSampleMutation.isPending ||
                    updateSampleMutation.isPending
                  }
                >
                  {createSampleMutation.isPending ||
                  updateSampleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEdit ? "Обновление..." : "Сохранение..."}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEdit ? "Обновить пробу" : "Сохранить пробу"}
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
