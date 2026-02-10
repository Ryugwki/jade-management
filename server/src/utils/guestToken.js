import crypto from "crypto";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year for guest tokens
};

/**
 * Generates a secure random guest token
 * @returns {string} A unique guest token
 */
export function generateGuestToken() {
  return crypto.randomUUID();
}

/**
 * Creates a new guest user in the database
 * @returns {Promise<Object>} The created guest user with token
 */
export async function createGuestUser() {
  const guestToken = generateGuestToken();
  const randomId = crypto.randomBytes(8).toString("hex");
  const passwordHash = await import("bcryptjs").then((bcrypt) =>
    bcrypt.hash(randomId, 10),
  );

  const guestUser = await User.create({
    name: `Guest ${randomId.slice(0, 6)}`,
    email: `guest_${randomId}@guest.local`,
    passwordHash,
    role: "GUEST",
    isGuest: true,
    guestToken,
    lastActiveAt: new Date(),
  });

  return guestUser;
}

/**
 * Finds a guest user by token and updates lastActiveAt
 * @param {string} guestToken - The guest token to search for
 * @returns {Promise<Object|null>} The guest user or null
 */
export async function findGuestByToken(guestToken) {
  const user = await User.findOneAndUpdate(
    { guestToken, isGuest: true },
    { lastActiveAt: new Date() },
    { new: true },
  ).lean();

  return user;
}

/**
 * Sets the guest token cookie in the response
 * @param {Object} res - Express response object
 * @param {string} guestToken - The guest token to set
 */
export function setGuestTokenCookie(res, guestToken) {
  res.cookie("guest_token", guestToken, COOKIE_OPTIONS);
}

/**
 * Clears the guest token cookie from the response
 * @param {Object} res - Express response object
 */
export function clearGuestTokenCookie(res) {
  res.clearCookie("guest_token", COOKIE_OPTIONS);
}

/**
 * Generates a JWT token for a guest user
 * @param {Object} user - The user object
 * @returns {string} JWT token
 */
export function generateGuestJWT(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: "GUEST",
      isGuest: true,
      guestToken: user.guestToken,
    },
    JWT_SECRET,
    { expiresIn: "365d" }, // Long expiry for guests
  );
}
