import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TEST_TYPES, CONTROL_EXERCISE_TYPES, Period, TEST_TYPES_CAMEL } from "@shared/schema";
import MainLayout from "@/components/layout/main-layout";
import { useLocation, useParams } from "wouter";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { date } from "drizzle-orm/mysql-core";

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
  periodId: number;
  pushUps?: number;
  legHold?: number;
  tappingTest?: number;
  runningInPlace?: number;
  halfSquat?: number;
  pullUps?: number;
  plank?: number;
  forwardBend?: number;
  longJump?: number;
}

// Form schema for test creation/editing
const testFormSchema = z.object({
  studentId: z.number(),
  periodId: z.number(),
  pushUps: z.number().optional(),
  legHold: z.number().optional(),
  tappingTest: z.number().optional(),
  runningInPlace: z.number().optional(),
  halfSquat: z.number().optional(),
  pullUps: z.number().optional(),
  plank: z.number().optional(),
  forwardBend: z.number().optional(),
  longJump: z.number().optional(),
  // grade: z.string().optional(),
  // notes: z.string().optional(),
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

  const { data: periods = [], isLoading: isLoadingPeriods } = useQuery<
    Period[]
  >({
    queryKey: ["/api/periods"],
    enabled: user?.role !== "student",
  });

  // Fetch students for teacher/admin to select a student
  const { data: students = [], isLoading: isLoadingStudents } = useQuery<
    Student[]
  >({
    queryKey: ["/api/student/users"],
    enabled: user?.role !== "student",
  });

  // Fetch specific test data when editing
  const { data: testData, isLoading: isLoadingTest } = useQuery<TestData>({
    queryKey: [`/api/physical-tests-id/${testId}`],
    enabled: !!isEdit && !!testId,
  }); 
console.log(testData)
  // Setup form with default values
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      studentId: testData?.studentId ?? 0,
      periodId: testData?.periodId ?? 0,
      pushUps: testData?.studentId ?? 0,
      legHold: testData?.legHold ?? 0,
      tappingTest: testData?.tappingTest ?? 0,
      runningInPlace: testData?.runningInPlace ?? 0,
      halfSquat: testData?.halfSquat ?? 0,
      pullUps: testData?.pullUps ?? 0,
      plank: testData?.plank ?? 0,
      forwardBend: testData?.forwardBend ?? 0,
      longJump: testData?.longJump ?? 0,
    },
  });
