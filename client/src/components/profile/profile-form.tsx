import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Student, Teacher } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";

// Define the schema for profile updates
const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  position: z.string().min(1, "Position is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  educationalDepartment: z.string().min(1, "Образовательное подразделение является обязательным"),
  phone: z.string()
    .regex(/^\+375\d{9}$/, "Phone number must be in format: +375*********")
    .min(13, "Phone number must be 13 characters long")
    .max(13, "Phone number must be 13 characters long"),
  nationality: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  id: number;
  role: "student" | "teacher";
  isEditable?: boolean;
}

interface UserWithProfile {
  id: number;
  username: string;
  role: "admin" | "teacher" | "student";
  profile: Student | Teacher;
}

export function ProfileForm({ id, role, isEditable = true }: ProfileFormProps) {
  const { toast } = useToast();

  // Fetch user profile data
  const { data: userData, isLoading, error } = useQuery<UserWithProfile>({
    queryKey: [`/api/profile/${role}/${id}`],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Create form with react-hook-form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      position: "",
      dateOfBirth: "",
      educationalDepartment: "",
      phone: "",
      nationality: "",
    },
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (userData?.profile) {
      const profile = userData.profile as Teacher;
      form.reset({
        fullName: profile.fullName || "",
        position: profile.position || "",
        dateOfBirth: profile.dateOfBirth || "",
        educationalDepartment: profile.educationalDepartment || "",
        phone: profile.phone || "",
        nationality: profile.nationality || "",
      });
    }
  }, [userData, form]);

  // Create mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PUT", `/api/profile/${role}/${id}`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${role}/${id}`] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Ошибка загрузки профиля: {error.message}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Информация о профиле</CardTitle>
        <CardDescription>Обновите вашу личную информацию</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-medium">Личная информация</h3>
              <Separator className="my-3" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ФИО</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditable}
                          placeholder="Enter your full name"
                        />
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
                        <Input
                          {...field}
                          disabled={!isEditable}
                          placeholder="Введите вашу должность"
                        />
                      </FormControl>
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
                        <Input
                          {...field}
                          disabled={!isEditable}
                          type="date"
                        />
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
                          {...field}
                          disabled={!isEditable}
                          placeholder="+375*********"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Professional Information Section */}
            <div>
              <h3 className="text-lg font-medium">Профессиональная информация</h3>
              <Separator className="my-3" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="educationalDepartment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Образовательное подразделение</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditable}
                          placeholder="Введите ваше подразделение"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Национальность</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditable}
                          placeholder="Введите вашу национальность"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {isEditable && (
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                  className="min-w-[120px]"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Сохранить профиль"
                  )}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
