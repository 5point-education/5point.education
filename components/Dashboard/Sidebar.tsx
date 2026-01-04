"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    Calendar,
    Settings,
    FileText,
    UserPlus,
    Layers,
    LogOut,
    Menu,
    X,
} from "lucide-react";

interface SidebarItemProps {
    icon: React.ElementType;
    label: string;
    href: string;
    exact?: boolean;
    onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, href, exact, onClick }: SidebarItemProps) => {
    const pathname = usePathname();
    const isActive = exact
        ? pathname === href
        : pathname === href || pathname?.startsWith(`${href}/`);

    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group hover:bg-primary/10",
                isActive ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "text-muted-foreground hover:text-primary"
            )}
        >
            <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "group-hover:text-primary")} />
            <span className="font-medium text-sm">{label}</span>
        </Link>
    );
};

interface User {
    name?: string | null;
    role?: string | null;
    email?: string | null;
}

interface SidebarProps {
    user?: User;
    onLogout: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const userRole = user?.role?.toUpperCase() || "STUDENT";
    const userName = user?.name || user?.email || "User";
    const userInitial = userName.charAt(0).toUpperCase();

    const closeMobileSidebar = () => setIsMobileOpen(false);

    const renderLinks = () => {
        switch (userRole) {
            case "ADMIN":
                return (
                    <>
                        <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/dashboard/admin" exact onClick={closeMobileSidebar} />
                        <SidebarItem icon={Users} label="Users" href="/dashboard/admin/users" onClick={closeMobileSidebar} />
                        <SidebarItem icon={Settings} label="Settings" href="/dashboard/admin/settings" onClick={closeMobileSidebar} />
                    </>
                );
            case "RECEPTIONIST":
                return (
                    <>
                        <SidebarItem icon={LayoutDashboard} label="Overview" href="/dashboard/reception" exact onClick={closeMobileSidebar} />
                        <SidebarItem icon={UserPlus} label="Teacher Onboarding" href="/dashboard/reception/teachers" onClick={closeMobileSidebar} />
                        <SidebarItem icon={Layers} label="Batch Management" href="/dashboard/reception/batches" onClick={closeMobileSidebar} />
                    </>
                );
            case "TEACHER":
                return (
                    <>
                        <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/dashboard/teacher" exact onClick={closeMobileSidebar} />
                        <SidebarItem icon={Users} label="My Students" href="/dashboard/teacher/students" onClick={closeMobileSidebar} />
                        <SidebarItem icon={Calendar} label="Schedule" href="/dashboard/teacher/schedule" onClick={closeMobileSidebar} />
                    </>
                );
            case "STUDENT":
                return (
                    <>
                        <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/dashboard/student" exact onClick={closeMobileSidebar} />
                        <SidebarItem icon={BookOpen} label="My Courses" href="/dashboard/student/courses" onClick={closeMobileSidebar} />
                        <SidebarItem icon={GraduationCap} label="Results" href="/dashboard/student/results" onClick={closeMobileSidebar} />
                    </>
                );
            default:
                return <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/dashboard" onClick={closeMobileSidebar} />;
        }
    };

    const sidebarContent = (
        <>
            {/* Branding */}
            <div className="p-6 border-b">
                <Link href="/" className="flex items-center gap-2">
                    <GraduationCap className="h-8 w-8 text-primary" />
                    <div>
                        <span className="text-lg font-bold text-primary block leading-none">5 Point</span>
                        <span className="text-xs text-muted-foreground font-medium">Education Hub</span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <div className="p-4 flex-1 overflow-y-auto">
                <div className="space-y-1">
                    {renderLinks()}
                </div>
            </div>

            {/* User Profile & Logout */}
            <div className="p-4 border-t bg-slate-50">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">{userInitial}</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{userName}</p>
                        <p className="text-xs text-muted-foreground capitalize truncate">
                            {user?.role?.toLowerCase() || "student"}
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="w-full justify-start text-muted-foreground hover:text-destructive"
                    onClick={onLogout}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                </Button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Menu Button */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 md:hidden"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {/* Mobile Sidebar Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={closeMobileSidebar}
                />
            )}

            {/* Mobile Sidebar */}
            <div
                className={cn(
                    "fixed top-0 left-0 w-64 bg-white h-screen z-40 flex flex-col transition-transform duration-300 md:hidden",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {sidebarContent}
            </div>

            {/* Desktop Sidebar */}
            <div className="w-64 bg-white border-r h-screen sticky top-0 flex flex-col hidden md:flex">
                {sidebarContent}
            </div>
        </>
    );
}

