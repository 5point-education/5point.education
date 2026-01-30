"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    ClipboardList,
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    Calendar,
    UserPlus,
    Layers,
    LogOut,
    Menu,
    X,
    IndianRupee,
    FileText,
    UserCog,
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
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group mx-2",
                isActive
                    ? "bg-gradient-to-r from-primary to-primary-light text-white shadow-lg shadow-primary/25"
                    : "text-gray-600 hover:bg-primary/5 hover:text-primary"
            )}
        >
            <Icon
                className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-white" : "text-gray-500 group-hover:text-primary"
                )}
            />
            <span className={cn("font-medium text-sm", isActive ? "font-semibold" : "")}>{label}</span>
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
                        <SidebarItem icon={UserCog} label="Register" href="/dashboard/admin/register" onClick={closeMobileSidebar} />
                        <div className="px-4 pt-6 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Operations</div>
                        <SidebarItem icon={FileText} label="Enquiries" href="/dashboard/reception" exact onClick={closeMobileSidebar} />
                        <SidebarItem icon={Users} label="Students" href="/dashboard/reception/students" onClick={closeMobileSidebar} />
                        <SidebarItem icon={Layers} label="Batches" href="/dashboard/reception/batches" onClick={closeMobileSidebar} />
                        <SidebarItem icon={IndianRupee} label="Fees" href="/dashboard/reception/fees" onClick={closeMobileSidebar} />
                        <SidebarItem icon={Calendar} label="Attendance" href="/dashboard/reception/attendance" onClick={closeMobileSidebar} />
                        <SidebarItem icon={UserPlus} label="Teachers" href="/dashboard/reception/teachers" onClick={closeMobileSidebar} />
                    </>
                );
            case "RECEPTIONIST":
                return (
                    <>
                        <SidebarItem icon={LayoutDashboard} label="Overview" href="/dashboard/reception" exact onClick={closeMobileSidebar} />
                        <SidebarItem icon={UserPlus} label="Teacher Onboarding" href="/dashboard/reception/teachers" onClick={closeMobileSidebar} />
                        <SidebarItem icon={Users} label="Student List" href="/dashboard/reception/students" onClick={closeMobileSidebar} />
                        <SidebarItem icon={Layers} label="Batch Management" href="/dashboard/reception/batches" onClick={closeMobileSidebar} />
                        <SidebarItem icon={IndianRupee} label="Fees Management" href="/dashboard/reception/fees" onClick={closeMobileSidebar} />
                        <SidebarItem icon={Calendar} label="Attendance" href="/dashboard/reception/attendance" onClick={closeMobileSidebar} />
                    </>
                );
            case "TEACHER":
                return (
                    <>
                        <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/dashboard/teacher" exact onClick={closeMobileSidebar} />
                        <SidebarItem icon={Users} label="My Students" href="/dashboard/teacher/students" onClick={closeMobileSidebar} />
                        <SidebarItem icon={ClipboardList} label="Exams" href="/dashboard/teacher/exam" onClick={closeMobileSidebar} />
                        <SidebarItem icon={Calendar} label="Attendance" href="/dashboard/teacher/attendance" onClick={closeMobileSidebar} />
                    </>
                );
            case "STUDENT":
                return (
                    <>
                        <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/dashboard/student" exact onClick={closeMobileSidebar} />
                        <SidebarItem icon={BookOpen} label="My Courses" href="/dashboard/student/courses" onClick={closeMobileSidebar} />
                        <SidebarItem icon={GraduationCap} label="Results" href="/dashboard/student/results" onClick={closeMobileSidebar} />
                        <SidebarItem icon={Calendar} label="Attendance" href="/dashboard/student/attendance" onClick={closeMobileSidebar} />
                    </>
                );
            default:
                return <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/dashboard" onClick={closeMobileSidebar} />;
        }
    };

    const sidebarContent = (
        <div className="flex flex-col h-full bg-white border-r border-gray-100">
            {/* Branding */}
            <div className="p-5 border-b border-gray-100">
                <Link href="/" className="flex items-center gap-3">
                    <Image
                        src="/5pointlogo.png"
                        alt="5 Point Education"
                        width={150}
                        height={40}
                        className="h-10 w-auto object-contain"
                        priority
                    />
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 overflow-y-auto">
                <div className="space-y-1">
                    {renderLinks()}
                </div>
            </div>

            {/* User Profile & Logout */}
            <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg shadow-primary/25">
                        <span className="font-semibold text-sm text-white">{userInitial}</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate text-gray-900">{userName}</p>
                        <p className="text-xs text-gray-500 capitalize truncate">
                            {user?.role?.toLowerCase() || "student"}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 rounded-xl transition-all duration-200"
                    onClick={onLogout}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                </Button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Top Navbar */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50 flex items-center justify-between px-4 md:hidden shadow-sm">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/5pointlogo.png"
                        alt="5 Point Education"
                        width={120}
                        height={32}
                        className="h-8 w-auto object-contain"
                        priority
                    />
                </Link>

                {/* Hamburger Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/5"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                >
                    {isMobileOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
                </Button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                    onClick={closeMobileSidebar}
                />
            )}

            {/* Mobile Sidebar - Slides from Right */}
            <div
                className={cn(
                    "fixed top-0 right-0 w-72 bg-white h-screen z-50 flex flex-col transition-transform duration-300 md:hidden shadow-2xl",
                    isMobileOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {sidebarContent}
            </div>

            {/* Desktop Sidebar */}
            <div className="w-72 bg-white h-screen sticky top-0 flex flex-col hidden md:flex shrink-0 shadow-lg shadow-gray-100/50">
                {sidebarContent}
            </div>
        </>
    );
}
