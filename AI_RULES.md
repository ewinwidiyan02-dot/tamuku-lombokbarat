# AI Development Rules

This document provides guidelines for the AI assistant to follow when developing this application. The goal is to maintain code quality, consistency, and predictability.

## Tech Stack

This project is built with a modern, type-safe, and efficient technology stack:

- **Build Tool**: Vite for fast development and optimized builds.
- **Framework**: React for building the user interface.
- **Language**: TypeScript for static typing and improved developer experience.
- **Styling**: Tailwind CSS for a utility-first styling approach.
- **UI Components**: shadcn/ui, a collection of accessible and composable components built on Radix UI.
- **Routing**: React Router (`react-router-dom`) for client-side navigation.
- **Data Fetching**: TanStack Query (`@tanstack/react-query`) for managing server state, caching, and data synchronization.
- **Form Management**: React Hook Form (`react-hook-form`) for performant form state management, paired with Zod for schema validation.
- **Icons**: Lucide React (`lucide-react`) for a comprehensive and consistent set of icons.
- **Notifications**: A combination of the default shadcn/ui `Toaster` and `Sonner` for rich toast notifications.

## Library and Pattern Usage

To ensure consistency, please adhere to the following rules:

- **UI Components**:
  - **ALWAYS** use components from the `shadcn/ui` library located in `src/components/ui` for all UI primitives (buttons, inputs, cards, etc.).
  - If a required component does not exist, create a new reusable component in `src/components` by composing `shadcn/ui` components.
  - **DO NOT** introduce other UI libraries like Material UI, Ant Design, or Bootstrap.

- **Styling**:
  - **ALWAYS** use Tailwind CSS utility classes for styling.
  - **AVOID** writing custom CSS in `.css` files. Global styles should only be defined in `src/index.css` using Tailwind's `@layer` directives.
  - Adhere to the design system defined in `tailwind.config.ts` (colors, spacing, border radius, etc.).

- **State Management**:
  - For server state (data fetched from an API), **ALWAYS** use TanStack Query.
  - For simple, local component state, use React's `useState` and `useReducer` hooks.
  - **DO NOT** add global state management libraries like Redux or Zustand unless the application's complexity explicitly requires it.

- **Routing**:
  - All client-side routing **MUST** be handled by `react-router-dom`.
  - Define all routes within `src/App.tsx`.
  - New pages should be created as components within the `src/pages` directory.

- **Forms**:
  - **ALWAYS** use `react-hook-form` for building forms.
  - Use `zod` to define validation schemas and connect them using `@hookform/resolvers`.
  - Use the `Form` component from `src/components/ui/form` to integrate with `react-hook-form` and `shadcn/ui` components.

- **Icons**:
  - **ONLY** use icons from the `lucide-react` package. Do not install or use any other icon libraries.

- **File Structure**:
  - **Pages**: `src/pages`
  - **Reusable Components**: `src/components`
  - **shadcn/ui Primitives**: `src/components/ui`
  - **Custom Hooks**: `src/hooks`
  - **Utility Functions**: `src/lib`