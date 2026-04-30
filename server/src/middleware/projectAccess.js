import Project from "../models/Project.js";

export async function loadProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.projectId || req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const member = project.members.find(
      (entry) => entry.user.toString() === req.user.id
    );

    if (!member) {
      return res.status(403).json({ message: "You are not part of this project" });
    }

    req.project = project;
    req.projectRole = member.role;
    next();
  } catch (error) {
    res.status(500).json({ message: "Could not load project" });
  }
}

export function requireAdmin(req, res, next) {
  if (req.projectRole !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}
