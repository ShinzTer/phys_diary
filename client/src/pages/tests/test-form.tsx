import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TEST_TYPES, CONTROL_EXERCISE_TYPES } from "@shared/schema";
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

interface UserRecord {
  studentId?: number;
  teacherId?: number;
}

interface StudentProfile {
  studentId: number;
  fullName: string;
}

interface Student {
  id: number;
  username: string;
  fullName?: string;
}

interface TestData {
  studentId: number;
  date: string;
  notes: string | null;
  grade: string | null;
  [key: string]: any; // For dynamic test type fields
}

// Form schema for test creation/editing
const testFormSchema = z.object({
  userId: z.number(),
  testType: z.string().min(1, "Test type is required"),
  result: z.string().min(1, "Result is required"),
  grade: z.string().optional(),
  notes: z.string().optional(),
});

type TestFormValues = z.infer<typeof testFormSchema>;

export default function TestForm() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const isEdit = !!params.id;
  const testId = isEdit && params.id ? parseInt(params.id) : undefined;
  
  // Get search params to check if we're in grading mode
  const [searchParams] = useLocation();
  const isGrading = searchParams.includes("grade=true");

  // First get the user record to get the studentId
  const { data: userRecord } = useQuery<UserRecord>({
    queryKey: [`/api/users/${user?.id}/record`],
    enabled: user?.role === "student" && !!user?.id,
  });
  
  // Then fetch student profile using the studentId
  const { data: studentProfile } = useQuery<StudentProfile>({
    queryKey: [`/api/profile/student/${userRecord?.studentId}`],
    enabled: !!userRecord?.studentId,
  });
  
  // Fetch students for teacher/admin to select a student
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/users?role=student"],
    enabled: user?.role !== "student"
  });
  
  // Fetch specific test data when editing
  const { data: testData, isLoading: isLoadingTest } = useQuery<TestData>({
    queryKey: [`/api/tests/${testId}`],
    enabled: !!isEdit && !!testId
  });
  
  // Setup form with default values
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      userId: 0,
      testType: "",
      result: "",
      grade: "",
      notes: ""
    }
  });

  // Update form when student profile or edit data is loaded
  useEffect(() => {
    if (user?.role === "student" && studentProfile) {
      form.setValue("userId", studentProfile.studentId);
    }
    
    if (isEdit && testData) {
      const testType = Object.keys(testData).find(key => 
        [...TEST_TYPES, ...CONTROL_EXERCISE_TYPES].includes(key as any)
      );
      
      if (testType) {
        form.reset({
          userId: testData.studentId,
          testType: testType,
          result: testData[testType]?.toString() || "",
          grade: testData.grade || "",
          notes: testData.notes || ""
        });
      }
    }
  }, [isEdit, testData, form, user?.role, studentProfile]);

  // All test types (physical tests + control exercises)
  const allTestTypes = [...TEST_TYPES, ...CONTROL_EXERCISE_TYPES];

  // Get formatted test type display name
  const formatTestType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Create test mutation
  const createTestMutation = useMutation({
    mutationFn: async (data: TestFormValues) => {
      let studentId: number;
      
      if (user?.role === "student") {
        if (!studentProfile?.studentId) {
          throw new Error("Student profile not found. Please contact your administrator.");
        }
        studentId = studentProfile.studentId;
      } else {
        studentId = data.userId;
      }

      if (!studentId) {
        throw new Error("Student ID is required");
      }

      // Create test data object
      const testData: TestData = {
        studentId,
        date: new Date().toISOString().split('T')[0],
        notes: data.notes || null,
        grade: data.grade || null
      };
      
      // Add the specific test type value
      testData[data.testType] = parseFloat(data.result) || data.result;
      
      await apiRequest("POST", "/api/physical-tests", testData);
    },
    onSuccess: () => {
      const studentId = user?.role === "student" ? studentProfile?.studentId : form.getValues("userId");
      queryClient.invalidateQueries({ queryKey: [`/api/physical-tests/${studentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/physical-tests"] });
      toast({
        title: "Test recorded",
        description: "Your test result has been successfully recorded."
      });
      navigate('/tests');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record test",
        variant: "destructive"
      });
    }
  });
  
  // Update test mutation
  const updateTestMutation = useMutation({
    mutationFn: async (data: TestFormValues) => {
      let studentId: number;
      
      if (user?.role === "student") {
        if (!studentProfile?.studentId) {
          throw new Error("Student profile not found");
        }
        studentId = studentProfile.studentId;
      } else {
        studentId = data.userId;
      }

      if (!studentId) {
        throw new Error("Student ID is required");
      }

      const testData: TestData = {
        studentId,
        date: new Date().toISOString().split('T')[0],
        notes: data.notes || null,
        grade: data.grade || null
      };
      
      testData[data.testType] = parseFloat(data.result) || data.result;
      
      await apiRequest("PUT", `/api/physical-tests/${testId}`, testData);
    },
    onSuccess: () => {
      const studentId = user?.role === "student" ? studentProfile?.studentId : form.getValues("userId");
      queryClient.invalidateQueries({ queryKey: [`/api/physical-tests/${studentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/physical-tests"] });
      toast({
        title: isGrading ? "Test graded" : "Test updated",
        description: isGrading 
          ? "The test has been successfully graded." 
          : "The test has been successfully updated."
      });
      navigate('/tests');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update test",
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  function onSubmit(data: TestFormValues) {
    if (isEdit) {
      updateTestMutation.mutate(data);
    } else {
      createTestMutation.mutate(data);
    }
  }

  if (isEdit && isLoadingTest) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const pageTitle = isEdit 
    ? (isGrading ? "Grade Test" : "Edit Test Record") 
    : "Record New Test";

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/tests')} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">{pageTitle}</h2>
            <p className="text-gray-500">
              {isEdit 
                ? (isGrading ? "Assign a grade to this test" : "Update test information") 
                : "Record a new physical test or control exercise"
              }
            </p>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{pageTitle}</CardTitle>
            <CardDescription>
              {isEdit 
                ? (isGrading ? "Review and grade this test result" : "Make changes to the test record") 
                : "Fill in the details for the new test"
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
                          Select the student for whom this test is being recorded
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Test type selection - disabled in grading mode */}
                <FormField
                  control={form.control}
                  name="testType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isGrading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select test type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* Category headers and section dividers */}
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                            Select a test type
                          </div>
                          {/* Physical Tests Section */}
                          <div className="px-2 py-1.5 text-sm font-semibold text-primary">
                            Physical Tests
                          </div>
                          {TEST_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {formatTestType(type)}
                            </SelectItem>
                          ))}
                          
                          {/* Control Exercises Section */}
                          <div className="px-2 py-1.5 text-sm font-semibold text-primary">
                            Control Exercises
                          </div>
                          {CONTROL_EXERCISE_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {formatTestType(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Test result - disabled in grading mode */}
                <FormField
                  control={form.control}
                  name="result"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Result</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter test result" {...field} disabled={isGrading} />
                      </FormControl>
                      <FormDescription>
                        Enter the numeric or descriptive result (e.g., "12 reps", "180 cm")
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Grade - only enabled for teachers or in grading mode */}
                {(user?.role === "teacher" || user?.role === "admin" || isGrading) && (
                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter grade" {...field} />
                        </FormControl>
                        <FormDescription>
                          Assign a grade (e.g., A, B, C, D or numeric 1-5)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes about the test" 
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
                  onClick={() => navigate('/tests')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTestMutation.isPending || updateTestMutation.isPending}
                >
                  {createTestMutation.isPending || updateTestMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEdit ? (isGrading ? "Saving Grade..." : "Updating...") : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEdit ? (isGrading ? "Save Grade" : "Update Test") : "Save Test"}
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
