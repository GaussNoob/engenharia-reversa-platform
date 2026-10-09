export type BinaryField = {
  name: string;
  offset: number;
  size: number;
  value: string;
  explanation: string;
};
export type PeSection = {
  name: string;
  virtualSize: number;
  rva: number;
  rawSize: number;
  offset: number;
  characteristics: number;
  permissions: string;
};
export type PeImport = {
  dll: string;
  functions: Array<{ name: string; ordinal: number | null; rva: number }>;
};
export type PeImage = {
  architecture: string;
  headersSize: number;
  is64: boolean;
  imageBase: string;
  entrypointRva: number;
  entrypointVa: string;
  fields: BinaryField[];
  sections: PeSection[];
  imports: PeImport[];
  exports: Array<{ name: string; rva: number }>;
  bytes: Uint8Array;
};
const h = (value: number | bigint) => `0x${value.toString(16).toUpperCase()}`;
export class BinaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BinaryError";
  }
}
export function parsePe(bytes: Uint8Array): PeImage {
  if (bytes.length > 8388608)
    throw new BinaryError("O limite de inspeção é 8 MiB.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const bounds = (offset: number, size: number) => {
    if (
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      size < 0 ||
      offset + size > bytes.length
    )
      throw new BinaryError(
        `Estrutura truncada ou fora do arquivo em ${h(offset)}.`,
      );
  };
  const u16 = (offset: number) => {
    bounds(offset, 2);
    return view.getUint16(offset, true);
  };
  const u32 = (offset: number) => {
    bounds(offset, 4);
    return view.getUint32(offset, true);
  };
  const u64 = (offset: number) => {
    bounds(offset, 8);
    return view.getBigUint64(offset, true);
  };
  const string = (offset: number, max = 256) => {
    bounds(offset, 1);
    let end = offset;
    while (end < bytes.length && end - offset < max && bytes[end] !== 0) end++;
    if (end - offset >= max || end === bytes.length)
      throw new BinaryError("String sem terminador dentro do limite.");
    return new TextDecoder("ascii").decode(bytes.slice(offset, end));
  };
  bounds(0, 64);
  if (bytes[0] !== 0x4d || bytes[1] !== 0x5a)
    throw new BinaryError("O arquivo não possui a assinatura MZ.");
  const nt = u32(0x3c);
  bounds(nt, 24);
  if (u32(nt) !== 0x4550)
    throw new BinaryError("A assinatura PE não foi encontrada em e_lfanew.");
  const coff = nt + 4,
    sectionCount = u16(coff + 2),
    optionalSize = u16(coff + 16),
    optional = coff + 20;
  if (!sectionCount || sectionCount > 96)
    throw new BinaryError("Quantidade de seções inválida ou não suportada.");
  bounds(optional, optionalSize);
  const magic = u16(optional);
  if (magic !== 0x20b && magic !== 0x10b)
    throw new BinaryError("Cabeçalho opcional não é PE32 ou PE32+.");
  const is64 = magic === 0x20b;
  const minimum = is64 ? 112 : 96;
  if (optionalSize < minimum)
    throw new BinaryError("Cabeçalho opcional incompleto.");
  const machine = u16(coff),
    imageBase = is64 ? u64(optional + 24) : BigInt(u32(optional + 28)),
    entrypointRva = u32(optional + 16),
    headersSize = u32(optional + 60);
  const fields: BinaryField[] = [
    {
      name: "e_magic",
      offset: 0,
      size: 2,
      value: "MZ",
      explanation: "Assinatura inicial do cabeçalho DOS.",
    },
    {
      name: "e_lfanew",
      offset: 0x3c,
      size: 4,
      value: h(nt),
      explanation: "Offset da assinatura PE no arquivo.",
    },
    {
      name: "Signature",
      offset: nt,
      size: 4,
      value: "PE\\0\\0",
      explanation: "Assinatura que antecede o cabeçalho COFF.",
    },
    {
      name: "Machine",
      offset: coff,
      size: 2,
      value: h(machine),
      explanation: "Arquitetura alvo do arquivo.",
    },
    {
      name: "NumberOfSections",
      offset: coff + 2,
      size: 2,
      value: String(sectionCount),
      explanation: "Quantidade de cabeçalhos de seções.",
    },
    {
      name: "TimeDateStamp",
      offset: coff + 4,
      size: 4,
      value: h(u32(coff + 4)),
      explanation: "Metadado que não comprova sozinho a data de compilação.",
    },
    {
      name: "SizeOfOptionalHeader",
      offset: coff + 16,
      size: 2,
      value: h(optionalSize),
      explanation: "Tamanho do cabeçalho opcional.",
    },
    {
      name: "Characteristics",
      offset: coff + 18,
      size: 2,
      value: h(u16(coff + 18)),
      explanation: "Máscara de características COFF.",
    },
    {
      name: "Magic",
      offset: optional,
      size: 2,
      value: h(magic),
      explanation: is64 ? "PE32+" : "PE32",
    },
    {
      name: "AddressOfEntryPoint",
      offset: optional + 16,
      size: 4,
      value: h(entrypointRva),
      explanation: "RVA do ponto de entrada.",
    },
    {
      name: "ImageBase",
      offset: optional + (is64 ? 24 : 28),
      size: is64 ? 8 : 4,
      value: h(imageBase),
      explanation: "Base preferencial da imagem; a base efetiva pode mudar.",
    },
    {
      name: "SectionAlignment",
      offset: optional + 32,
      size: 4,
      value: h(u32(optional + 32)),
      explanation: "Alinhamento das seções em memória.",
    },
    {
      name: "FileAlignment",
      offset: optional + 36,
      size: 4,
      value: h(u32(optional + 36)),
      explanation: "Alinhamento dos dados das seções no arquivo.",
    },
    {
      name: "Subsystem",
      offset: optional + 68,
      size: 2,
      value: h(u16(optional + 68)),
      explanation: "Subsistema solicitado pela imagem.",
    },
    {
      name: "DllCharacteristics",
      offset: optional + 70,
      size: 2,
      value: h(u16(optional + 70)),
      explanation: "Inclui DYNAMIC_BASE (0x40) e NX_COMPAT (0x100).",
    },
  ];
  const sections: PeSection[] = [];
  const table = optional + optionalSize;
  bounds(table, sectionCount * 40);
  for (let index = 0; index < sectionCount; index++) {
    const at = table + index * 40;
    const name = new TextDecoder("ascii")
      .decode(bytes.slice(at, at + 8))
      .replace(/\0.*$/, "");
    const flags = u32(at + 36);
    const section = {
      name,
      virtualSize: u32(at + 8),
      rva: u32(at + 12),
      rawSize: u32(at + 16),
      offset: u32(at + 20),
      characteristics: flags,
      permissions: `${flags & 0x40000000 ? "R" : "—"}${flags & 0x80000000 ? "W" : "—"}${flags & 0x20000000 ? "X" : "—"}`,
    };
    if (section.rawSize) bounds(section.offset, section.rawSize);
    sections.push(section);
  }
  const offsetOf = (rva: number): number => {
    if (rva < headersSize) {
      bounds(rva, 1);
      return rva;
    }
    const section = sections.find(
      (item) =>
        rva >= item.rva &&
        rva - item.rva < Math.max(item.virtualSize, item.rawSize),
    );
    if (!section || rva - section.rva >= section.rawSize)
      throw new BinaryError(
        `RVA ${h(rva)} não possui bytes correspondentes no arquivo.`,
      );
    const offset = section.offset + rva - section.rva;
    bounds(offset, 1);
    return offset;
  };
  const directoryCount = Math.min(
    u32(optional + (is64 ? 108 : 92)),
    16,
    Math.floor((optionalSize - minimum) / 8),
  );
  const directory = (index: number) =>
    index < directoryCount
      ? {
          rva: u32(optional + minimum + index * 8),
          size: u32(optional + minimum + index * 8 + 4),
        }
      : { rva: 0, size: 0 };
  const imports: PeImport[] = [];
  const importDir = directory(1);
  if (importDir.rva && importDir.size) {
    let descriptor = offsetOf(importDir.rva);
    const max = Math.min(256, Math.floor(importDir.size / 20));
    for (let index = 0; index < max; index++, descriptor += 20) {
      bounds(descriptor, 20);
      const lookup = u32(descriptor) || u32(descriptor + 16),
        nameRva = u32(descriptor + 12);
      if (!lookup && !nameRva) break;
      if (!lookup || !nameRva)
        throw new BinaryError("Descritor de importação incompleto.");
      const functions: PeImport["functions"] = [];
      let item = offsetOf(lookup);
      for (let count = 0; count < 512; count++, item += is64 ? 8 : 4) {
        const value = is64 ? u64(item) : BigInt(u32(item));
        if (!value) break;
        const byOrdinal = (value & (1n << BigInt(is64 ? 63 : 31))) !== 0n;
        if (byOrdinal)
          functions.push({
            name: `ordinal ${value & 0xffffn}`,
            ordinal: Number(value & 0xffffn),
            rva: 0,
          });
        else {
          if (value > 0xffffffffn)
            throw new BinaryError("RVA de nome inválido.");
          const rva = Number(value);
          functions.push({
            name: string(offsetOf(rva) + 2),
            ordinal: null,
            rva,
          });
        }
      }
      imports.push({ dll: string(offsetOf(nameRva)), functions });
    }
  }
  const exports: PeImage["exports"] = [];
  const exportDir = directory(0);
  if (exportDir.rva && exportDir.size) {
    const at = offsetOf(exportDir.rva);
    bounds(at, 40);
    const count = u32(at + 24);
    if (count > 4096) throw new BinaryError("Tabela de exports grande demais.");
    const funcs = offsetOf(u32(at + 28)),
      names = offsetOf(u32(at + 32)),
      ordinals = offsetOf(u32(at + 36));
    for (let index = 0; index < count; index++) {
      const ordinal = u16(ordinals + index * 2);
      exports.push({
        name: string(offsetOf(u32(names + index * 4))),
        rva: u32(funcs + ordinal * 4),
      });
    }
  }
  return {
    architecture:
      (
        { [0x8664]: "x86-64", [0x14c]: "x86-32", [0xaa64]: "ARM64" } as Record<
          number,
          string
        >
      )[machine] ?? h(machine),
    headersSize,
    is64,
    imageBase: h(imageBase),
    entrypointRva,
    entrypointVa: h(imageBase + BigInt(entrypointRva)),
    fields,
    sections,
    imports,
    exports,
    bytes,
  };
}
export function rvaToOffset(image: PeImage, rva: number): number | null {
  if (!Number.isSafeInteger(rva) || rva < 0) return null;
  if (rva < image.headersSize && rva < image.bytes.length) return rva;
  const section = image.sections.find(
    (item) =>
      rva >= item.rva &&
      rva < item.rva + Math.max(item.virtualSize, item.rawSize),
  );
  return section &&
    rva - section.rva < section.rawSize &&
    section.offset + rva - section.rva < image.bytes.length
    ? section.offset + rva - section.rva
    : null;
}
