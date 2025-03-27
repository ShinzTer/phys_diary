import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { userProfileSchema, MEDICAL_GROUP_TYPES } from "@shared/schema";
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
import { Separator } from "@/components/ui/separator";
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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = userProfileSchema.extend({
  dateOfBirth: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof formSchema>;

export default function EditProfile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  
  const { data: profile, isLoading } = useQuery({
    queryKey: [`/api/profile/${user?.id}`],
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      await apiRequest("PUT", `/api/profile/${user?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${user?.id}`] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
      navigate('/profile');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    }
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      gender: "",
      dateOfBirth: "",
      placeOfBirth: "",
      address: "",
      nationality: "",
      previousSchool: "",
      facultyId: undefined,
      groupId: undefined,
      medicalGroup: "basic",
      diagnosis: "",
      previousIllnesses: "",
      educationalDepartment: "",
      currentSports: "",
      previousSports: "",
      additionalInfo: ""
    }
  });

  // Update form when profile data is loaded
  useState(() => {
    if (profile) {
      // Format date string for date input
      let dateOfBirth = profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : "";
      
      // Set each field value
      Object.entries({
        ...profile,
        dateOfBirth
      }).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.setValue(key as any, value);
        }
      });
    }
  });

  if (isLoading) {
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
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">Edit Profile</h2>
            <p className="text-gray-500">Update your personal information</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile Information</CardTitle>
                <CardDescription>
                  Please fill out your profile information accurately
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="personal" value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="education">Education</TabsTrigger>
                    <TabsTrigger value="medical">Medical</TabsTrigger>
                    <TabsTrigger value="sports">Sports</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="personal">
                    <div className="grid gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
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
                              <FormLabel>Gender</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="placeOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Place of Birth</FormLabel>
                              <FormControl>
                                <Input placeholder="City, Country" {...field} />
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
                              <FormLabel>Nationality</FormLabel>
                              <FormControl>
                                <Input placeholder="Your nationality" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Your current address" 
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
                  
                  <TabsContent value="education">
                    <div className="grid gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="previousSchool"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Previous School</FormLabel>
                              <FormControl>
                                <Input placeholder="Name of your previous school" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="educationalDepartment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Educational Department</FormLabel>
                              <FormControl>
                                <Input placeholder="Your educational department" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="facultyId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Faculty ID</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Your faculty ID" 
                                  {...field}
                                  onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormDescription>Please enter your assigned faculty ID</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="groupId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Group ID</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Your group ID" 
                                  {...field}
                                  onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormDescription>Please enter your assigned group ID</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="medical">
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="medicalGroup"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medical Group</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select medical group" />
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
                            <FormDescription>Your assigned medical category</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {form.watch("medicalGroup") && form.watch("medicalGroup") !== "basic" && (
                        <FormField
                          control={form.control}
                          name="diagnosis"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Diagnosis</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Medical diagnosis details" 
                                  className="resize-none" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>Required for special or preparatory medical groups</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <FormField
                        control={form.control}
                        name="previousIllnesses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Previous Illnesses</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List any previous illnesses or medical conditions" 
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
                        name="currentSports"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currently Engaged In (Sports)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List sports you are currently engaged in" 
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
                            <FormLabel>Previously Engaged In (Sports)</FormLabel>
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
                            <FormLabel>Additional Information</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Any additional information about yourself" 
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
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={navigateToProfile}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </MainLayout>
  );
}
