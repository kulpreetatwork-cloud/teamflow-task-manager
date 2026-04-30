import express from "express";
import Task from "../models/Task.js";
import { protect } from "../middleware/auth.js";
import { loadProject } from "../middleware/projectAccess.js";

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(loadProject);

router.get("/", async (req, res) => {
  try {
    const taskQuery = { project: req.project.id };
    if (req.projectRole !== "admin") {
      taskQuery.assignedTo = req.user.id;
    }

    const tasks = await Task.find(taskQuery).populate("assignedTo", "name email");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const byStatus = {
      todo: 0,
      in_progress: 0,
      done: 0
    };
    const perUserMap = new Map();
    let overdue = 0;

    tasks.forEach((task) => {
      byStatus[task.status] += 1;

      const userId = task.assignedTo.id;
      const current = perUserMap.get(userId) || {
        user: task.assignedTo,
        total: 0,
        done: 0
      };
      current.total += 1;
      if (task.status === "done") current.done += 1;
      perUserMap.set(userId, current);

      if (task.status !== "done" && task.dueDate < today) {
        overdue += 1;
      }
    });

    res.json({
      totalTasks: tasks.length,
      byStatus,
      overdue,
      perUser: Array.from(perUserMap.values())
    });
  } catch (error) {
    res.status(500).json({ message: "Could not build dashboard" });
  }
});

export default router;
