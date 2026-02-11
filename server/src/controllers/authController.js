import bcrypt from "bcryptjs";
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

const toSafeUser = (user) => ({
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
});

export async function login(req, res) {
  const { email, password, role, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  let user = await User.findOne({ email }).exec();

  if (!user) {
    const passwordHash = await bcrypt.hash(password, 10);
    user = await User.create({
      name: name || email.split("@")[0],
      email,
      passwordHash,
      role: normalizeRole(role) || "GUEST",
      isGuest: false, // Regular users are not guests
    });
  } else {
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  }

  const token = jwt.sign(
    { id: user._id.toString(), role: normalizeRole(user.role) },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.cookie("gm_token", token, COOKIE_OPTIONS);
  return res.json({ user: toSafeUser(user) });
}

export async function loginGuest(req, res) {
  try {
    // Reuse existing guest token if available
    const existingGuestToken =
      req.cookies?.guest_token || req.headers["x-guest-token"];

    if (existingGuestToken) {
      const existingGuest = await findGuestByToken(existingGuestToken);
      if (existingGuest) {
        const token = generateGuestJWT(existingGuest);
        res.cookie("gm_token", token, COOKIE_OPTIONS);
        setGuestTokenCookie(res, existingGuest.guestToken);
        return res.json({ user: toSafeUser(existingGuest) });
      }
    }

    // No existing guest, create a new unique guest user
    const newGuestUser = await createGuestUser();
    const token = generateGuestJWT(newGuestUser);

    res.cookie("gm_token", token, COOKIE_OPTIONS);
    setGuestTokenCookie(res, newGuestUser.guestToken);
    return res.json({ user: toSafeUser(newGuestUser) });
  } catch (error) {
    console.error("Error logging in as guest:", error);
    return res.status(500).json({ message: "Error creating guest user" });
  }
}

/**
 * Initialize or retrieve a guest token
 * This endpoint creates a unique guest user for each device/browser
 */
export async function initGuestToken(req, res) {
  try {
    // Check if guest token already exists in cookie or header
    const existingGuestToken =
      req.cookies?.guest_token || req.headers["x-guest-token"];

    if (existingGuestToken) {
      // Try to find existing guest user
      const existingGuest = await findGuestByToken(existingGuestToken);

      if (existingGuest) {
        // Valid guest token found, return existing user
        const token = generateGuestJWT(existingGuest);
        res.cookie("gm_token", token, COOKIE_OPTIONS);
        setGuestTokenCookie(res, existingGuest.guestToken);

        return res.json({
          user: toSafeUser(existingGuest),
          guestToken: existingGuest.guestToken,
          isNewGuest: false,
        });
      }
    }

    // Create new guest user
    const newGuestUser = await createGuestUser();
    const token = generateGuestJWT(newGuestUser);

    // Set cookies
    res.cookie("gm_token", token, COOKIE_OPTIONS);
    setGuestTokenCookie(res, newGuestUser.guestToken);

    return res.json({
      user: toSafeUser(newGuestUser),
      guestToken: newGuestUser.guestToken,
      isNewGuest: true,
    });
  } catch (error) {
    console.error("Error initializing guest token:", error);
    return res.status(500).json({ message: "Error creating guest user" });
  }
}

export async function logout(_req, res) {
  // Preserve guest token across logout
  res.clearCookie("gm_token", COOKIE_OPTIONS);
  return res.json({ message: "Logged out" });
}

export async function me(req, res) {
  return res.json({ user: req.user });
}

/**
 * Get guest user statistics (admin only)
 */
export async function getGuestStats(req, res) {
  try {
    const { User } = await import("../models/User.js");

    const totalGuests = await User.countDocuments({ isGuest: true });
    const activeGuests = await User.countDocuments({
      isGuest: true,
      lastActiveAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      }, // Last 7 days
    });

    return res.json({
      totalGuests,
      activeGuests,
      inactiveGuests: totalGuests - activeGuests,
    });
  } catch (error) {
    console.error("Error fetching guest stats:", error);
    return res.status(500).json({ message: "Error fetching guest statistics" });
  }
}
