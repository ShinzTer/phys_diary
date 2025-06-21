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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Plus, Pencil, MoreHorizontal, ArrowUpDown } from "lucide-react";
import { SAMPLE_TYPES } from "@shared/schema";
import { format } from "date-fns";

interface PhysicalState {
  id: number;
  student_id: number;
  sample_type: string;
  value: string;
  notes?: string;
  date: string;
  created_at: string;
}

export default function Samples() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sampleTypeFilter, setSampleTypeFilter] = useState<string>("all");
  
 const { data: rawSamples, isLoading } = useQuery<any[]>({
  queryKey: [user?.role === "student" ? `/api/physical-states/${user.id}` : "/api/samples/all"],
});

const transformedSamples: PhysicalState[] = rawSamples?.flatMap((sample) => {
  const {
    id: stateId,
    studentId,
    date,
    created_at,
    ...measurements
  } = sample;

  return Object.entries(measurements)
    .filter(([key, value]) => SAMPLE_TYPES.includes(key) && value !== null)
    .map(([sample_type, value]) => ({
      id: `${stateId}-${sample_type}`, // id уникальный (можно string)
      student_id: studentId,
      sample_type,
      value: String(value),
      date,
      created_at,
    }));
}) ?? [];


  // Filter samples based on search term and sample type
  const filteredSamples = transformedSamples?.filter((sample: PhysicalState) => {
    const matchesSearch = sample.sample_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sample.value.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = sampleTypeFilter === "all" || sample.sample_type === sampleTypeFilter;
    
    return matchesSearch && matchesType;
  });

  // Get formatted sample type display name
  const formatSampleType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Физические пробы</h2>
            <p className="text-gray-500">Просмотр и управление записями физических проб</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск проб..."
                className="pl-9 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Link href="/samples/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Записать пробу
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Записи проб</CardTitle>
              <div className="flex gap-2">
                <Select
                  value={sampleTypeFilter}
                  onValueChange={setSampleTypeFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Все типы проб" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы проб</SelectItem>
                    {SAMPLE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {formatSampleType(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardDescription>
              Физические измерения и показатели здоровья
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {(!filteredSamples || filteredSamples.length === 0) ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">Записи проб не найдены.</p>
                    <Link href="/samples/new">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Записать новую пробу
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
                              Тип пробы
                              <ArrowUpDown className="ml-2 h-3 w-3" />
                            </div>
                          </th>
                          <th className="px-4 py-3">Значение</th>
                          <th className="px-4 py-3">Дата</th>
                          <th className="px-4 py-3">Кем записано</th>
                          <th className="px-4 py-3">Примечания</th>
                          <th className="px-4 py-3 text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredSamples?.map((sample) => (
                          <tr key={sample.id}>
                            <td className="px-4 py-4 whitespace-nowrap font-medium">
                              {formatSampleType(sample.sample_type)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {sample.value}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              {sample.date ? format(new Date(sample.date), 'MMM d, yyyy') : '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              {sample.recordedBy ? `ID: ${sample.recordedBy}` : 'Самостоятельно'}
                            </td>
                            <td className="px-4 py-4">
                              <div className="max-w-xs truncate">
                                {sample.notes || '-'}
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
                                    <Link href={`/samples/edit/${sample.id}`}>
                                      <div className="w-full flex items-center">
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Редактировать
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
