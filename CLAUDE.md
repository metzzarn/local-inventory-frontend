# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server
npm run dev

# Build the project
npm run build

# Lint the codebase
npm run lint

# Preview production build
npm run preview
```

## Project Architecture

This is a React TypeScript inventory management application with the following architecture:

### Core Structure
- **Frontend**: React 18 with TypeScript, Vite build tool
- **Styling**: Tailwind CSS with custom UI components
- **State Management**: React Context API for authentication
- **Backend Communication**: RESTful API calls to `http://localhost:3001`

### Key Components

**Authentication Flow**:
- `AuthContext` (`src/contexts/AuthContext.tsx`): Manages user authentication state, JWT tokens, and localStorage persistence
- `AppRouter` (`src/components/AppRouter.tsx`): Handles routing between authenticated and unauthenticated views
- `LoginForm` (`src/components/LoginForm.tsx`): User login/registration interface

**Inventory Management**:
- `InventoryManager` (`src/components/InventoryManager.tsx`): Main inventory dashboard with item management
- `InventoryTable` (`src/components/InventoryTable.tsx`): Displays items in a responsive table/card layout
- `AddItemForm` (`src/components/AddItemForm.tsx`): Form for adding new inventory items
- `EditableCell` (`src/components/EditableCell.tsx`): Inline editing for inventory items

**API Integration**:
- `useApi` hook (`src/hooks/useApi.ts`): Handles authenticated API requests with automatic token refresh
- Automatic token refresh on 401/403 responses
- Graceful logout on refresh failure

### Key Features
- JWT-based authentication with refresh tokens
- Mobile-responsive design with touch-friendly interfaces
- Barcode scanning capability (mock implementation)
- Real-time inventory quantity adjustments
- Inline editing of inventory items
- Persistent authentication state

### API Endpoints
The frontend communicates with a backend API at `http://localhost:3001/api/`:
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout
- `GET /items` - Fetch inventory items
- `POST /items` - Add new item
- `PUT /items/:id` - Update item
- `PATCH /items/:id/quantity` - Update item quantity
- `DELETE /items/:id` - Delete item

### Path Aliases
- `@/` resolves to `src/` directory
- Use `@/components/`, `@/hooks/`, `@/contexts/`, etc. for imports

### TypeScript Types
Core types defined in `src/types/index.ts`:
- `Item`: Inventory item structure
- `User`: User account information
- `AuthResponse`: Authentication response format

### UI Components
Custom UI components in `src/components/ui/`:
- Built with Tailwind CSS
- Follows shadcn/ui pattern for reusable components
- Responsive design with mobile-first approach

### Mobile Considerations
- Touch-friendly button sizes (minimum 44px)
- Responsive breakpoints for different screen sizes
- Mobile-specific navigation patterns
- Camera API integration for barcode scanning