export interface AuthState {
  idToken: string;
  email: string;
  authenticatedAt: string;
  devMode?: boolean;
  role?: string;
}

export interface UserProfile {
  fullName: string;
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;
  activityLevel: string;
  units: string;
  photoUrl?: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  category: string;
  defaultWeight: number;
  defaultSets: number;
  defaultReps: number;
}

export interface ExerciseMedia {
  id: string;
  type: "photo" | "video";
  url: string;
  caption?: string;
}

export interface UserExercise {
  id: string;
  name: string;
  type: string;
  muscleGroup: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeightKg: number;
  media: ExerciseMedia[];
  createdAt: string;
}

export interface RoutineExercise {
  exerciseId: string;
  exerciseName?: string;
  sets: number;
  reps: number;
  weightKg: number;
}

export interface Routine {
  id: string;
  name: string;
  goal: string;
  daysPerWeek: number;
  exercises: RoutineExercise[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SetLog {
  setNumber: number;
  repsCompleted: number;
  weightUsedKg: number;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  setsCompleted: SetLog[];
}

export interface WorkoutLogEntry {
  id: string;
  routineId: string;
  routineName: string;
  startedAt: string;
  completedAt: string;
  exercises: ExerciseLog[];
}

export interface ReadinessCheckin {
  id: string;
  sleepQuality: number;
  energy: number;
  stress: number;
  mood: number;
  soreness: number;
  motivation: number;
  notes: string;
  createdAt: string;
}

export interface ScheduledWorkout {
  id: string;
  clientEmail: string;
  routineId: string;
  routineName: string;
  scheduledDate: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  clientName?: string;
}

export interface KnowledgeChunk {
  id: string;
  exerciseId: string;
  chunkType: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface AdminRoutine extends Routine {
  email: string;
  ownerName: string;
}

export interface AdminStats {
  users: { total: number; clients: number; admins: number };
  routines: number;
  exercises: { catalog: number; custom: number };
  workouts: { total: number; thisWeek: number };
  checkins: { total: number; thisWeek: number };
  knowledgeChunks: number;
}

export interface ClientSummary {
  email: string;
  username: string;
  fullName: string;
  createdAt: string;
  routineCount: number;
  workoutCount: number;
  lastWorkout: string | null;
  checkinCount: number;
  lastCheckin: string | null;
}

export interface CoachSocials {
  instagram?: string;
  website?: string;
  youtube?: string;
}

export interface CoachListItem {
  email: string;
  fullName: string;
  photoUrl: string;
  tagline: string;
  specialties: string[];
  accentColor: string;
  yearsExperience: number;
  startingPrice: number;
}

export interface CoachPlan {
  id: string;
  name: string;
  price: number;
  cadence: string; // "month" | "session" | "week" | "program" | ...
  description: string;
  features: string[];
  popular: boolean;
}

export interface CoachMedia {
  type: "photo" | "video";
  url: string; // photo: base64 data URL; video: YouTube/Vimeo/direct URL
  caption: string;
}

export interface CoachSpotlight {
  email: string;
  fullName: string;
  photoUrl: string;
  tagline: string;
  bio: string;
  specialties: string[];
  certifications: string[];
  yearsExperience: number;
  coverPhoto: string;
  accentColor: string;
  socials: CoachSocials;
  plans: CoachPlan[];
  gallery: CoachMedia[];
  published: boolean;
}

export type CoachingRequestStatus = "pending" | "accepted" | "declined";

export interface CoachingRequest {
  id: string;
  coachEmail: string;
  clientEmail: string;
  clientName: string;
  clientPhoto: string;
  coachName: string;
  planId: string;
  planName: string;
  message: string;
  status: CoachingRequestStatus;
  createdAt: string;
}

export interface RecentWorkoutAdmin {
  id: string;
  routineId: string;
  routineName: string;
  startedAt: string;
  completedAt: string;
  exercises: unknown[];
  email: string;
  clientName: string;
}
