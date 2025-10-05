# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a full-stack **dating application** (similar to Tinder) with two main components:

- **frontend-angular/**: Angular 20 frontend application (standalone components architecture)
- **backend-nodejs/**: Express.js backend API with MariaDB

The backend and frontend are separate applications that run independently and communicate via HTTP.

### Database Setup

The application uses MariaDB. To set up the complete database with all features:

**Full Reset (Recommended):**
```bash
cd backend-nodejs/database
./full-reset.sh
```

This script will:
1. Drop and recreate the database
2. Create all tables (users, profiles, matches, messages, interests, locations)
3. Seed interest categories and translations (en, fr, es, pt)
4. Import worldwide location data from GeoNames (~225k cities with population > 500)
5. Create test accounts (40 users) with random interests
6. Total time: ~1-2 minutes

**Manual Setup:**
```bash
mysql -u root -p
source backend-nodejs/database/setup.sql
source backend-nodejs/database/schema.sql
```

**Database Credentials:**
- Root password: `Manuela2011`
- Dev user: `devuser` / `Manuela2011!`
- Database: `dating_app`

See `backend-nodejs/database/README.md` for complete database documentation.

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
