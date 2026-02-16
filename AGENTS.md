# Civil ERP - Repository Knowledge

## Project Overview
Civil ERP is a construction management ERP system with:
- **Frontend**: React (CRA with CRACO) + TailwindCSS + shadcn/ui
- **Backend**: Python FastAPI + Motor (async MongoDB)
- **Auth**: JWT-based authentication with RBAC (Role-Based Access Control)

## Build Commands

### Backend
```bash
cd civilERP/backend
pip install -r requirements.txt
python -m uvicorn server:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd civilERP/frontend
npm install --legacy-peer-deps  # Required due to date-fns peer dep conflict
npm run build  # Production build
npm start      # Development server
```

## Environment Variables

### Backend (.env)
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT signing secret
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)
- `FERNET_KEY` - Optional encryption key for credentials

### Frontend (.env)
- `REACT_APP_BACKEND_URL` - Backend API URL
- `PORT` - Dev server port

## RBAC System (Implemented)

### Available Modules
- dashboard, projects, financial, procurement, hrms, compliance, einvoicing, reports, ai_assistant, settings, admin

### Available Actions
- view, create, edit, delete

### Backend API Endpoints
- `GET /api/rbac/modules` - Get available modules and actions
- `POST /api/rbac/roles` - Create new role
- `GET /api/rbac/roles` - List all roles
- `GET /api/rbac/roles/{id}` - Get specific role
- `PUT /api/rbac/roles/{id}` - Update role
- `DELETE /api/rbac/roles/{id}` - Delete role
- `POST /api/rbac/assign-role` - Assign role to user
- `DELETE /api/rbac/users/{id}/role` - Remove RBAC role from user
- `GET /api/rbac/users` - List users with role info
- `GET /api/rbac/stats` - Get RBAC statistics
- `POST /api/rbac/init` - Initialize default system roles

### Frontend Components
- `PermissionGate` - Conditional rendering based on permissions
- `CanView`, `CanCreate`, `CanEdit`, `CanDelete` - Shorthand components
- `AdminOnly` - Renders children only for admin users
- `usePermission(module, action)` - Hook for permission checks

### AuthContext Utilities
- `hasPermission(module, action)` - Check specific permission
- `canView(module)`, `canCreate(module)`, `canEdit(module)`, `canDelete(module)`
- `isAdmin` - Check if user has admin access
- `refreshPermissions()` - Refresh user permissions from server

## Key Files

### Backend
- `server.py` - Main FastAPI application with all routes and models
- `.env` - Environment variables

### Frontend
- `src/context/AuthContext.js` - Authentication and RBAC context
- `src/components/PermissionGate.jsx` - Permission-based rendering
- `src/components/layout/Sidebar.jsx` - Permission-filtered navigation
- `src/pages/RoleManagement.jsx` - Admin role management UI
- `src/App.js` - Routes with RBAC protection

## Testing Notes
- Backend syntax can be verified with: `python -c "import ast; ast.parse(open('server.py').read())"`
- Frontend builds with warnings about useEffect dependencies (non-breaking)
- MongoDB required for full testing
