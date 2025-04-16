import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboardIcon,
  Receipt,
  TagIcon,
  BarChart4Icon,
  MenuIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

function SidebarItem({ href, icon, children, active }: SidebarItemProps) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
          active
            ? "bg-gray-100 text-primary"
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        <span className="mr-3 text-gray-500">{icon}</span>
        {children}
      </div>
    </Link>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 z-20 p-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <MenuIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar for mobile */}
      <aside
        className={cn(
          "bg-white border-r border-gray-200 w-64 fixed h-full z-30 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Finance Visualizer</h1>
        </div>
        <nav className="p-4 space-y-1">
          <SidebarItem 
            href="/" 
            icon={<LayoutDashboardIcon className="h-5 w-5" />} 
            active={location === '/'}
          >
            Dashboard
          </SidebarItem>
          <SidebarItem 
            href="/transactions" 
            icon={<Receipt className="h-5 w-5" />} 
            active={location === '/transactions'}
          >
            Transactions
          </SidebarItem>
          <SidebarItem 
            href="/categories" 
            icon={<TagIcon className="h-5 w-5" />} 
            active={location === '/categories'}
          >
            Categories
          </SidebarItem>
          <SidebarItem 
            href="/reports" 
            icon={<BarChart4Icon className="h-5 w-5" />} 
            active={location === '/reports'}
          >
            Reports
          </SidebarItem>
        </nav>
      </aside>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
