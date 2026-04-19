/** Nest API origin with no trailing slash. Set in Vercel: NEXT_PUBLIC_API_URL */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
