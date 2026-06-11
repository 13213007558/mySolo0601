import { createCookieSessionStorage } from "@remix-run/node";

if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = "deep-decompression-checkstation-dev-secret-key-2026";
}

export const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: "dive_checkstation_session",
      secure: process.env.NODE_ENV === "production",
      secrets: [process.env.SESSION_SECRET],
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
      httpOnly: true,
    },
  });
