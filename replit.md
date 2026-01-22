# Invoice Management System

## Overview

This is a full-stack invoice management system built with React and Firebase. The application provides role-based access control for managing invoice requests, expense sheets, and user accounts with approval workflows. It uses a modern tech stack with TypeScript, React, Express.js, and Firebase for authentication and data storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state, React Context for authentication
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Server**: Express.js with TypeScript
- **API Design**: RESTful architecture (minimal routes as Firebase handles most operations)
- **Development Setup**: Vite middleware integration for hot reloading
- **Error Handling**: Centralized error middleware with structured error responses

### Authentication & Authorization
- **Provider**: Firebase Authentication
- **Strategy**: Email/password authentication with role-based access control
- **Roles**: Five distinct user roles (operation, finance, operational_admin, financial_admin, main_admin)
- **Account Status**: Three-tier approval system (pending, approved, rejected)
- **Protection**: Route-level protection with role-based component access

### Data Storage
- **Primary Database**: Firebase Firestore for all application data
- **File Storage**: Firebase Storage for document uploads (invoices, receipts, expense sheets)
- **Schema**: Zod validation schemas for type safety and data validation
- **Real-time**: Firestore real-time listeners for live data updates

### Business Logic Flow
- **Invoice Workflow**: Multi-stage approval process (operational_admin → main_admin → finance)
- **Expense Management**: Finance team acknowledgment system for expense sheets
- **User Management**: Main admin approval for new user registrations
- **File Handling**: Secure upload and retrieval of supporting documents

### UI/UX Design
- **Design System**: Modern, clean interface with consistent spacing and typography
- **Responsive**: Mobile-first design with adaptive layouts
- **Accessibility**: ARIA-compliant components with keyboard navigation
- **Theme**: Light/dark mode support with CSS custom properties
- **Icons**: Font Awesome integration for consistent iconography

## External Dependencies

### Firebase Services
- **Firebase Authentication**: User authentication and session management
- **Firestore Database**: Document-based NoSQL database for application data
- **Firebase Storage**: File storage service for document uploads
- **Firebase SDK**: Client-side SDK for real-time database operations

### UI Framework Dependencies
- **Radix UI**: Headless UI components for accessibility and functionality
- **Tailwind CSS**: Utility-first CSS framework for styling
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Lucide React**: Icon library for modern iconography

### Development Tools
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Fast build tool with hot module replacement
- **TanStack Query**: Server state management and caching
- **Wouter**: Lightweight client-side routing
- **Zod**: Runtime type validation and schema definition

### Build and Deployment
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration
- **Replit Integration**: Development environment optimization for Replit platform