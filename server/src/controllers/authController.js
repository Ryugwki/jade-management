import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

const normalizeRole = (role) => (role === "FREELANCER" ? "GUEST" : role);

const toSafeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: normalizeRole(user.role),
  permissions: user.permissions || {},
  phone: user.phone || "",
  address: user.address || "",
  avatarUrl: user.avatarUrl || "",
  language: user.language || "vi",
  timezone: user.timezone || "Asia/Ho_Chi_Minh",
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

export async function loginGuest(_req, res) {
  const email = "guest@guest.local";
  let user = await User.findOne({ email }).exec();
  if (!user) {
    const randomId = Math.random().toString(36).slice(2, 10);
    const passwordHash = await bcrypt.hash(randomId, 10);
    user = await User.create({
      name: "Guest",
      email,
      passwordHash,
      role: "GUEST",
    });
  }

  const token = jwt.sign(
    { id: user._id.toString(), role: "GUEST" },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.cookie("gm_token", token, COOKIE_OPTIONS);
  return res.json({ user: toSafeUser(user) });
}

export async function logout(_req, res) {
  res.clearCookie("gm_token", COOKIE_OPTIONS);
  return res.json({ message: "Logged out" });
}

export async function me(req, res) {
  return res.json({ user: req.user });
}
