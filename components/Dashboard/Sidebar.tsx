"use client";

import { useState } from "react";
import Link from "next/link";
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
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group mx-2",
                isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
        >
            <Icon
                className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
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
                        <div className="px-3 pt-4 pb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Operations</div>
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
                        {/* <SidebarItem icon={Calendar} label="Schedule" href="/dashboard/teacher/schedule" onClick={closeMobileSidebar} /> */}
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
        <div className="flex flex-col h-full bg-background border-r">
            {/* Branding */}
            <div className="p-6">
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold tracking-tight text-foreground">5 Point</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Education Hub</span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-4 overflow-y-auto">
                <div className="space-y-1 px-2">
                    {renderLinks()}
                </div>
            </div>

            {/* User Profile & Logout */}
            <div className="p-4 border-t bg-card/50">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border ring-2 ring-background">
                        <span className="font-semibold text-sm text-primary">{userInitial}</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate text-foreground">{userName}</p>
                        <p className="text-xs text-muted-foreground capitalize truncate">
                            {user?.role?.toLowerCase() || "student"}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2"
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
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={closeMobileSidebar}
                />
            )}

            {/* Mobile Sidebar */}
            <div
                className={cn(
                    "fixed top-0 left-0 w-72 bg-background h-screen z-50 flex flex-col transition-transform duration-300 md:hidden border-r shadow-lg",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {sidebarContent}
            </div>

            {/* Desktop Sidebar */}
            <div className="w-72 bg-background h-screen sticky top-0 flex flex-col hidden md:flex shrink-0">
                {sidebarContent}
            </div>
        </>
    );
}
