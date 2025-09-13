import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocalSettingsContext } from "@/components/providers/local-settings-provider";
import { queryClient } from "@/lib/queryClient";
import MainLayout from "@/components/layout/main-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Palette, Eye, Moon, Sun, Monitor } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

// Password change form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Нынешний пароль является обязательным"),
  newPassword: z.string().min(6, "Новый пароль, по крайней мере 6 символов"),
  confirmPassword: z.string().min(1, "Подтвердите новый пароль"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// Visual settings form schema
const visualSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  colorScheme: z.string(),
  fontSize: z.string(),
  reduceMotion: z.boolean(),
  contrastMode: z.enum(["normal", "high"]),
});

type VisualSettingsValues = z.infer<typeof visualSettingsSchema>;

interface UserData {
  id: string;
  // Remove visualSettings from user data since we're using local storage
  // Add other user data fields as needed
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("appearance");
  
  // Use local settings context
  const { settings: localSettings, isLoaded: settingsLoaded, saveSettings } = useLocalSettingsContext();
  
  // Form for password change
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  // Get existing user data (without visual settings)
  const { data: userData, isLoading } = useQuery<UserData>({
    queryKey: [`/api/profile/${user?.id}`],
  });

  // Form for visual settings
  const visualSettingsForm = useForm<VisualSettingsValues>({
    resolver: zodResolver(visualSettingsSchema),
    defaultValues: localSettings,
  });

  // Update form values when local settings are loaded
  useEffect(() => {
    if (settingsLoaded) {
      visualSettingsForm.reset(localSettings);
    }
  }, [settingsLoaded, localSettings]);

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      // Actual implementation would call an API endpoint to change password
      // This is a placeholder
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Пароль обновлён",
        description: "Ваш пароль был успешно изменён."
      });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Ошибка в изменении пароля",
        variant: "destructive"
      });
    }
  });

  // Handle password change form submission
  function onPasswordSubmit(data: PasswordFormValues) {
    changePasswordMutation.mutate(data);
  }

  // Handle visual settings form submission
  function onVisualSettingsSubmit(data: VisualSettingsValues) {
    saveSettings(data);
    toast({
      title: "Настройки обновлены",
      description: "Визуальные настройки сохранены локально на вашем устройстве."
    });
  }

  if (isLoading || !settingsLoaded) {
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
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Настройки</h2>
          <p className="text-gray-500">Изменение настроек для своего аккаунта</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="appearance">
              <Palette className="h-4 w-4 mr-2" />
              Внешний вид
            </TabsTrigger>
            <TabsTrigger value="account">
              <Eye className="h-4 w-4 mr-2" />
              Аккаунт
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Визуальные предпочтения</CardTitle>
                <CardDescription>
                  Изменение внешнего вида приложения. Настройки сохраняются локально на вашем устройстве.
                </CardDescription>
              </CardHeader>
              <Form {...visualSettingsForm}>
                <form onSubmit={visualSettingsForm.handleSubmit(onVisualSettingsSubmit)}>
                  <CardContent className="space-y-6">
                    <FormField
                      control={visualSettingsForm.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Тема</FormLabel>
                          <div className="flex space-x-4">
                            <RadioGroup 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              className="flex space-x-1"
                            >
                              <FormItem className="flex items-center space-x-1 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="light" id="theme-light" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer flex items-center">
                                  <Sun className="h-4 w-4 mr-1" />
                                  Светлая
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-1 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="dark" id="theme-dark" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer flex items-center">
                                  <Moon className="h-4 w-4 mr-1" />
                                  Тёмная
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-1 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="system" id="theme-system" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer flex items-center">
                                  <Monitor className="h-4 w-4 mr-1" />
                                  Как в системе
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={visualSettingsForm.control}
                      name="colorScheme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Цветовая схема</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a color scheme" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="blue">Синяя</SelectItem>
                              <SelectItem value="green">Зелёная</SelectItem>
                              <SelectItem value="purple">Фиолетовая</SelectItem>
                              <SelectItem value="orange">Оранжевая</SelectItem>
                              <SelectItem value="red">Красная</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Основной цвет используется по всему приложению
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={visualSettingsForm.control}
                      name="fontSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Размер шрифта</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a font size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="small">Маленький</SelectItem>
                              <SelectItem value="medium">Средний (По умолчанию)</SelectItem>
                              <SelectItem value="large">Большой</SelectItem>
                              <SelectItem value="extra-large">Очень большой</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={visualSettingsForm.control}
                      name="reduceMotion"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Упрощённые анимации</FormLabel>
                            <FormDescription>
                              Минимизировать анимированность приложения
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={visualSettingsForm.control}
                      name="contrastMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Контрастность</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select contrast mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="normal">Обычная</SelectItem>
                              <SelectItem value="high">Высококонтрастная</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Повысить контрастность для лучшей сличаемости
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={false}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Сохранить настройки
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Смена пароля</CardTitle>
                <CardDescription>
                  Обновить пароль аккаунта
                </CardDescription>
              </CardHeader>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                  <CardContent className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Текущий пароль</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Введите свой текущий пароль" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Новый пароль</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Введите новый пароль" {...field} />
                          </FormControl>
                          <FormDescription>
                            Пароль должен быть длинной минимум в 6 символов
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Подтвердть пароль</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Подтвердите новый пароль" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Изменение пароля...
                        </>
                      ) : (
                        "Изменение пароля"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
