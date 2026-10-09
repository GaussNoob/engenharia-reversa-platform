"use client";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import type * as MonacoTypes from "monaco-editor";
import { useEffect, useRef, useState } from "react";
import { prepareMonaco } from "./monaco-runtime";
import {
  installCompletions,
  setCompletionContext,
  removeCompletionContext,
} from "./monaco-completions";
import type { EditorProps } from "./CodeEditor";
const beforeMount: BeforeMount = (monaco: typeof MonacoTypes) => {
  monaco.editor.defineTheme("nucleo", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "89939A" },
      { token: "keyword", foreground: "E8BA70" },
      { token: "string", foreground: "B2C7A6" },
      { token: "number", foreground: "98BBCA" },
      { token: "type", foreground: "D6C3A8" },
    ],
    colors: {
      "editor.background": "#131719",
      "editor.foreground": "#F1F0EB",
      "editorLineNumber.foreground": "#89939A",
      "editorLineNumber.activeForeground": "#E8BA70",
      "editor.lineHighlightBackground": "#E8BA7009",
      "editor.selectionBackground": "#E8BA7025",
      "editorCursor.foreground": "#E8BA70",
      "editorWidget.background": "#242A2E",
      "editorGutter.background": "#131719",
      "minimap.background": "#131719",
    },
  });
  if (
    !monaco.languages
      .getLanguages()
      .some((language) => language.id === "assembly")
  ) {
    monaco.languages.register({ id: "assembly" });
    monaco.languages.setMonarchTokensProvider("assembly", {
      tokenizer: {
        root: [
          [/;.*/, "comment"],
          [
            /\b(?:mov|add|sub|inc|dec|mul|div|and|or|xor|not|shl|shr|rol|ror|cmp|test|jmp|je|jz|jne|jnz|jg|jl|jge|jle|call|ret|push|pop|lea|nop|xchg)\b/i,
            "keyword",
          ],
          [
            /\b(?:r(?:ax|bx|cx|dx|sp|bp|si|di|[89]|1[0-5])|e(?:ax|bx|cx|dx|sp|bp|si|di)|[abcd][lh])\b/i,
            "type",
          ],
          [/\b(?:0x[\da-f]+|\d+)\b/i, "number"],
          [/'.*?'|".*?"/, "string"],
        ],
      },
    });
  }
  installCompletions(monaco);
};
export default function MonacoCodeEditor({
  value,
  onChange,
  language,
  path,
  currentLine,
  breakpoints = [],
  onBreakpoint,
  dialect,
  files,
  mode,
}: EditorProps) {
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [runtimeError, setRuntimeError] = useState("");
  useEffect(() => {
    let alive = true;
    void prepareMonaco()
      .then(() => {
        if (alive) setRuntimeReady(true);
      })
      .catch((error) => {
        if (alive)
          setRuntimeError(
            error instanceof Error
              ? error.message
              : "Não foi possível preparar o editor.",
          );
      });
    return () => {
      alive = false;
    };
  }, []);
  const editor = useRef<MonacoTypes.editor.IStandaloneCodeEditor | null>(null);
  const monaco = useRef<typeof MonacoTypes | null>(null);
  const decorations =
    useRef<MonacoTypes.editor.IEditorDecorationsCollection | null>(null);
  const breakpointCallback = useRef(onBreakpoint);
  breakpointCallback.current = onBreakpoint;
  const context = useRef({
    dialect:
      dialect ??
      (language === "c"
        ? "c"
        : language === "cpp"
          ? "cpp"
          : language === "python"
            ? "python"
            : "assembly"),
    files,
    mode,
  } as const);
  context.current = {
    dialect:
      dialect ??
      (language === "c"
        ? "c"
        : language === "cpp"
          ? "cpp"
          : language === "python"
            ? "python"
            : "assembly"),
    files,
    mode,
  };
  useEffect(() => {
    const uri = editor.current?.getModel()?.uri.toString();
    if (uri) setCompletionContext(uri, context.current);
  }, [dialect, files, mode, path, language]);
  const ready: OnMount = (instance, library) => {
    editor.current = instance;
    monaco.current = library;
    decorations.current = instance.createDecorationsCollection();
    const uri = instance.getModel()?.uri.toString();
    if (uri) setCompletionContext(uri, context.current);
    const changed = instance.onDidChangeModel(() => {
      const next = instance.getModel()?.uri.toString();
      if (next) setCompletionContext(next, context.current);
    });
    const listener = instance.onMouseDown((event) => {
      if (
        event.target.type ===
          library.editor.MouseTargetType.GUTTER_GLYPH_MARGIN &&
        event.target.position
      )
        breakpointCallback.current?.(event.target.position.lineNumber);
    });
    instance.onDidDispose(() => {
      listener.dispose();
      changed.dispose();
      if (uri) removeCompletionContext(uri);
    });
  };
  useEffect(() => {
    const library = monaco.current;
    if (!library || !decorations.current) return;
    const marks: MonacoTypes.editor.IModelDeltaDecoration[] = breakpoints.map(
      (line) => ({
        range: new library.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          glyphMarginClassName: "editor-breakpoint",
        },
      }),
    );
    if (currentLine) {
      marks.push({
        range: new library.Range(currentLine, 1, currentLine, 1),
        options: {
          isWholeLine: true,
          className: "editor-current-instruction",
          glyphMarginClassName: "editor-instruction-arrow",
        },
      });
      editor.current?.revealLineInCenterIfOutsideViewport(currentLine);
    }
    decorations.current.set(marks);
  }, [currentLine, breakpoints, path, runtimeReady]);
  if (!runtimeReady)
    return (
      <div className="editor-loading" role={runtimeError ? "alert" : "status"}>
        {runtimeError || "Preparando o editor…"}
      </div>
    );
  return (
    <Editor
      height="100%"
      value={value}
      path={path}
      language={language}
      theme="nucleo"
      beforeMount={beforeMount}
      onMount={ready}
      onChange={(value) => onChange(value ?? "")}
      loading={<div className="editor-loading">Preparando o editor…</div>}
      options={{
        fontFamily: "Commit Mono",
        fontSize: 14,
        lineHeight: 24,
        padding: { top: 18, bottom: 18 },
        minimap: { enabled: true, maxColumn: 60 },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        wordWrap: "off",
        renderLineHighlight: "line",
        smoothScrolling: false,
        accessibilitySupport: "auto",
        glyphMargin: true,
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        bracketPairColorization: { enabled: false },
        stickyScroll: { enabled: false },
        quickSuggestions: { other: true, comments: false, strings: false },
        quickSuggestionsDelay: 120,
        suggestOnTriggerCharacters: true,
        tabCompletion: "on",
        acceptSuggestionOnEnter: "on",
        wordBasedSuggestions: "off",
        parameterHints: { enabled: true },
        suggest: { showIcons: true, preview: true, showStatusBar: true },
        suggestFontSize: 13,
        suggestLineHeight: 26,
      }}
    />
  );
}
