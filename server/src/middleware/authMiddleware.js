import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import {
  createGuestUser,
  findGuestByToken,
  setGuestTokenCookie,
  generateGuestJWT,
} from "../utils/guestToken.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

const normalizeRole = (role) => (role === "FREELANCER" ? "GUEST" : role);
const normalizePermissions = (permissions) => {
  if (!permissions) return {};
  if (permissions instanceof Map) {
    return Object.fromEntries(permissions.entries());
  }
  return permissions;
};

/**
 * Middleware to ensure a guest token exists
 * Creates a new guest user if no valid token is found
 */
export async function ensureGuestToken(req, res, next) {
  try {
    // Check if user is already authenticated with JWT
    const authToken =
      req.cookies?.gm_token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (authToken) {
      try {
        const payload = jwt.verify(authToken, JWT_SECRET);
        const user = await User.findById(payload.id).lean();
        if (user) {
          // User is authenticated, no need for guest token
          return next();
        }
      } catch (err) {
        // Invalid JWT, continue to check guest token
      }
    }

    // Check for existing guest token in cookie or header
    const guestToken = req.cookies?.guest_token || req.headers["x-guest-token"];

    if (guestToken) {
      const guestUser = await findGuestByToken(guestToken);
      if (guestUser) {
        // Valid guest token found, attach to request
        req.guestUser = guestUser;
        return next();
      }
    }

    // No valid token found, create new guest user
    const newGuestUser = await createGuestUser();
    const jwtToken = generateGuestJWT(newGuestUser);

    // Set both cookies
    setGuestTokenCookie(res, newGuestUser.guestToken);
    res.cookie("gm_token", jwtToken, COOKIE_OPTIONS);

    req.guestUser = newGuestUser;
    return next();
  } catch (error) {
    console.error("Guest token middleware error:", error);
    return next(); // Continue even if guest token fails
  }
}

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

    // Update lastActiveAt for guest users
    if (user.isGuest) {
      await User.findByIdAndUpdate(user._id, { lastActiveAt: new Date() });
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
      isGuest: user.isGuest || false,
      guestToken: user.guestToken || null,
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
