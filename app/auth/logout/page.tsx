"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
    const router = useRouter();

    useEffect(() => {
        const doLogout = async () => {
            await signOut({ redirect: false });
            router.replace("/auth/login");
        };
        doLogout();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-muted-foreground">Signing out...</p>
        </div>
    );
}
