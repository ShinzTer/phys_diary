import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { Link } from "wouter";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Search,
  Plus,
  Pencil,
  MoreHorizontal,
  ArrowUpDown,
  Trash
} from "lucide-react";
import { Period, PhysicalState, SAMPLE_TYPES, Student, Teacher } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export default function Samples() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const { data: teacherProfile, isLoading: isLoadingTeacherProfile } =
    useQuery<Teacher>({
      queryKey: [`/api/profile/teacher/${user?.id}`],
      enabled: user?.role === "teacher",
    });
  const { data: samples, isLoading } = useQuery<PhysicalState[]>({
    queryKey: [
      user?.role === "student"
        ? `/api/physical-states/${user.id}`
        : user?.role === "teacher"
        ? `/api/samples/all/${teacherProfile?.teacherId}`
        : "api/samples/all",
    ],
  });

  // const filteredSamples = samples;
  const filteredSamples = samples?.filter(
    (test) => test.periodId === Number(periodFilter) || periodFilter === "all"
  );
  console.log(filteredSamples)
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
    enabled: !!user,
  });


  
    // Update sample mutation
    const deleteSampleMutation = useMutation({
      mutationFn: async (id: number) => {
  
        await apiRequest("DELETE", `/api/physical-states/${id}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [user?.role === "student"
        ? `/api/physical-states/${user.id}`
        : "/api/samples/all",],
        });
        toast({
          title: "Проба удалена",
          description: "Физическое измерение успешно удалено.",
        });
     
      },
      onError: (error) => {
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось удалить пробу",
          variant: "destructive",
        });
      },
    });
  
    // Handle form submission
    function handleDelete(id: number) {      
        deleteSampleMutation.mutate(id);
      }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Физические пробы</h2>
            <p className="text-gray-500">
              Просмотр и управление записями физических проб
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск проб..."
                className="pl-9 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Link href="/samples/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Записать пробу
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Записи проб</CardTitle>
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
            <CardDescription>
              Физические измерения и показатели здоровья
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {!filteredSamples || filteredSamples.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">
                      Записи проб не найдены.
                    </p>
                    <Link href="/samples/new">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Записать новую пробу
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          
                          <th className="px-4 py-3">Студент</th>
                          <th className="px-4 py-3">Дата</th>
                          <th className="px-4 py-3">Период</th>

                          <th className="px-4 py-3">Рост</th>
                          <th className="px-4 py-3">Вес</th>
                          <th className="px-4 py-3">
                            Весоростовой индекс Кетле
                          </th>
                          <th className="px-4 py-3">
                            Окружность грудной клетки
                          </th>
                          <th className="px-4 py-3">Окружность талии</th>
                          <th className="px-4 py-3">Осанка</th>
                          <th className="px-4 py-3">
                            Жизненная емкость легких
                          </th>
                          <th className="px-4 py-3">Сила кисти</th>
                          <th className="px-4 py-3">Ортостатическая проба</th>
                          <th className="px-4 py-3">Проба Штанге</th>
                          <th className="px-4 py-3">Проба Генчи</th>
                          <th className="px-4 py-3">
                            Проба Мартине-Кушелевского
                          </th>
                          <th className="px-4 py-3">
                            Частота сердечных сокращений
                          </th>
                          <th className="px-4 py-3">Артериальное давление</th>
                          <th className="px-4 py-3">Пульсовое давление</th>

                          <th className="px-4 py-3 text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredSamples?.map((sample) => (
                          <tr key={sample.stateId}>
                            <td className="px-4 py-4 whitespace-nowrap font-medium">
                              {user?.role === "student"
                                ? user?.username
                                : students.find(
                                    (student) =>
                                      student.userId === sample.studentId
                                  )?.fullName || "Unknown"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {sample.date
                                ? format(new Date(sample.date), "dd.MM.yyyy")
                                : "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              {periods.find(
                                (period) => period.periodId === sample.periodId
                              )?.periodOfStudy || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {sample.height || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {sample.weight || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {sample.ketleIndex || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {sample.chestCircumference || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {sample.waistCircumference || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {sample.posture || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {sample.vitalCapacity || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {sample.handStrength || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {sample.orthostaticTest || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {sample.shtangeTest || "-"}
                            </td>
                            <td className="px-4 py-4 whites  pace-nowrap">
                              {sample.genchiTest || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {sample.martineTest || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {sample.heartRate || "-"}
                            </td>
                          
                            <td className="px-4 py-4 whitespace-nowrap">
                              {sample.bloodPressure || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {sample.pulsePressure || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>
                                    Действия
                                  </DropdownMenuLabel>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/samples/edit/${sample.stateId}`}
                                    >
                                      <div className="w-full flex items-center">
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Редактировать
                                      </div>
                                    </Link>
                                  </DropdownMenuItem>
                                   <DropdownMenuItem asChild>
                                      <button onClick={() => handleDelete(sample.stateId)}>
                                      <div className="w-full flex items-center">
                                        <Trash className="mr-2 h-4 w-4" />
                                        Удалить
                                      </div>
                                    </button>
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
        </Card>
      </div>
    </MainLayout>
  );
}

