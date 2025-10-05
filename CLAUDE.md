# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a full-stack web application with two main components:

- **frontend-angular/**: Angular 20 frontend application (standalone components architecture)
- **backend-nodejs/**: Express.js backend API

The backend and frontend are separate applications that run independently and communicate via HTTP.

## Development Commands

### Backend (Node.js/Express)

From the `backend-nodejs/` directory:

```bash
npm run dev      # Start development server with nodemon (auto-reload)
npm start        # Start production server
```

Backend runs on port 3000 by default (configurable via `.env` file).

Database: MariaDB with credentials configured in `.env`:
- User: `devuser`
- Database connection settings in environment variables

### Frontend (Angular)

From the `frontend-angular/` directory:

```bash
npm start        # Start development server (http://localhost:4200)
ng serve         # Alternative to npm start
npm run build    # Production build (outputs to dist/)
npm run watch    # Build with watch mode for development
npm test         # Run Karma unit tests
```

#### Angular-Specific Commands

```bash
ng generate component component-name    # Create new component
ng generate --help                      # List available schematics
```

## Architecture Notes

### Backend Architecture

The backend follows an MVC-like structure with directories for:
- `src/routes/` - API route definitions
- `src/controllers/` - Request handlers and business logic
- `src/models/` - Data models
- `src/middleware/` - Express middleware
- `src/server.js` - Application entry point with Express configuration

Currently implements a basic health check endpoint at `/api/health`. CORS is enabled for cross-origin requests.

### Frontend Architecture

Angular 20 application using:
- **Standalone components** (no NgModules)
- **Signals** for reactive state management
- **SCSS** for styling (configured project-wide)
- **Router** for navigation via `app.routes.ts`

Component configuration:
- Component prefix: `app-`
- Style language: SCSS
- File naming: `*.ts`, `*.html`, `*.scss`, `*.spec.ts`

Application configuration is centralized in `src/app/app.config.ts` with providers for:
- Zone change detection (with event coalescing)
- Router
- Global error listeners

### Code Style

Frontend uses Prettier with these settings:
- Print width: 100 characters
- Single quotes: enabled
- Angular parser for HTML templates

## Testing

Frontend tests use Jasmine and Karma. Tests run in Chrome by default.
