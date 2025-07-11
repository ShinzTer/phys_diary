import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import MainLayout from "@/components/layout/main-layout";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
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
  DropdownMenuSeparator,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Plus, Edit, Trash2, MoreHorizontal, User, UserPlus, Users, Shield } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface User {
  id: number;
  username: string;
  role: "admin" | "teacher" | "student";
  facultyId?: number;
  groupId?: number;
}

interface Group {
  groupId: number;
  name: string;
  facultyId: number;
}

interface QueryResponse<T> {
  data: T[];
  error?: string;
}

// User creation form schema
const baseUserSchema = z.object({
  username: z.string().min(3, "Логин должен быть не менее 3 символов"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
  role: z.enum(["admin", "teacher", "student"]),
});

const studentUserSchema = baseUserSchema.extend({
  fullName: z.string().min(1, "ФИО является обязательным"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Пол является обязательным",
  }),
  dateOfBirth: z.string().min(1, "Дата рождения является обязательной"),
  phone: z.string()
    .regex(/^\+375\d{9}$/, "Номер телефона должен быть в формате: +375*********"),
  medicalGroup: z.enum(["basic", "preparatory", "special"], {
    required_error: "Медицинская группа является обязательной",
  }),
  groupId: z.number({
    required_error: "Группа является обязательной",
  }),
});

const teacherUserSchema = baseUserSchema.extend({
  fullName: z.string().min(1, "ФИО является обязательным"),
  position: z.string().min(1, "Должность является обязательной"),
  phone: z.string()
    .regex(/^\+375\d{9}$/, "Номер телефона должен быть в формате: +375*********"),
});

type UserFormValues = z.infer<typeof studentUserSchema> | z.infer<typeof teacherUserSchema> | z.infer<typeof baseUserSchema>;

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<"admin" | "teacher" | "student">("student");
  
  // Fetch all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/manage"],
  });

  // Fetch all groups for student creation
  const { data: groupsResponse } = useQuery<QueryResponse<Group>>({
    queryKey: ["/api/groups", { forRegistration: true }],
    enabled: selectedRole === "student",
  });
