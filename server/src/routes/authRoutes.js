import express from "express";
import bcrypt from "bcryptjs";
import { body } from "express-validator";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createToken } from "../utils/token.js";

const router = express.Router();

router.post(
  "/signup",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),
    body("email").isEmail().withMessage("A valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(409).json({ message: "Email is already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await User.create({ name, email, password: hashedPassword });

      res.status(201).json({
        user,
        token: createToken(user.id)
      });
    } catch (error) {
      res.status(500).json({ message: "Signup failed" });
    }
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("A valid email is required"),
    body("password").notEmpty().withMessage("Password is required")
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      res.json({
        user,
        token: createToken(user.id)
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  }
);

router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});

export default router;
