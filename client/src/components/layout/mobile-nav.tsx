import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Menu, X } from "lucide-react";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden w-full bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">PhysEd Control</h1>
        <button 
          onClick={toggleMenu} 
          className="text-white focus:outline-none"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      
      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-800 z-50 flex flex-col md:hidden">
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h1 className="text-xl font-bold text-white">PhysEd Control</h1>
            <button 
              onClick={closeMenu} 
              className="text-white focus:outline-none"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1">
            <Sidebar isMobile={true} onLinkClick={closeMenu} />
          </div>
        </div>
      )}
    </>
  );
}
