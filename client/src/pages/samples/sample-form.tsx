import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SAMPLE_TYPES } from "@shared/schema";
import MainLayout from "@/components/layout/main-layout";
import { useLocation, useParams } from "wouter";
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
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: number;
  username: string;
  fullName?: string;
}

interface SampleData {
  studentId: number;
  date: string;
  notes: string | null;
  [key: string]: any; // For dynamic sample type fields
}

// Form schema for sample creation/editing
const sampleFormSchema = z.object({
  userId: z.number(),
  sampleType: z.string().min(1, "Sample type is required"),
  value: z.string().min(1, "Value is required"),
  notes: z.string().optional(),
});

type SampleFormValues = z.infer<typeof sampleFormSchema>;

export default function SampleForm() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const isEdit = !!params.id;
  const sampleId = isEdit && params.id ? parseInt(params.id) : undefined;
  
  // Fetch students for teacher/admin to select a student
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/users?role=student"],
    enabled: user?.role !== "student"
  });
  
  // Fetch specific sample data when editing
  const { data: sampleData, isLoading: isLoadingSample } = useQuery<SampleData>({
    queryKey: [`/api/physical-states/${sampleId}`],
    enabled: !!isEdit && !!sampleId
  });
  
  // Setup form with default values
  const form = useForm<SampleFormValues>({
    resolver: zodResolver(sampleFormSchema),
    defaultValues: {
      userId: user?.role === "student" ? (user.studentId || 0) : 0,
      sampleType: "",
      value: "",
      notes: ""
    }
  });

  // Update form when edit data is loaded
  useEffect(() => {
    if (isEdit && sampleData) {
      const sampleType = Object.keys(sampleData).find(key => 
        SAMPLE_TYPES.includes(key as any)
      );
      
      if (sampleType) {
        form.reset({
          userId: sampleData.studentId,
          sampleType: sampleType,
          value: sampleData[sampleType]?.toString() || "",
          notes: sampleData.notes || ""
        });
      }
    }
  }, [isEdit, sampleData, form]);

  // Get formatted sample type display name
  const formatSampleType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Create sample mutation
  const createSampleMutation = useMutation({
    mutationFn: async (data: SampleFormValues) => {
      // Create an empty state data object
      const stateData: SampleData = {
        studentId: user?.role === "student" ? (user.studentId || 0) : data.userId,
        date: new Date().toISOString().split('T')[0],
        notes: data.notes || null
      };
      
      // Add the specific sample type value
      stateData[data.sampleType] = parseFloat(data.value) || data.value;
      
      await apiRequest("POST", "/api/physical-states", stateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/physical-states/${user?.studentId || user?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/physical-states"] });
      toast({
        title: "Sample recorded",
        description: "Your physical measurement has been successfully recorded."
      });
      navigate('/samples');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record sample",
        variant: "destructive"
      });
    }
  });
  
  // Update sample mutation
  const updateSampleMutation = useMutation({
    mutationFn: async (data: SampleFormValues) => {
      const stateData: SampleData = {
        studentId: user?.role === "student" ? (user.studentId || 0) : data.userId,
        date: new Date().toISOString().split('T')[0],
        notes: data.notes || null
      };
      
      stateData[data.sampleType] = parseFloat(data.value) || data.value;
      
      await apiRequest("PUT", `/api/physical-states/${sampleId}`, stateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/physical-states/${user?.studentId || user?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/physical-states"] });
      toast({
        title: "Sample updated",
        description: "The physical measurement has been successfully updated."
      });
      navigate('/samples');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update sample",
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  function onSubmit(data: SampleFormValues) {
    if (isEdit) {
      updateSampleMutation.mutate(data);
    } else {
      createSampleMutation.mutate(data);
    }
  }

  if (isEdit && isLoadingSample) {
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
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/samples')} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">{isEdit ? "Edit Sample" : "Record New Sample"}</h2>
            <p className="text-gray-500">
              {isEdit 
                ? "Update physical measurement information" 
                : "Record a new physical measurement or health indicator"
              }
            </p>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{isEdit ? "Edit Sample" : "Record New Sample"}</CardTitle>
            <CardDescription>
              {isEdit 
                ? "Make changes to the sample record" 
                : "Fill in the details for the new physical measurement"
              }
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                {/* Student selection (for teachers/admins only) */}
                {user?.role !== "student" && (
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value.toString()}
                          disabled={isEdit}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a student" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {students?.map(student => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.fullName || student.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the student for whom this measurement is being recorded
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Sample type selection */}
                <FormField
                  control={form.control}
                  name="sampleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sample Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sample type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                            Select a sample type
                          </div>
                          {SAMPLE_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {formatSampleType(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sample value */}
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter measurement value" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the measurement value with appropriate units (e.g., "180 cm", "75 kg")
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes about the measurement" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/samples')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createSampleMutation.isPending || updateSampleMutation.isPending}
                >
                  {createSampleMutation.isPending || updateSampleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEdit ? "Updating..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEdit ? "Update Sample" : "Save Sample"}
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </MainLayout>
  );
}
