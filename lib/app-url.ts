export function getAppUrl(request?: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (request) {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
    if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
    try { return new URL(request.url).origin; } catch { /* use local fallback */ }
  }
  return "http://localhost:3000";
}

export function getPasswordResetRedirect(request?: Request) {
  return `${getAppUrl(request)}/auth/callback?next=/auth/update-password`;
}
