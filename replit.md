# Photography Portfolio Website

## Overview

This is a full-stack photography portfolio website built with React, TypeScript, Express.js, and PostgreSQL. The application showcases a photographer's work through an elegant, responsive interface with portfolio galleries, contact forms, and administrative features. It features modern web technologies including shadcn/ui components, Tailwind CSS styling, and Drizzle ORM for database management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development and building
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom design system and CSS variables for theming
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **State Management**: TanStack Query (React Query) for server state management
- **Animation**: Framer Motion for smooth animations and transitions
- **Forms**: React Hook Form with Zod validation for type-safe form handling

The frontend is organized into reusable components with a clear separation between UI components (`/components/ui/`) and feature-specific components. The application uses a dark theme by default with comprehensive design tokens.

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Development Server**: Custom Vite integration for hot module replacement in development
- **API Design**: RESTful API with clear endpoint structure for portfolio and contact operations
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes
- **Request Logging**: Custom middleware for API request/response logging
- **Storage Abstraction**: Interface-based storage layer supporting both in-memory and database implementations

The backend follows a modular architecture with separate concerns for routing, storage, and server configuration.

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Migration System**: Drizzle Kit for database schema management and migrations
- **Connection**: Neon Database serverless PostgreSQL connection
- **Schema Design**: Well-structured tables for portfolio images and contact submissions with proper relationships and constraints
- **Development Fallback**: In-memory storage implementation for development/testing scenarios

### External Dependencies
- **Database Hosting**: Neon Database for serverless PostgreSQL
- **Image Hosting**: External image URLs (Unsplash, Pixabay) for portfolio images
- **Font Loading**: Google Fonts integration for typography
- **Development Tools**: Replit-specific plugins for development environment integration

The application uses environment variables for configuration and supports both development and production deployment scenarios. The architecture is designed to be scalable and maintainable with clear separation of concerns between frontend presentation, backend logic, and data persistence layers.

## Recent Changes

### GitHub Import Setup - Fresh Clone (Oct 2, 2025)
Successfully configured a fresh GitHub clone to run in the Replit environment:
- Installed missing `cuid` package for database schema ID generation
- Created PostgreSQL database using Replit's database service
- Pushed database schema using `npm run db:push` (Drizzle Kit migration)
- Configured workflow "Start application" with webview output on port 5000
- Verified Vite dev server has `allowedHosts: true` for Replit's proxy support (line 26 in server/vite.ts)
- Server correctly bound to 0.0.0.0:5000 for Replit environment
- All LSP diagnostics cleared and application running successfully
- Backend API endpoints responding correctly (categories and projects APIs)
- Deployment configuration set to autoscale with proper build/run commands

### Mobile Navigation Scroll Fix (Sept 30, 2025)
Fixed mobile menu scroll-to-section functionality that was broken after adding Framer Motion animations:
- Added `id="portfolio"` to CategoryFilter component for "Work" menu navigation
- Updated scroll timing: menu closes first, then scrolls after 100ms delay to prevent animation interference
- Changed overflow handling on mobile menu animation container
- Navigation now properly scrolls to sections: Work → Category filter, About → About section, Contact → Contact section

## Deployment

### Replit Deployment
The application is configured for deployment on Replit with the following setup:

**Development:**
- Command: `npm run dev`
- Uses tsx to run TypeScript directly without compilation
- Vite dev server with HMR on port 5000
- Host configured as `0.0.0.0` for Replit environment
- Vite configured with `allowedHosts: true` for Replit's proxy

**Production:**
- Build: `npm run build` (builds frontend only with Vite)
- Start: `npm run start` (uses tsx to run server in production mode)
- tsx moved from devDependencies to dependencies for production use
- Server serves static files from `dist/public` in production
- Configured for autoscale deployment on Replit

**Important Notes:**
- Both dev and production use tsx for TypeScript execution (no separate compilation step)
- The app uses in-memory storage by default; configure database for persistence
- Port 5000 is the only non-firewalled port and must be used for the frontend

### Netlify Functions Serverless Deployment
The application is configured for serverless deployment on Netlify with the following setup:

- **Serverless Function**: API routes wrapped with serverless-http adapter in `netlify/functions/api.ts`
- **Build Configuration**: `netlify.toml` defines build commands, redirects, and function settings
- **Build Process**: Vite builds the frontend to `dist/client`, functions are built to `netlify/functions`
- **Routing**: API requests (`/api/*`) are redirected to `/.netlify/functions/api/:splat`
- **SPA Support**: All non-API routes redirect to `index.html` for client-side routing
- **Environment Variables**: Set `DATABASE_URL` in Netlify UI for production database connection
- **Node Version**: Configured to use Node.js 20 for compatibility

**Deployment Steps:**
1. Connect repository to Netlify
2. Configure environment variables in Netlify UI (especially `DATABASE_URL`)
3. Deploy - Netlify will automatically run the build command and deploy functions
4. The app will be available at the Netlify-provided URL

**Important Notes:**
- The app uses stateless architecture suitable for serverless deployment
- In-memory storage is used by default; configure external database for production persistence
- No session middleware currently used; consider JWT or external session store for auth in production

**Build Configuration:**
- The project uses a custom esbuild script (`scripts/build-functions.mjs`) to build Netlify functions
- This script uses `esbuild-plugin-alias` to resolve TypeScript path aliases (`@shared`) during the build
- The build script is configured in `package.json` under `build:functions`
- The Netlify build command uses `npm ci --include=dev` to ensure devDependencies (vite, esbuild, etc.) are installed during build
- This ensures the Netlify serverless functions can properly bundle and resolve all dependencies