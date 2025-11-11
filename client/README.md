# AMARK
AMARK is a tool designed for Markers to review and assess writing tasks.

## Features:
Backend: Built with Django
Frontend: Developed using React and TypeScript

## Quick-Start

### Authentication

- For Local development:
set `USE_FAKE_AUTH=True` -> `backend/.env` 
set `VITE_AUTH_DISABLED=true` -> `.env`

- For Prod, change them back to false/False

### 
- Navigate to the project root and run:
`npm install & npm run dev`
- Move into the backend directory:`cd backend`
- Copy the environment file and update its content as needed: `cp .env.example .env`
- Build and start the services: `docker compose up --build`
**Note** run `sudo chown -R $(id -u):$(id -g) ./staticfiles` after docker build container