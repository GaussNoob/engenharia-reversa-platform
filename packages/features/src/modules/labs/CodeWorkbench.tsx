"use client";
import { Select } from "@nucleo/features/components/Select";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  RotateCcw,
  StepForward,
  Square,
  Plus,
  GitCompare,
  Download,
  ArrowRight,
} from "lucide-react";
import { createCpu, parseProgram, hex, type Mode } from "@nucleo/models";
import type {
  ExecutionLanguage,
  VirtualFile,
  DraftPayload,
  Job,
} from "@nucleo/core";
import { CodeEditor } from "./editor/CodeEditor";
import { RegisterPanel } from "./RegisterPanel";
import { HexViewer } from "./HexViewer";
import { defaultCode, labCode, entryName } from "./presets";
import { useDraft } from "./workbench/useDraft";
import { useMachine } from "./workbench/useMachine";
import { useExecution } from "./workbench/useExecution";
import { Disassembly } from "./workbench/Disassembly";
import { TerminalPanel } from "./workbench/TerminalPanel";
import { WorkbenchDialog } from "./workbench/WorkbenchDialog";
import {
  CodeSnippet,
  SyntaxCode,
} from "@nucleo/features/components/CodeSnippet";

type Props = {
  initialLanguage?: ExecutionLanguage;
  initialCode?: string;
  labId?: string;
  lessonId?: string;
  scopeKey?: string;
  panel?: string;
  onTab?: (tab: string) => void;
  exerciseId?: string;
  initialMode?: Mode;
  onJobChange?: (job: Job | null) => void;
};
export function CodeWorkbench({
  initialLanguage = "assembly",
  initialCode,
  labId,
  lessonId,
  scopeKey,
  panel,
  onTab,
  exerciseId,
  initialMode = "x86-64",
  onJobChange,
}: Props) {
  const [language, setLanguage] = useState<ExecutionLanguage>(initialLanguage);
  const [mode, setMode] = useState<Mode>(initialMode);
  const seedFor = (language: ExecutionLanguage) =>
    language === initialLanguage
      ? (initialCode ??
        (labId ? labCode[labId] : undefined) ??
        defaultCode[language])
      : defaultCode[language];
  const [files, setFiles] = useState<VirtualFile[]>([
    { name: entryName(initialLanguage), content: seedFor(initialLanguage) },
  ]);
  const [activeFile, setActiveFile] = useState(entryName(initialLanguage));
  const [tab, setTab] = useState("Código");
  const [edits, setEdits] = useState(0);
  const [solution, setSolution] = useState(false);
  const [dialog, setDialog] = useState<"file" | "reset" | null>(null);
  const [memoryRegion, setMemoryRegion] = useState<"stack" | "heap">("stack");
  const code = files.find((file) => file.name === activeFile)?.content ?? "";
  const assembly = language === "assembly";
  const model = useMachine(code, mode);
  const execution = useExecution();
  const draftKey = scopeKey ?? labId ?? `playground-${initialLanguage}`;
  const payload = useMemo<DraftPayload>(
    () => ({ files, language, activeFile }),
    [files, language, activeFile],
  );
  const saved = useDraft(draftKey, payload, edits, (draft) => {
    setFiles(draft.files);
    setLanguage(draft.language);
    setActiveFile(draft.activeFile);
    model.reset();
  });
  useEffect(() => {
    if (panel) setTab(panel);
  }, [panel]);
  function selectTab(value: string) {
    setTab(value);
    onTab?.(value);
  }
  function edit(value: string) {
    onJobChange?.(null);
    setEdits((count) => count + 1);
    setFiles((current) =>
      current.map((file) =>
        file.name === activeFile ? { ...file, content: value } : file,
      ),
    );
  }
  function load(value: string, nextLanguage = language) {
    onJobChange?.(null);
    setEdits((count) => count + 1);
    setLanguage(nextLanguage);
    setFiles([{ name: entryName(nextLanguage), content: value }]);
    setActiveFile(entryName(nextLanguage));
    model.reset();
  }
  function reset() {
    if (files.length > 1 || code !== seedFor(language)) setDialog("reset");
    else model.reset();
  }
  function exportFiles() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ language, files, activeFile }, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "nucleo-bancada.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function execute() {
    onJobChange?.(null);
    selectTab("Terminal");
    await execution.execute(
      {
        language,
        mode,
        files,
        entryFile: activeFile,
        ...(labId ? { labId } : {}),
        ...(lessonId ? { lessonId } : {}),
        ...(exerciseId ? { exerciseId } : {}),
      },
      (job) => {
        onJobChange?.(job);
        const snapshot = job.result?.cpu;
        if (!snapshot || !assembly) return;
        try {
          const program = parseProgram(code, mode),
            cpu = createCpu(program);
          for (const [name, value] of Object.entries(snapshot.registers))
            cpu.registers[
              name.toLowerCase().replace(/^e([abcd]x|[sb]p|[sd]i)$/, "r$1")
            ] = BigInt(value);
          for (const region of snapshot.memory)
            region.bytes.forEach((byte, index) =>
              cpu.memory.set(BigInt(region.address) + BigInt(index), byte),
            );
          cpu.ip = BigInt(snapshot.ip);
          cpu.flags = snapshot.flags as typeof cpu.flags;
          cpu.steps = snapshot.steps;
          cpu.halted = snapshot.halted;
          cpu.output = snapshot.output;
          model.setMachine({ program, cpu, code });
        } catch {
          /* Errors are already shown in the terminal. */
        }
      },
    );
  }
  const actions = useRef({ execute, step: model.step });
  actions.current = { execute, step: model.step };
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!container.current?.contains(document.activeElement)) return;
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void actions.current.execute();
      }
      if (assembly && ["F10", "F11"].includes(event.key)) {
        event.preventDefault();
        actions.current.step(event.key === "F10" ? "over" : "into");
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [assembly]);
  const cpu = model.machine?.cpu;
  const memoryBase =
    memoryRegion === "stack" ? (cpu?.registers.rsp ?? 0x201000n) : 0x300000n;
  const editorLanguage =
    language === "assembly" || language === "fasm"
      ? "assembly"
      : language === "windows-cpp"
        ? "cpp"
        : language;
  const currentLine = model.machine?.program.instructions.find(
    (instruction) => instruction.address === cpu?.ip,
  )?.line;
  const tabs = [
    "Código",
    "Terminal",
    ...(assembly ? ["Disassembly", "CPU", "Memória", "Histórico"] : []),
  ];
  return (
    <div className="code-workbench" ref={container}>
      <header className="workbench-header">
        <span className="mono">
          <span className="tiny-square" />
          AMBIENTE DE PRÁTICA
        </span>
        <Select
          label="Linguagem da bancada"
          value={language}
          disabled={execution.busy || Boolean(exerciseId)}
          onChange={(value) => {
            const next = value as ExecutionLanguage;
            load(seedFor(next), next);
            selectTab("Código");
          }}
          options={[
            {
              value: "assembly",
              label: "Assembly",
              description: "Modelo x86 com execução passo a passo",
            },
            {
              value: "python",
              label: "Python 3",
              description: "Execução isolada",
            },
            {
              value: "c",
              label: "C",
              description: "Compilação e execução isoladas",
            },
            {
              value: "fasm",
              label: "FASM",
              description: "Montar um executável PE",
            },
            {
              value: "windows-cpp",
              label: "C++ / Windows",
              description: "Compilar um executável PE",
            },
          ]}
        />
      </header>
      <div className="workbench-toolbar">
        <button
          className="button button-small"
          onClick={() => void execute()}
          disabled={execution.busy}
          title="Ctrl + Enter"
        >
          <Play size={14} />
          {language === "fasm" || language === "windows-cpp"
            ? "Compilar PE"
            : "Executar"}
        </button>
        {assembly && (
          <>
            <button
              className="tool-button"
              disabled={execution.busy}
              onClick={() => model.step()}
              title="Avançar uma instrução (F11)"
            >
              <StepForward size={16} />
              <span>Step into</span>
            </button>
            <button
              className="tool-button"
              disabled={execution.busy}
              onClick={() => model.step("over")}
              title="Executar a chamada até o retorno (F10)"
            >
              Step over
            </button>
            <button
              className="tool-button"
              disabled={execution.busy}
              onClick={() => model.step("continue")}
              title="Executar até a próxima parada"
            >
              <ArrowRight size={14} />
              Continuar
            </button>
          </>
        )}
        {execution.busy && (
          <button
            className="icon-button"
            aria-label="Cancelar execução"
            onClick={() => void execution.cancel()}
          >
            <Square size={14} />
          </button>
        )}
        <div className="toolbar-end">
          <button
            className="icon-button"
            aria-label="Comparar com o exemplo"
            aria-pressed={solution}
            onClick={() => {
              setSolution(!solution);
              selectTab("Código");
            }}
          >
            <GitCompare size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Exportar meus arquivos"
            onClick={exportFiles}
          >
            <Download size={16} />
          </button>
          <button
            className="icon-button"
            disabled={execution.busy}
            aria-label="Restaurar exemplo"
            onClick={reset}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      <div
        className="bench-tabs"
        role="tablist"
        aria-label="Painéis da bancada"
      >
        {tabs.map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={tab === item}
            tabIndex={tab === item ? 0 : -1}
            className={tab === item ? "active" : ""}
            onClick={() => selectTab(item)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                event.preventDefault();
                const buttons =
                  event.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>(
                    "button",
                  );
                const next =
                  (tabs.indexOf(item) +
                    (event.key === "ArrowRight" ? 1 : tabs.length - 1)) %
                  tabs.length;
                selectTab(tabs[next]!);
                buttons[next]?.focus();
              }
            }}
          >
            {item}
          </button>
        ))}
      </div>
      {(execution.error || model.error) && (
        <p className="workbench-error" role="alert">
          {execution.error || model.error}
        </p>
      )}
      <div className="workbench-content">
        <div hidden={tab !== "Código"}>
          <div className="file-tabs">
            {files.map((file) => (
              <button
                key={file.name}
                className={file.name === activeFile ? "active" : ""}
                onClick={() => {
                  setActiveFile(file.name);
                  model.reset();
                }}
              >
                {file.name}
              </button>
            ))}
            <button
              aria-label="Adicionar arquivo"
              disabled={files.length >= 8}
              onClick={() => setDialog("file")}
            >
              <Plus size={15} />
            </button>
            {assembly && (
              <Select
                className="select-compact"
                label="Arquitetura do modelo"
                disabled={execution.busy || Boolean(exerciseId)}
                value={mode}
                onChange={(value) => {
                  setMode(value as Mode);
                  model.reset();
                }}
                options={[
                  { value: "x86-64", label: "x86-64" },
                  { value: "x86-32", label: "x86-32" },
                ]}
              />
            )}
          </div>
          <div className="editor-container">
            <CodeEditor
              value={code}
              onChange={edit}
              language={editorLanguage}
              dialect={language === "windows-cpp" ? "cpp" : language}
              files={files}
              mode={mode}
              path={`${draftKey}/${activeFile}`}
              currentLine={cpu?.halted ? undefined : currentLine}
              breakpoints={model.breakpoints}
              onBreakpoint={model.toggleBreakpoint}
            />
          </div>
          {solution && (
            <div className="solution-comparison">
              <header>
                <strong>Exemplo de referência</strong>
                <button
                  className="text-link"
                  onClick={() => setDialog("reset")}
                >
                  Restaurar referência
                </button>
              </header>
              <div className="comparison-columns">
                <section>
                  <span className="mono">REFERÊNCIA</span>
                  <CodeSnippet
                    source={seedFor(language)}
                    language={editorLanguage}
                  />
                </section>
                <section>
                  <span className="mono">SEU ARQUIVO</span>
                  <pre>
                    {code.split("\n").map((line, index) => (
                      <span
                        className={
                          line !== seedFor(language).split("\n")[index]
                            ? "different"
                            : ""
                        }
                        key={index}
                      >
                        <SyntaxCode
                          source={line || " "}
                          language={editorLanguage}
                        />
                        {"\n"}
                      </span>
                    ))}
                  </pre>
                </section>
              </div>
            </div>
          )}
        </div>
        <div hidden={tab !== "Terminal"}>
          <TerminalPanel
            job={execution.job}
            busy={execution.busy}
            onRun={() => void execute()}
            onReset={reset}
          />
        </div>
        {tab === "Disassembly" && (
          <Disassembly
            code={code}
            mode={mode}
            cpu={cpu}
            breakpoints={model.breakpoints}
            onBreakpoint={model.toggleBreakpoint}
          />
        )}
        {tab === "CPU" &&
          (cpu ? (
            <>
              <RegisterPanel state={cpu} />
              <div className="call-stack">
                <span className="mono">CALL STACK</span>
                {cpu.frames.length ? (
                  [...cpu.frames].reverse().map((frame, index) => (
                    <div key={index}>
                      <strong>{frame.label}</strong>
                      <code>retorno {hex(frame.returnAddress)}</code>
                    </div>
                  ))
                ) : (
                  <p>Nenhuma chamada ativa.</p>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              Avance uma instrução para inspecionar a CPU.
            </div>
          ))}
        {tab === "Memória" && (
          <>
            <div
              className="memory-region-tabs"
              role="group"
              aria-label="Região de memória"
            >
              {(["stack", "heap"] as const).map((region) => (
                <button
                  key={region}
                  aria-pressed={memoryRegion === region}
                  onClick={() => setMemoryRegion(region)}
                >
                  {region === "stack" ? "Stack / RSP" : "Dados / 0x300000"}
                </button>
              ))}
            </div>
            <HexViewer
              bytes={Uint8Array.from(
                Array.from(
                  { length: 128 },
                  (_, index) =>
                    cpu?.memory.get(memoryBase + BigInt(index)) ?? 0,
                ),
              )}
              base={Number(memoryBase)}
            />
            <p className="disassembly-note">
              Regiões virtuais do modelo. PUSH e CALL escrevem na stack;
              declarações de dados começam em 0x300000.
            </p>
          </>
        )}
        {tab === "Histórico" && (
          <div className="execution-history">
            {model.history.length ? (
              model.history.map((item, index) => (
                <div key={index}>
                  <span>{index + 1}</span>
                  <SyntaxCode source={item.source} language="assembly" />
                  <small>{item.changes.join(", ") || "Fluxo ou flags"}</small>
                </div>
              ))
            ) : (
              <p>
                Avance ou continue o modelo para registrar as instruções
                executadas.
              </p>
            )}
          </div>
        )}
      </div>
      {assembly && cpu && tab === "Código" && <RegisterPanel state={cpu} />}
      <footer className="workbench-footer">
        <span>
          {assembly
            ? `Modelo pedagógico ${mode} · F10 / F11`
            : language === "fasm" || language === "windows-cpp"
              ? "Compilação para inspeção do PE"
              : "Sandbox gVisor · rede desabilitada"}
        </span>
        <span role="status">
          {saved || "Exporte uma cópia pelo ícone de download"}
        </span>
      </footer>
      <WorkbenchDialog
        kind={dialog}
        close={() => setDialog(null)}
        confirm={(name) => {
          if (dialog === "reset") {
            load(seedFor(language));
            return;
          }
          if (!/^[a-zA-Z0-9_-]+\.(py|c|cpp|h|asm|txt)$/.test(name))
            return "Use um nome simples e uma extensão suportada.";
          if (files.some((file) => file.name === name))
            return "Já existe um arquivo com esse nome.";
          if (files.length >= 8) return "O limite é 8 arquivos.";
          setFiles([...files, { name, content: "" }]);
          setActiveFile(name);
          setEdits((count) => count + 1);
        }}
      />
    </div>
  );
}
