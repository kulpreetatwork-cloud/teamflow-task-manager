import express from "express";
import { body } from "express-validator";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import { protect } from "../middleware/auth.js";
import { loadProject, requireAdmin } from "../middleware/projectAccess.js";
import { validate } from "../middleware/validate.js";

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(loadProject);

const taskValidators = [
  body("title").trim().isLength({ min: 2 }).withMessage("Task title is required"),
  body("description").optional().trim().isLength({ max: 800 }),
  body("dueDate").isISO8601().withMessage("A valid due date is required"),
  body("priority").isIn(["low", "medium", "high"]).withMessage("Invalid priority"),
  body("status").optional().isIn(["todo", "in_progress", "done"]),
  body("assignedTo").isMongoId().withMessage("A valid assignee is required")
];

const updateTaskValidators = [
  body("title").optional().trim().isLength({ min: 2 }).withMessage("Task title is required"),
  body("description").optional().trim().isLength({ max: 800 }),
  body("dueDate").optional().isISO8601().withMessage("A valid due date is required"),
  body("priority").optional().isIn(["low", "medium", "high"]).withMessage("Invalid priority"),
  body("status").optional().isIn(["todo", "in_progress", "done"]).withMessage("Invalid status"),
  body("assignedTo").optional().isMongoId().withMessage("A valid assignee is required")
];

function isProjectMember(project, userId) {
  return project.members.some((member) => member.user.toString() === userId);
}

router.post("/", requireAdmin, taskValidators, validate, async (req, res) => {
  try {
    if (!isProjectMember(req.project, req.body.assignedTo)) {
      return res.status(400).json({ message: "Assignee must be a project member" });
    }

    const task = await Task.create({
      project: req.project.id,
      title: req.body.title,
      description: req.body.description || "",
      dueDate: req.body.dueDate,
      priority: req.body.priority,
      status: req.body.status || "todo",
      assignedTo: req.body.assignedTo,
      createdBy: req.user.id
    });

    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");
    res.status(201).json({ task });
  } catch (error) {
    res.status(500).json({ message: "Could not create task" });
  }
});

router.patch("/:taskId", updateTaskValidators, validate, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      project: req.project.id
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isAssignee = task.assignedTo.toString() === req.user.id;
    if (req.projectRole !== "admin" && !isAssignee) {
      return res.status(403).json({ message: "You can only update assigned tasks" });
    }

    if (req.projectRole !== "admin") {
      const allowedKeys = Object.keys(req.body).every((key) => key === "status");
      if (!allowedKeys) {
        return res.status(403).json({ message: "Members can only update task status" });
      }
    }

    const allowedUpdates = ["title", "description", "dueDate", "priority", "status", "assignedTo"];
    allowedUpdates.forEach((key) => {
      if (req.body[key] !== undefined) {
        task[key] = req.body[key];
      }
    });

    if (task.assignedTo && !isProjectMember(req.project, task.assignedTo.toString())) {
      return res.status(400).json({ message: "Assignee must be a project member" });
    }

    await task.save();
    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: "Could not update task" });
  }
});

router.delete("/:taskId", requireAdmin, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.taskId,
      project: req.project.id
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: "Could not delete task" });
  }
});

export default router;
