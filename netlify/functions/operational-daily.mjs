export const config = { schedule: "0 3 * * *" };

export default async function handler() {
  const siteUrl = process.env.URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!siteUrl || !process.env.CRON_SECRET) throw new Error("URL and CRON_SECRET are required");
  const response = await fetch(`${siteUrl}/api/internal/automation/daily`, { method: "POST", headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  if (!response.ok) throw new Error(`Daily automation failed: ${response.status}`);
  return { statusCode: 200, body: await response.text() };
}
