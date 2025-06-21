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

interface Student {
  id: number;
  username: string;
  fullName?: string;
  medicalGroup?: string;
  facultyId?: number;
  groupId?: number;
  diagnosis?: string;
}

interface Faculty {
  id: number;
  name: string;
}

interface Group {
  id: number;
  name: string;
}

// Add proper loading states
const LoadingSpinner = () => (
  <div className="loading-overlay">
    <Loader2 className="animate-spin" />
  </div>
);

const calculateProfileCompletion = (student: Student): number => {
  const fields = [
    student.fullName,
    student.medicalGroup,
    student.facultyId,
    student.groupId,
    // Only include diagnosis in calculation if medical group is special
    student.medicalGroup === "special" ? student.diagnosis : undefined
  ];

  const filledFields = fields.filter(field => field !== undefined && field !== null).length;
  const totalFields = student.medicalGroup === "special" ? 5 : 4;
  
  return Math.round((filledFields / totalFields) * 100);
};

export default function Students() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [medicalGroupFilter, setMedicalGroupFilter] = useState<string>("all");
  
  const { data: students = [], isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: user?.role !== "student"
  });

  const { data: faculties = [], isLoading: isLoadingFaculties } = useQuery<Faculty[]>({
    queryKey: ["/api/faculties"],
  });
  console.log(faculties)
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery<Group[]>({
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
  const filteredStudents = students.filter((student: Student) => {
    const matchesSearch = 
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMedicalGroup = 
      medicalGroupFilter === "all" || 
      student.medicalGroup === medicalGroupFilter;
    
    return matchesSearch && matchesMedicalGroup;
  });

  // Get faculty and group names
  const getFacultyName = (facultyId?: number) => {
    if (!facultyId) return "Не назначен";
    const faculty = faculties.find((f: Faculty) => f.facultyId === facultyId);
    return faculty ? faculty.name : "Не найден";
  };

  const getGroupName = (groupId?: number) => {
    if (!groupId) return "Не назначен";
    const group = groups.find((g: Group) => g.groupId === groupId); //.data
    return group ? group.name : "Не найден";
  };

  const getMedicalGroupBadge = (medicalGroup?: string) => {
    if (!medicalGroup) return null;
    
    switch (medicalGroup) {
      case "basic":
        return <Badge className="bg-green-100 text-green-800">Основная</Badge>;
      case "preparatory":
        return <Badge className="bg-amber-100 text-amber-800">Подготовительная</Badge>;
      case "special":
        return <Badge className="bg-red-100 text-red-800">Специальная</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{medicalGroup}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Студенты</h2>
            <p className="text-gray-500">Просмотр и управление информацией о студентах</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск студентов..."
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
                <SelectValue placeholder="Фильтр по медицинской группе" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все медицинские группы</SelectItem>
                {MEDICAL_GROUP_TYPES.map(type => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoadingStudents || isLoadingFaculties || isLoadingGroups ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Список студентов</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Фильтры
                  </Button>
                  {user?.role === "admin" && (
                    <Link href="/admin/users">
                      <Button size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Добавить студента
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              <CardDescription>
                {filteredStudents?.length || 0} {filteredStudents?.length === 1 ? "студент" : "студентов"} найдено
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredStudents?.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Не найдено студентов, соответствующих вашему поиску.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Студент</th>
                        <th className="px-4 py-3">Факультет / Группа</th>
                        <th className="px-4 py-3">Медицинская группа</th>
                        <th className="px-4 py-3">Завершение профиля</th>
                        <th className="px-4 py-3 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredStudents?.map((student: Student) => (
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
                                <DropdownMenuLabel>Действия</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/students/${student.id}`}>
                                    <div className="w-full flex items-center">
                                      <Eye className="mr-2 h-4 w-4" />
                                      Просмотр профиля
                                    </div>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/tests/${student.id}`}>
                                    <div className="w-full flex items-center">
                                      <FileText className="mr-2 h-4 w-4" />
                                      Просмотр тестов
                                    </div>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/reports?userId=${student.id}`}>
                                    <div className="w-full flex items-center">
                                      <FileText className="mr-2 h-4 w-4" />
                                      Генерация отчета
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
