"use client";
import { useEffect, useRef, useState } from "react";
import { unsignedValue, signedValue } from "@nucleo/models";
export function HexViewer({
  bytes,
  highlight,
  onSelect,
  base = 0,
}: {
  bytes: Uint8Array;
  highlight?: { offset: number; size: number };
  onSelect?: (offset: number) => void;
  base?: number;
}) {
  const [selected, setSelected] = useState(0),
    [page, setPage] = useState(0),
    [columns, setColumns] = useState(16);
  const root = useRef<HTMLDivElement>(null);
  const perPage = 256,
    maxPage = Math.max(0, Math.ceil(bytes.length / perPage) - 1);
  const currentPage = Math.min(page, maxPage),
    start = currentPage * perPage,
    data = bytes.slice(start, start + perPage);
  const selectedOffset = Math.min(selected, Math.max(0, bytes.length - 1));
  useEffect(() => {
    const observer = new ResizeObserver((entries) =>
      setColumns((entries[0]?.contentRect.width ?? 800) < 630 ? 8 : 16),
    );
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (highlight && highlight.offset >= 0 && highlight.offset < bytes.length) {
      setPage(Math.floor(highlight.offset / perPage));
      setSelected(highlight.offset);
    }
  }, [highlight?.offset, highlight?.size, bytes.length]);
  const select = (offset: number, focus = false) => {
    const next = Math.max(0, Math.min(bytes.length - 1, offset));
    setSelected(next);
    setPage(Math.floor(next / perPage));
    onSelect?.(next);
    if (focus)
      requestAnimationFrame(() =>
        root.current
          ?.querySelector<HTMLButtonElement>(`[data-offset="${next}"]`)
          ?.focus(),
      );
  };
  const selectedBytes = bytes.slice(
    selectedOffset,
    Math.min(bytes.length, selectedOffset + 4),
  );
  const value = unsignedValue(selectedBytes);
  return (
    <div className={`hex-viewer hex-columns-${columns}`} ref={root}>
      <header>
        <span className="mono">OFFSET</span>
        <span className="mono">HEX</span>
        <span className="mono">ASCII</span>
      </header>
      <div
        className="hex-scroll"
        role="group"
        aria-label="Bytes do arquivo em hexadecimal"
      >
        {Array.from({ length: Math.ceil(data.length / columns) }, (_, row) => (
          <div className="hex-row" key={row}>
            <span className="hex-offset">
              {(base + start + row * columns)
                .toString(16)
                .padStart(8, "0")
                .toUpperCase()}
            </span>
            <div className="hex-bytes">
              {Array.from(
                data.slice(row * columns, row * columns + columns),
                (byte, column) => {
                  const offset = start + row * columns + column;
                  const active =
                    highlight &&
                    offset >= highlight.offset &&
                    offset < highlight.offset + highlight.size;
                  return (
                    <button
                      key={offset}
                      data-offset={offset}
                      className={`${selectedOffset === offset ? "selected" : ""} ${active ? "highlighted" : ""}`}
                      tabIndex={
                        selectedOffset === offset ||
                        (selectedOffset < start && offset === start) ||
                        (selectedOffset >= start + perPage && offset === start)
                          ? 0
                          : -1
                      }
                      onClick={() => select(offset)}
                      onKeyDown={(event) => {
                        const movement: Record<string, number> = {
                          ArrowRight: 1,
                          ArrowLeft: -1,
                          ArrowUp: -columns,
                          ArrowDown: columns,
                          PageDown: perPage,
                          PageUp: -perPage,
                        };
                        if (event.key in movement) {
                          event.preventDefault();
                          select(offset + movement[event.key]!, true);
                        }
                      }}
                      aria-label={`Byte no offset ${offset.toString(16)}: ${byte.toString(16)}`}
                    >
                      {byte.toString(16).padStart(2, "0").toUpperCase()}
                    </button>
                  );
                },
              )}
            </div>
            <span className="hex-ascii">
              {Array.from(
                data.slice(row * columns, row * columns + columns),
                (byte) =>
                  byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : "·",
              ).join("")}
            </span>
          </div>
        ))}
      </div>
      <footer>
        <div>
          <span>Selecionado</span>
          <code>0x{(base + selectedOffset).toString(16).toUpperCase()}</code>
          <span>{selectedBytes.length * 8} bits LE</span>
          <code>{value.toString()}</code>
          <span>com sinal</span>
          <code>
            {signedValue(value, selectedBytes.length * 8 || 8).toString()}
          </code>
        </div>
        {bytes.length > perPage && (
          <div className="hex-pager">
            <button
              disabled={currentPage === 0}
              onClick={() => select((currentPage - 1) * perPage)}
            >
              Anterior
            </button>
            <span>
              {currentPage + 1}/{maxPage + 1}
            </span>
            <button
              disabled={currentPage === maxPage}
              onClick={() => select((currentPage + 1) * perPage)}
            >
              Próxima
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}
