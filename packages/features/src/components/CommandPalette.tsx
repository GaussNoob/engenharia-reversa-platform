"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "@nucleo/platform";
import { Search, X } from "lucide-react";
import type { SearchResult } from "@nucleo/core";
import { api } from "@nucleo/api-client";
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [failed, setFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  useEffect(() => {
    const show = () => setOpen(true);
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", key);
    window.addEventListener("nucleo:search", show);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("nucleo:search", show);
    };
  }, []);
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      input.current?.focus();
    } else dialog.current?.close();
  }, [open]);
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setFailed(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void api<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then((value) => {
          setResults(value);
          setSelected(0);
          setFailed(false);
        })
        .catch((error) => {
          if (!controller.signal.aborted) {
            setResults([]);
            setFailed(true);
          }
        });
    }, 70);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  const go = (result: SearchResult | undefined) => {
    if (result) {
      setOpen(false);
      router.push(result.href);
    }
  };
  return (
    <dialog
      className="command-dialog"
      ref={dialog}
      onCancel={() => setOpen(false)}
      onClick={(event) => {
        if (event.target === dialog.current) setOpen(false);
      }}
      aria-label="Buscar na plataforma"
    >
      <div className="command-search">
        <Search size={20} />
        <input
          ref={input}
          placeholder="Procure um conceito, aula ou instrução…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setSelected((index) => Math.min(index + 1, results.length - 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setSelected((index) => Math.max(0, index - 1));
            }
            if (event.key === "Enter") go(results[selected]);
          }}
          aria-label="Termo da busca"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="search-results"
          aria-activedescendant={
            results[selected] ? `result-${selected}` : undefined
          }
        />
        <button
          className="icon-button"
          aria-label="Fechar busca"
          onClick={() => setOpen(false)}
        >
          <X size={18} />
        </button>
      </div>
      <div id="search-results" role="listbox" className="command-results">
        {results.map((result, index) => (
          <button
            role="option"
            aria-selected={selected === index}
            id={`result-${index}`}
            key={result.id}
            className={selected === index ? "selected" : ""}
            onMouseEnter={() => setSelected(index)}
            onClick={() => go(result)}
          >
            <span>
              <strong>{result.title}</strong>
              <small>{result.description}</small>
            </span>
            <span className="result-kind">{result.kind}</span>
          </button>
        ))}
        {failed ? (
          <p className="empty-search">
            A busca está indisponível no momento. Tente novamente em instantes.
          </p>
        ) : query && results.length === 0 ? (
          <p className="empty-search">
            Nenhum resultado. Experimente “RAX”, “PE” ou “XOR”.
          </p>
        ) : !query ? (
          <p className="empty-search">
            Aulas, conceitos, instruções, funções e ferramentas em um só lugar.
          </p>
        ) : null}
      </div>
      <footer>
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> navegar
        </span>
        <span>
          <kbd>Enter</kbd> abrir
        </span>
        <span>
          <kbd>Esc</kbd> fechar
        </span>
      </footer>
    </dialog>
  );
}
