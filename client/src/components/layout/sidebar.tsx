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
        "w-64 bg-white shadow-lg h-full fixed md:relative z-20 transition-all duration-300",
        !isMobileSidebarOpen && "transform -translate-x-full md:transform-none"
      )}
    >
      <div className="flex flex-col h-full">
        {/* User info */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" alt={user?.fullName || user?.username} />
              <AvatarFallback className="bg-primary text-white">
                {user?.fullName ? getInitials(user.fullName) : user?.username?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{user?.fullName || user?.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {/* Main menu */}
          <div className="px-4 mb-2">
            <p className="text-xs uppercase text-gray-500 font-medium">Main menu</p>
          </div>
          <ul className="space-y-1">
            <li>
              <Link href="/">
                <a className={cn(
                  "flex items-center space-x-3 px-4 py-3 text-sm font-medium hover:bg-gray-100 transition-colors",
                  isActive("/") && "text-primary border-l-4 border-primary bg-blue-50"
                )}>
                  <Home size={18} className={isActive("/") ? "text-primary" : "text-gray-500"} />
                  <span>Dashboard</span>
                </a>
              </Link>
            </li>
            
            <li>
              <Link href="/profile">
                <a className={cn(
                  "flex items-center space-x-3 px-4 py-3 text-sm font-medium hover:bg-gray-100 transition-colors",
                  isActive("/profile") && "text-primary border-l-4 border-primary bg-blue-50"
                )}>
                  <User size={18} className={isActive("/profile") ? "text-primary" : "text-gray-500"} />
                  <span>My Profile</span>
                </a>
              </Link>
            </li>
            
            {(user?.role === "admin" || user?.role === "teacher") && (
              <li>
                <Link href="/students">
                  <a className={cn(
                    "flex items-center space-x-3 px-4 py-3 text-sm font-medium hover:bg-gray-100 transition-colors",
                    isActive("/students") && "text-primary border-l-4 border-primary bg-blue-50"
                  )}>
                    <Users size={18} className={isActive("/students") ? "text-primary" : "text-gray-500"} />
                    <span>Students</span>
                  </a>
                </Link>
              </li>
            )}
            
            <li>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="tests" className="border-none">
                  <AccordionTrigger className="py-3 px-4 hover:bg-gray-100 hover:no-underline text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <Activity size={18} className="text-gray-500" />
                      <span>Tests & Samples</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-0 pb-1">
                    <ul className="pl-8">
                      <li>
                        <Link href="/tests">
                          <a className={cn(
                            "flex items-center py-2 px-4 text-sm hover:bg-gray-100 transition-colors rounded-md",
                            isActive("/tests") && "text-primary bg-blue-50"
                          )}>
                            Physical Tests
                          </a>
                        </Link>
                      </li>
                      <li>
                        <Link href="/samples">
                          <a className={cn(
                            "flex items-center py-2 px-4 text-sm hover:bg-gray-100 transition-colors rounded-md",
                            isActive("/samples") && "text-primary bg-blue-50"
                          )}>
                            Health Samples
                          </a>
                        </Link>
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </li>
            
            {(user?.role === "admin" || user?.role === "teacher") && (
              <li>
                <Link href="/reports">
                  <a className={cn(
                    "flex items-center space-x-3 px-4 py-3 text-sm font-medium hover:bg-gray-100 transition-colors",
                    isActive("/reports") && "text-primary border-l-4 border-primary bg-blue-50"
                  )}>
                    <BarChart size={18} className={isActive("/reports") ? "text-primary" : "text-gray-500"} />
                    <span>Reports</span>
                  </a>
                </Link>
              </li>
            )}
            
            <li>
              <Link href="/settings">
                <a className={cn(
                  "flex items-center space-x-3 px-4 py-3 text-sm font-medium hover:bg-gray-100 transition-colors",
                  isActive("/settings") && "text-primary border-l-4 border-primary bg-blue-50"
                )}>
                  <Settings size={18} className={isActive("/settings") ? "text-primary" : "text-gray-500"} />
                  <span>Settings</span>
                </a>
              </Link>
            </li>
          </ul>
          
          {/* Admin menu */}
          {user?.role === "admin" && (
            <>
              <div className="px-4 mb-2 mt-6">
                <p className="text-xs uppercase text-gray-500 font-medium">Administration</p>
              </div>
              <ul className="space-y-1">
                <li>
                  <Link href="/admin/users">
                    <a className={cn(
                      "flex items-center space-x-3 px-4 py-3 text-sm font-medium hover:bg-gray-100 transition-colors",
                      isActive("/admin/users") && "text-primary border-l-4 border-primary bg-blue-50"
                    )}>
                      <Laptop size={18} className={isActive("/admin/users") ? "text-primary" : "text-gray-500"} />
                      <span>User Management</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/admin/faculties">
                    <a className={cn(
                      "flex items-center space-x-3 px-4 py-3 text-sm font-medium hover:bg-gray-100 transition-colors",
                      isActive("/admin/faculties") && "text-primary border-l-4 border-primary bg-blue-50"
                    )}>
                      <Building2 size={18} className={isActive("/admin/faculties") ? "text-primary" : "text-gray-500"} />
                      <span>Faculties</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/admin/groups">
                    <a className={cn(
                      "flex items-center space-x-3 px-4 py-3 text-sm font-medium hover:bg-gray-100 transition-colors",
                      isActive("/admin/groups") && "text-primary border-l-4 border-primary bg-blue-50"
                    )}>
                      <Briefcase size={18} className={isActive("/admin/groups") ? "text-primary" : "text-gray-500"} />
                      <span>Groups</span>
                    </a>
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
            className="flex items-center space-x-3 text-sm font-medium text-gray-600 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
