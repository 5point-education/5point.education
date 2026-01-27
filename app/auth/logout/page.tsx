"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function LogoutPage() {
    const router = useRouter();
    const supabase = createClient();
    const [open, setOpen] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    const handleCancel = () => {
        setOpen(false);
        router.replace("/dashboard");
    };

    const doLogout = async () => {
        setLoggingOut(true);
        await supabase.auth.signOut();
        router.replace("/auth/login");
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <Dialog
                open={open}
                onOpenChange={(o) => {
                    setOpen(o);
                    if (!o) router.replace("/dashboard");
                }}
            >
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Sign out</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to sign out? You will need to sign in again to access your account.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={loggingOut}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={doLogout}
                            disabled={loggingOut}
                        >
                            {loggingOut ? "Signing out..." : "Sign out"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
