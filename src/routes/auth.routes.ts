import { Router } from "express";
import {
  getAdminArea,
  getCurrentUser,
  loginUser,
  registerUser,
  getStaffArea,
  updateCurrentUser,
  verifyEmailOtp,
} from "../controllers/auth.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.post("/verify-email-otp", verifyEmailOtp);
authRouter.get("/me", requireAuth, getCurrentUser);
authRouter.patch("/me", requireAuth, updateCurrentUser);

// Contoh endpoint RBAC untuk staff internal.
// Urutan middleware penting:
// 1. `requireAuth` memverifikasi bearer token dan mengambil user dari database.
// 2. `requireRoles("owner", "admin")` mengecek apakah role user boleh masuk.
// 3. `getStaffArea` hanya dipanggil jika dua langkah di atas lolos.
authRouter.get(
  "/staff-area",
  requireAuth,
  requireRoles("owner", "admin"),
  getStaffArea,
);

// Contoh endpoint RBAC yang lebih ketat: hanya `admin`.
// Jika token valid tetapi role bukan `admin`, API mengembalikan `403`.
authRouter.get("/admin-area", requireAuth, requireRoles("admin"), getAdminArea);

export default authRouter;