console.log(groupsResponse)
  const groups = groupsResponse || [];

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      await apiRequest("POST", "/api/register", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Пользователь создан",
        description: "Пользователь успешно создан."
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать пользователя",
        variant: "destructive"
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/manage/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/manage"] });
      toast({
        title: "Пользователь удален",
        description: "Пользователь успешно удален."
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить пользователя",
        variant: "destructive"
      });
    }
  });

  // User creation form
  const form = useForm<UserFormValues>({
    resolver: zodResolver(
      selectedRole === "student" 
        ? studentUserSchema 
        : selectedRole === "teacher" 
          ? teacherUserSchema 
          : baseUserSchema
    ),
    defaultValues: {
      username: "",
      password: "",
      role: selectedRole,
      fullName: "",
    }
  });

  // Reset form when role changes
  useEffect(() => {
    form.reset({
      username: "",
      password: "",
      role: selectedRole,
      fullName: "",
    });
  }, [selectedRole, form]);

  function onSubmit(data: UserFormValues) {
    createUserMutation.mutate(data);
  }

  function handleDeleteUser(userId: number) {
    deleteUserMutation.mutate(userId);
  }

  // Filter users based on search term and role filter
  const filteredUsers = users?.filter((u: User) => {
    // const matchesSearch = 
    //   u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //   (u.fullName && u.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = !roleFilter || u.role === roleFilter;
    
    return /*matchesSearch && */matchesRole;
  });

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4 text-primary" />;
      case "teacher":
        return <User className="h-4 w-4 text-green-600" />;
      case "student":
        return <Users className="h-4 w-4 text-amber-600" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Управление пользователями</h2>
            <p className="text-gray-500">Создание, просмотр, редактирование и управление пользователями в системе</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск пользователей..."
                className="pl-9 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Добавить пользователя
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Пользователи системы</CardTitle>
              <Select
                value={roleFilter || "all"}
                onValueChange={(value) => setRoleFilter(value === "all" ? "" : value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Все роли" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все роли</SelectItem>
                  <SelectItem value="admin">Администраторы</SelectItem>
                  <SelectItem value="teacher">Преподаватели</SelectItem>
                  <SelectItem value="student">Студенты</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription>
              Управление учетными записями и их ролями
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {(!filteredUsers || filteredUsers.length === 0) ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">Пользователи не найдены.</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Добавить нового пользователя
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-3">Пользователь</th>
                          <th className="px-4 py-3">Имя пользователя</th>
                          <th className="px-4 py-3">Роль</th>
                          <th className="px-4 py-3">Факультет/Группа</th>
                          <th className="px-4 py-3 text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredUsers.map((u: User) => (
                          <tr key={u.id}>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-3">
                                  <AvatarFallback>
                                    {getInitials(u.username)} 
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{"Не установлено"}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {u.username}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {getRoleIcon(u.role)}
                                <span className="ml-2 capitalize">{u.role}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                {u.facultyId ? `ID факультета: ${u.facultyId}` : "Не установлено"}
                                {u.groupId && ` / ID группы: ${u.groupId}`}
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
                                  {u.id !== user?.id && (
                                    <>
                                      <DropdownMenuItem asChild>
                                        <Link href={`/students/${u.id}`}>
                                          <div className="w-full flex items-center">
                                            <User className="mr-2 h-4 w-4" />
                                            Просмотр профиля
                                          </div>
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setUserToDelete(u);
                                          setIsDeleteDialogOpen(true);
                                        }}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Удалить пользователя
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {u.id === user?.id && (
                                    <DropdownMenuItem asChild disabled>
                                      <span className="text-gray-500 w-full flex items-center">
                                        <User className="mr-2 h-4 w-4" />
                                        Текущий пользователь
                                      </span>
                                    </DropdownMenuItem>
                                  )}
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

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Добавить нового пользователя</DialogTitle>
              <DialogDescription>
                Добавьте нового пользователя в систему
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form  onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto max-h-80">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Роль</FormLabel>
                      <Select 
                        onValueChange={(value: "admin" | "teacher" | "student") => {
                          field.onChange(value);
                          setSelectedRole(value);
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите роль" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Студент</SelectItem>
                          <SelectItem value="teacher">Преподаватель</SelectItem>
                          <SelectItem value="admin">Администратор</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя пользователя</FormLabel>
                      <FormControl>
                        <Input placeholder="Выберите имя пользователя" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Пароль</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Выберите пароль" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                

                {selectedRole === "student" && (
                  <>
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Полное имя</FormLabel>
                          <FormControl>
                            <Input placeholder="Введите полное имя" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Пол</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите пол" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Мужской</SelectItem>
                              <SelectItem value="female">Женский</SelectItem>
                              <SelectItem value="other">Другой</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Дата рождения</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Номер телефона</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+375291234567" 
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d+]/g, '');
                                if (!value.startsWith('+375')) {
                                  field.onChange('+375' + value.replace(/^\+375/, ''));
                                } else {
                                  field.onChange(value);
                                }
                              }}
                            />
                          </FormControl>
                          <FormDescription>Формат: +375*********</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="medicalGroup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Медицинская группа</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите медицинскую группу" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="basic">Основная</SelectItem>
                              <SelectItem value="preparatory">Подготовительная</SelectItem>
                              <SelectItem value="special">Специальная</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="groupId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Группа</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите группу" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {groups.map((group: Group) => (
                                <SelectItem key={group.groupId} value={group.groupId.toString()}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {selectedRole === "teacher" && (
                  <>
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Полное имя</FormLabel>
                          <FormControl>
                            <Input placeholder="Введите полное имя" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Должность</FormLabel>
                          <FormControl>
                            <Input placeholder="Введите должность" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Номер телефона</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+375291234567" 
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d+]/g, '');
                                if (!value.startsWith('+375')) {
                                  field.onChange('+375' + value.replace(/^\+375/, ''));
                                } else {
                                  field.onChange(value);
                                }
                              }}
                            />
                          </FormControl>
                          <FormDescription>Формат: +375*********</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Создание...
                      </>
                    ) : (
                      'Создать пользователя'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие не может быть отменено и может повлиять на пользователя и его данные.
                <span className="font-semibold">
                  {userToDelete?.fullName || userToDelete?.username}
                </span>. 
                Это действие не может быть отменено.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteUser(userToDelete?.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteUserMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Удаление...
                  </>
                ) : (
                  'Удалить пользователя'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
