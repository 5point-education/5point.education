import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
    const path = request.nextUrl.pathname;

    const publicPaths = ["/auth/login", "/auth/forgot-password", "/auth/update-password"];
    const isPublicPath = publicPaths.some(p => path.startsWith(p));

    if (path.startsWith("/_next") || path.startsWith("/api") || path.includes(".")) {
        return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (isPublicPath) {
        if (session) {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }
        return supabaseResponse;
    }

    if (!session) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        return NextResponse.redirect(url);
    }

    const user = session.user;
    const role = user.user_metadata?.role as string;

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
                url.pathname = "/auth/login";
                return NextResponse.redirect(url);
        }
    }

    if (path.startsWith("/dashboard/student") && role !== "STUDENT") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (path.startsWith("/dashboard/teacher") && role !== "TEACHER") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (path.startsWith("/dashboard/reception") && role !== "RECEPTIONIST" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (path.startsWith("/dashboard/admin") && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
