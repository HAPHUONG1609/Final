import "dotenv/config";
export const isProd = process.env.NODE_ENV === "production";
export const clientOrigin =
  process.env.CLIENT_ORIGIN || "http://localhost:5173";
export const jwtSecret = process.env.JWT_SECRET || "change_me";
export const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";
