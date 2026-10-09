"use client";
import { useState } from "react";
import type { Block, Inline } from "@nucleo/core";
import { Copy, Check, Code2, ExternalLink } from "lucide-react";
import { SourceFigure } from "./SourceFigure";
import { CodeSnippet } from "@nucleo/features/components/CodeSnippet";
function Rich({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((node, index) =>
        node.type === "strong" ? (
          <strong key={index}>
            <Rich nodes={node.children ?? []} />
          </strong>
        ) : node.type === "emphasis" ? (
          <em key={index}>
            <Rich nodes={node.children ?? []} />
          </em>
        ) : node.type === "code" ? (
          <code key={index}>{node.text}</code>
        ) : node.type === "link" ? (
          <a
            key={index}
            href={node.href}
            target={node.href?.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
          >
            <Rich nodes={node.children ?? []} />
          </a>
        ) : node.type === "break" ? (
          <br key={index} />
        ) : (
          <span key={index}>{node.text}</span>
        ),
      )}
    </>
  );
}
function CodeBlock({
  block,
  onLoad,
}: {
  block: Extract<Block, { type: "code" }>;
  onLoad?: (block: Extract<Block, { type: "code" }>) => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(block.raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="lesson-code-block">
      <header>
        <span className="mono">
          {block.language.toUpperCase()}
          {block.architecture && block.architecture !== "not-applicable"
            ? ` / ${block.architecture}`
            : ""}
        </span>
        <div>
          {block.executable && onLoad && (
            <button onClick={() => onLoad(block)}>
              <Code2 size={13} />
              Carregar na bancada
            </button>
          )}
          <button aria-label="Copiar trecho" onClick={() => void copy()}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </header>
      <CodeSnippet source={block.raw} language={block.language} />
      {block.note && <p className="code-note">{block.note}</p>}
    </div>
  );
}
export function ContentRenderer({
  blocks,
  onCodeLoad,
}: {
  blocks: Block[];
  onCodeLoad?: (block: Extract<Block, { type: "code" }>) => void;
}) {
  return (
    <div className="lesson-prose">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          if (block.level === 1 && index === 0) return null;
          return block.level <= 2 ? (
            <h2 id={block.id} key={block.id}>
              {block.text}
            </h2>
          ) : (
            <h3 id={block.id} key={block.id}>
              {block.text}
            </h3>
          );
        }
        if (block.type === "paragraph")
          return (
            <p id={block.id} key={block.id}>
              <Rich nodes={block.content} />
            </p>
          );
        if (block.type === "quote")
          return (
            <blockquote id={block.id} key={block.id}>
              <Rich nodes={block.content} />
            </blockquote>
          );
        if (block.type === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return (
            <Tag id={block.id} key={block.id}>
              {block.items.map((item, i) => (
                <li key={i}>
                  <Rich nodes={item} />
                </li>
              ))}
            </Tag>
          );
        }
        if (block.type === "table")
          return (
            <div
              id={block.id}
              key={block.id}
              className="lesson-table-wrap"
              tabIndex={0}
              aria-label="Tabela técnica"
            >
              <table>
                <thead>
                  <tr>
                    {block.headers.map((header, i) => (
                      <th key={i}>
                        <Rich nodes={header} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>
                          <Rich nodes={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        if (block.type === "code")
          return (
            <div id={block.id} key={block.id}>
              <CodeBlock block={block} onLoad={onCodeLoad} />
            </div>
          );
        if (block.type === "image")
          return <SourceFigure key={block.id} block={block} />;
        if (block.type === "embed")
          return (
            <a
              key={block.id}
              href={block.url}
              target="_blank"
              rel="noopener noreferrer"
              className="video-reference"
            >
              <ExternalLink size={17} />
              <span>
                {block.title}
                <small>Abrir o vídeo da fonte</small>
              </span>
            </a>
          );
        if (block.type === "note")
          return (
            <aside key={block.id} className="concept-note">
              <strong>{block.title}</strong>
              <p>{block.content}</p>
            </aside>
          );
        return null;
      })}
    </div>
  );
}
