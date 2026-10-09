export type SourceRef = {
  repository: string;
  commit: string;
  path: string;
  startLine: number;
  endLine: number;
  fileSha256: string;
};
export type Inline = {
  type: "text" | "strong" | "emphasis" | "code" | "link" | "break";
  text?: string;
  href?: string;
  children?: Inline[];
};
export type Block =
  | { id: string; type: "heading"; level: number; text: string }
  | { id: string; type: "paragraph" | "quote"; content: Inline[] }
  | { id: string; type: "list"; ordered: boolean; items: Inline[][] }
  | { id: string; type: "table"; headers: Inline[][]; rows: Inline[][][] }
  | {
      id: string;
      type: "code";
      raw: string;
      language: string;
      exampleId?: string;
      practiceSource?: string;
      executable: boolean;
      architecture?: string;
      note?: string;
    }
  | { id: string; type: "image"; asset: string; alt: string }
  | { id: string; type: "embed"; url: string; title: string }
  | { id: string; type: "note"; title: string; content: string };
export type Lesson = {
  id: string;
  slug: string;
  title: string;
  moduleId: string;
  order: number;
  objective: string;
  minutes: number;
  prerequisites: string[];
  sourceRefs: SourceRef[];
  labIds: string[];
  summary: string[];
  concepts: string[];
  blocks: Block[];
  checkpointIds: string[];
  revision: string;
};
export type CourseModule = {
  id: string;
  number: string;
  title: string;
  objective: string;
  difficulty: string;
  minutes: number;
  prerequisites: string[];
  lessons: Lesson[];
  labCount: number;
};
export type LabEngine =
  | "assembly"
  | "hex"
  | "pe"
  | "memory"
  | "number-bench"
  | "bit-bench"
  | "encoding"
  | "windows-api-model"
  | "process-model"
  | "loader-model"
  | "debugger-model"
  | "patch"
  | "python"
  | "c-portable"
  | "assembler";
export type Lab = {
  id: string;
  title: string;
  moduleNumber: string;
  engine: LabEngine;
  learningOutcome: string;
  lessonIds: string[];
  minutes: number;
  sourceRefs: SourceRef[];
};
export type ReferenceDocument = {
  id: string;
  slug: string;
  title: string;
  blocks: Block[];
  sourceRefs: SourceRef[];
};
export type Catalog = {
  id: string;
  title: string;
  revision: string;
  sourceCommit: string;
  modules: CourseModule[];
  labs: Lab[];
  references: ReferenceDocument[];
  sourceCounts: {
    pages: number;
    blocks: number;
    tables: number;
    images: number;
    tools: number;
  };
};
export type PublicCatalog = Omit<Catalog, "modules" | "references"> & {
  modules: Array<
    Omit<CourseModule, "lessons"> & { lessons: Array<Omit<Lesson, "blocks">> }
  >;
  references: Array<Omit<ReferenceDocument, "blocks">>;
};
export type QuizChoice = { id: string; text: string };
export type QuizQuestion = {
  id: string;
  moduleNumber: string;
  lessonIds: string[];
  question: string;
  choices: QuizChoice[];
  origin: "complement";
};
export type QuizDefinition = QuizQuestion & {
  correctId: string;
  explanation: string;
};
export type SearchEntry = {
  id: string;
  title: string;
  kind:
    | "aula"
    | "conceito"
    | "laboratório"
    | "exercício"
    | "ferramenta"
    | "referência"
    | "função"
    | "comando";
  description: string;
  href: string;
  keywords: string[];
};
export type SearchResult = SearchEntry & { score: number };

export function lessonHref(lesson: Pick<Lesson, "moduleId" | "slug">): string {
  return `/aprender/fundamentos/${lesson.moduleId}/${lesson.slug}`;
}
export function allLessons(catalog: Catalog | PublicCatalog) {
  return catalog.modules.flatMap((module) => module.lessons);
}
