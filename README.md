# ShiftSync - Roster Management System

A modern, multi-tenant roster management application built with Next.js 15, React 19, and Supabase.

## Features

- **Multi-tenant Architecture**: Complete data isolation between companies using Row Level Security
- **Real-time Updates**: Live roster updates using Supabase Realtime subscriptions
- **Mock Authentication**: Demo login system for testing (Manager and Staff roles)
- **Role-based Access Control**: Different views and permissions for managers and staff
- **Shift Management**: Create, edit, and delete shifts with real-time synchronization
- **Responsive Design**: Mobile-first design with adaptive layouts

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **Real-time**: Supabase Realtime for live updates
- **Authentication**: Mock authentication system (ready for Supabase Auth migration)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Seed the database:
```bash
npm run seed
```

4. Run the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Migration Status

### Completed
- Database schema with multi-tenant RLS
- Authentication system with mock login
- Roster page with real-time updates
- Navigation and layout components
- Supabase service layer
- Next.js configuration and build

### To be Migrated
The following pages need full implementation:
- Employees, Positions, Time Tracking, Reports
- My Shifts, My Work, Availability pages

## Architecture

The application uses Next.js App Router with a multi-tenant Supabase backend. All data is isolated by company using Row Level Security policies. Real-time updates are enabled for shifts, employees, and positions tables.

For detailed documentation, see the inline comments in the codebase.
