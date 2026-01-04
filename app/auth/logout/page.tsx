"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutPage() {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const doLogout = async () => {
            await supabase.auth.signOut();
            router.replace("/auth/login");
        };
        doLogout();
    }, [router, supabase]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-muted-foreground">Signing out...</p>
        </div>
    );
}
