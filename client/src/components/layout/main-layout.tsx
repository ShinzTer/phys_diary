import { useState, ReactNode } from "react";
import Header from "./header";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import { useAuth } from "@/hooks/use-auth";

type MainLayoutProps = {
  children: ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="h-screen flex flex-col">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isMobileSidebarOpen={mobileSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto bg-neutral-50 pb-16 md:pb-0">
          {children}
        </main>
      </div>
      
      <MobileNav />
      
      {/* Overlay for mobile sidebar */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
    </div>
  );
}
