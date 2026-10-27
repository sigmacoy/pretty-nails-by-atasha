"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, Calendar, Users, Scissors, Award, BarChart3, ImageIcon, LogOut, Menu, ChevronRight, Building2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar },
  { href: "/admin/schedule", label: "Schedule", icon: Building2 },
  { href: "/admin/services", label: "Services", icon: Scissors },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/loyalty", label: "Loyalty", icon: Award },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border max-w-md">
          <p className="font-semibold text-gray-900 mb-2">Access Denied</p>
          <p className="text-sm text-gray-500 mb-4">You must be signed in as the Owner/Admin to access this page.</p>
          <Link href="/login">
            <Button variant="outline">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r transition-all duration-300 z-50 flex flex-col shrink-0",
          // Mobile: drawer sliding in from left
          "fixed inset-y-0 left-0 h-full w-64 lg:static lg:h-screen lg:sticky lg:top-0",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0",
          // Desktop collapsed width
          collapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        {/* Header / Logo */}
        <div className={cn("flex items-center justify-between h-16 px-4 border-b shrink-0", collapsed && "lg:px-2 lg:justify-center")}>
          {!collapsed ? (
            <>
              <Link href="/admin/dashboard" className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center shrink-0">
                  <Scissors className="h-4 w-4 text-white" />
                </div>
                <span className="font-display text-lg font-bold text-gray-900 truncate">Pretty Nails</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex text-gray-500 hover:text-gray-900 h-8 w-8"
                onClick={() => setCollapsed(true)}
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-gray-900 h-8 w-8"
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto" aria-label="Admin navigation">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                      collapsed && "lg:justify-center lg:px-2"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary-600")} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info & Sign out */}
        <div className="p-3 border-t shrink-0">
          {!collapsed ? (
            <div>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                  <AvatarFallback>{session.user.name?.[0]?.toUpperCase() || "A"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{session.user.name || "Ma'am Atasha"}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 text-xs"
                onClick={() => (window.location.href = "/api/auth/signout?callbackUrl=/")}
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                <AvatarFallback>{session.user.name?.[0]?.toUpperCase() || "A"}</AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-gray-900"
                onClick={() => (window.location.href = "/api/auth/signout?callbackUrl=/")}
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b shrink-0">
          <div className="flex items-center justify-between h-14 px-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-display text-base font-bold text-gray-900">Admin Portal</h1>
            <div className="w-8" />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
