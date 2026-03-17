import { createRouter, createRoute, createRootRoute, redirect, Outlet } from "@tanstack/react-router";
import { RootLayout } from "./routes/__root";
import { LandingPage } from "./routes/index";
import { LoginPage } from "./routes/login";
import { DashboardPage } from "./routes/_authenticated/dashboard";
import { ProfilePage } from "./routes/_authenticated/profile";
import { ExercisesPage } from "./routes/_authenticated/exercises";
import { RoutineNewPage } from "./routes/_authenticated/routines.new";
import { RoutineEditPage } from "./routes/_authenticated/routines.$id.edit";
import { WorkoutPage } from "./routes/_authenticated/workout";
import { ReadinessPage } from "./routes/_authenticated/readiness";
import { UsersPage } from "./routes/_authenticated/users";
import { LabelsPage } from "./routes/_authenticated/labels";
import { CalendarPage } from "./routes/_authenticated/calendar";
import { SchedulePage } from "./routes/_authenticated/schedule";
import { CoachPage } from "./routes/_authenticated/coach";
import { KnowledgePage } from "./routes/_authenticated/knowledge";

const AUTH_KEY = "training_app_auth_v1";

function isAuthenticated() {
  try {
    return !!localStorage.getItem(AUTH_KEY);
  } catch {
    return false;
  }
}

// Root route
const rootRoute = createRootRoute({ component: RootLayout });

// Public routes
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: LandingPage });
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: "/login", component: LoginPage });

// Auth guard layout
const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "authenticated",
  component: Outlet,
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" });
  },
});

// Authenticated routes
const dashboardRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: "/dashboard", component: DashboardPage });
const profileRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: "/profile", component: ProfilePage });
const exercisesRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: "/exercises", component: ExercisesPage });
const routineNewRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: "/routines/new", component: RoutineNewPage });
const routineEditRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: "/routines/$id/edit", component: RoutineEditPage });
const workoutRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: "/workout", component: WorkoutPage });
const readinessRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: "/readiness", component: ReadinessPage });
const usersRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: "/users", component: UsersPage });
const labelsRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: "/labels", component: LabelsPage });
const calendarRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: "/calendar", component: CalendarPage });
const scheduleRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: "/schedule", component: SchedulePage });
const coachRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: "/coach", component: CoachPage });
const knowledgeRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: "/knowledge", component: KnowledgePage });

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  authenticatedRoute.addChildren([
    dashboardRoute,
    profileRoute,
    exercisesRoute,
    routineNewRoute,
    routineEditRoute,
    workoutRoute,
    readinessRoute,
    usersRoute,
    labelsRoute,
    calendarRoute,
    scheduleRoute,
    coachRoute,
    knowledgeRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
