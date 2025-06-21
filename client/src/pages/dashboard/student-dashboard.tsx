import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Activity, 
  Trophy, 
  TrendingUp, 
  Heart, 
  Calendar, 
  Users, 
  Plus,
  ArrowUpRight
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

export default function StudentDashboard() {
  const { user } = useAuth();
  
  const { data: tests, isLoading: isLoadingTests } = useQuery({
    queryKey: [`/api/tests/${user?.id}`],
  });

  const { data: samples, isLoading: isLoadingSamples } = useQuery({
    queryKey: [`/api/samples/${user?.id}`],
  });

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: [`/api/profile/${user?.id}`],
  });

  const isLoading = isLoadingTests || isLoadingSamples || isLoadingProfile;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Панель студента</h2>
        <Link href="/profile">
          <Button variant="outline">
            Посмотреть полную информацию
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Profile Completion Notice (if incomplete) */}
          {(!profile?.dateOfBirth || !profile?.medicalGroup) && (
            <Card className="mb-6 border-amber-300 bg-amber-50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-amber-500 mr-3">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-amber-700">Заполнение информации профиля не завершено</p>
                    <p className="text-sm text-amber-600">Пожалуйста, заполните свою информацию для доступа ко всем функциям.</p>
                  </div>
                </div>
                <Link href="/profile/edit">
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                    Завершить заполнение профиля
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Физические тесты</p>
                    <p className="text-2xl font-semibold">{tests?.length || 0}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-md">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/tests">
                    <Button size="sm" variant="link" className="p-0 h-auto text-primary">
                      Посмотреть все тесты <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Физические пробы</p>
                    <p className="text-2xl font-semibold">{samples?.length || 0}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-md">
                    <Heart className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/samples">
                    <Button size="sm" variant="link" className="p-0 h-auto text-primary">
                      Посмотреть все пробы <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Мед. группа</p>
                    <p className="text-2xl font-semibold capitalize">{profile?.medicalGroup || "Не установлено"}</p>
                  </div>
                  <div className="p-2 bg-amber-100 rounded-md">
                    <Users className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  {profile?.diagnosis ? (
                    <span>Диагноз: {profile.diagnosis}</span>
                  ) : (
                    <span>Нет специальных медицинских требований</span>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Следующий запланированный тест</p>
                    <p className="text-xl font-semibold">Нет</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-md">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Нет запланированных тестов
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Быстрые действия</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/tests/new">
                    <Button className="w-full">
                      <Activity className="mr-2 h-4 w-4" />
                      Записать тест
                    </Button>
                  </Link>
                  <Link href="/samples/new">
                    <Button variant="outline" className="w-full">
                      <Heart className="mr-2 h-4 w-4" />
                      Записать пробу
                    </Button>
                  </Link>
                  <Link href="/profile/edit">
                    <Button variant="outline" className="w-full">
                      Обновить профиль
                    </Button>
                  </Link>
                  <Link href="/settings">
                    <Button variant="outline" className="w-full">
                      Настройки
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Завершение заполнения профиля</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Личная информация</span>
                      <span className="text-sm text-gray-500">75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Медицинская информация</span>
                      <span className="text-sm text-gray-500">60%</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Академическая информация</span>
                      <span className="text-sm text-gray-500">80%</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Общая информация</span>
                      <span className="text-sm text-gray-500">72%</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Tests */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Последние тесты и пробы</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tests">
                <TabsList className="mb-4">
                  <TabsTrigger value="tests">Тесты</TabsTrigger>
                  <TabsTrigger value="samples">Пробы</TabsTrigger>
                </TabsList>
                
                <TabsContent value="tests">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-2">Тип теста</th>
                          <th className="px-4 py-2">Результат</th>
                          <th className="px-4 py-2">Дата</th>
                          <th className="px-4 py-2">Оценка</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {tests?.slice(0, 5).map((test) => (
                          <tr key={test.id}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium">{test.testType}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {test.result}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {test.date ? format(new Date(test.date), 'MMM d, yyyy') : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {test.grade ? (
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                  {test.grade}
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                  Ожидается
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {(!tests || tests.length === 0) && (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                              Нет записанных тестов
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                
                <TabsContent value="samples">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-2">Тип пробы</th>
                          <th className="px-4 py-2">Значение</th>
                          <th className="px-4 py-2">Дата</th>
                          <th className="px-4 py-2">Примечания</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {samples?.slice(0, 5).map((sample) => (
                          <tr key={sample.id}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium">{sample.sampleType}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {sample.value}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {sample.date ? format(new Date(sample.date), 'MMM d, yyyy') : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {sample.notes || '-'}
                            </td>
                          </tr>
                        ))}
                        {(!samples || samples.length === 0) && (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                              Нет записанных проб
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-4 flex justify-center space-x-4">
                <Link href="/tests">
                  <Button variant="outline" size="sm">
                    Все тесты
                  </Button>
                </Link>
                <Link href="/samples">
                  <Button variant="outline" size="sm">
                    Все пробы
                  </Button>
                </Link>
                <Link href="/tests/new">
                  <Button size="sm">
                    <Plus className="mr-1 h-3 w-3" />
                    Добавить новую запись
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
