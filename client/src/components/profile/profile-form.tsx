import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
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

// Define the schema for profile updates
const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string().optional(),
  placeOfBirth: z.string().optional(),
  address: z.string().optional(),
  nationality: z.string().optional(),
  schoolGraduated: z.string().optional(),
  medicalGroup: z.enum(["basic", "preparatory", "special"]).optional(),
  medicalDiagnosis: z.string().optional(),
  previousIllnesses: z.string().optional(),
  educationalDepartment: z.string().optional(),
  activeSports: z.string().optional(),
  previousSports: z.string().optional(),
  additionalInfo: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  userId: number;
  isEditable?: boolean;
}

export function ProfileForm({ userId, isEditable = true }: ProfileFormProps) {
  const { toast } = useToast();

  // Fetch user profile data
  const { data: user, isLoading, error } = useQuery<Omit<User, "password">>({
    queryKey: [`/api/profile/${userId}`],
  });

  // Create form with react-hook-form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      gender: "male",
      dateOfBirth: "",
      placeOfBirth: "",
      address: "",
      nationality: "",
      schoolGraduated: "",
      medicalGroup: "basic",
      medicalDiagnosis: "",
      previousIllnesses: "",
      educationalDepartment: "",
      activeSports: "",
      previousSports: "",
      additionalInfo: "",
    },
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName || "",
        gender: user.gender || "male",
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
        placeOfBirth: user.placeOfBirth || "",
        address: user.address || "",
        nationality: user.nationality || "",
        schoolGraduated: user.schoolGraduated || "",
        medicalGroup: user.medicalGroup || "basic",
        medicalDiagnosis: user.medicalDiagnosis || "",
        previousIllnesses: user.previousIllnesses || "",
        educationalDepartment: user.educationalDepartment || "",
        activeSports: user.activeSports || "",
        previousSports: user.previousSports || "",
        additionalInfo: user.additionalInfo || "",
      });
    }
  }, [user, form]);

  // Create mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PUT", `/api/profile/${userId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${userId}`] });
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
        <p className="text-red-500">Error loading profile: {error.message}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your personal and medical information</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-medium">Personal Information</h3>
              <Separator className="my-3" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
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
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        disabled={!isEditable}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
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
                
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          disabled={!isEditable}
                        />
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
                        <Input
                          {...field}
                          disabled={!isEditable}
                          placeholder="City, Country"
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
                      <FormLabel>Nationality</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditable}
                          placeholder="Your nationality"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditable}
                          placeholder="Your current address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Educational Information */}
            <div>
              <h3 className="text-lg font-medium">Educational Information</h3>
              <Separator className="my-3" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="schoolGraduated"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Graduated</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditable}
                          placeholder="Previous school"
                        />
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
                        <Input
                          {...field}
                          disabled={!isEditable}
                          placeholder="Your department"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Medical Information */}
            <div>
              <h3 className="text-lg font-medium">Medical Information</h3>
              <Separator className="my-3" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="medicalGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Group</FormLabel>
                      <Select
                        disabled={!isEditable}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select medical group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="preparatory">Preparatory</SelectItem>
                          <SelectItem value="special">Special</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Your assigned medical group for physical education
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="medicalDiagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Diagnosis</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={!isEditable}
                          placeholder="If applicable, enter diagnosis"
                          className="resize-none"
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Required for special or preparatory medical groups
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="previousIllnesses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous Illnesses</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={!isEditable}
                          placeholder="List any previous significant illnesses"
                          className="resize-none"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Sports Information */}
            <div>
              <h3 className="text-lg font-medium">Sports Information</h3>
              <Separator className="my-3" />
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="activeSports"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currently Active Sports</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={!isEditable}
                          placeholder="List sports you are currently engaged in"
                          className="resize-none"
                          rows={3}
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
                      <FormLabel>Previous Sports</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={!isEditable}
                          placeholder="List sports you were previously engaged in"
                          className="resize-none"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-medium">Additional Information</h3>
              <Separator className="my-3" />
              <FormField
                control={form.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About Yourself</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={!isEditable}
                        placeholder="Share any additional information about yourself"
                        className="resize-none"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    "Save Profile"
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
