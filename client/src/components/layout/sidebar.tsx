import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart, 
  ChevronDown, 
  Users, 
  BookOpen, 
  User, 
  Settings, 
  LogOut, 
  Home, 
  Activity, 
  Laptop, 
  Building2, 
  Briefcase 
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type SidebarProps = {
  isMobileSidebarOpen: boolean;
};

export default function Sidebar({ isMobileSidebarOpen }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  // Check if the current path matches the given path
  const isActive = (path: string) => {
    return location === path || location.startsWith(`${path}/`);
  };

  // Helper function to get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside 
      className={cn(
        "w-64 bg-card text-card-foreground shadow-lg h-full fixed md:relative z-20 transition-all duration-300",
        !isMobileSidebarOpen && "transform -translate-x-full md:transform-none"
      )}
    >
      <div className="flex flex-col h-full">
        {/* User info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" alt={user?.fullName || user?.username} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.fullName ? getInitials(user.fullName) : user?.username?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{user?.fullName || user?.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {/* Main menu */}
          <div className="px-4 mb-2">
            <p className="text-xs uppercase text-muted-foreground font-medium">Главное меню</p>
          </div>
          <ul className="space-y-1">
            <li>
              <Link 
                to="/"
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                  isActive("/") && "text-primary border-l-4 border-primary bg-accent"
                )}
              >
                <Home size={18} className={isActive("/") ? "text-primary" : "text-muted-foreground"} />
                <span>Главная</span>
              </Link>
            </li>
            
            <li>
              <Link 
                to="/profile"
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                  isActive("/profile") && "text-primary border-l-4 border-primary bg-accent"
                )}
              >
                <User size={18} className={isActive("/profile") ? "text-primary" : "text-muted-foreground"} />
                <span>Мой профиль</span>
              </Link>
            </li>
            
            {(user?.role === "admin" || user?.role === "teacher") && (
              <li>
                <Link 
                  to="/students"
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                    isActive("/students") && "text-primary border-l-4 border-primary bg-accent"
                  )}
                >
                  <Users size={18} className={isActive("/students") ? "text-primary" : "text-muted-foreground"} />
                  <span>Студенты</span>
                </Link>
              </li>
            )}
            
            <li>
              <Link 
                to="/tests"
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                  isActive("/tests") && "text-primary bg-accent"
                )}
              >
                <Activity size={18} className="text-muted-foreground" />
                <span>Контрольные упражнения</span>
              </Link>
            </li>
            
            {(user?.role === "admin" || user?.role === "teacher") && (
              <li>
                <Link 
                  to="/reports"
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                    isActive("/reports") && "text-primary border-l-4 border-primary bg-accent"
                  )}
                >
                  <BarChart size={18} className={isActive("/reports") ? "text-primary" : "text-muted-foreground"} />
                  <span>Отчеты</span>
                </Link>
              </li>
            )}
            
            <li>
              <Link 
                to="/settings"
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                  isActive("/settings") && "text-primary border-l-4 border-primary bg-accent"
                )}
              >
                <Settings size={18} className={isActive("/settings") ? "text-primary" : "text-muted-foreground"} />
                <span>Настройки</span>
              </Link>
            </li>
          </ul>
          
          {/* Admin menu */}
          {user?.role === "admin" && (
            <>
              <div className="px-4 mb-2 mt-6">
                <p className="text-xs uppercase text-muted-foreground font-medium">Администрирование</p>
              </div>
              <ul className="space-y-1">
                <li>
                  <Link 
                    to="/admin/users"
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                      isActive("/admin/users") && "text-primary border-l-4 border-primary bg-accent"
                    )}
                  >
                    <Laptop size={18} className={isActive("/admin/users") ? "text-primary" : "text-muted-foreground"} />
                    <span>Управление пользователями</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/faculties"
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                      isActive("/admin/faculties") && "text-primary border-l-4 border-primary bg-accent"
                    )}
                  >
                    <Building2 size={18} className={isActive("/admin/faculties") ? "text-primary" : "text-muted-foreground"} />
                    <span>Факультеты</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/groups"
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                      isActive("/admin/groups") && "text-primary border-l-4 border-primary bg-accent"
                    )}
                  >
                    <Briefcase size={18} className={isActive("/admin/groups") ? "text-primary" : "text-muted-foreground"} />
                    <span>Группы</span>
                  </Link>
                </li>
              </ul>
            </>
          )}
        </nav>
        
        {/* Logout */}
        <div className="border-t p-4">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 text-sm font-medium text-muted-foreground hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
            <span>Выйти</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
