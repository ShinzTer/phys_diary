import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, FileBarChart, Activity, Users, BookOpen, Dumbbell } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Главная страница</h2>
          <p className="text-gray-500">Добро пожаловать, {user.fullName || user.username}</p>
        </div>
        
        {/* Dashboard content based on role */}
        {user.role === "admin" && <AdminDashboard />}
        {user.role === "teacher" && <TeacherDashboard />}
        {user.role === "student" && <StudentDashboard />}
      </div>
    </MainLayout>
  );
}

function AdminDashboard() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Панель администратора</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              Управление пользователями
            </CardTitle>
            <CardDescription>Управление пользователями системы</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Добавить, изменить или удалить пользователей разных ролей: администраторы, преподаватели и студенты.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-indigo-500" />
              факультеты
            </CardTitle>
            <CardDescription>Управление факультетами</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Организация факультетов в рамках учебного заведения.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-500" />
              Группы
            </CardTitle>
            <CardDescription>Управление группами</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Создание и управление группами студентов, связанными с факультетами.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TeacherDashboard() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Панель преподавателя</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              Профили студентов
            </CardTitle>
            <CardDescription>Просмотреть информацию студента</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Получение доступа к деталям профиля своих студентов.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <ClipboardList className="h-5 w-5 mr-2 text-indigo-500" />
              Оценка
            </CardTitle>
            <CardDescription>Оценить результаты студента</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Запись и оценивание результатов выполнения тестов и проб учащихся.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileBarChart className="h-5 w-5 mr-2 text-green-500" />
              Отчёты
            </CardTitle>
            <CardDescription>Создать отчёт</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Создать и проанализировать отчёты, основанные на резульататах нормативов.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StudentDashboard() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Панель студента</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-500" />
              Мой профиль
            </CardTitle>
            <CardDescription>Персональная информация</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Просмотр и изменение персональной информации, образования, и физического состояния.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Dumbbell className="h-5 w-5 mr-2 text-indigo-500" />
              Мои результаты
            </CardTitle>
            <CardDescription>Данные о нормативах</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Проследите свои нормативы в физических тестах, пробах и контрольных упражнениях.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-500" />
              Преподаватели
            </CardTitle>
            <CardDescription>Просмотреть информацию о преподавателе</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Просмотреть список своих преподавателей и информацию о них.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
