"use client";
import { useMemo, useState } from "react";
import {
  extractStrings,
  rvaToOffset,
  type PeImage,
  type BinaryField,
} from "@nucleo/models";
export function BinaryStrings({
  image,
  onSelect,
}: {
  image: PeImage;
  onSelect: (field: BinaryField) => void;
}) {
  const [query, setQuery] = useState("");
  const strings = useMemo(() => extractStrings(image.bytes), [image]);
  const filtered = strings.filter((item) =>
    item.text.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="binary-strings">
      <label>
        Filtrar strings
        <input
          className="field-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nome, mensagem, função…"
        />
      </label>
      <p>
        {filtered.length} candidatas · ASCII e UTF-16LE imprimível · mínimo 4
        caracteres · limite 500
      </p>
      <div>
        {filtered.map((item) => (
          <button
            key={`${item.offset}-${item.encoding}`}
            onClick={() =>
              onSelect({
                name: item.encoding,
                offset: item.offset,
                size: item.size,
                value: item.text,
                explanation: `String candidata: ${item.text}. Sua presença não prova que o programa a utiliza.`,
              })
            }
          >
            <code>0x{item.offset.toString(16).toUpperCase()}</code>
            <span>{item.text}</span>
            <small>{item.encoding}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
export function BinaryAddresses({
  image,
  onSelect,
}: {
  image: PeImage;
  onSelect: (field: BinaryField) => void;
}) {
  const [input, setInput] = useState(`0x${image.entrypointRva.toString(16)}`);
  let rva: number | null = null;
  try {
    if (/^(0x[\da-f]+|\d+)$/i.test(input.trim())) {
      const number = BigInt(input);
      if (number >= 0n && number <= 0xffffffffn) rva = Number(number);
    }
  } catch {
    /* Keep the explanation available for invalid input. */
  }
  const offset = rva === null ? null : rvaToOffset(image, rva);
  const section = image.sections.find(
    (item) =>
      rva !== null &&
      rva >= item.rva &&
      rva < item.rva + Math.max(item.virtualSize, item.rawSize),
  );
  return (
    <div className="binary-addresses">
      <label>
        RVA a investigar
        <input
          className="field-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={24}
        />
      </label>
      <dl>
        <div>
          <dt>Base preferencial</dt>
          <dd>{image.imageBase}</dd>
        </div>
        <div>
          <dt>VA na base preferencial</dt>
          <dd>
            {rva === null
              ? "—"
              : `0x${(BigInt(image.imageBase) + BigInt(rva)).toString(16).toUpperCase()}`}
          </dd>
        </div>
        <div>
          <dt>Seção</dt>
          <dd>{section?.name ?? "Cabeçalhos ou fora das seções"}</dd>
        </div>
        <div>
          <dt>Offset no arquivo</dt>
          <dd>
            {offset === null
              ? "Sem bytes correspondentes"
              : `0x${offset.toString(16).toUpperCase()}`}
          </dd>
        </div>
      </dl>
      {offset !== null && (
        <button
          className="button button-secondary button-small"
          onClick={() =>
            onSelect({
              name: "RVA → offset",
              offset,
              size: 1,
              value: input,
              explanation: `RVA ${input} corresponde ao offset 0x${offset.toString(16)} neste arquivo.`,
            })
          }
        >
          Destacar no hex viewer
        </button>
      )}
      <p>
        Dentro de uma seção: offset = RVA − VirtualAddress + PointerToRawData.
        Áreas preenchidas com zeros pelo loader podem não ter bytes no arquivo.
        ASLR pode alterar a base efetiva.
      </p>
    </div>
  );
}
