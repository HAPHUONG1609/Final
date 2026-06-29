import jwt from "jsonwebtoken";
import { isProd, jwtExpiresIn, jwtSecret } from "../config/env.js";

export function signJwt(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
}

export function setAuthCookie(res, token) {
  res.cookie("access_token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}
