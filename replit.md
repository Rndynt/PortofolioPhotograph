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