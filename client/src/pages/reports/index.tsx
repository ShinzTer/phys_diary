import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { Link, useLocation } from "wouter";
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
import { Loader2, FileText, BarChart, PieChart, Download, Calendar, Users } from "lucide-react";
import { TEST_TYPES, SAMPLE_TYPES, MEDICAL_GROUP_TYPES } from "@shared/schema";
import { format, subDays } from "date-fns";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  CartesianGrid,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";

interface Faculty {
  id: number;
  name: string;
  facultyId?: number;
  faculty?: {
    facultyId: number;
  };
}

interface Group {
  id: number;
  name: string;
  facultyId: number;
  year: number;
}

interface Student {
  id: number;
  username: string;
  fullName?: string;
  medicalGroup?: string;
}

interface Test {
  id: number;
  date?: string;
  grade?: string;
}

interface Sample {
  id: number;
  date?: string;
  value: string;
}

interface UserData {
  id: number;
  username: string;
  fullName?: string;
}

export default function Reports() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [location] = useLocation();
  
  // Extract userId from URL query params if present
  const params = new URLSearchParams(location.includes('?') ? location.substring(location.indexOf('?')) : '');
  const userIdFromUrl = params.get('userId');
  
  const [selectedFaculty, setSelectedFaculty] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>(userIdFromUrl || "all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("semester");
  const [selectedReportType, setSelectedReportType] = useState<string>("performance");
  
  // Fetch faculties for dropdown
  const { data: faculties } = useQuery<Faculty[]>({
    queryKey: ["/api/faculties"],
  });

  // Fetch groups (filtered by faculty if selected)
  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups", selectedFaculty],
    queryFn: async () => {
      const url = selectedFaculty !== "all"
        ? `/api/groups?facultyId=${selectedFaculty}` 
        : "/api/groups";
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch groups");
      return res.json();
    },
  });

  // Fetch students (filtered by group if selected)
  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/users?role=student", selectedGroup],
    queryFn: async () => {
      const url = selectedGroup !== "all"
        ? `/api/users?role=student&groupId=${selectedGroup}`
        : "/api/users?role=student";
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });

  // Fetch all tests and samples
  const { data: tests, isLoading: isLoadingTests } = useQuery<Test[]>({
    queryKey: ["/api/tests", selectedUser],
    enabled: selectedUser !== "",
    queryFn: async () => {
      const res = await fetch(`/api/tests/${selectedUser}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tests");
      return res.json();
    },
  });

  const { data: samples, isLoading: isLoadingSamples } = useQuery<Sample[]>({
    queryKey: ["/api/samples", selectedUser],
    enabled: selectedUser !== "",
    queryFn: async () => {
      const res = await fetch(`/api/samples/${selectedUser}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch samples");
      return res.json();
    },
  });

  // Get data for selected student
  const { data: userData } = useQuery<UserData>({
    queryKey: [`/api/profile/${selectedUser}`],
    enabled: selectedUser !== "" && selectedUser !== "all",
  });

  const isLoading = isLoadingTests || isLoadingSamples || (selectedUser !== "" && selectedUser !== "all" && !userData);

  // Format test type display name
  const formatTestType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Helper function to get random performance data (for demonstration)
  const getPerformanceData = () => {
    // We'll create fake data based on the test types
    return TEST_TYPES.map(testType => {
      // Generate random value between 60 and 100
      const value = Math.floor(Math.random() * 40) + 60;
      return {
        name: formatTestType(testType),
        value
      };
    });
  };

  // Generate medical group distribution data
  const getMedicalGroupData = () => {
    // Count students by medical group
    const counts = {
      basic: 0,
      preparatory: 0,
      special: 0
    };

    students?.forEach(student => {
      if (student.medicalGroup && counts[student.medicalGroup as keyof typeof counts] !== undefined) {
        counts[student.medicalGroup as keyof typeof counts]++;
      } else {
        counts.basic++; // Default to basic if not specified
      }
    });

    return [
      { name: "Basic", value: counts.basic },
      { name: "Preparatory", value: counts.preparatory },
      { name: "Special", value: counts.special }
    ];
  };

  // Generate progress data based on tests
  const getProgressData = () => {
    if (!tests) return [];

    // Group by date (month/year) and count average performance
    const groupedByDate: Record<string, { count: number, total: number }> = {};
    
    tests.forEach(test => {
      if (!test.date) return;
      
      // Format date as month/year
      const date = new Date(test.date);
      const dateKey = format(date, 'MMM yyyy');
      
      // Convert test grade to numeric value if possible
      let score = 0;
      if (test.grade) {
        if (['A', 'EXCELLENT', '5'].includes(test.grade.toUpperCase())) score = 5;
        else if (['B', 'GOOD', '4'].includes(test.grade.toUpperCase())) score = 4;
        else if (['C', 'SATISFACTORY', '3'].includes(test.grade.toUpperCase())) score = 3;
        else if (['D', 'POOR', '2'].includes(test.grade.toUpperCase())) score = 2;
        else score = 3; // Default score
      } else {
        score = 3; // Default for ungraded tests
      }
      
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = { count: 0, total: 0 };
      }
      
      groupedByDate[dateKey].count++;
      groupedByDate[dateKey].total += score;
    });
    
    // Convert to array and calculate averages
    return Object.entries(groupedByDate).map(([date, data]) => ({
      date,
      performance: Math.round((data.total / data.count) * 20), // Scale to percentage (1-5 -> 20-100)
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Generate mock data for sample trends
  const getSampleTrendData = () => {
    if (!samples || samples.length === 0) {
      // Generate some placeholder data
      return Array.from({ length: 6 }, (_, i) => ({
        date: format(subDays(new Date(), 30 * (5 - i)), 'MMM yyyy'),
        value: Math.floor(Math.random() * 20) + 70 // Random value between 70-90
      }));
    }
    
    // Group samples by date for the selected sample type
    const samplesByDate: Record<string, number[]> = {};
    samples.forEach(sample => {
      if (!sample.date) return;
      
      // Format date as month/year
      const date = new Date(sample.date);
      const dateKey = format(date, 'MMM yyyy');
      
      if (!samplesByDate[dateKey]) {
        samplesByDate[dateKey] = [];
      }
      
      // Try to extract numeric value
      const numericValue = parseFloat(sample.value.replace(/[^\d.-]/g, ''));
      if (!isNaN(numericValue)) {
        samplesByDate[dateKey].push(numericValue);
      }
    });
    
    // Convert to array and calculate averages
    return Object.entries(samplesByDate).map(([date, values]) => {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      return {
        date,
        value: Math.round(avg * 100) / 100 // Round to 2 decimal places
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // For the pie chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Select a student and generate report
  const generateReport = () => {
    if (selectedUser) {
      // This would typically generate a PDF or detailed report
      // For now we'll just show an alert
      alert(`Report generated for user ID: ${selectedUser}`);
    } else {
      alert("Please select a student to generate a report");
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Reports</h2>
            <p className="text-gray-500">Generate and view student performance reports</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={generateReport} disabled={!selectedUser}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Report Filters</CardTitle>
              <CardDescription>
                Select criteria for your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Faculty</label>
                <Select
                  value={selectedFaculty}
                  onValueChange={setSelectedFaculty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Faculties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Faculties</SelectItem>
                    {faculties?.map(faculty => {
                      // Handle both possible faculty ID structures and ensure we have a valid ID
                      const facultyId = faculty.faculty?.facultyId || faculty.facultyId || faculty.id;
                      if (!facultyId) return null; // Skip if no valid ID
                      return (
                        <SelectItem 
                          key={facultyId} 
                          value={facultyId.toString()}
                        >
                          {faculty.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Group</label>
                <Select
                  value={selectedGroup}
                  onValueChange={setSelectedGroup}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                      {groups?.map(group => { //.data
                      if (!group?.id) return null; // Skip if no valid ID
                      return (
                        <SelectItem 
                          key={group.id} 
                          value={group.id.toString()}
                        >
                          {group.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Student</label>
                <Select
                  value={selectedUser}
                  onValueChange={setSelectedUser}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Student" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select Student</SelectItem>
                    {students?.map(student => {
                      if (!student?.id) return null; // Skip if no valid ID
                      return (
                        <SelectItem 
                          key={student.id} 
                          value={student.id.toString()}
                        >
                          {student.fullName || student.username}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select
                  value={selectedDateRange}
                  onValueChange={setSelectedDateRange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semester">This Semester</SelectItem>
                    <SelectItem value="year">Past Year</SelectItem>
                    <SelectItem value="month">Past Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select
                  value={selectedReportType}
                  onValueChange={setSelectedReportType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Report Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance Analysis</SelectItem>
                    <SelectItem value="progress">Progress Over Time</SelectItem>
                    <SelectItem value="medical">Medical Group Distribution</SelectItem>
                    <SelectItem value="samples">Physical Measurements</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={generateReport}
                disabled={!selectedUser}
              >
                <Download className="mr-2 h-4 w-4" />
                Export as PDF
              </Button>
            </CardFooter>
          </Card>

          {/* Report Content */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>
                {selectedUser && userData ? (
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    {userData.fullName || userData.username}
                    <span className="ml-2 text-sm text-gray-500">
                      (ID: {userData.id})
                    </span>
                  </div>
                ) : (
                  'Report Results'
                )}
              </CardTitle>
              <CardDescription>
                {selectedReportType === "performance" && "Test performance analysis across different exercises"}
                {selectedReportType === "progress" && "Student progress over time"}
                {selectedReportType === "medical" && "Distribution of students by medical group"}
                {selectedReportType === "samples" && "Physical measurement trends"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {!selectedUser ? (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Student</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Please select a student from the filters panel to generate a report.
                      </p>
                    </div>
                  ) : (
                    <>
                      {selectedReportType === "performance" && (
                        <div>
                          <h3 className="text-lg font-medium mb-4">Performance by Test Type</h3>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <ReBarChart
                                data={getPerformanceData()}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" name="Performance Score" fill="#1565C0" />
                              </ReBarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="mt-6">
                            <h4 className="font-medium mb-2">Summary</h4>
                            <p className="text-gray-600">
                              This chart shows the student's performance across different physical tests. 
                              Higher scores indicate better performance relative to standards for the student's age and gender.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {selectedReportType === "progress" && (
                        <div>
                          <h3 className="text-lg font-medium mb-4">Progress Over Time</h3>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={getProgressData()}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                              >
                                <defs>
                                  <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1565C0" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#1565C0" stopOpacity={0.1} />
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="date" />
                                <YAxis domain={[0, 100]} />
                                <CartesianGrid strokeDasharray="3 3" />
                                <Tooltip />
                                <Area
                                  type="monotone"
                                  dataKey="performance"
                                  stroke="#1565C0"
                                  fillOpacity={1}
                                  fill="url(#colorPerformance)"
                                  name="Performance"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="mt-6">
                            <h4 className="font-medium mb-2">Progress Analysis</h4>
                            <p className="text-gray-600">
                              This chart tracks the student's performance over time, showing improvement trends 
                              across all test categories combined.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {selectedReportType === "medical" && (
                        <div>
                          <h3 className="text-lg font-medium mb-4">Medical Group Distribution</h3>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <RePieChart>
                                <Pie
                                  data={getMedicalGroupData()}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={true}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                  {getMedicalGroupData().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </RePieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="mt-6">
                            <h4 className="font-medium mb-2">Medical Group Analysis</h4>
                            <p className="text-gray-600">
                              This chart shows the distribution of students across different medical groups. 
                              Understanding this distribution helps in planning appropriate physical education activities.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {selectedReportType === "samples" && (
                        <div>
                          <h3 className="text-lg font-medium mb-4">Physical Measurement Trends</h3>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={getSampleTrendData()}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                              >
                                <defs>
                                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.1} />
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="date" />
                                <YAxis />
                                <CartesianGrid strokeDasharray="3 3" />
                                <Tooltip />
                                <Area
                                  type="monotone"
                                  dataKey="value"
                                  stroke="#4CAF50"
                                  fillOpacity={1}
                                  fill="url(#colorValue)"
                                  name="Measurement Value"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="mt-6">
                            <h4 className="font-medium mb-2">Measurement Analysis</h4>
                            <p className="text-gray-600">
                              This chart shows trends in physical measurements over time, helping to track
                              growth, fitness levels, and health indicators.
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
