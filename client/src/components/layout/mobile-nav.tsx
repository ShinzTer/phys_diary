import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Users, Activity, User } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  // Check if the current path matches the given path
  const isActive = (path: string) => {
    return location === path || location.startsWith(`${path}/`);
  };

  return (
    <nav className="md:hidden bg-white border-t shadow-lg fixed bottom-0 w-full z-10">
      <div className="flex justify-around">
        <Link href="/">
          <a className={cn(
            "flex flex-col items-center py-2 px-4",
            isActive("/") ? "text-primary" : "text-gray-500"
          )}>
            <Home size={20} />
            <span className="text-xs mt-1">Главная</span>
          </a>
        </Link>
        
        <Link href="/students">
          <a className={cn(
            "flex flex-col items-center py-2 px-4",
            isActive("/students") ? "text-primary" : "text-gray-500"
          )}>
            <Users size={20} />
            <span className="text-xs mt-1">Студенты</span>
          </a>
        </Link>
        
        <Link href="/tests">
          <a className={cn(
            "flex flex-col items-center py-2 px-4",
            isActive("/tests") || isActive("/samples") ? "text-primary" : "text-gray-500"
          )}>
            <Activity size={20} />
            <span className="text-xs mt-1">Тесты</span>
          </a>
        </Link>
        
        <Link href="/profile">
          <a className={cn(
            "flex flex-col items-center py-2 px-4",
            isActive("/profile") ? "text-primary" : "text-gray-500"
          )}>
            <User size={20} />
            <span className="text-xs mt-1">Профиль</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}
