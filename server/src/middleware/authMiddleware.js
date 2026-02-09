import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const normalizeRole = (role) => (role === "FREELANCER" ? "GUEST" : role);
const normalizePermissions = (permissions) => {
  if (!permissions) return {};
  if (permissions instanceof Map) {
    return Object.fromEntries(permissions.entries());
  }
  return permissions;
};

export async function requireAuth(req, res, next) {
  try {
    const token =
      req.cookies?.gm_token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).lean();
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: normalizeRole(user.role),
      permissions: normalizePermissions(user.permissions),
      phone: user.phone || "",
      address: user.address || "",
      avatarUrl: user.avatarUrl || "",
      language: user.language || "vi",
      timezone: user.timezone || "Asia/Ho_Chi_Minh",
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN" && req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }
  return next();
}

export function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }
  return next();
}
