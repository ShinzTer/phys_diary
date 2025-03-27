import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
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
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
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

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("appearance");
  
  // Form for password change
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  // Get existing settings from user data
  const { data: userData, isLoading } = useQuery({
    queryKey: [`/api/profile/${user?.id}`],
  });

  // Parse visual settings from user data or use defaults
  const defaultVisualSettings: VisualSettingsValues = {
    theme: "light",
    colorScheme: "blue",
    fontSize: "medium",
    reduceMotion: false,
    contrastMode: "normal",
  };

  // Try to parse existing visual settings from user data
  const parseVisualSettings = () => {
    if (userData?.visualSettings) {
      try {
        const settings = JSON.parse(userData.visualSettings);
        return {
          theme: settings.theme || defaultVisualSettings.theme,
          colorScheme: settings.colorScheme || defaultVisualSettings.colorScheme,
          fontSize: settings.fontSize || defaultVisualSettings.fontSize,
          reduceMotion: settings.reduceMotion || defaultVisualSettings.reduceMotion,
          contrastMode: settings.contrastMode || defaultVisualSettings.contrastMode,
        };
      } catch (e) {
        return defaultVisualSettings;
      }
    }
    return defaultVisualSettings;
  };

  // Form for visual settings
  const visualSettingsForm = useForm<VisualSettingsValues>({
    resolver: zodResolver(visualSettingsSchema),
    defaultValues: defaultVisualSettings,
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (userData) {
      visualSettingsForm.reset(parseVisualSettings());
    }
  }, [userData]);

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
        title: "Password updated",
        description: "Your password has been successfully changed."
      });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive"
      });
    }
  });

  // Visual settings mutation
  const updateVisualSettingsMutation = useMutation({
    mutationFn: async (data: VisualSettingsValues) => {
      // Convert settings to JSON string for storage
      const visualSettings = JSON.stringify(data);
      await apiRequest("PUT", `/api/settings/${user?.id}`, { visualSettings });
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${user?.id}`] });
      toast({
        title: "Settings updated",
        description: "Your visual preferences have been saved."
      });

      // Apply visual settings to the application
      applyVisualSettings(visualSettingsForm.getValues());
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
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
    updateVisualSettingsMutation.mutate(data);
  }

  // Apply visual settings to the application
  function applyVisualSettings(settings: VisualSettingsValues) {
    // Apply theme
    const htmlElement = document.documentElement;
    
    // Theme (light/dark)
    if (settings.theme === "dark") {
      htmlElement.classList.add("dark");
    } else if (settings.theme === "light") {
      htmlElement.classList.remove("dark");
    } else {
      // System theme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        htmlElement.classList.add("dark");
      } else {
        htmlElement.classList.remove("dark");
      }
    }
    
    // Font size
    htmlElement.style.fontSize = {
      small: "14px",
      medium: "16px",
      large: "18px",
      "extra-large": "20px"
    }[settings.fontSize] || "16px";
    
    // Reduced motion
    if (settings.reduceMotion) {
      htmlElement.classList.add("reduce-motion");
    } else {
      htmlElement.classList.remove("reduce-motion");
    }
    
    // High contrast
    if (settings.contrastMode === "high") {
      htmlElement.classList.add("high-contrast");
    } else {
      htmlElement.classList.remove("high-contrast");
    }
  }

  if (isLoading) {
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
          <h2 className="text-2xl font-semibold">Settings</h2>
          <p className="text-gray-500">Manage your account preferences and settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="appearance">
              <Palette className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="account">
              <Eye className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Visual Preferences</CardTitle>
                <CardDescription>
                  Customize the appearance of the application
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
                          <FormLabel>Theme</FormLabel>
                          <div className="flex flex-wrap gap-4">
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
                                  Light
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-1 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="dark" id="theme-dark" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer flex items-center">
                                  <Moon className="h-4 w-4 mr-1" />
                                  Dark
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-1 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="system" id="theme-system" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer flex items-center">
                                  <Monitor className="h-4 w-4 mr-1" />
                                  System
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
                          <FormLabel>Color Scheme</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a color scheme" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="blue">Blue</SelectItem>
                              <SelectItem value="green">Green</SelectItem>
                              <SelectItem value="purple">Purple</SelectItem>
                              <SelectItem value="orange">Orange</SelectItem>
                              <SelectItem value="red">Red</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The primary color used throughout the application
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
                          <FormLabel>Font Size</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a font size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium (Default)</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                              <SelectItem value="extra-large">Extra Large</SelectItem>
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
                            <FormLabel className="text-base">Reduce Motion</FormLabel>
                            <FormDescription>
                              Minimize animated effects throughout the application
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
                          <FormLabel>Contrast Mode</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select contrast mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High Contrast</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Increase contrast for better visibility
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={updateVisualSettingsMutation.isPending}
                    >
                      {updateVisualSettingsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your account password
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
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your current password" {...field} />
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
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your new password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 6 characters long
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
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm your new password" {...field} />
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
                          Changing Password...
                        </>
                      ) : (
                        "Change Password"
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
