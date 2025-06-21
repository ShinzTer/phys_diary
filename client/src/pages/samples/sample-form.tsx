import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SAMPLE_TYPES } from "@shared/schema";
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

interface Student {
  id: number;
  username: string;
  fullName?: string;
}

interface SampleData {
  studentId: number;
  date: string;
  notes: string | null;
  [key: string]: any; // For dynamic sample type fields
}

// Form schema for sample creation/editing
const sampleFormSchema = z.object({
  userId: z.number(),
  sampleType: z.string().min(1, "Sample type is required"),
  value: z.string().min(1, "Value is required"),
  notes: z.string().optional(),
});

type SampleFormValues = z.infer<typeof sampleFormSchema>;

export default function SampleForm() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const isEdit = !!params.id;
  const sampleId = isEdit && params.id ? parseInt(params.id) : undefined;

  // Fetch students for teacher/admin to select a student
  const { data: students = [], isLoading: isLoadingStudents } = useQuery<
    Student[]
  >({
    queryKey: ["/api/student/users"],
    enabled: user?.role !== "student",
  });

  // Fetch specific sample data when editing
  const { data: sampleData, isLoading: isLoadingSample } = useQuery<SampleData>(
    {
      queryKey: [`/api/physical-states/${sampleId}`],
      enabled: !!isEdit && !!sampleId,
    }
  );

  // Setup form with default values
  const form = useForm<SampleFormValues>({
    resolver: zodResolver(sampleFormSchema),
    defaultValues: {
      userId: user?.role === "student" ? user.id || 0 : 0,
      sampleType: "",
      value: "",
      notes: "",
    },
  });

  // Update form when edit data is loaded
  useEffect(() => {
    if (isEdit && sampleData) {
      const sampleType = Object.keys(sampleData).find((key) =>
        SAMPLE_TYPES.includes(key as any)
      );

      if (sampleType) {
        form.reset({
          userId: sampleData.studentId,
          sampleType: sampleType,
          value: sampleData[sampleType]?.toString() || "",
          notes: sampleData.notes || "",
        });
      }
    }
  }, [isEdit, sampleData, form]);

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
      // Create an empty state data object
      const stateData: SampleData = {
        studentId: user?.role === "student" ? user.id || 0 : data.userId,
        date: new Date().toISOString().split("T")[0],
        notes: data.notes || null,
      };

      // Add the specific sample type value
      stateData[data.sampleType] = parseFloat(data.value) || data.value;

      await apiRequest("POST", "/api/physical-states", stateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/physical-states/${user?.id || user?.id}`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/physical-states"] });
      toast({
        title: "Проба записана",
        description:
          "Ваше физическое измерение успешно записано.",
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
      const stateData: SampleData = {
        studentId: user?.role === "student" ? user.id || 0 : data.userId,
        date: new Date().toISOString().split("T")[0],
        notes: data.notes || null,
      };

      stateData[data.sampleType] = parseFloat(data.value) || data.value;

      await apiRequest("PUT", `/api/physical-states/${sampleId}`, stateData);
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
                    name="userId"
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
                          Выберите студента, для которого записывается это измерение
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

              
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
                        { name: "Весоростовой индекс Кетле", key: "ketleIndex" },
                          { name: "Окружность грудной клетки", key: "chestCircumference" },  
                        { name: "Окружность талии", key: "waistCircumference" },
                        { name: "Осанка", key: "posture" },
                        { name: "Жизненная емкость легких", key: "vitalCapacity" },
                        { name: "Сила кисти", key: "handStrength" },
                        { name: "Ортостатическая проба", key: "orthostaticTest" },
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
                                  step={test.key === "longJump" ? "0.01" : "1"}
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const inputValue = e.target.value;
                                    field.onChange(
                                      inputValue === ""
                                        ? undefined
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
