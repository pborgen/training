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

export interface AdminRoutine extends Routine {
  email: string;
  ownerName: string;
}
