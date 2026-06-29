import { Router } from "express";
import {
  login,
  logout,
  me,
  getMyProfile,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

// NEW
router.get("/profile/me", requireAuth, getMyProfile);

export default router;
