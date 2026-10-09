import type {
  UserSummary,
  PublicCatalog,
  ProgressSummary,
  PublicExercise,
  Lesson,
  QuizQuestion,
  ReferenceDocument,
} from "@nucleo/core";
import { supplements } from "@nucleo/core";
import { api } from "@nucleo/api-client";
import { DashboardView } from "../pages/DashboardView";
import { CourseView } from "../pages/CourseView";
import { LabsView } from "../pages/LabsView";
import { LabView } from "../pages/LabView";
import { ExercisesView } from "../pages/ExercisesView";
import { ExerciseView } from "../pages/ExerciseView";
import { ProgressView } from "../pages/ProgressView";
import { ReferencesView } from "../pages/ReferencesView";
import { ReferenceView } from "../pages/ReferenceView";
import { PlaygroundView } from "../pages/PlaygroundView";
import { PlaygroundEnvironmentView } from "../pages/PlaygroundEnvironmentView";
import { ExploreView } from "../pages/ExploreView";
import { SupplementView } from "../pages/SupplementView";
import { LessonView } from "../modules/learning/LessonView";
import { AccountSettings } from "../modules/auth/AccountSettings";
import { ExecutionHistory } from "../modules/labs/ExecutionHistory";
export function installedPath(input: string) {
  const aliases: Record<string, string> = {
    "/": "/dashboard",
    "/app": "/dashboard",
    "/app/courses": "/aprender/fundamentos",
    "/app/labs": "/laboratorios",
    "/app/settings": "/configuracoes",
    "/login": "/entrar",
    "/register": "/criar-conta",
    "/aprender": "/aprender/fundamentos",
  };
  const [pathname, fragment] = input.split("#");
  return (aliases[pathname!] ?? pathname!) + (fragment ? "#" + fragment : "");
}
export async function loadInstalledPage(
  pathname: string,
  user: UserSummary,
  signal: AbortSignal,
) {
  const request = <T,>(path: string) => api<T>(path, { signal });
  if (pathname === "/configuracoes") return <AccountSettings />;
  if (pathname === "/execucoes") return <ExecutionHistory />;
  if (pathname === "/playground") return <PlaygroundView />;
  if (pathname.startsWith("/playground/")) {
    const environment = pathname.slice(12);
    if (
      ![
        "assembly",
        "c",
        "hex",
        "pe",
        "memory",
        "encoding",
        "float",
        "flow",
        "anatomy",
      ].includes(environment)
    )
      throw new Error("Ambiente não encontrado.");
    return <PlaygroundEnvironmentView environment={environment} />;
  }
  if (pathname === "/explorar") return <ExploreView />;
  if (pathname.startsWith("/explorar/")) {
    const item = supplements.find((item) => item.id === pathname.slice(10));
    if (!item) throw new Error("Experimento não encontrado.");
    return <SupplementView item={item} />;
  }
  const catalog = await request<PublicCatalog>("/catalog");
  if (pathname === "/dashboard")
    return (
      <DashboardView
        user={user}
        catalog={catalog}
        progress={await request<ProgressSummary>("/progress")}
      />
    );
  if (pathname === "/aprender/fundamentos")
    return <CourseView catalog={catalog} />;
  const lessonRoute = pathname.match(
    /^\/aprender\/fundamentos\/([^/]+)\/([^/]+)$/,
  );
  if (lessonRoute) {
    const [data, exercises] = await Promise.all([
      request<{ lesson: Lesson; questions: QuizQuestion[] }>(
        "/lessons/" +
          encodeURIComponent(lessonRoute[1]!) +
          "/" +
          encodeURIComponent(lessonRoute[2]!),
      ),
      request<PublicExercise[]>("/exercises"),
    ]);
    return (
      <LessonView
        key={data.lesson.id}
        {...data}
        catalog={catalog}
        exercises={exercises.filter((exercise) =>
          exercise.lessonIds.includes(data.lesson.id),
        )}
      />
    );
  }
  if (pathname === "/laboratorios") return <LabsView catalog={catalog} />;
  if (pathname.startsWith("/laboratorios/"))
    return (
      <LabView
        id={pathname.slice(14)}
        catalog={catalog}
        exercises={await request<PublicExercise[]>("/exercises")}
      />
    );
  if (pathname === "/exercicios" || pathname.startsWith("/exercicios/")) {
    const exercises = await request<PublicExercise[]>("/exercises");
    if (pathname === "/exercicios")
      return <ExercisesView catalog={catalog} exercises={exercises} />;
    const exercise = exercises.find((item) => item.id === pathname.slice(12));
    if (!exercise) throw new Error("Exercício não encontrado.");
    const lab = catalog.labs.find((item) => item.id === exercise.labId),
      module = catalog.modules.find(
        (item) => item.number === exercise.moduleNumber,
      );
    if (!lab || !module) throw new Error("Conteúdo inconsistente.");
    return (
      <ExerciseView
        exercise={exercise}
        lab={lab}
        module={module}
        exercises={exercises}
      />
    );
  }
  if (pathname === "/progresso")
    return (
      <ProgressView
        catalog={catalog}
        progress={await request<ProgressSummary>("/progress")}
      />
    );
  if (pathname === "/referencias") return <ReferencesView catalog={catalog} />;
  if (pathname.startsWith("/referencias/"))
    return (
      <ReferenceView
        reference={await request<ReferenceDocument>(
          "/references/" + encodeURIComponent(pathname.slice(13)),
        )}
      />
    );
  throw new Error("Página não encontrada.");
}
