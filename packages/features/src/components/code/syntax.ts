import { StreamLanguage } from "@codemirror/language";
import { cppLanguage } from "@codemirror/lang-cpp";
import { pythonLanguage } from "@codemirror/lang-python";
import { classHighlighter, highlightTree } from "@lezer/highlight";
import {
  assemblyInstructions,
  completionCatalog,
  registers,
} from "../../modules/labs/editor/completion-data";

const keywords = new Set([
  ...assemblyInstructions,
  ...completionCatalog.fasm.map((item) => item.label),
]);
const registerNames = new Set(registers);
export const assemblySyntax = StreamLanguage.define({
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.match(/;.*/)) return "comment";
    if (stream.match(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/)) return "string";
    if (stream.match(/\b(?:0x[\da-f]+|[\da-f]+h|[01]+b|\d+)(?!\w)/i))
      return "number";
    const word = stream.match(/[\w.$]+/);
    if (word && typeof word !== "boolean") {
      const name = word[0]!.toLowerCase();
      if (keywords.has(name)) return "keyword";
      if (registerNames.has(name)) return "typeName";
      if (stream.peek() === ":") return "labelName";
      return "variableName";
    }
    stream.next();
    return null;
  },
  languageData: { commentTokens: { line: ";" } },
});
const commandSyntax = StreamLanguage.define({
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.match(/#.*/)) return "comment";
    if (stream.match(/"(?:[^"\\]|\\.)*"|'[^']*'/)) return "string";
    if (stream.match(/\b(?:0x[\da-f]+|\d+)\b/i)) return "number";
    if (stream.match(/\$[\w{}]+/)) return "variableName";
    if (stream.match(/--?[\w-]+/)) return "keyword";
    if (stream.sol() && stream.match(/[\w./\\-]+/)) return "keyword";
    stream.next();
    return null;
  },
});
export type CodeToken = { text: string; className?: string };
function languageFor(language: string, source: string) {
  const name = language.toLowerCase();
  if (/python|^py$/.test(name)) return pythonLanguage;
  if (/assembly|fasm|asm/.test(name)) return assemblySyntax;
  if (/^(c|cpp|c\+\+|h)$/.test(name)) return cppLanguage;
  if (/bash|shell|powershell|batch|^sh$|^bat$|cmd/.test(name))
    return commandSyntax;
  if (/^\s*(?:#include|int\s+main|void\s+\w+\()/m.test(source))
    return cppLanguage;
  if (/^\s*(?:mov|xor|cmp|add|push|pop|call|format\s+PE)\b/im.test(source))
    return assemblySyntax;
  if (/^\s*(?:import\s|from\s|def\s|print\()/m.test(source))
    return pythonLanguage;
  return commandSyntax;
}
const windowsTypes = new Set(
  (
    "BOOL BOOLEAN BYTE CHAR WCHAR TCHAR WORD DWORD DWORD64 QWORD INT UINT LONG ULONG " +
    "SHORT USHORT LONGLONG ULONGLONG FLOAT VOID PVOID LPVOID LPCVOID HANDLE PHANDLE " +
    "HWND HMODULE HINSTANCE HKEY PHKEY HMENU HDC HICON HBRUSH HCURSOR HFILE HRESULT " +
    "LRESULT WPARAM LPARAM ATOM NTSTATUS REGSAM SIZE_T SSIZE_T DWORD_PTR UINT_PTR " +
    "INT_PTR LONG_PTR ULONG_PTR LPSTR LPCSTR LPWSTR LPCWSTR LPTSTR LPCTSTR PSTR PCSTR " +
    "PWSTR PCWSTR LPBYTE PBYTE LPDWORD PDWORD LPWORD LPBOOL LPLONG LPINT FARPROC " +
    "LPSECURITY_ATTRIBUTES LPOVERLAPPED LPTHREAD_START_ROUTINE LPSTARTUPINFO " +
    "LPPROCESS_INFORMATION STARTUPINFO PROCESS_INFORMATION SECURITY_ATTRIBUTES " +
    "size_t ssize_t ptrdiff_t uintptr_t intptr_t int8_t int16_t int32_t int64_t " +
    "uint8_t uint16_t uint32_t uint64_t wchar_t FILE"
  ).split(" "),
);
const pythonTypes = new Set(
  "int str bytes bytearray float bool list dict tuple set frozenset object memoryview complex".split(
    " ",
  ),
);
const annotations = new Set(
  "in out inout optional opt reserved _In_ _Out_ _Inout_ _In_opt_ _Out_opt_ _Inout_opt_ IN OUT OPTIONAL".split(
    " ",
  ),
);
const branchInstructions = /^(?:call|j[a-z]{1,4}|loop\w*)$/i;

/** Adds the semantic roles the Lezer grammars leave as plain identifiers. */
function refine(source: string, tokens: CodeToken[], language: string) {
  const flavour = languageFor(language, source);
  const result: CodeToken[] = [];
  let offset = 0;
  // `[in, optional]` style SAL brackets from the Microsoft documentation.
  const salRanges = [
    ...source.matchAll(
      /\[(?:\s*(?:in|out|inout|optional|opt|reserved)\s*,?)+\]/g,
    ),
  ].map((match) => [match.index!, match.index! + match[0].length] as const);
  const inSal = (at: number) =>
    salRanges.some(([from, to]) => at >= from && at < to);
  let previousWord = "";
  for (const token of tokens) {
    const plain =
      !token.className ||
      /^tok-variableName(?: tok-definition)?$/.test(token.className);
    if (!plain) {
      result.push(
        flavour === assemblySyntax && token.className === "tok-typeName"
          ? { ...token, className: "tok-register" }
          : token,
      );
      offset += token.text.length;
      if (/\w/.test(token.text)) previousWord = token.text.toLowerCase();
      continue;
    }
    for (const part of token.text.split(/([A-Za-z_][\w$]*)/)) {
      if (!part) continue;
      const at = offset;
      offset += part.length;
      if (!/^[A-Za-z_]/.test(part)) {
        result.push(
          token.className && !part.trim()
            ? { text: part }
            : { text: part, className: token.className },
        );
        continue;
      }
      const next = source.slice(offset).match(/^\s*(\S)/)?.[1];
      const definition = token.className?.includes("tok-definition")
        ? " tok-definition"
        : "";
      let className = token.className ?? "tok-variableName";
      if (flavour === assemblySyntax) {
        if (branchInstructions.test(previousWord))
          className =
            previousWord === "call" ? "tok-function" : "tok-labelName";
      } else if (
        inSal(at) ||
        (flavour === cppLanguage && annotations.has(part) && /^_/.test(part))
      ) {
        className = "tok-annotation";
      } else if (flavour === cppLanguage && windowsTypes.has(part)) {
        className = "tok-typeName";
      } else if (
        flavour === pythonLanguage &&
        pythonTypes.has(part) &&
        next !== "("
      ) {
        className = "tok-typeName";
      } else if (next === "(") {
        className = `tok-function${definition}`;
      } else if (
        /^[A-Z][A-Z0-9]*_[A-Z0-9_]*$|^[A-Z]{2,}[0-9]*$/.test(part) &&
        part.length > 1
      ) {
        className = "tok-constant";
      } else if (
        /^[A-Z][a-z]\w*$/.test(part) &&
        flavour === pythonLanguage &&
        previousWord === "class"
      ) {
        className = "tok-className";
      }
      result.push({ text: part, className });
      previousWord = part.toLowerCase();
    }
  }
  return result;
}
export function codeTokens(source: string, language: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let position = 0;
  const parser = languageFor(language, source).parser;
  highlightTree(
    parser.parse(source),
    classHighlighter,
    (from, to, className) => {
      if (from > position) tokens.push({ text: source.slice(position, from) });
      tokens.push({ text: source.slice(from, to), className });
      position = to;
    },
  );
  if (position < source.length) tokens.push({ text: source.slice(position) });
  return refine(source, tokens, language);
}
