"use client";
import { useEffect, useRef, useState } from "react";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
} from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  autocompletion,
  acceptCompletion,
  startCompletion,
  snippetCompletion,
  closeBrackets,
  closeBracketsKeymap,
  type CompletionSource,
} from "@codemirror/autocomplete";
import {
  HighlightStyle,
  syntaxHighlighting,
  bracketMatching,
  indentOnInput,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { ListFilter } from "lucide-react";
import { getCompletions, callSignature } from "./completions";
import { assemblySyntax } from "@nucleo/features/components/code/syntax";
import type { EditorProps } from "./CodeEditor";

const colors = HighlightStyle.define([
  { tag: tags.keyword, color: "#e8ba70" },
  { tag: tags.comment, color: "#89939a" },
  { tag: tags.string, color: "#b2c7a6" },
  { tag: tags.number, color: "#98bbca" },
  { tag: [tags.typeName, tags.labelName], color: "#d6c3a8" },
  { tag: tags.function(tags.variableName), color: "#d4dadd" },
]);
const syntax = (language: string) =>
  language === "python"
    ? python()
    : language === "assembly"
      ? assemblySyntax
      : cpp();

export default function TouchCodeEditor({
  value,
  onChange,
  language,
  dialect,
  files,
  mode,
}: EditorProps) {
  const container = useRef<HTMLDivElement>(null),
    editor = useRef<EditorView | null>(null);
  const callback = useRef(onChange);
  callback.current = onChange;
  const configuration = useRef({ dialect: dialect ?? "assembly", files, mode });
  configuration.current = { dialect: dialect ?? "assembly", files, mode };
  const languageSlot = useRef(new Compartment());
  const [signature, setSignature] = useState("");
  useEffect(() => {
    if (!container.current) return;
    const completions: CompletionSource = (context) => {
      const result = getCompletions({
        ...configuration.current,
        source: context.state.doc.toString(),
        offset: context.pos,
      });
      if (
        result.from === context.pos &&
        !context.explicit &&
        !/[.:>]$/.test(
          context.state.sliceDoc(Math.max(0, context.pos - 1), context.pos),
        )
      )
        return null;
      return {
        from: result.from,
        options: result.items.map((item) => {
          const option = {
            label: item.label,
            type:
              item.kind === "snippet"
                ? "keyword"
                : item.kind === "module"
                  ? "namespace"
                  : item.kind,
            detail: item.detail,
            info: item.description,
            boost:
              item.kind === "snippet"
                ? -5
                : item.description.startsWith("Símbolo")
                  ? 10
                  : 0,
          };
          return item.insert?.includes("${")
            ? snippetCompletion(item.insert.replace(/\$0\b/g, "${0}"), option)
            : { ...option, apply: item.insert ?? item.label };
        }),
        validFor: /^[\w$]*$/,
      };
    };
    const view = new EditorView({
      parent: container.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          history(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          syntaxHighlighting(colors),
          keymap.of([
            ...closeBracketsKeymap,
            { key: "Tab", run: acceptCompletion },
            indentWithTab,
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          languageSlot.current.of(syntax(language)),
          autocompletion({
            override: [completions],
            activateOnTyping: true,
            maxRenderedOptions: 30,
            icons: true,
            interactionDelay: 0,
          }),
          EditorView.contentAttributes.of({
            "aria-label": "Editor de código",
            autocapitalize: "off",
            autocorrect: "off",
            spellcheck: "false",
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged)
              callback.current(update.state.doc.toString());
            if (update.docChanged || update.selectionSet) {
              const found = callSignature({
                ...configuration.current,
                source: update.state.doc.toString(),
                offset: update.state.selection.main.head,
              });
              setSignature(found?.item.detail ?? "");
            }
          }),
          EditorView.theme(
            {
              "&": {
                height: "100%",
                background: "#131719",
                color: "#f1f0eb",
                fontSize: "14px",
              },
              ".cm-scroller": {
                fontFamily: "Commit Mono",
                lineHeight: "1.7",
                overflow: "auto",
              },
              ".cm-gutters": {
                background: "#131719",
                color: "#89939a",
                border: "none",
                fontSize: "11px",
              },
              ".cm-activeLineGutter": { background: "#ffffff08" },
              ".cm-content": { padding: "16px 0" },
              ".cm-cursor": { borderLeftColor: "#e8ba70" },
              ".cm-tooltip": {
                background: "#20272c",
                color: "#f1f0eb",
                border: "1px solid #4a565f",
                borderRadius: "5px",
              },
              ".cm-tooltip-autocomplete": {
                maxWidth: "calc(100vw - 32px)",
                maxHeight: "240px",
              },
              ".cm-tooltip-autocomplete > ul": {
                fontFamily: "Commit Mono",
                fontSize: "12px",
                maxHeight: "210px",
              },
              ".cm-tooltip-autocomplete > ul > li": {
                padding: "8px 10px",
                minHeight: "32px",
              },
              ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
                background: "#ffffff0d",
                color: "#f1f0eb",
              },
              ".cm-completionLabel": { fontSize: "13px" },
              ".cm-completionDetail": {
                fontSize: "10px",
                color: "#aeb7bc",
                marginLeft: "12px",
                maxWidth: "150px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "inline-block",
                verticalAlign: "bottom",
              },
              ".cm-completionInfo": {
                fontFamily: "Instrument Sans Variable",
                fontSize: "12px",
                lineHeight: "1.7",
                maxWidth: "230px",
                padding: "12px",
              },
              ".cm-snippetField": { background: "#e8ba7015" },
            },
            { dark: true },
          ),
        ],
      }),
    });
    editor.current = view;
    return () => {
      view.destroy();
      editor.current = null;
    };
  }, []);
  useEffect(() => {
    const view = editor.current;
    if (view && view.state.doc.toString() !== value)
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
  }, [value]);
  useEffect(() => {
    editor.current?.dispatch({
      effects: languageSlot.current.reconfigure(syntax(language)),
    });
  }, [language]);
  return (
    <div className="touch-code-editor">
      <div className="touch-editor-host" ref={container} />
      {signature && <div className="touch-signature">{signature}</div>}
      <div className="touch-editor-tools">
        <button
          type="button"
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => {
            if (editor.current) {
              editor.current.focus();
              startCompletion(editor.current);
            }
          }}
        >
          <ListFilter size={14} />
          Sugestões
        </button>
        <button
          type="button"
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => {
            const view = editor.current;
            if (view) {
              view.focus();
              view.dispatch(view.state.replaceSelection("    "));
            }
          }}
        >
          Tab
        </button>
        <span>Ctrl + Espaço</span>
      </div>
    </div>
  );
}
