import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Plus, Edit, Trash2, MoreHorizontal, Briefcase, Users, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import React from "react";

// Group form schema
const groupFormSchema = z.object({
  name: z.string().min(1, "Название группы является обязательным"),
  facultyId: z.string().min(1, "Факультет является обязательным"),
  teacherId: z.string().min(1, "Преподаватель является обязательным"),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

interface Faculty {
  facultyId: number;
  name: string;
}

interface Teacher {
  teacherId: number;
  fullName: string;
}

interface Group {
  groupId: number;
  name: string;
  facultyId: number;
  teacherId: number;
}

export default function GroupManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [facultyFilter, setFacultyFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  // Fetch all groups
  const { data: groups, isLoading: isLoadingGroups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  // Fetch all faculties for dropdown
  const { data: faculties = [], isLoading: isLoadingFaculties, error: facultiesError } = useQuery<Faculty[]>({
    queryKey: ["/api/faculties"],
  });

  // Fetch all teachers for dropdown
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  // Filter out any invalid faculty data
  const validFaculties = React.useMemo(() => {
    return faculties?.filter((faculty): faculty is Faculty => 
      faculty !== null && 
      faculty !== undefined && 
      typeof faculty === 'object' &&
      'facultyId' in faculty &&
      'name' in faculty
    ) ?? [];
  }, [faculties]);

  // Filter out any invalid teacher data
  const validTeachers = React.useMemo(() => {
    return teachers?.filter((teacher): teacher is Teacher => 
      teacher !== null && 
      teacher !== undefined && 
      typeof teacher === 'object' &&
      'teacherId' in teacher &&
      'fullName' in teacher
    ) ?? [];
  }, [teachers]);

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/groups", {
        name: data.name,
        facultyId: parseInt(data.facultyId),
        teacherId: parseInt(data.teacherId),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Группа создана",
        description: "Группа успешно создана."
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать группу",
        variant: "destructive"
      });
    }
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      await apiRequest("PUT", `/api/groups/${id}`, {
        name: data.name,
        facultyId: parseInt(data.facultyId),
        teacherId: parseInt(data.teacherId),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Группа обновлена",
        description: "Группа успешно обновлена."
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить группу",
        variant: "destructive"
      });
    }
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Группа удалена",
        description: "Группа успешно удалена."
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить группу",
        variant: "destructive"
      });
    }
  });

  // Create group form
  const createForm = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: "",
      facultyId: "",
      teacherId: "",
    }
  });

  // Edit group form
  const editForm = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: "",
      facultyId: "",
      teacherId: "",
    }
  });

  function onCreateSubmit(data: GroupFormValues) {
    createGroupMutation.mutate(data);
  }

  function onEditSubmit(data: GroupFormValues) {
    if (selectedGroup) {
      updateGroupMutation.mutate({ id: selectedGroup.groupId, data });
    }
  }

  function handleEditGroup(group: Group) {
    setSelectedGroup(group);
    editForm.reset({
      name: group.name,
      facultyId: group.facultyId.toString(),
      teacherId: group.teacherId.toString(),
    });
    setIsEditDialogOpen(true);
  }

  function handleDeleteGroup(group: Group) {
    setSelectedGroup(group);
    setIsDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (selectedGroup) {
      deleteGroupMutation.mutate(selectedGroup.groupId);
    }
  }

  // Get faculty name by ID with defensive programming
  const getFacultyName = (facultyId: number) => {
    if (!Array.isArray(faculties)) {
      console.warn('Faculties is not an array:', faculties);
      return "Unknown Faculty";
    }
    const faculty = faculties.find(f => f && f.facultyId === facultyId);
    return faculty?.name || "Unknown Faculty";
  };

  // Filter groups based on search term and faculty filter with defensive programming
  const filteredGroups = Array.isArray(groups) 
  ? groups?.filter((group) => {
      const matchesSearch = group.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const matchesFaculty = facultyFilter === "all" || 
        (group.facultyId && group.facultyId.toString() === facultyFilter);
      return matchesSearch && matchesFaculty;
    })
  : [];

  const isLoading = isLoadingGroups || isLoadingFaculties || isLoadingTeachers;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Управление группами</h2>
            <p className="text-gray-500">Создание, просмотр, редактирование и управление группами студентов</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск групп..."
                className="pl-9 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить группу
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Группы студентов</CardTitle>
              <div className="mb-4">
                <Select
                  value={facultyFilter}
                  onValueChange={setFacultyFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Все факультеты" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все факультеты</SelectItem>
                    {validFaculties.map((faculty) => (
                      <SelectItem 
                        key={faculty.facultyId} 
                        value={String(faculty.facultyId)}
                      >
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardDescription>
              Управление группами студентов в системе
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {(!filteredGroups || filteredGroups.length === 0) ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">Не найдено групп, соответствующих вашему критерию поиска.</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить новую группу
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-3">ID</th>
                          <th className="px-4 py-3">Название группы</th>
                          <th className="px-4 py-3">Факультет</th>
                          <th className="px-4 py-3">Преподаватель</th>
                          <th className="px-4 py-3 text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredGroups.map((group: Group) => (
                          <tr key={group.groupId}>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {group.groupId}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap font-medium">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span>{group.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Building2 className="h-4 w-4 text-gray-500 mr-2" />
                                {getFacultyName(group.facultyId)}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Briefcase className="h-4 w-4 text-gray-500 mr-2" />
                                {validTeachers.find(t => t.teacherId === group.teacherId)?.fullName || "Unknown Teacher"}
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
                                  <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Редактировать
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteGroup(group)}
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

        {/* Create Group Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить новую группу</DialogTitle>
              <DialogDescription>
                Добавьте новую группу в систему
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название группы</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите название группы" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="facultyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Факультет</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите факультет" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {validFaculties.map((faculty) => (
                            <SelectItem 
                              key={faculty.facultyId} 
                              value={String(faculty.facultyId)}
                            >
                              {faculty.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Преподаватель</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите преподавателя" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {validTeachers.map((teacher) => (
                            <SelectItem 
                              key={teacher.teacherId} 
                              value={String(teacher.teacherId)}
                            >
                              {teacher.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={createGroupMutation.isPending}>
                    {createGroupMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Создание...
                      </>
                    ) : (
                      'Создать группу'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Group Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать группу</DialogTitle>
              <DialogDescription>
                Измените детали группы
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название группы</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите название группы" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="facultyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Факультет</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите факультет" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {validFaculties.map((faculty) => (
                            <SelectItem 
                              key={faculty.facultyId} 
                              value={String(faculty.facultyId)}
                            >
                              {faculty.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Преподаватель</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите преподавателя" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {validTeachers.map((teacher) => (
                            <SelectItem 
                              key={teacher.teacherId} 
                              value={String(teacher.teacherId)}
                            >
                              {teacher.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={updateGroupMutation.isPending}>
                    {updateGroupMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Обновление...
                      </>
                    ) : (
                      'Обновить группу'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Group Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Удалить группу</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить эту группу? Это действие не может быть отменено.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="button" variant="destructive" onClick={confirmDelete} disabled={deleteGroupMutation.isPending}>
                {deleteGroupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Удаление...
                  </>
                ) : (
                  'Удалить группу'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
