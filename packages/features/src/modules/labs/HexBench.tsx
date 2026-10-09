"use client";
import { useState } from "react";
import { parseHex, hexBytes, encodeText } from "@nucleo/models";
import { HexViewer } from "./HexViewer";
const fixtures = {
  "null-strings": {
    title: "Encontre o fim da string.",
    description:
      "“Erro” em UTF-16LE com terminador. Compare com a versão ASCII.",
    bytes: encodeText("Erro", "utf-16-le", true),
  },
  "arquivo-conteudo": {
    title: "Conteúdo não é o nome.",
    description:
      "mentebinaria.com.br ocupa 19 bytes ASCII, sem quebra de linha nem terminador. Mudar a extensão não muda estes bytes.",
    bytes: encodeText("mentebinaria.com.br", "ascii", false),
  },
  gif: {
    title: "Leia o cabeçalho GIF.",
    description:
      "Cabeçalho didático GIF89a: offsets 6–7 guardam largura 48; 8–9 guardam altura 32, em little-endian. Este trecho de 13 bytes não é um arquivo GIF completo.",
    bytes: Uint8Array.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x30, 0, 0x20, 0, 0x80, 0, 0,
    ]),
  },
};
export function HexBench({
  patch = false,
  labId,
}: {
  patch?: boolean;
  labId?: string;
}) {
  const fixture =
    fixtures[labId as keyof typeof fixtures] ?? fixtures["null-strings"];
  const [hex, setHex] = useState(hexBytes(fixture.bytes));
  const [text, setText] = useState("C:\\Windows\\System32\\cmd.exe");
  const [original] = useState(() =>
    encodeText("C:\\Windows\\System32\\cmd.exe", "ascii", true),
  );
  const [virtualFiles, setVirtualFiles] = useState([
    "C:\\Windows\\System32\\cmd.exe",
    "C:\\Windows\\System32\\calc.exe",
  ]);
  const [result, setResult] = useState<{
    eax: number;
    lastError: string;
  } | null>(null);
  let bytes: Uint8Array = new Uint8Array(),
    error = "";
  try {
    bytes = patch ? encodeText(text, "ascii", true) : parseHex(hex);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Entrada inválida.";
  }
  const changes = patch
    ? Array.from(
        { length: Math.max(bytes.length, original.length) },
        (_, offset) => ({
          offset,
          before: original[offset] ?? null,
          after: bytes[offset] ?? null,
        }),
      ).filter((row) => row.before !== row.after)
    : [];
  const download = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            format: "nucleo-byte-patch-v1",
            originalLength: original.length,
            modifiedLength: bytes.length,
            changes,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "alteracao.patch.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="concept-bench">
      <div className="bench-heading">
        <span className="overline">
          {patch ? "PATCH / ANTES E DEPOIS" : "HEX / BYTES E TEXTO"}
        </span>
        <h3>
          {patch ? "Mude um argumento.\nObserve a diferença." : fixture.title}
        </h3>
        <p>
          {patch
            ? "Experimento com bytes em memória virtual. A comparação inclui inserções e remoções."
            : fixture.description}
        </p>
      </div>
      {patch ? (
        <>
          <label className="bench-wide-field">
            String passada à chamada modelada
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={120}
            />
          </label>
          <div className="patch-summary">
            <strong>{changes.length} bytes alterados</strong>
            <button
              className="button button-secondary button-small"
              onClick={download}
              disabled={Boolean(error)}
            >
              Exportar patch
            </button>
          </div>
          {labId === "manipulation" && (
            <section className="virtual-delete">
              <p>
                Arquivos fictícios disponíveis:{" "}
                {virtualFiles
                  .map((path) => path.split("\\").at(-1))
                  .join(", ") || "nenhum"}
              </p>
              <button
                className="button button-secondary button-small"
                disabled={Boolean(error)}
                onClick={() => {
                  const exists = virtualFiles.includes(text);
                  setResult({
                    eax: exists ? 1 : 0,
                    lastError: exists
                      ? "Sem significado garantido após sucesso"
                      : "2 / ERROR_FILE_NOT_FOUND",
                  });
                  if (exists)
                    setVirtualFiles((files) =>
                      files.filter((path) => path !== text),
                    );
                }}
              >
                Modelar DeleteFileA
              </button>
              {result && (
                <p role="status">
                  EAX = {result.eax} · LastError: {result.lastError}
                </p>
              )}
            </section>
          )}
          <p className="bench-explanation">
            Este alvo existe somente na bancada. A chamada modelada altera a
            lista de arquivos fictícios acima; nenhum arquivo do sistema é
            modificado.
          </p>
        </>
      ) : (
        <>
          <div className="experiment-presets">
            <button onClick={() => setHex(hexBytes(fixture.bytes))}>
              Restaurar exemplo
            </button>
            {(!labId || labId === "null-strings") && (
              <>
                <button
                  onClick={() =>
                    setHex(hexBytes(encodeText("Erro", "ascii", true)))
                  }
                >
                  Erro / ASCII
                </button>
                <button
                  onClick={() =>
                    setHex(hexBytes(encodeText("Erro", "utf-16-le", true)))
                  }
                >
                  Erro / UTF-16LE
                </button>
              </>
            )}
          </div>
          <label className="bench-wide-field">
            Bytes hexadecimais
            <textarea
              value={hex}
              onChange={(event) => setHex(event.target.value)}
              rows={3}
              maxLength={20000}
            />
          </label>
          <p className="bench-explanation">
            {bytes.length} bytes no trecho atual. Selecione um byte para
            inspecionar seu valor.
          </p>
        </>
      )}
      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : (
        <>
          <HexViewer bytes={bytes} />
          {patch && (
            <div className="patch-diff">
              <span className="mono">BYTES MODIFICADOS</span>
              {changes.map((row) => (
                <div key={row.offset}>
                  <code>0x{row.offset.toString(16).toUpperCase()}</code>
                  <del>
                    {row.before?.toString(16).padStart(2, "0").toUpperCase() ??
                      "—"}
                  </del>
                  <strong>
                    {row.after?.toString(16).padStart(2, "0").toUpperCase() ??
                      "—"}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
