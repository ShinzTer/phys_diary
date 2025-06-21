import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import MainLayout from "@/components/layout/main-layout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Plus, Edit, Trash2, MoreHorizontal, Building2 } from "lucide-react";

// Faculty form schema
const facultyFormSchema = z.object({
  name: z.string().min(1, "Faculty name is required"),
  description: z.string().optional(),
});

type FacultyFormValues = z.infer<typeof facultyFormSchema>;

interface Faculty {
  facultyId: number;
  name: string;
  description?: string;
}

export default function FacultyManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  
  // Fetch all faculties
  const { data: faculties = [], isLoading } = useQuery<Faculty[]>({
    queryKey: ["/api/faculties"],
  });

  // Create faculty mutation
  const createFacultyMutation = useMutation({
    mutationFn: async (data: FacultyFormValues) => {
      await apiRequest("POST", "/api/faculties", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faculties"] });
      toast({
        title: "Факультет создан",
        description: "Создание факультета выполнено успешно."
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать факультет",
        variant: "destructive"
      });
    }
  });

  // Update faculty mutation
  const updateFacultyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: FacultyFormValues }) => {
      await apiRequest("PUT", `/api/faculties/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faculties"] });
      toast({
        title: "Факультет обновлен",
        description: "Обновление факультета выполнено успешно."
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить факультет",
        variant: "destructive"
      });
    }
  });

  // Delete faculty mutation
  const deleteFacultyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/faculties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faculties"] });
      toast({
        title: "Факультет удален",
        description: "Удаление факультета выполнено успешно."
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить факультет",
        variant: "destructive"
      });
    }
  });

  // Create faculty form
  const createForm = useForm<FacultyFormValues>({
    resolver: zodResolver(facultyFormSchema),
    defaultValues: {
      name: "",
      description: "",
    }
  });

  // Edit faculty form
  const editForm = useForm<FacultyFormValues>({
    resolver: zodResolver(facultyFormSchema),
    defaultValues: {
      name: "",
      description: "",
    }
  });

  function onCreateSubmit(data: FacultyFormValues) {
    createFacultyMutation.mutate(data);
  }

  function onEditSubmit(data: FacultyFormValues) {
    if (selectedFaculty) {
      updateFacultyMutation.mutate({ id: selectedFaculty.facultyId, data });
    }
  }

  function handleEditFaculty(faculty: Faculty) {
    setSelectedFaculty(faculty);
    editForm.reset({
      name: faculty.name,
      description: faculty.description || "",
    });
    setIsEditDialogOpen(true);
  }

  function handleDeleteFaculty(faculty: Faculty) {
    setSelectedFaculty(faculty);
    setIsDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (selectedFaculty) {
      deleteFacultyMutation.mutate(selectedFaculty.facultyId);
    }
  }

  // Filter faculties based on search term
  const filteredFaculties = faculties.filter((faculty: Faculty) => 
    faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (faculty.description && faculty.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Управление факультетами</h2>
            <p className="text-gray-500">Создание, просмотр, редактирование и управление факультетами</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск факультетов..."
                className="pl-9 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить факультет
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Факультеты</CardTitle>
            <CardDescription>
              Управление факультетами в системе
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {(!filteredFaculties || filteredFaculties.length === 0) ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">Не найдено факультетов, соответствующих вашему критерию поиска.</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить новый факультет
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-3">ID</th>
                          <th className="px-4 py-3">Название</th>
                          <th className="px-4 py-3">Описание</th>
                          <th className="px-4 py-3 text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredFaculties.map((faculty: Faculty) => (
                          <tr key={faculty.facultyId}>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {faculty.facultyId}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap font-medium">
                              <div className="flex items-center">
                                <Building2 className="h-4 w-4 text-primary mr-2" />
                                {faculty.name}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="max-w-xs truncate">
                                {faculty.description || "-"}
                              </div>
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
                                  <DropdownMenuItem onClick={() => handleEditFaculty(faculty)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Редактировать
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteFaculty(faculty)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
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
        </Card>

        {/* Create Faculty Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Добавить новый факультет</DialogTitle>
              <DialogDescription>
                Добавьте новый факультет в систему
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название факультета</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите название факультета" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Введите описание факультета" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Краткое описание факультета (необязательно)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={createFacultyMutation.isPending}>
                    {createFacultyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Создание...
                      </>
                    ) : (
                      'Создать факультет'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Faculty Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Редактировать факультет</DialogTitle>
              <DialogDescription>
                Обновите информацию о факультете
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название факультета</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите название факультета" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Введите описание факультета" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Краткое описание факультета (необязательно)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={updateFacultyMutation.isPending}>
                    {updateFacultyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Обновление...
                      </>
                    ) : (
                      'Обновить факультет'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Faculty Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие не может быть отменено и может повлиять на студентов и группы, связанные с этим факультетом.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteFacultyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Удаление...
                  </>
                ) : (
                  'Удалить факультет'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
