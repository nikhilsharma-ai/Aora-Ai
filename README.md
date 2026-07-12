# Aura AI Monorepo

Welcome to the **Aura AI** repository. This project is structured as a clean monorepo containing both the frontend application and the backend service.

## Project Structure

```
saas.ai/
├── backend/            # FastAPI Python backend
│   ├── app/            # Application logic (routers, models, services)
│   ├── requirements.txt# Python package dependencies
│   └── venv/           # Python virtual environment
├── frontend/           # Next.js frontend
│   ├── src/            # Next.js React codebase (app router, components)
│   ├── public/         # Static assets (images, icons)
│   ├── package.json    # Frontend npm dependencies and scripts
│   └── tsconfig.json   # TypeScript configuration
└── package.json        # Root monorepo scripts coordinator
```

## Running the Application

### 1. Root Commands (Recommended)

From the root directory of this repository, you can run the following convenient commands:

- **Run Frontend (Dev Server)**:
  ```bash
  npm run dev:frontend
  ```
- **Build Frontend**:
  ```bash
  npm run build:frontend
  ```
- **Run Backend (Uvicorn Dev Server)**:
  ```bash
  npm run dev:backend
  ```

### 2. Manual Commands

Alternatively, you can navigate into each folder and run their respective commands:

#### Frontend (`frontend/`)
```bash
cd frontend
npm run dev
```

#### Backend (`backend/`)
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```
