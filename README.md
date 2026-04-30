# TeamFlow - Team Task Management Web Application

TeamFlow is a full-stack MERN web application for managing team projects, members, and assigned tasks. It is designed as a simplified collaborative task management tool inspired by products like Trello and Asana.

The application supports user authentication, project-based teams, role-based access control, task assignment, task progress tracking, and a project dashboard.

## Submission Links

- Live Application: `Pending Railway deployment`
- Backend API: `Pending Railway deployment`
- GitHub Repository: `Pending GitHub repository URL`
- Demo Video: `Pending demo video URL`

## Demo Accounts

Use these accounts after running the seed script:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@demo.com` | `password123` |
| Member | `maya@demo.com` | `password123` |
| Member | `rohan@demo.com` | `password123` |

## Features

### User Authentication

- User signup with name, email, and password
- Secure login using JWT authentication
- Passwords hashed with bcrypt
- Protected frontend routes
- Authenticated backend APIs

### Project Management

- Users can create projects
- Project creator automatically becomes the project admin
- Project creator can delete their own project
- Admin can add members by registered email
- Admin can remove members from a project
- Users can view projects where they are members

### Task Management

- Admin can create tasks inside a project
- Tasks include title, description, due date, priority, status, and assignee
- Tasks can be assigned to project members
- Supported task statuses:
  - To Do
  - In Progress
  - Done
- Supported priorities:
  - Low
  - Medium
  - High

### Dashboard

Each project includes a dashboard showing:

- Total tasks
- Tasks by status
- Tasks per user
- Overdue tasks

### Role-Based Access Control

Admin users can:

- Manage project members
- Create tasks
- Assign tasks
- Update all project tasks
- Delete tasks

Member users can:

- View only their assigned tasks
- Update the status of their assigned tasks only

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Recharts
- Lucide React Icons
- CSS3 responsive layout

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- express-validator
- CORS
- dotenv

### Deployment

- Railway for frontend and backend deployment
- MongoDB Atlas for database hosting

## Project Structure

```text
team-task-manager/
|-- client/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- context/
|   |   `-- pages/
|   |-- .env.example
|   |-- package.json
|   `-- vite.config.js
|-- server/
|   |-- src/
|   |   |-- config/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- utils/
|   |   |-- seed.js
|   |   `-- server.js
|   |-- .env.example
|   `-- package.json
|-- package.json
`-- README.md
```

## Local Setup

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd team-task-manager
```

### 2. Install dependencies

```bash
npm install
npm run install:all
```

### 3. Configure backend environment variables

Create a `server/.env` file using `server/.env.example`.

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_jwt_secret
CLIENT_URL=http://localhost:5173
```

For local development, if Vite starts on another port such as `5174`, add it to `CLIENT_URL`:

```env
CLIENT_URL=http://localhost:5173,http://localhost:5174
```

### 4. Configure frontend environment variables

Create a `client/.env` file using `client/.env.example`.

```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Seed demo data

```bash
npm run seed --prefix server
```

### 6. Start the application

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

Backend runs on:

```text
http://localhost:5000
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login user and return JWT |
| GET | `/api/auth/me` | Get logged-in user |

### Projects

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | Get projects for logged-in user |
| POST | `/api/projects` | Create a new project |
| GET | `/api/projects/:id` | Get project details and tasks |
| DELETE | `/api/projects/:id` | Delete project, creator only |
| POST | `/api/projects/:id/members` | Add project member by email |
| DELETE | `/api/projects/:id/members/:userId` | Remove project member |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/projects/:projectId/tasks` | Create a task |
| PATCH | `/api/projects/:projectId/tasks/:taskId` | Update task |
| DELETE | `/api/projects/:projectId/tasks/:taskId` | Delete task |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/:projectId/dashboard` | Get project dashboard metrics |

## Database Design

### User

Stores registered users.

- name
- email
- password

### Project

Stores project details and members.

- name
- description
- owner
- members with role

### Task

Stores project tasks.

- project
- title
- description
- dueDate
- priority
- status
- assignedTo
- createdBy

## Role-Based Access Rules

| Action | Admin | Member |
|---|---|---|
| Create project | Yes | Yes |
| Delete own created project | Yes | Yes |
| Add/remove project members | Yes | No |
| Create tasks | Yes | No |
| View all project tasks | Yes | No |
| View assigned tasks | Yes | Yes |
| Update all tasks | Yes | No |
| Update assigned task status | Yes | Yes |
| Delete tasks | Yes | No |

## Railway Deployment Guide

The application can be deployed on Railway as two services from the same GitHub repository.

### Backend Service

Create a Railway service for the backend.

- Root directory: `server`
- Build command:

```bash
npm install
```

- Start command:

```bash
npm start
```

Add these Railway environment variables:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_jwt_secret
CLIENT_URL=https://your-frontend-url.up.railway.app
```

### Frontend Service

Create a Railway service for the frontend.

- Root directory: `client`
- Build command:

```bash
npm install && npm run build
```

- Start command:

```bash
npm run preview -- --port $PORT
```

Add this Railway environment variable:

```env
VITE_API_URL=https://your-backend-url.up.railway.app/api
```

Important: Vite exposes only environment variables prefixed with `VITE_` to the frontend.

## Validation and Error Handling

- Required fields are validated using `express-validator`
- Invalid login returns an authentication error
- Duplicate user signup is prevented
- Only project members can access project data
- Only admins can manage members and tasks
- Members can update only assigned task status
- API returns clear error messages for invalid actions

## Notes

- Do not commit `.env` files.
- Use strong secrets for production environment variables.
- Make sure `CLIENT_URL` on the backend matches the deployed frontend URL.
- Make sure `VITE_API_URL` on the frontend points to the deployed backend API URL.
