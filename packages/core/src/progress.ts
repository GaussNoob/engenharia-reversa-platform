export type LessonStatus = "in_progress" | "completed";
export type LessonProgress = {
  lessonId: string;
  status: LessonStatus;
  anchor: string | null;
  startedAt: string;
  completedAt: string | null;
  lastVisitedAt: string;
};
export type UserSummary = { id: string; name: string; email: string };
export type Activity = {
  id: string;
  kind: string;
  label: string;
  href: string;
  createdAt: string;
};
export type ProgressSummary = {
  lessons: LessonProgress[];
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  activeSeconds: number;
  passedExercises: number;
  completedLabs: number;
  passedQuizzes: number;
  streak: number;
  lastLessonId: string | null;
  activities: Activity[];
};
export interface ProgressRepository {
  visit(
    userId: string,
    lessonId: string,
    anchor: string | null,
  ): Promise<LessonProgress>;
  complete(
    userId: string,
    lessonId: string,
    eventId: string,
  ): Promise<LessonProgress>;
  getSummary(userId: string): Promise<ProgressSummary>;
}
export function progressPercentage(completed: number, total: number): number {
  return total <= 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));
}
export function nextLessonId(
  ids: string[],
  completed: ReadonlySet<string>,
): string | null {
  return ids.find((id) => !completed.has(id)) ?? null;
}
