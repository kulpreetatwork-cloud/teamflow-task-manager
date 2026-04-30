import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import Project from "./models/Project.js";
import Task from "./models/Task.js";
import User from "./models/User.js";

const users = [
  { name: "Aarav Admin", email: "admin@demo.com", password: "password123" },
  { name: "Maya Member", email: "maya@demo.com", password: "password123" },
  { name: "Rohan Member", email: "rohan@demo.com", password: "password123" }
];

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function seed() {
  await connectDB();

  await Promise.all([User.deleteMany({}), Project.deleteMany({}), Task.deleteMany({})]);

  const hashedUsers = await Promise.all(
    users.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 12)
    }))
  );

  const [admin, maya, rohan] = await User.insertMany(hashedUsers);

  const launchProject = await Project.create({
    name: "Product Launch Sprint",
    description: "Coordinate design, development, and launch tasks for the new dashboard.",
    owner: admin.id,
    members: [
      { user: admin.id, role: "admin" },
      { user: maya.id, role: "member" },
      { user: rohan.id, role: "member" }
    ]
  });

  const opsProject = await Project.create({
    name: "Customer Success Ops",
    description: "Improve support workflows and customer follow-up visibility.",
    owner: admin.id,
    members: [
      { user: admin.id, role: "admin" },
      { user: maya.id, role: "member" }
    ]
  });

  await Task.insertMany([
    {
      project: launchProject.id,
      title: "Finalize dashboard UI polish",
      description: "Review spacing, responsive cards, and empty states before demo.",
      dueDate: addDays(3),
      priority: "high",
      status: "in_progress",
      assignedTo: maya.id,
      createdBy: admin.id
    },
    {
      project: launchProject.id,
      title: "Connect deployment environment variables",
      description: "Set Railway API URL, client URL, JWT secret, and MongoDB URI.",
      dueDate: addDays(1),
      priority: "high",
      status: "todo",
      assignedTo: rohan.id,
      createdBy: admin.id
    },
    {
      project: launchProject.id,
      title: "Record walkthrough script",
      description: "Prepare a short 2-5 minute demo covering roles and dashboard.",
      dueDate: addDays(-2),
      priority: "medium",
      status: "todo",
      assignedTo: admin.id,
      createdBy: admin.id
    },
    {
      project: launchProject.id,
      title: "Test member status update",
      description: "Confirm members can update assigned task status only.",
      dueDate: addDays(2),
      priority: "medium",
      status: "done",
      assignedTo: rohan.id,
      createdBy: admin.id
    },
    {
      project: opsProject.id,
      title: "Build customer follow-up checklist",
      description: "Define repeatable support handoff steps.",
      dueDate: addDays(5),
      priority: "low",
      status: "in_progress",
      assignedTo: maya.id,
      createdBy: admin.id
    }
  ]);

  console.log("Seed complete");
  console.log("Admin login: admin@demo.com / password123");
  console.log("Member login: maya@demo.com / password123");
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
