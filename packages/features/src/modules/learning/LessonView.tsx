"use client";
import { Link } from "@nucleo/platform";
import { useEffect, useState } from "react";
import dynamic from "@nucleo/platform/lazy";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  PanelRightClose,
  PanelRightOpen,
  FlaskConical,
  ExternalLink,
} from "lucide-react";
import {
  lessonHref,
  type Lesson,
  type PublicCatalog,
  type QuizQuestion,
  type Block,
  type ExecutionLanguage,
  type PublicExercise,
} from "@nucleo/core";
import { useAccount } from "@nucleo/features/components/AccountProvider";
import { api } from "@nucleo/api-client";
import { ContentRenderer } from "./ContentRenderer";
import { Checkpoint } from "./Checkpoint";
import { LessonPractice } from "./LessonPractice";
import { LabSurface } from "@nucleo/features/modules/labs/LabSurface";
import { ExerciseLinks } from "@nucleo/features/modules/exercises/ExerciseLinks";
const CodeWorkbench = dynamic(
  () =>
    import("@nucleo/features/modules/labs/CodeWorkbench").then(
      (module) => module.CodeWorkbench,
    ),
  { ssr: false },
);
export function LessonView({
  lesson,
  catalog,
  questions,
  exercises = [],
}: {
  lesson: Lesson;
  catalog: PublicCatalog;
  questions: QuizQuestion[];
  exercises?: PublicExercise[];
}) {
  const { user } = useAccount();
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [practice, setPractice] = useState(true);
  const [mobile, setMobile] = useState("Aula");
  const [code, setCode] = useState<{
    language: ExecutionLanguage;
    source: string;
    key: string;
  } | null>(null);
  const all = catalog.modules.flatMap((module) => module.lessons);
  const position = all.findIndex((item) => item.id === lesson.id);
  const next = all[position + 1];
  const previous = all[position - 1];
  const module = catalog.modules.find((item) => item.id === lesson.moduleId)!;
  const lab =
    catalog.labs.find((item) => lesson.labIds.includes(item.id)) ??
    catalog.labs.find((item) => item.moduleNumber === module.number);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    void api<{ status: string; anchor: string | null }>("/progress/visit", {
      method: "POST",
      body: JSON.stringify({ lessonId: lesson.id, anchor: null }),
    })
      .then((value) => {
        if (!alive) return;
        setCompleted(value.status === "completed");
        if (value.anchor) {
          const element = document.getElementById(value.anchor);
          element?.scrollIntoView({ block: "start" });
        }
      })
      .catch(() => {});
    let lastActive = Date.now();
    const heartbeat = setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastActive < 180000
      )
        void api("/progress/heartbeat", { method: "POST", body: "{}" }).catch(
          () => {},
        );
    }, 25000);
    const resume = () => {
      lastActive = Date.now();
    };
    window.addEventListener("keydown", resume);
    window.addEventListener("scroll", resume);
    return () => {
      alive = false;
      clearInterval(heartbeat);
      window.removeEventListener("keydown", resume);
      window.removeEventListener("scroll", resume);
    };
  }, [user, lesson.id]);
  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const found = entries.find((entry) => entry.isIntersecting);
        if (found) {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            void api("/progress/visit", {
              method: "POST",
              body: JSON.stringify({
                lessonId: lesson.id,
                anchor: found.target.id,
              }),
            }).catch(() => {});
          }, 1000);
        }
      },
      { rootMargin: "-10% 0px -70% 0px" },
    );
    document
      .querySelectorAll(".lesson-prose [id]")
      .forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [user, lesson.id]);
  const finish = async () => {
    setSaving(true);
    setError("");
    try {
      await api("/progress/complete", {
        method: "POST",
        body: JSON.stringify({
          lessonId: lesson.id,
          eventId: crypto.randomUUID(),
        }),
      });
      setCompleted(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível guardar sua conclusão.",
      );
    } finally {
      setSaving(false);
    }
  };
  const load = (block: Extract<Block, { type: "code" }>) => {
    const language: ExecutionLanguage =
      block.language === "python"
        ? "python"
        : block.language === "c"
          ? block.architecture?.toLowerCase().includes("windows")
            ? "windows-cpp"
            : "c"
          : block.language === "cpp"
            ? "windows-cpp"
            : "assembly";
    setCode({
      language,
      source: block.practiceSource ?? block.raw,
      key: block.id,
    });
    setPractice(true);
    setMobile("Código");
  };
  const headings = lesson.blocks.filter(
    (block): block is Extract<Block, { type: "heading" }> =>
      block.type === "heading" && block.level >= 2,
  );
  return (
    <>
      <header className="lesson-topbar">
        <div>
          <Link href="/aprender/fundamentos">Fundamentos</Link>
          <span>/</span>
          <Link href={`/aprender/fundamentos#${module.id}`}>
            {module.title}
          </Link>
          <span>/</span>
          <strong>{lesson.title}</strong>
        </div>
        <button
          className="tool-button"
          onClick={() => setPractice((value) => !value)}
        >
          {practice ? (
            <PanelRightClose size={16} />
          ) : (
            <PanelRightOpen size={16} />
          )}
          <span>{practice ? "Expandir leitura" : "Abrir bancada"}</span>
        </button>
      </header>
      <main
        id="main"
        className={`lesson-layout ${practice ? "with-practice" : "reading-only"} `}
      >
        <article className="lesson-reading">
          <div className="lesson-orientation">
            <span className="mono">
              MÓDULO {module.number} / AULA{" "}
              {String(lesson.order + 1).padStart(2, "0")}
            </span>
            <span>
              {position + 1} de {all.length} na trilha
            </span>
          </div>
          <h1>{lesson.title}</h1>
          <div className="lesson-details">
            <span>{lesson.minutes} min de estudo</span>
            <span>{module.difficulty}</span>
            <span>{completed ? "Concluída" : "Em descoberta"}</span>
          </div>
          <div className="lesson-objective">
            <span className="mono">AO FINAL, VOCÊ VAI CONSEGUIR</span>
            <p>{lesson.objective}</p>
          </div>
          {lesson.prerequisites.length > 0 && (
            <div className="lesson-prerequisites">
              <span>Antes de seguir:</span>
              {lesson.prerequisites.map((id) => {
                const item = all.find((lesson) => lesson.id === id);
                return item ? (
                  <Link key={id} href={lessonHref(item)}>
                    {item.title}
                  </Link>
                ) : null;
              })}
            </div>
          )}
          {headings.length > 2 && (
            <details className="lesson-outline">
              <summary>Nesta aula</summary>
              <nav aria-label="Seções desta aula">
                {headings.map((heading) => (
                  <a key={heading.id} href={`#${heading.id}`}>
                    {heading.text}
                  </a>
                ))}
              </nav>
            </details>
          )}
          <ContentRenderer blocks={lesson.blocks} onCodeLoad={load} />
          {lab && (
            <section className="lesson-lab-invitation">
              <FlaskConical size={20} />
              <div>
                <strong>Transforme o conceito em experiência.</strong>
                <p>{lab.learningOutcome}</p>
                <Link href={`/laboratorios/${lab.id}`}>Abrir {lab.title}</Link>
              </div>
            </section>
          )}
          {questions.map((question) => (
            <Checkpoint key={question.id} question={question} />
          ))}
          <ExerciseLinks exercises={exercises} />
          <section className="lesson-recap">
            <span className="overline">O QUE FICA DESTA AULA</span>
            {lesson.summary.map((item, index) => (
              <p key={index}>{item}</p>
            ))}
          </section>
          <div className="lesson-completion">
            {user ? (
              <button
                className={completed ? "button button-secondary" : "button"}
                disabled={saving || completed}
                onClick={() => void finish()}
              >
                <Check size={15} />
                {completed
                  ? "Aula concluída"
                  : saving
                    ? "Guardando seu progresso…"
                    : "Concluir esta aula"}
              </button>
            ) : (
              <Link className="button" href="/entrar">
                Entrar para guardar meu progresso
              </Link>
            )}
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
          </div>
          <nav className="lesson-next" aria-label="Aulas anterior e seguinte">
            {previous ? (
              <Link href={lessonHref(previous)}>
                <ChevronLeft size={16} />
                <div>
                  <small>AULA ANTERIOR</small>
                  <strong>{previous.title}</strong>
                </div>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={lessonHref(next)}>
                <div>
                  <small>PRÓXIMO PASSO</small>
                  <strong>{next.title}</strong>
                </div>
                <ChevronRight size={16} />
              </Link>
            ) : (
              <Link href="/progresso">Revisar sua jornada</Link>
            )}
          </nav>
          <div className="source-attribution">
            <strong>Fonte e proveniência</strong>
            <p>
              Livro de Fernando Mercês / Mente Binária. Checkpoints e
              visualizações são complementos pedagógicos.
            </p>
            {lesson.sourceRefs.map((ref) => (
              <a
                key={ref.path}
                target="_blank"
                rel="noopener noreferrer"
                href={`${ref.repository}/blob/${ref.commit}/${ref.path}#L${ref.startLine}-L${ref.endLine}`}
              >
                <ExternalLink size={12} />
                {ref.path}
              </a>
            ))}
          </div>
        </article>
        <LessonPractice
          title={lab?.title ?? "Sua bancada"}
          expanded={practice}
          panel={mobile}
          onPanel={(value) => {
            setPractice(true);
            setMobile(value);
          }}
        >
          {code ? (
            <CodeWorkbench
              key={code.key}
              initialLanguage={code.language}
              initialCode={code.source}
              lessonId={lesson.id}
              scopeKey={lesson.id}
              panel={
                mobile === "Terminal"
                  ? "Terminal"
                  : mobile === "Código"
                    ? "Código"
                    : undefined
              }
              onTab={(tab) => {
                if (tab === "Terminal" || tab === "Código") setMobile(tab);
              }}
            />
          ) : lab ? (
            <LabSurface
              lab={lab}
              lessonId={lesson.id}
              panel={
                mobile === "Terminal"
                  ? "Terminal"
                  : mobile === "Código"
                    ? "Código"
                    : undefined
              }
              onTab={(tab) => {
                if (tab === "Terminal" || tab === "Código") setMobile(tab);
              }}
            />
          ) : (
            <CodeWorkbench
              lessonId={lesson.id}
              scopeKey={lesson.id}
              panel={
                mobile === "Terminal"
                  ? "Terminal"
                  : mobile === "Código"
                    ? "Código"
                    : undefined
              }
              onTab={(tab) => {
                if (tab === "Terminal" || tab === "Código") setMobile(tab);
              }}
            />
          )}
        </LessonPractice>
      </main>
    </>
  );
}
