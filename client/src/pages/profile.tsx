import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { ProfileForm } from "@/components/profile/profile-form";

export default function Profile() {
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar for desktop */}
      <div className="hidden md:block h-screen">
        <Sidebar isMobileSidebarOpen={isMobileSidebarOpen} />
      </div>
      
      {/* Mobile navigation */}
      <MobileNav />
      
      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">My Profile</h1>
          
          <ProfileForm userId={user.id} isEditable={true} />
        </div>
      </main>
    </div>
  );
}
