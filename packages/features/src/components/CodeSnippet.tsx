import { codeTokens } from "./code/syntax";

export function SyntaxCode({
  source,
  language = "text",
}: {
  source: string;
  language?: string;
}) {
  return (
    <code className="syntax-code" data-language={language}>
      {codeTokens(source, language).map((token, index) =>
        token.className ? (
          <span className={token.className} key={index}>
            {token.text}
          </span>
        ) : (
          token.text
        ),
      )}
    </code>
  );
}
export function CodeSnippet({
  source,
  language = "text",
  className = "",
}: {
  source: string;
  language?: string;
  className?: string;
}) {
  return (
    <pre
      className={`code-snippet ${className}`}
      tabIndex={0}
      aria-label={`Trecho de código ${language}`}
    >
      <SyntaxCode source={source} language={language} />
    </pre>
  );
}
