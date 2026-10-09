import type * as Monaco from "monaco-editor";
import {
  callSignature,
  getCompletions,
  type CompletionRequest,
} from "./completions";
import type { CompletionDialect, CodeSuggestion } from "./completion-data";

type EditorContext = Pick<CompletionRequest, "dialect" | "files" | "mode">;
const contexts = new Map<string, EditorContext>();
const installed = new WeakSet<object>();
export function setCompletionContext(uri: string, context: EditorContext) {
  contexts.set(uri, context);
}
export function removeCompletionContext(uri: string) {
  contexts.delete(uri);
}
function request(
  model: Monaco.editor.ITextModel,
  position: Monaco.Position,
): CompletionRequest {
  const dialect = model.getLanguageId() as CompletionDialect;
  return {
    dialect:
      dialect in { python: 1, c: 1, cpp: 1, assembly: 1 }
        ? dialect
        : "assembly",
    ...contexts.get(model.uri.toString()),
    source: model.getValue(),
    offset: model.getOffsetAt(position),
  };
}
export function installCompletions(monaco: typeof Monaco) {
  if (installed.has(monaco)) return;
  installed.add(monaco);
  const kinds: Record<
    CodeSuggestion["kind"],
    Monaco.languages.CompletionItemKind
  > = {
    keyword: monaco.languages.CompletionItemKind.Keyword,
    function: monaco.languages.CompletionItemKind.Function,
    variable: monaco.languages.CompletionItemKind.Variable,
    type: monaco.languages.CompletionItemKind.Class,
    constant: monaco.languages.CompletionItemKind.Constant,
    module: monaco.languages.CompletionItemKind.Module,
    snippet: monaco.languages.CompletionItemKind.Snippet,
    property: monaco.languages.CompletionItemKind.Field,
  };
  for (const language of ["python", "c", "cpp", "assembly"]) {
    monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: [".", ":", ">", "<", '"'],
      provideCompletionItems(model, position) {
        const result = getCompletions(request(model, position));
        const start = model.getPositionAt(result.from);
        const range = new monaco.Range(
          start.lineNumber,
          start.column,
          position.lineNumber,
          position.column,
        );
        return {
          suggestions: result.items.map((item) => ({
            label: {
              label: item.label,
              description: item.kind === "snippet" ? item.detail : undefined,
            },
            kind: kinds[item.kind],
            detail: item.detail,
            documentation: {
              value: item.description,
              isTrusted: false,
              supportHtml: false,
            },
            insertText: item.insert ?? item.label,
            insertTextRules: item.insert?.includes("${")
              ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              : undefined,
            sortText: `${item.kind === "snippet" ? "2" : item.description.startsWith("Símbolo") ? "0" : "1"}-${item.label}`,
            range,
          })),
        };
      },
    });
    monaco.languages.registerSignatureHelpProvider(language, {
      signatureHelpTriggerCharacters: ["(", ","],
      signatureHelpRetriggerCharacters: [")"],
      provideSignatureHelp(model, position) {
        const found = callSignature(request(model, position));
        if (!found) return;
        return {
          value: {
            signatures: [
              {
                label: found.item.detail,
                documentation: found.item.description,
                parameters: (found.item.parameters ?? []).map((label) => ({
                  label,
                })),
              },
            ],
            activeSignature: 0,
            activeParameter: found.parameter,
          },
          dispose() {},
        };
      },
    });
    monaco.languages.registerHoverProvider(language, {
      provideHover(model, position) {
        const word = model.getWordAtPosition(position);
        if (!word) return;
        const cursor = new monaco.Position(position.lineNumber, word.endColumn);
        const item = getCompletions(request(model, cursor)).items.find(
          (item) => item.label === word.word && item.kind !== "snippet",
        );
        return item
          ? {
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn,
              ),
              contents: [
                {
                  value: `\`${item.detail}\``,
                  isTrusted: false,
                  supportHtml: false,
                },
                {
                  value: item.description,
                  isTrusted: false,
                  supportHtml: false,
                },
              ],
            }
          : undefined;
      },
    });
  }
}
