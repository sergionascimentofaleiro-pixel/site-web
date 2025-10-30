# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a full-stack **dating application** (similar to Tinder) with two main components:

- **frontend-angular/**: Angular 20 frontend application (standalone components architecture)
- **backend-nodejs/**: Express.js backend API with **PostgreSQL** or **MariaDB/MySQL** (dual support)

The backend and frontend are separate applications that run independently and communicate via HTTP.

### Database Setup

The application supports both **PostgreSQL** and **MariaDB/MySQL** with automatic detection and query conversion.

**Configuration:**

Edit `backend-nodejs/.env` to choose database type:
```env
DB_TYPE=postgres   # or 'mysql' for MariaDB/MySQL
DB_PORT=5432       # 3306 for MySQL
```

**Full Reset (Recommended):**
```bash
cd backend-nodejs/database
./full-reset.sh              # Full import with cities (1-2 minutes)
./full-reset.sh --skip-cities # Fast mode for testing (30 seconds)
```

The script automatically detects `DB_TYPE` from `.env` and:
1. Drops and recreates the database
2. Creates all tables (users, profiles, matches, messages, interests, locations)
3. Seeds interest categories and translations (en, fr, es, pt)
4. Imports worldwide location data from GeoNames (~225k cities with population > 500) - skipped with --skip-cities
5. Creates test accounts (400 users) with random interests
6. Total time: ~1-2 minutes (or 30 seconds with --skip-cities)

**Cloud Database Reset (Fly.io, Render, etc.):**

For cloud PostgreSQL databases, use DATABASE_URL with a local proxy for much faster imports:

```bash
# Terminal 1: Create proxy to cloud database
flyctl proxy 5432:5432 -a curvy-backend-db

# Terminal 2: Run reset script with DATABASE_URL pointing to localhost
export DATABASE_URL="postgres://username:password@localhost:5432/dbname?sslmode=disable"
export DB_TYPE=postgres
cd backend-nodejs/database
./full-reset.sh              # Full import: 2-3 minutes (vs 15-30 via SSH)
./full-reset.sh --skip-cities # Fast mode: 30 seconds
```

**Why proxy is faster:**
- The `.flycast` domain (Fly.io internal network) is not accessible from local machine
- Running the script via SSH is very slow for city imports (15-30 minutes)
- Using `flyctl proxy` creates a local tunnel with much better performance (2-3 minutes)
- The script automatically detects DATABASE_URL and uses cloud mode

**Manual Setup (PostgreSQL):**
```bash
sudo -u postgres psql
CREATE USER devuser WITH PASSWORD 'Manuela2011!';
ALTER USER devuser CREATEDB;
\q

psql -U devuser -h localhost -d dating_app -f backend-nodejs/database/schema-postgres.sql
```

**Manual Setup (MariaDB/MySQL):**
```bash
mysql -u root -p
source backend-nodejs/database/setup.sql
source backend-nodejs/database/schema.sql
```

**Database Credentials:**
- PostgreSQL: `devuser` / `Manuela2011!`
- MariaDB root: `Manuela2011`
- MariaDB dev: `devuser` / `Manuela2011!`
- Database: `dating_app`

**Dual Compatibility:**
- The `src/config/database.js` file provides automatic query conversion between MySQL and PostgreSQL syntax
- All SQL placeholders (`?` → `$1, $2, ...`), INSERT RETURNING, date formats, and aggregation functions are handled automatically
- Models use conditional logic for database-specific syntax (UPSERT, INSERT IGNORE, GROUP_CONCAT/STRING_AGG)

See `backend-nodejs/database/README.md` for complete database documentation.

## Development Commands

### Backend (Node.js/Express)

From the `backend-nodejs/` directory:

```bash
npm run dev      # Start development server with nodemon (auto-reload)
npm start        # Start production server
```

Backend runs on port 3000 by default (configurable via `.env` file).

Database: PostgreSQL or MariaDB/MySQL with credentials configured in `.env`:
- Type: Set via `DB_TYPE` environment variable (`postgres` or `mysql`)
- User: `devuser`
- Database connection settings in environment variables
- Port: 5432 (PostgreSQL) or 3306 (MySQL)

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
- `src/routes/` - API route definitions (auth, profile, match, message)
- `src/controllers/` - Request handlers and business logic
- `src/models/` - Data models (User, Profile, Like, Match, Message)
- `src/middleware/` - Express middleware (JWT authentication)
- `src/config/` - Database connection configuration
- `src/server.js` - Application entry point with Express configuration

**API Endpoints:**
- Authentication: `/api/auth/*` (register, login, me, update preferences)
- Profiles: `/api/profile/*` (CRUD, potential matches, swipe)
- Matches: `/api/matches/*` (list, unmatch)
- Messages: `/api/messages/*` (send, conversations, unread count)
- Interests: `/api/interests/*` (get all with translations, get/set user interests)
- Locations: `/api/locations/*` (countries, states, cities, search with autocomplete)

All protected routes require JWT Bearer token authentication. CORS is enabled for cross-origin requests.

### Frontend Architecture

Angular 20 application using:
- **Standalone components** (no NgModules)
- **Signals** for reactive state management
- **SCSS** for styling (configured project-wide)
- **Router** for navigation via `app.routes.ts`
- **HTTP Interceptor** for automatic JWT token injection

**Services:**
- `Auth` - Authentication (login, register, getCurrentUser, language preferences)
- `Profile` - Profile management and swiping
- `Match` - Match management
- `Message` - Messaging functionality
- `Interest` - Interest categories and user interests management
- `Location` - Countries, states, cities with autocomplete search

**Components:**
- Login/Register - Authentication forms
- Profile - User profile creation/editing
- Discover - Swipe interface (Tinder-like card system)
- Matches - List of matches
- Chat - One-on-one messaging

Component configuration:
- Component prefix: `app-`
- Style language: SCSS
- File naming: `*.ts`, `*.html`, `*.scss`, `*.spec.ts`

Application configuration is centralized in `src/app/app.config.ts` with providers for:
- Zone change detection (with event coalescing)
- Router
- Global error listeners
- HTTP Client with auth interceptor
- i18n with ngx-translate (English, French, Spanish, Portuguese)

### Internationalization (i18n)

The application supports 4 languages:
- **English (en)** - Default fallback
- **French (fr)** - Primary language
- **Spanish (es)**
- **Portuguese (pt)**

Translation files are located in `frontend-angular/public/assets/i18n/`.

**Language Features:**
- User can select preferred language (stored in database)
- Language persists across sessions
- All UI elements are translated
- Interest categories and names are translated
- Location names support multiple languages (countries)

**Implementation:**
- Uses `ngx-translate` library
- Default language: French
- Language selector in navigation bar
- Automatic language detection from user preferences

### Key Features

**1. Interest System:**
- 10 interest categories (Sports, Music, Arts, etc.)
- 100 predefined interests
- Fully translated in 4 languages
- Users can select multiple interests
- Interest matching for better compatibility

**2. Location System:**
- Worldwide coverage: 252 countries, 305 states, 224k+ cities
- Cascading selection: Country → State (if applicable) → City
- City autocomplete search (performance optimized)
- Search filters up to 500 results
- Data sourced from GeoNames

**3. Profile System:**
- Public info: Name, photo, bio, interests, location
- Private info: Email, phone (not shared with matches)
- Age calculation from birth date
- Gender and preference selection

### Code Style

Frontend uses Prettier with these settings:
- Print width: 100 characters
- Single quotes: enabled
- Angular parser for HTML templates

## Testing

Frontend tests use Jasmine and Karma. Tests run in Chrome by default.

## Database Schema

**Main Tables:**
- `users` - Authentication and user preferences
- `profiles` - User profile information
- `likes` - Swipe actions (like/pass)
- `matches` - Mutual likes
- `messages` - Chat messages between matches
- `interest_categories` - Interest categories
- `interests` - Available interests
- `interest_translations` - Interest name translations
- `profile_interests` - User-interest associations
- `countries` - Countries with translations
- `states` - States/provinces for specific countries
- `cities` - Cities (225k entries, population > 500)

See `backend-nodejs/database/README.md` for detailed schema documentation.

## Deployment

The application is configured for deployment on **Fly.io** (backend + PostgreSQL) and **Vercel** (frontend).

**Configuration files:**
- `backend-nodejs/fly.toml` - Fly.io app configuration
- `backend-nodejs/Dockerfile` - Docker container for backend
- `frontend-angular/src/app/config/environment.ts` - Frontend environment URLs

**Key features:**
- App name: `curvy-backend` (Fly.io)
- Frontend: `curvy.vercel.app`
- Persistent volume for uploads (10GB)
- Health checks configured
- DATABASE_URL support for cloud PostgreSQL
- Dual mode: local development + cloud production

**Important:** When initializing a Fly.io database, use the proxy method documented above for much faster imports (2-3 minutes vs 15-30 minutes via SSH).

See `DEPLOYMENT-FLYIO-VERCEL.md` for complete deployment guide with step-by-step instructions.
