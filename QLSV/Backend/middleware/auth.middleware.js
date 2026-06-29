import jwt from "jsonwebtoken";
import { jwtSecret } from "../config/env.js";

export function requireAuth(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) return res.status(401).json({ error: "UNAUTHORIZED" });

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
}
