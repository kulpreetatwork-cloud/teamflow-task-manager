import express from "express";
import { body } from "express-validator";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { loadProject, requireAdmin } from "../middleware/projectAccess.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.use(protect);

router.get("/", async (req, res) => {
  try {
    const projects = await Project.find({ "members.user": req.user.id })
      .populate("owner", "name email")
      .populate("members.user", "name email")
      .sort({ updatedAt: -1 });

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch projects" });
  }
});

router.post(
  "/",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Project name is required"),
    body("description").optional().trim().isLength({ max: 400 })
  ],
  validate,
  async (req, res) => {
    try {
      const project = await Project.create({
        name: req.body.name,
        description: req.body.description || "",
        owner: req.user.id,
        members: [{ user: req.user.id, role: "admin" }]
      });

      await project.populate("members.user", "name email");
      res.status(201).json({ project });
    } catch (error) {
      res.status(500).json({ message: "Could not create project" });
    }
  }
);

router.get("/:id", loadProject, async (req, res) => {
  try {
    const project = await Project.findById(req.project.id)
      .populate("owner", "name email")
      .populate("members.user", "name email");
    const taskQuery = { project: req.project.id };
    if (req.projectRole !== "admin") {
      taskQuery.assignedTo = req.user.id;
    }

    const tasks = await Task.find(taskQuery)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ dueDate: 1 });

    res.json({ project, tasks, role: req.projectRole });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch project details" });
  }
});

router.delete("/:id", loadProject, async (req, res) => {
  try {
    if (req.project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the project creator can delete this project" });
    }

    await Task.deleteMany({ project: req.project.id });
    await Project.findByIdAndDelete(req.project.id);

    res.json({ message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ message: "Could not delete project" });
  }
});

router.post(
  "/:id/members",
  loadProject,
  requireAdmin,
  [body("email").isEmail().withMessage("A valid email is required")],
  validate,
  async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email.toLowerCase() });

      if (!user) {
        return res.status(404).json({ message: "No registered user found for this email" });
      }

      const alreadyMember = req.project.members.some(
        (member) => member.user.toString() === user.id
      );

      if (alreadyMember) {
        return res.status(409).json({ message: "User is already a project member" });
      }

      req.project.members.push({ user: user.id, role: "member" });
      await req.project.save();
      await req.project.populate("owner", "name email");
      await req.project.populate("members.user", "name email");

      res.json({ project: req.project });
    } catch (error) {
      res.status(500).json({ message: "Could not add member" });
    }
  }
);

router.delete("/:id/members/:userId", loadProject, requireAdmin, async (req, res) => {
  try {
    if (req.params.userId === req.project.owner.toString()) {
      return res.status(400).json({ message: "Project owner cannot be removed" });
    }

    req.project.members = req.project.members.filter(
      (member) => member.user.toString() !== req.params.userId
    );
    await req.project.save();

    await Task.deleteMany({
      project: req.project.id,
      assignedTo: req.params.userId
    });

    await req.project.populate("owner", "name email");
    await req.project.populate("members.user", "name email");
    res.json({ project: req.project });
  } catch (error) {
    res.status(500).json({ message: "Could not remove member" });
  }
});

export default router;
