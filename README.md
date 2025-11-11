# CollabCode 🚀

A real-time collaborative code editor with AI-powered code reviews.  
Built with **NestJS**, **Next.js**, **Prisma**, **PostgreSQL**, and **Socket.IO**.

## ✨ Features
- 🧠 AI-powered code review using OpenAI
- ⚡ Real-time collaboration via WebSockets
- 📂 Multi-user projects with authentication (JWT)
- 💻 VS Code–style Monaco editor
- 🎨 Modern UI using TailwindCSS + Shadcn

## 🧰 Tech Stack
**Frontend:** Next.js 16, TypeScript, TailwindCSS, Shadcn, Monaco Editor  
**Backend:** NestJS, Prisma ORM, PostgreSQL, Socket.IO, OpenAI API  
**Infrastructure:** Docker, Redis, Node.js 20+

## 🚀 Getting Started

### 1. Backend
```bash
cd backend
cp .env.example .env
npm install
docker run --name collabcode-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=collabcode -p 5432:5432 -d postgres:16
npx prisma migrate dev --name init
npm run start:dev
