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
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, SlidersHorizontal, Plus, Pencil, MoreHorizontal, ArrowUpDown, Star } from "lucide-react";
import { TEST_TYPES, CONTROL_EXERCISE_TYPES } from "@shared/schema";
import { format } from "date-fns";

export default function Tests() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [testTypeFilter, setTestTypeFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("tests");
  
  // Fetch tests for current user (if student) or all tests (if teacher/admin)
  const { data: tests, isLoading: isLoadingTests } = useQuery({
    queryKey: [user?.role === "student" ? `/api/tests/${user.id}` : "/api/tests"],
  });

  // Combine test types and control exercise types for filtering
  const allTestTypes = [...TEST_TYPES, ...CONTROL_EXERCISE_TYPES];
  
  // Filter tests based on search term and test type
  const filteredTests = tests?.filter(test => {
    const matchesSearch = test.testType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.result.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !testTypeFilter || test.testType === testTypeFilter;
    
    // For the tabs
    const isPhysicalTest = TEST_TYPES.includes(test.testType as any);
    const isControlExercise = CONTROL_EXERCISE_TYPES.includes(test.testType as any);
    
    if (activeTab === "tests" && !isPhysicalTest) return false;
    if (activeTab === "exercises" && !isControlExercise) return false;
    
    return matchesSearch && matchesType;
  });

  // Get formatted test type display name
  const formatTestType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get grade badge
  const getGradeBadge = (grade?: string) => {
    if (!grade) return <Badge variant="outline">Pending</Badge>;
    
    let badgeClass = "";
    switch (grade.toUpperCase()) {
      case "A":
      case "5":
      case "EXCELLENT":
        return <Badge className="bg-green-100 text-green-800">{grade}</Badge>;
      case "B":
      case "4":
      case "GOOD":
        return <Badge className="bg-blue-100 text-blue-800">{grade}</Badge>;
      case "C":
      case "3":
      case "SATISFACTORY":
        return <Badge className="bg-amber-100 text-amber-800">{grade}</Badge>;
      case "D":
      case "2":
      case "POOR":
        return <Badge className="bg-red-100 text-red-800">{grade}</Badge>;
      default:
        return <Badge>{grade}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Physical Tests</h2>
            <p className="text-gray-500">View and manage physical test results</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tests..."
                className="pl-9 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Link href="/tests/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Test
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Test Records</CardTitle>
              <div className="flex gap-2">
                <Select
                  value={testTypeFilter}
                  onValueChange={setTestTypeFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All test types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All test types</SelectItem>
                    {allTestTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {formatTestType(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Tabs defaultValue="tests" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="tests">Physical Tests</TabsTrigger>
                <TabsTrigger value="exercises">Control Exercises</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoadingTests ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {(!filteredTests || filteredTests.length === 0) ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No test records found.</p>
                    <Link href="/tests/new">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Record New Test
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-3">
                            <div className="flex items-center">
                              Test Type
                              <ArrowUpDown className="ml-2 h-3 w-3" />
                            </div>
                          </th>
                          <th className="px-4 py-3">Result</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">
                            <div className="flex items-center">
                              Grade
                              <ArrowUpDown className="ml-2 h-3 w-3" />
                            </div>
                          </th>
                          <th className="px-4 py-3">Notes</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredTests?.map((test) => (
                          <tr key={test.id}>
                            <td className="px-4 py-4 whitespace-nowrap font-medium">
                              {formatTestType(test.testType)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {test.result}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              {test.date ? format(new Date(test.date), 'MMM d, yyyy') : '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {getGradeBadge(test.grade)}
                            </td>
                            <td className="px-4 py-4">
                              <div className="max-w-xs truncate">
                                {test.notes || '-'}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => navigate(`/tests/edit/${test.id}`)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  {user?.role === "teacher" && !test.grade && (
                                    <DropdownMenuItem onClick={() => navigate(`/tests/edit/${test.id}?grade=true`)}>
                                      <Star className="mr-2 h-4 w-4" />
                                      Assign Grade
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
