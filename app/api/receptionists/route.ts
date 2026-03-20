import { db } from "@/lib/db";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        // Only Admin can create receptionists
        const userRole = user?.user_metadata?.role as string;
        if (error || !user || userRole !== Role.ADMIN) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return new NextResponse("User already exists", { status: 409 });
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name,
                role: Role.RECEPTIONIST,
            },
        });

        if (authError || !authData.user) {
            console.error("Supabase Auth Error:", authError);
            return new NextResponse(authError?.message || "Failed to create user in Supabase", { status: 500 });
        }

        const receptionist = await db.user.create({
            data: {
                id: authData.user.id,
                name,
                email,
                role: Role.RECEPTIONIST,
            },
        });

        // Send password reset email so the receptionist can set their own password
        try {
            const origin = req.headers.get("origin") ?? (req.headers.get("x-forwarded-host") ? `https://${req.headers.get("x-forwarded-host")}` : null);
            const redirectTo = origin ? `${origin}/auth/callback?next=/auth/update-password` : undefined;
            const authClient = createClient();
            const { error: resetError } = await authClient.auth.resetPasswordForEmail(email, {
                redirectTo: redirectTo ?? undefined,
            });
            if (resetError) {
                console.warn("[RECEPTIONISTS_POST] Password reset email failed:", resetError.message);
            }
        } catch (e) {
            console.warn("[RECEPTIONISTS_POST] Password reset email error:", e);
        }

        return NextResponse.json(receptionist);

    } catch (error) {
        console.log("[RECEPTIONISTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const receptionists = await db.user.findMany({
            where: {
                role: Role.RECEPTIONIST,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(receptionists);

    } catch (error) {
        console.log("[RECEPTIONISTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        const userRole = user?.user_metadata?.role as string;
        if (error || !user || userRole !== Role.ADMIN) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { id, name, email, is_active } = body;

        if (!id) {
            return new NextResponse("Receptionist ID is required", { status: 400 });
        }

        // Check if receptionist exists
        const existingReceptionist = await db.user.findUnique({
            where: { id },
        });

        if (!existingReceptionist || existingReceptionist.role !== Role.RECEPTIONIST) {
            return new NextResponse("Receptionist not found", { status: 404 });
        }

        // If email is being changed, update it in Supabase Auth first
        if (email !== undefined && email !== existingReceptionist.email) {
            const { error: authUpdateError } = await supabase.auth.admin.updateUserById(id, {
                email,
                email_confirm: true,
            });

            if (authUpdateError) {
                console.error("[RECEPTIONISTS_PATCH] Supabase Auth email update error:", authUpdateError);
                return new NextResponse(
                    authUpdateError.message || "Failed to update email in authentication",
                    { status: 500 }
                );
            }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (is_active !== undefined) updateData.is_active = is_active;

        const receptionist = await db.user.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(receptionist);

    } catch (error) {
        console.log("[RECEPTIONISTS_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        // Only Admin can delete receptionists
        const userRole = user?.user_metadata?.role as string;
        if (error || !user || userRole !== Role.ADMIN) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { id } = body;

        if (!id) {
            return new NextResponse("Receptionist ID is required", { status: 400 });
        }

        // Check if receptionist exists
        const existingReceptionist = await db.user.findUnique({
            where: { id },
        });

        if (!existingReceptionist || existingReceptionist.role !== Role.RECEPTIONIST) {
            return new NextResponse("Receptionist not found", { status: 404 });
        }

        // Delete from Supabase Auth FIRST (before database)
        // This ensures auth is cleaned up even if database deletion fails
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(id);
        if (deleteAuthError) {
            console.error("[RECEPTIONISTS_DELETE] Failed to delete from Supabase Auth:", deleteAuthError.message);
            return new NextResponse(
                `Failed to delete receptionist authentication: ${deleteAuthError.message}`,
                { status: 500 }
            );
        }

        // Delete from database
        await db.user.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Receptionist deleted successfully" });

    } catch (error) {
        console.log("[RECEPTIONISTS_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
