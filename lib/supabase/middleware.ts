import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.error("Supabase Environment Variables Missing in Middleware!");
    }

    const supabase = createServerClient(
        url!,
        key!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;

    // Protect dashboard routes
    if (path.startsWith("/dashboard")) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = "/auth/login";
            return NextResponse.redirect(url);
        }

        const role = user.user_metadata?.role as string;

        // Role-based route protection
        if (path.startsWith("/dashboard/student") && role !== "STUDENT") {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }

        if (path.startsWith("/dashboard/teacher") && role !== "TEACHER") {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }

        if (path.startsWith("/dashboard/reception") && role !== "RECEPTIONIST") {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }

        if (path.startsWith("/dashboard/admin") && role !== "ADMIN") {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }

        // Redirect from base /dashboard to role-specific dashboard
        if (path === "/dashboard") {
            const url = request.nextUrl.clone();
            switch (role) {
                case "ADMIN":
                    url.pathname = "/dashboard/admin";
                    return NextResponse.redirect(url);
                case "RECEPTIONIST":
                    url.pathname = "/dashboard/reception";
                    return NextResponse.redirect(url);
                case "TEACHER":
                    url.pathname = "/dashboard/teacher";
                    return NextResponse.redirect(url);
                case "STUDENT":
                    url.pathname = "/dashboard/student";
                    return NextResponse.redirect(url);
                default:
                    // If no valid role, maybe send to login or a not-authorized page?
                    // For now, staying on dashboard might cause a loop if we don't handle it, 
                    // but we just fall through to existing behavior or login.
                    // Let's redirect to login if role is missing/invalid to be safe.
                    url.pathname = "/auth/login";
                    return NextResponse.redirect(url);
            }
        }
    }

    // Redirect authenticated users away from login page
    if (path.startsWith("/auth/login") && user) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