console.log(studentProfile)
  // Update form when student profile or edit data is loaded
  useEffect(() => {
    if (user?.role === "student" && testData  ) {
      form.setValue("studentId", testData?.studentId);
    }

    if (isEdit && testData) {
      const testType = Object.keys(testData).find((key) =>
        [...TEST_TYPES_CAMEL].includes(key as any)
      );

      if (testType) {
        form.reset({
          studentId: testData.studentId,
          periodId: testData.periodId,
          pushUps: testData.pushUps ?? 0,
          legHold: testData.legHold ?? 0,
          tappingTest: testData.tappingTest ?? 0,
          runningInPlace: testData.runningInPlace ?? 0,
          halfSquat: testData.halfSquat ?? 0,
          pullUps: testData.pullUps ?? 0,
          plank: testData.plank ?? 0,
          forwardBend: testData.forwardBend ?? 0,
          longJump: testData.longJump ?? 0,
        });
      }
    }
  }, [isEdit, testData, form, user?.role, studentProfile]);

  // All test types (physical tests + control exercises)
  const allTestTypes = [...TEST_TYPES, ...CONTROL_EXERCISE_TYPES];

  // Get formatted test type display name
  const formatTestType = (type: string) => {
    const ret = type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return ret;
  };
  const formatTestType2 = (type: string) => {
    return type
      .split("_")
      .map((word, index) => {
        // Первое слово оставляем в lowercase, остальные с заглавной буквы
        if (index === 0) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join("");
  };

  // Create test mutation
  const createTestMutation = useMutation({
    mutationFn: async (data: TestFormValues) => {
      let studentId: number;
      
      if (user?.role === "student") {
        if (!studentProfile?.studentId) {
          throw new Error(
            "Student profile not found. Please contact your administrator."
          );
        }
        studentId = studentProfile.studentId;
      } else {
        studentId = data.studentId;
      }

      if (!studentId) {
        throw new Error("Student ID is required");
      }

      // Create test data object
      const testData: TestData = {
        studentId: data.studentId,
        date: new Date().toISOString().split("T")[0],
        periodId: data.periodId,
        pushUps: data.pushUps ?? 0,
        legHold: data.legHold ?? 0,
        tappingTest: data.tappingTest ?? 0,
        runningInPlace: data.runningInPlace ?? 0,
        halfSquat: data.halfSquat ?? 0,
        pullUps: data.pullUps ?? 0,
        plank: data.plank ?? 0,
        forwardBend: data.forwardBend ?? 0,
        longJump: data.longJump ?? 0,
      };

      await apiRequest("POST", "/api/physical-tests", testData);
    },
    onSuccess: () => {
      const studentId =
        user?.role === "student"
          ? studentProfile?.studentId
          : form.getValues("studentId");
      queryClient.invalidateQueries({
        queryKey: [`/api/physical-tests/${studentId}`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/physical-tests"] });
      toast({
        title: "Test recorded",
        description: "Your test result has been successfully recorded.",
      });
      navigate("/tests");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record test",
        variant: "destructive",
      });
    },
  });

  // Update test mutation
  const updateTestMutation = useMutation({
    mutationFn: async (data: TestFormValues) => {
      let studentId: number;
   console.log(studentProfile)
      if (user?.role === "student") {
        if (!studentProfile?.student_id) {
          throw new Error("Student profile not found");
        }
        studentId = studentProfile.student_id;
      } else {
        studentId = data.studentId;
      }

      if (!studentId) {
        throw new Error("Student ID is required");
      }

      const testData: TestData = {
        studentId: data.studentId,
        date: new Date().toISOString().split("T")[0],
        periodId: data.periodId,
        pushUps: data.pushUps ?? 0,
        legHold: data.legHold ?? 0,
        tappingTest: data.tappingTest ?? 0,
        runningInPlace: data.runningInPlace ?? 0,
        halfSquat: data.halfSquat ?? 0,
        pullUps: data.pullUps ?? 0,
        plank: data.plank ?? 0,
        forwardBend: data.forwardBend ?? 0,
        longJump: data.longJump ?? 0,
      };

      await apiRequest("PUT", `/api/physical-tests/${testId}`, testData);
    },
    onSuccess: () => {
      const studentId =
        user?.role === "student"
          ? studentProfile?.studentId
          : form.getValues("studentId");
      queryClient.invalidateQueries({
        queryKey: [`/api/physical-tests/${studentId}`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/physical-tests"] });
      toast({
        title: isGrading ? "Test graded" : "Test updated",
        description: isGrading
          ? "The test has been successfully graded."
          : "The test has been successfully updated.",
      });
      navigate("/tests");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update test",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(data: TestFormValues) {
    if (isEdit) {
      updateTestMutation.mutate(data);
    } else {
     
      createTestMutation.mutate(data);
    }
  }

  if (isEdit && isLoadingTest && isLoadingStudents) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const pageTitle = isEdit
    ? isGrading
      ? "Grade Test"
      : "Edit Test Record"
    : "Record New Test";

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/tests")}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">{pageTitle}</h2>
            <p className="text-gray-500">
              {isEdit
                ? isGrading
                  ? "Assign a grade to this test"
                  : "Update test information"
                : "Record a new physical test or control exercise"}
            </p>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{pageTitle}</CardTitle>
            <CardDescription>
              {isEdit
                ? isGrading
                  ? "Review and grade this test result"
                  : "Make changes to the test record"
                : "Fill in the details for the new test"}
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.log("FORM ERRORS:", errors);
              })}
            >
              {user?.role !== "student" && (
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        defaultValue={field.value.toString()}
                        disabled={isEdit}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students?.map((student) => (
                            <SelectItem
                              key={student.id}
                              value={student.id.toString()}
                            >
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

              <FormField
                control={form.control}
                name="periodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period</FormLabel>
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
                        {periods?.map((period) => (
                          <SelectItem
                            key={period.periodId}
                            value={period.periodId.toString()}
                          >
                            {period.periodOfStudy}
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

              <CardContent className="space-y-4">
                {/* Табличный ввод */}
                <div className="overflow-x-auto">
                  <table className="w-full table-auto border border-gray-200 text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Test Name</th>
                        <th className="p-2 text-left">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Push-Ups", key: "pushUps" },
                        { name: "Leg Hold", key: "legHold" },
                        { name: "Tapping Test", key: "tappingTest" },
                        { name: "Running in Place", key: "runningInPlace" },
                        { name: "Half Squat", key: "halfSquat" },
                        { name: "Pull-Ups", key: "pullUps" },
                        { name: "Plank", key: "plank" },
                        { name: "Forward Bend", key: "forwardBend" },
                        { name: "Long Jump", key: "longJump" },
                      ].map((test) => (
                        <tr key={test.key} className="border-t border-gray-100">
                          <td className="p-2 font-medium">{test.name}</td>
                          <td className="p-2">
                            <FormField
                              control={form.control}
                              name={test.key as keyof TestFormValues}
                              render={({ field }) => (
                                <Input
                                  type="number"
                                  step={test.key === "longJump" ? "0.01" : "1"}
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const inputValue = e.target.value;
                                    field.onChange(
                                      inputValue === ""
                                        ? undefined
                                        : Number(inputValue)
                                    );
                                  }}
                                />
                              )}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/tests")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createTestMutation.isPending || updateTestMutation.isPending
                  }
                >
                  {createTestMutation.isPending ||
                  updateTestMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEdit
                        ? isGrading
                          ? "Saving Grade..."
                          : "Updating..."
                        : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEdit
                        ? isGrading
                          ? "Save Grade"
                          : "Update Test"
                        : "Save Test"}
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
