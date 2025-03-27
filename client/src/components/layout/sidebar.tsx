import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  GraduationCap,
  UsersRound,
  UserCircle,
  ClipboardList,
  BarChart3,
  Dumbbell,
  ChalkboardTeacher,
  Settings,
  LogOut,
  Buildings,
  UserCog
} from "lucide-react";

interface SidebarProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

export function Sidebar({ isMobile = false, onLinkClick }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleLinkClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  if (!user) return null;

  return (
    <div className={`flex flex-col h-full bg-gray-800 text-white ${isMobile ? "w-full" : "w-64"}`}>
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">PhysEd Control</h1>
      </div>
      
      <div className="p-4">
        <div className="font-medium">{user.fullName || user.username}</div>
        <div className="text-sm text-gray-400 capitalize">{user.role}</div>
      </div>
      
      {/* Admin Navigation */}
      {user.role === "admin" && (
        <div className="mt-2">
          <p className="px-4 py-2 text-xs uppercase text-gray-500 font-semibold">Administration</p>
          <ul>
            <li className="px-2">
              <Link href="/admin/users">
                <a 
                  className={`flex items-center px-4 py-2 ${location === "/admin/users" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"} rounded`}
                  onClick={handleLinkClick}
                >
                  <UserCog className="mr-3 h-4 w-4 text-gray-400" />
                  <span>User Management</span>
                </a>
              </Link>
            </li>
            <li className="px-2">
              <Link href="/admin/faculties">
                <a 
                  className={`flex items-center px-4 py-2 ${location === "/admin/faculties" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"} rounded`}
                  onClick={handleLinkClick}
                >
                  <Buildings className="mr-3 h-4 w-4 text-gray-400" />
                  <span>Faculties</span>
                </a>
              </Link>
            </li>
            <li className="px-2">
              <Link href="/admin/groups">
                <a 
                  className={`flex items-center px-4 py-2 ${location === "/admin/groups" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"} rounded`}
                  onClick={handleLinkClick}
                >
                  <UsersRound className="mr-3 h-4 w-4 text-gray-400" />
                  <span>Groups</span>
                </a>
              </Link>
            </li>
          </ul>
        </div>
      )}
      
      {/* Teacher Navigation */}
      {(user.role === "teacher" || user.role === "admin") && (
        <div className="mt-2">
          <p className="px-4 py-2 text-xs uppercase text-gray-500 font-semibold">Teacher Tools</p>
          <ul>
            <li className="px-2">
              <Link href="/teacher/student-profiles">
                <a 
                  className={`flex items-center px-4 py-2 ${location === "/teacher/student-profiles" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"} rounded`}
                  onClick={handleLinkClick}
                >
                  <GraduationCap className="mr-3 h-4 w-4 text-gray-400" />
                  <span>Student Profiles</span>
                </a>
              </Link>
            </li>
            <li className="px-2">
              <Link href="/teacher/assessment">
                <a 
                  className={`flex items-center px-4 py-2 ${location === "/teacher/assessment" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"} rounded`}
                  onClick={handleLinkClick}
                >
                  <ClipboardList className="mr-3 h-4 w-4 text-gray-400" />
                  <span>Assessment</span>
                </a>
              </Link>
            </li>
            <li className="px-2">
              <Link href="/teacher/reports">
                <a 
                  className={`flex items-center px-4 py-2 ${location === "/teacher/reports" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"} rounded`}
                  onClick={handleLinkClick}
                >
                  <BarChart3 className="mr-3 h-4 w-4 text-gray-400" />
                  <span>Reports</span>
                </a>
              </Link>
            </li>
          </ul>
        </div>
      )}
      
      {/* Student Navigation */}
      {(user.role === "student" || user.role === "admin") && (
        <div className="mt-2">
          <p className="px-4 py-2 text-xs uppercase text-gray-500 font-semibold">Student</p>
          <ul>
            <li className="px-2">
              <Link href="/profile">
                <a 
                  className={`flex items-center px-4 py-2 ${location === "/profile" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"} rounded`}
                  onClick={handleLinkClick}
                >
                  <UserCircle className="mr-3 h-4 w-4 text-gray-400" />
                  <span>My Profile</span>
                </a>
              </Link>
            </li>
            <li className="px-2">
              <Link href="/student/results">
                <a 
                  className={`flex items-center px-4 py-2 ${location === "/student/results" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"} rounded`}
                  onClick={handleLinkClick}
                >
                  <Dumbbell className="mr-3 h-4 w-4 text-gray-400" />
                  <span>My Results</span>
                </a>
              </Link>
            </li>
            <li className="px-2">
              <Link href="/student/teachers">
                <a 
                  className={`flex items-center px-4 py-2 ${location === "/student/teachers" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"} rounded`}
                  onClick={handleLinkClick}
                >
                  <ChalkboardTeacher className="mr-3 h-4 w-4 text-gray-400" />
                  <span>Teachers</span>
                </a>
              </Link>
            </li>
          </ul>
        </div>
      )}
      
      {/* Common Navigation */}
      <div className="mt-auto">
        <p className="px-4 py-2 text-xs uppercase text-gray-500 font-semibold">Settings</p>
        <ul>
          <li className="px-2">
            <Link href="/settings">
              <a 
                className={`flex items-center px-4 py-2 ${location === "/settings" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"} rounded`}
                onClick={handleLinkClick}
              >
                <Settings className="mr-3 h-4 w-4 text-gray-400" />
                <span>Appearance</span>
              </a>
            </Link>
          </li>
          <li className="px-2">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 rounded"
            >
              <LogOut className="mr-3 h-4 w-4 text-gray-400" />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
