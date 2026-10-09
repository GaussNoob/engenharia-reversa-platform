"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { ChevronUp, SquareTerminal, X } from "lucide-react";

/** The same editor stays mounted in the desktop column and the mobile dialog. */
export function LessonPractice({
  title,
  expanded,
  panel,
  onPanel,
  children,
}: {
  title: string;
  expanded: boolean;
  panel: string;
  onPanel: (panel: string) => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const dialogId = useId();
  const open = panel !== "Aula";

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const media = matchMedia("(max-width: 900px)");
    const previousOverflow = document.body.style.overflow;
    let locked = false;
    const sync = () => {
      const modal = element.matches(":modal");
      if (media.matches) {
        if (element.open && (!open || !modal)) element.close();
        if (open && !element.open) element.showModal();
      } else {
        if (modal) element.close();
        if (!element.open) element.show();
      }
      locked = media.matches && open;
      document.body.style.overflow = locked ? "hidden" : previousOverflow;
    };
    const resize = () => {
      const viewport = window.visualViewport;
      element.style.setProperty(
        "--practice-height",
        `${viewport?.height ?? innerHeight}px`,
      );
      element.style.setProperty(
        "--practice-top",
        `${viewport?.offsetTop ?? 0}px`,
      );
    };
    sync();
    resize();
    media.addEventListener("change", sync);
    window.visualViewport?.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("scroll", resize);
    return () => {
      media.removeEventListener("change", sync);
      window.visualViewport?.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("scroll", resize);
      if (locked) document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        className="practice-launcher"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => onPanel("Código")}
      >
        <SquareTerminal size={21} />
        <span>
          <strong>Abrir bancada</strong>
          <small>{title}</small>
        </span>
        <ChevronUp size={18} />
      </button>
      <aside
        className={`lesson-practice ${expanded ? "" : "practice-collapsed"}`}
        aria-label="Bancada da aula"
      >
        <dialog
          ref={dialog}
          id={dialogId}
          className="practice-dialog"
          aria-labelledby={titleId}
          onCancel={(event) => {
            event.preventDefault();
            onPanel("Aula");
          }}
        >
          <header className="practice-dialog-header">
            <div>
              <h2 id={titleId}>Sua bancada</h2>
              <p>{title}</p>
            </div>
            <button
              autoFocus
              className="icon-button"
              aria-label="Voltar para a aula"
              onClick={() => onPanel("Aula")}
            >
              <X size={21} />
            </button>
          </header>
          <div className="practice-dialog-tabs">
            <button onClick={() => onPanel("Aula")}>Aula</button>
            <span>O código continua aqui quando você voltar.</span>
          </div>
          <div className="practice-context">
            <span className="mono">EXPLORE ENQUANTO APRENDE</span>
            <span>{title}</span>
          </div>
          {children}
        </dialog>
      </aside>
    </>
  );
}
