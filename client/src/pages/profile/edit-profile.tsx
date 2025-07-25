import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { userProfileSchema, MEDICAL_GROUP_TYPES, type UserProfile } from "@shared/schema";
import MainLayout from "@/components/layout/main-layout";
import { useLocation } from "wouter";
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
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ProfileFormValues = UserProfile;

type ProfileResponse = {
  profile: UserProfile;
};

export default function EditProfile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  
  // Redirect admin users away from profile page
  useEffect(() => {
    if (user?.role === "admin") {
      toast({
        title: "Доступ ограничен",
        description: "Администраторы не имеют страницы профиля.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [user?.role, navigate, toast]);

  // If user is admin, don't render the profile page
  if (user?.role === "admin") {
    return null;
  }

  // First get the user record by userId
  const { data: userRecord, isLoading: isLoadingRecord } = useQuery<{ teacherId?: number; studentId?: number }>({
    queryKey: [`/api/users/${user?.id}/record`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && (user.role === "teacher" || user.role === "student"),
  });

  // Then get the profile using the teacherId/studentId from the record
  const { data: profile, isLoading: isLoadingProfile } = useQuery<ProfileResponse>({
    queryKey: [`/api/profile/${user?.role}/${userRecord?.teacherId || userRecord?.studentId}`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!userRecord && (!!userRecord.teacherId || !!userRecord.studentId),
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const id = user?.role === "teacher" ? userRecord?.teacherId : userRecord?.studentId;
      await apiRequest("PUT", `/api/profile/${user?.role}/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${user?.role}/${userRecord?.teacherId || userRecord?.studentId}`] });
      toast({
        title: "Профиль обновлен",
        description: "Ваш профиль был успешно обновлен."
      });
      navigate('/profile');
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить профиль",
        variant: "destructive"
      });
    }
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues:
      user?.role === "student"
        ? {
            role: "student",
            fullName: "",
            dateOfBirth: "",
            phone: "",
            nationality: "",
            educationalDepartment: "",
            gender: "male",
            placeOfBirth: "",
            address: "",
            schoolGraduated: "",
            medicalGroup: "basic",
            medicalDiagnosis: "",
            previousIllnesses: "",
            activeSports: "",
            previousSports: "",
            additionalInfo: "",
            height: undefined,
            weight: undefined,
          }
        : user?.role === "teacher"
        ? {
            role: "teacher",
            fullName: "",
            dateOfBirth: "",
            phone: "",
            nationality: "",
            educationalDepartment: "",
            position: "",
          }
        : undefined,
  });

  // Update form when profile data is loaded
  useEffect(() => {
    if (profile?.profile) {
      // Format date string for date input
      let formattedProfile: any = {
        ...profile.profile,
        dateOfBirth: profile.profile.dateOfBirth ? new Date(profile.profile.dateOfBirth).toISOString().split('T')[0] : "",
        role: user?.role,
      };
      if (user?.role === "student") {
        formattedProfile.height = profile.profile.height !== undefined && profile.profile.height !== null && profile.profile.height !== '' ? Number(profile.profile.height) : undefined;
        formattedProfile.weight = profile.profile.weight !== undefined && profile.profile.weight !== null && profile.profile.weight !== '' ? Number(profile.profile.weight) : undefined;
      }
      // Set each field value
      Object.entries(formattedProfile).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.setValue(key as keyof ProfileFormValues, value as any);
        }
      });
    }
  }, [profile, user?.role, form]);

  if (isLoadingRecord || isLoadingProfile) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  function onSubmit(data: ProfileFormValues) {
    updateProfileMutation.mutate(data);
  }

  function handleTabChange(value: string) {
    setActiveTab(value);
  }

  function navigateToProfile() {
    navigate('/profile');
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={navigateToProfile} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">Редактировать профиль</h2>
            <p className="text-gray-500">Обновите вашу личную информацию</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Редактировать информацию о профиле</CardTitle>
                <CardDescription>
                  Пожалуйста, заполните вашу информацию о профиле
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="personal" value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="personal">Личная информация</TabsTrigger>
                    <TabsTrigger value="education">Образование</TabsTrigger>
                    {user?.role === "student" && (
                      <>
                        <TabsTrigger value="medical">Мед. информация</TabsTrigger>
                        <TabsTrigger value="sports">Спорт</TabsTrigger>
                      </>
                    )}
                  </TabsList>
                  
                  <TabsContent value="personal">
                    <div className="grid gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ФИО</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {user?.role === "student" && (
                          <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Пол</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Выберите пол" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="male">Мужской</SelectItem>
                                    <SelectItem value="female">Женский</SelectItem>
                                    <SelectItem value="other">Другое</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {user?.role === "teacher" && (
                          <FormField
                            control={form.control}
                            name="position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Должность</FormLabel>
                                <FormControl>
                                  <Input placeholder="Senior Lecturer" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

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
                                <Input placeholder="+375XXXXXXXXX" {...field} />
                              </FormControl>
                              <FormDescription>Формат: +375*********</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {user?.role === "student" && (
                          <>
                            <FormField
                              control={form.control}
                              name="height"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Рост (см)</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="Введите рост" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="weight"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Вес (кг)</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="Введите вес" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                        
                        {user?.role === "student" && (
                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Адрес</FormLabel>
                                <FormControl>
                                  <Input placeholder="123 Main St" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        <FormField
                          control={form.control}
                          name="nationality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Национальность</FormLabel>
                              <FormControl>
                                <Input placeholder="Belarusian" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="education">
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="educationalDepartment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Образовательное подразделение</FormLabel>
                            <FormControl>
                              <Input placeholder="Department name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {user?.role === "student" && (
                        <FormField
                          control={form.control}
                          name="schoolGraduated"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Учебное заведение</FormLabel>
                              <FormControl>
                                <Input placeholder="Previous school name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </TabsContent>
                  
                  {user?.role === "student" && (
                    <>
                      <TabsContent value="medical">
                        <div className="grid gap-6">
                          <FormField
                            control={form.control}
                            name="medicalGroup"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Медицинская группа</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Выберите медицинскую группу" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {MEDICAL_GROUP_TYPES.map(type => (
                                      <SelectItem key={type} value={type} className="capitalize">
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>Ваша медицинская группа</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="medicalDiagnosis"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Медицинский диагноз</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Введите все свои медицинские диагнозы" 
                                    className="resize-none" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="previousIllnesses"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Предыдущие болезни</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Перечислите любые предыдущие болезни" 
                                    className="resize-none" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="sports">
                        <div className="grid gap-6">
                          <FormField
                            control={form.control}
                            name="activeSports"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Текущие виды спорта</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Перечислите все виды спорта, которыми вы занимались" 
                                    className="resize-none" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="previousSports"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Предыдущие виды спорта</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="List sports you were previously engaged in" 
                                    className="resize-none" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="additionalInfo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Дополнительная информация</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Введите любую дополнительную информацию о себе" 
                                    className="resize-none" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                    </>
                  )}
                </Tabs>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                  className="ml-auto"
                >
                  {updateProfileMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Save className="mr-2 h-4 w-4" />
                  Сохранить изменения
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </MainLayout>
  );
}
