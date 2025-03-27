import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { Link } from "wouter";
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
import { Loader2, Search, SlidersHorizontal, UserPlus, Eye, FileText, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MEDICAL_GROUP_TYPES } from "@shared/schema";

export default function Students() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [medicalGroupFilter, setMedicalGroupFilter] = useState<string>("");
  
  const { data: students, isLoading } = useQuery({
    queryKey: ["/api/users?role=student"],
  });

  const { data: faculties, isLoading: isLoadingFaculties } = useQuery({
    queryKey: ["/api/faculties"],
  });

  const { data: groups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["/api/groups"],
  });

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "ST";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Filter students based on search and medical group filter
  const filteredStudents = students?.filter(student => {
    const matchesSearch = 
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMedicalGroup = 
      !medicalGroupFilter || 
      student.medicalGroup === medicalGroupFilter;
    
    return matchesSearch && matchesMedicalGroup;
  });

  // Get faculty and group names
  const getFacultyName = (facultyId?: number) => {
    if (!facultyId || !faculties) return "Not Assigned";
    const faculty = faculties.find(f => f.id === facultyId);
    return faculty ? faculty.name : "Not Found";
  };

  const getGroupName = (groupId?: number) => {
    if (!groupId || !groups) return "Not Assigned";
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : "Not Found";
  };

  const getMedicalGroupBadge = (medicalGroup?: string) => {
    if (!medicalGroup) return null;
    
    switch (medicalGroup) {
      case "basic":
        return <Badge className="bg-green-100 text-green-800">Basic</Badge>;
      case "preparatory":
        return <Badge className="bg-amber-100 text-amber-800">Preparatory</Badge>;
      case "special":
        return <Badge className="bg-red-100 text-red-800">Special</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{medicalGroup}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Students</h2>
            <p className="text-gray-500">View and manage student information</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students..."
                className="pl-9 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={medicalGroupFilter}
              onValueChange={setMedicalGroupFilter}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by medical group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Medical Groups</SelectItem>
                {MEDICAL_GROUP_TYPES.map(type => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading || isLoadingFaculties || isLoadingGroups ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Student List</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                  {user?.role === "admin" && (
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                  )}
                </div>
              </div>
              <CardDescription>
                {filteredStudents?.length || 0} {filteredStudents?.length === 1 ? "student" : "students"} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredStudents?.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No students found matching your search criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Faculty / Group</th>
                        <th className="px-4 py-3">Medical Group</th>
                        <th className="px-4 py-3">Profile Completion</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredStudents?.map((student) => (
                        <tr key={student.id}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarFallback>
                                  {getInitials(student.fullName || student.username)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{student.fullName || student.username}</div>
                                <div className="text-xs text-gray-500">{student.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div>{getFacultyName(student.facultyId)}</div>
                            <div className="text-xs text-gray-500">{getGroupName(student.groupId)}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {getMedicalGroupBadge(student.medicalGroup)}
                            {student.medicalGroup === "special" && student.diagnosis && (
                              <div className="text-xs text-gray-500 mt-1">
                                {student.diagnosis.length > 20 ? `${student.diagnosis.substring(0, 20)}...` : student.diagnosis}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ 
                                  width: `${calculateProfileCompletion(student)}%` 
                                }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 text-center">
                              {calculateProfileCompletion(student)}%
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
                                <DropdownMenuItem asChild>
                                  <Link href={`/students/${student.id}`}>
                                    <div className="w-full flex items-center">
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Profile
                                    </div>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/tests/${student.id}`}>
                                    <div className="w-full flex items-center">
                                      <FileText className="mr-2 h-4 w-4" />
                                      View Tests
                                    </div>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/reports?userId=${student.id}`}>
                                    <div className="w-full flex items-center">
                                      <FileText className="mr-2 h-4 w-4" />
                                      Generate Report
                                    </div>
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

// Helper function to calculate profile completion percentage
function calculateProfileCompletion(profile: any): number {
  if (!profile) return 0;

  const fields = [
    'fullName', 'gender', 'dateOfBirth', 'placeOfBirth', 'address', 
    'nationality', 'previousSchool', 'facultyId', 'groupId', 
    'medicalGroup', 'educationalDepartment', 'currentSports', 'previousSports'
  ];
  
  // Add conditional fields
  if (profile.medicalGroup === 'special' || profile.medicalGroup === 'preparatory') {
    fields.push('diagnosis');
  }

  let completedFields = 0;
  fields.forEach(field => {
    if (profile[field] && profile[field] !== '') {
      completedFields++;
    }
  });

  return Math.round((completedFields / fields.length) * 100);
}
