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
import { TEST_TYPES, CONTROL_EXERCISE_TYPES, TEST_TYPES_CAMEL, CONTROL_EXERCISE_TYPES_CAMEL, PhysicalTest, Student, Period, SportResult } from "@shared/schema";
import { format } from "date-fns";



export default function Tests() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("tests");
  
const { data: tests, isLoading } = useQuery<PhysicalTest[]>({
  queryKey: [user?.role === "student" ? `/api/physical-tests/${user.id}` : "/api/tests/all"],
});
const filteredTests = tests?.filter((test) => test.periodId === Number(periodFilter)|| periodFilter === "all");
const { data: sport_results, isLoading: isLoadingResults } = useQuery<SportResult[]>({
  queryKey: [user?.role === "student" ? `/api/physical-tests/${user.id}` : `/api/sport-results-period/${periodFilter}`],
  enabled: periodFilter !== "all",
});

const filteredSportResults = sport_results?.filter((test) => test.periodId === Number(periodFilter));
 const { data: students = [], isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: user?.role !== "student"
  });

   const { data: periods = [], isLoading: isLoadingPeriods } = useQuery<
      Period[]
    >({
      queryKey: ["/api/periods"],
      enabled: !!user,
    });

const formatTestType2 = (type: string) => {
  return type.split('_').map((word, index) => {
    // Первое слово оставляем в lowercase, остальные с заглавной буквы
    if (index === 0) {
      return word.toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
};





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
                  <div className="space-y-2">
                <label className="text-sm font-medium">Period</label>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select Period</SelectItem>
                    {periods?.map((student) => {
                      if (!student?.periodId) return null; // Skip if no valid ID
                      return (
                        <SelectItem
                          key={student.periodId}
                          value={student.periodId.toString()}
                        >
                          {student.periodOfStudy}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              </div>
            </div>
             </CardHeader>
             {periodFilter === "all" ? (
                <div className="text-center py-12">
                      
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select a period
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Please select a period from the filters panel to
                        watch records.
                      </p>
                    </div>
             ) : (
            <Tabs defaultValue="tests" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="tests">Physical Tests</TabsTrigger>
                <TabsTrigger value="exercises">Control Exercises</TabsTrigger>
              </TabsList>
            
          <TabsContent value="tests" className="m-0">
              <div className="text-center py-16">
               <CardContent>
            {isLoading ? (
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
                        
                          <th className="px-4 py-3">Student</th>
                          
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Period</th>
                          <th className="px-4 py-3">Push ups</th>
                          <th className="px-4 py-3">Pull ups</th>
                          <th className="px-4 py-3">Leg hold</th>
                          <th className="px-4 py-3">Tapping test</th>
                          <th className="px-4 py-3">Running in place</th>
                          <th className="px-4 py-3">Plank</th>
                          <th className="px-4 py-3">Forward Bend</th>
                           <th className="px-4 py-3">Long jump</th>
                          {/* <th className="px-4 py-3">
                            <div className="flex items-center">
                              Grade
                              <ArrowUpDown className="ml-2 h-3 w-3" />
                            </div>
                          </th>
                          <th className="px-4 py-3">Notes</th> */}
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredTests?.map((test) => (
                          <tr key={test.testId}>
                            <td className="px-4 py-4 whitespace-nowrap font-medium">
                              {user?.role === "student" ? user?.username : students.find((student) => student.userId === test.studentId)?.fullName || 'Unknown'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {test.date ? format(new Date(test.date), 'dd.MM.yyyy') : '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              {periods.find((period) => period.periodId === test.periodId)?.periodOfStudy || '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {test.pushUps || '-'}
                            </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                              {test.pullUps || '-'}
                            </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                              {test.legHold || '-'}
                            </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                              {test.tappingTest || '-'}
                            </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                              {test.runningInPlace || '-'}
                            </td>
                             <td className="px-4 py-4 whitespace-nowrap">
                              {test.forwardBend || '-'}
                            </td>
                             <td className="px-4 py-4 whitespace-nowrap">
                              {test.plank || '-'}
                            </td>
                             <td className="px-4 py-4 whitespace-nowrap">
                              {test.longJump || '-'}
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
                                  <DropdownMenuItem onClick={() => navigate(`/tests/edit/${test.testId}`)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  {user?.role === "teacher"  && (
                                    <DropdownMenuItem onClick={() => navigate(`/tests/edit/${test.testId}?grade=true`)}>
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
              </div>
            </TabsContent>
              <TabsContent value="exercises" className="m-0">
              <div className="text-center py-16">
               <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {(!filteredSportResults || filteredSportResults.length === 0) ? (
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
                        
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">Period</th>
                          <th className="px-4 py-3">Basketball freethrow</th>
                          <th className="px-4 py-3">Basketball dribble</th>
                          <th className="px-4 py-3">Volleyball pass</th>
                          <th className="px-4 py-3">Volleyball serve</th>
                          <th className="px-4 py-3">Swimming 25 m</th>
                          <th className="px-4 py-3">Swimming 50 m</th>
                          <th className="px-4 py-3">Swimming 100 m</th>
                          <th className="px-4 py-3">Running 100 m</th>
                          <th className="px-4 py-3">Running 500/1000 m</th>

                          {/* <th className="px-4 py-3">
                            <div className="flex items-center">
                              Grade
                              <ArrowUpDown className="ml-2 h-3 w-3" />
                            </div>
                          </th>
                          <th className="px-4 py-3">Notes</th> */}
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredSportResults?.map((test) => (
                          <tr key={test.sportResultId}>
                            <td className="px-4 py-4 whitespace-nowrap font-medium">
                              {students.find((student) => student.userId === test.studentId)?.fullName || 'Unknown'}
                            </td>
                           
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              {periods.find((period) => period.periodId === test.periodId)?.periodOfStudy || '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {test.basketballFreethrow || '-'}
                            </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                              {test.basketballDribble || '-'}
                            </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                              {test.volleyballPass || '-'}
                            </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                              {test.volleyballServe || '-'}
                            </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                              {test.swimming25m || '-'}
                            </td>
                             <td className="px-4 py-4 whitespace-nowrap">
                              {test.swimming50m || '-'}
                            </td>
                             <td className="px-4 py-4 whitespace-nowrap">
                              {test.swimming100m || '-'}
                            </td>
                             <td className="px-4 py-4 whitespace-nowrap">
                              {test.running100m || '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {test.running500m1000m || '-'}
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
                                  <DropdownMenuItem onClick={() => navigate(`/tests/edit/${test.sportResultId}`)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  {user?.role === "teacher"  && (
                                    <DropdownMenuItem onClick={() => navigate(`/tests/edit/${test.sportResultId}?grade=true`)}>
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
              </div>
            </TabsContent>
           </Tabs> 
           )}
        </Card>
        
      </div>
    </MainLayout>
  );
}
