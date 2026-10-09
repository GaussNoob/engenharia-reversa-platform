export type CompletionDialect = "python" | "c" | "cpp" | "assembly" | "fasm";
export type CodeSuggestion = {
  label: string;
  kind:
    | "keyword"
    | "function"
    | "variable"
    | "type"
    | "constant"
    | "module"
    | "snippet"
    | "property";
  detail: string;
  description: string;
  insert?: string;
  parameters?: string[];
};
const words = (
  source: string,
  kind: CodeSuggestion["kind"],
  detail: string,
): CodeSuggestion[] =>
  source
    .split(" ")
    .map((label) => ({ label, kind, detail, description: detail }));
const fn = (
  label: string,
  parameters: string[],
  description: string,
  insert?: string,
): CodeSuggestion => ({
  label,
  kind: "function",
  parameters,
  detail: `${label}(${parameters.join(", ")})`,
  description,
  insert:
    insert ??
    `${label}(${parameters.map((parameter, index) => "${" + (index + 1) + ":" + parameter.replace(/[^\w]/g, "").replace(/^\.\.\./, "") + "}").join(", ")})`,
});
export const pythonModules: Record<string, CodeSuggestion[]> = {
  struct: [
    fn(
      "pack",
      ["format", "values"],
      "Empacota valores em bytes segundo um formato.",
      'pack("${1:<I}", ${2:valor})',
    ),
    fn(
      "unpack",
      ["format", "buffer"],
      "Lê valores de um buffer de bytes.",
      'unpack("${1:<I}", ${2:dados})',
    ),
    fn(
      "unpack_from",
      ["format", "buffer", "offset"],
      "Lê um valor a partir de um offset no buffer.",
    ),
    fn("calcsize", ["format"], "Quantidade de bytes que o formato ocupa."),
  ],
  math: [
    ...words("pi e tau inf nan", "constant", "Constante de math"),
    ...["sqrt", "floor", "ceil", "trunc", "isnan", "isinf", "log2", "fabs"].map(
      (name) => fn(name, ["x"], "Função da biblioteca matemática."),
    ),
  ],
  binascii: [
    fn("hexlify", ["data"], "Converte bytes para a representação hexadecimal."),
    fn("unhexlify", ["hexstr"], "Converte hexadecimal para bytes."),
    fn("crc32", ["data"], "Calcula o checksum CRC-32 dos bytes."),
  ],
  json: [
    fn("loads", ["text"], "Decodifica uma string JSON."),
    fn("dumps", ["value"], "Serializa um valor como JSON."),
  ],
  sys: words(
    "argv byteorder version maxsize stdin stdout stderr",
    "property",
    "Informações e streams do interpretador",
  ),
  pathlib: [
    fn("Path", ["path"], "Representa um caminho no filesystem efêmero."),
  ],
  base64: [
    fn("b64encode", ["data"], "Codifica bytes em base64."),
    fn("b64decode", ["data"], "Decodifica base64 em bytes."),
  ],
  itertools: [
    fn("chain", ["iterables"], "Itera sobre sequências consecutivas."),
    fn("product", ["iterables"], "Produto cartesiano dos iteráveis."),
  ],
  codecs: [
    fn("encode", ["value", "encoding"], "Codifica um valor."),
    fn("decode", ["value", "encoding"], "Decodifica um valor."),
  ],
  array: [
    fn(
      "array",
      ["typecode", "initializer"],
      "Sequência de valores básicos com tipo definido.",
    ),
  ],
  typing: words(
    "Any Optional Union Iterable Iterator List Dict Tuple Callable",
    "type",
    "Anotação de tipo Python",
  ),
};
export const pythonMembers: Record<string, CodeSuggestion[]> = {
  str: [
    fn(
      "encode",
      ["encoding"],
      "Codifica a string como bytes.",
      'encode("${1:utf-8}")',
    ),
    fn("split", ["separator"], "Divide a string em partes."),
    fn("strip", [], "Remove espaços das extremidades."),
    fn("replace", ["old", "new"], "Substitui ocorrências de uma substring."),
    fn("startswith", ["prefix"], "Verifica o prefixo."),
    fn("upper", [], "Converte para maiúsculas."),
    fn("lower", [], "Converte para minúsculas."),
  ],
  bytes: [
    fn("hex", [], "Representação hexadecimal dos bytes."),
    fn(
      "decode",
      ["encoding"],
      "Decodifica bytes em texto.",
      'decode("${1:utf-8}")',
    ),
    fn("fromhex", ["text"], "Cria bytes de uma string hexadecimal."),
    fn("find", ["sub"], "Offset da sequência procurada."),
  ],
  int: [
    fn(
      "to_bytes",
      ["length", "byteorder"],
      "Converte o inteiro em bytes.",
      'to_bytes(${1:4}, "${2:little}")',
    ),
    fn(
      "from_bytes",
      ["bytes", "byteorder"],
      "Lê um inteiro da sequência de bytes.",
      'from_bytes(${1:dados}, "${2:little}")',
    ),
    fn("bit_length", [], "Número de bits necessários para a magnitude."),
    fn("bit_count", [], "Quantidade de bits iguais a 1 na magnitude."),
  ],
  list: [
    fn("append", ["value"], "Acrescenta um elemento ao final."),
    fn("pop", [], "Remove e retorna o último elemento."),
    fn("extend", ["iterable"], "Acrescenta elementos de um iterável."),
    fn("reverse", [], "Inverte os elementos no lugar."),
  ],
  dict: [
    fn(
      "get",
      ["key", "default"],
      "Obtém um valor com alternativa para chave ausente.",
    ),
    fn("keys", [], "Visão das chaves."),
    fn("values", [], "Visão dos valores."),
    fn("items", [], "Visão dos pares chave/valor."),
  ],
};
const python: CodeSuggestion[] = [
  ...words(
    "False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case",
    "keyword",
    "Palavra-chave Python",
  ),
  fn("print", ["value"], "Escreve um valor no terminal."),
  fn("len", ["object"], "Quantidade de itens do objeto."),
  fn("range", ["stop"], "Sequência de inteiros para iteração."),
  fn("int", ["value"], "Converte um valor em inteiro."),
  fn("float", ["value"], "Converte um valor em ponto flutuante."),
  fn("str", ["value"], "Converte um valor em string."),
  fn("hex", ["number"], "Representação hexadecimal de um inteiro."),
  fn("bin", ["number"], "Representação binária de um inteiro."),
  fn("ord", ["character"], "Ponto de código Unicode do caractere."),
  fn("chr", ["codepoint"], "Caractere de um ponto de código Unicode."),
  fn("bytes", ["source"], "Sequência imutável de bytes."),
  fn("bytearray", ["source"], "Sequência mutável de bytes."),
  fn("enumerate", ["iterable"], "Pares índice/valor de um iterável."),
  fn("zip", ["iterables"], "Agrupa elementos de iteráveis."),
  fn(
    "open",
    ["file", "mode"],
    "Abre um arquivo no filesystem efêmero.",
    'open(${1:path}, "${2:rb}")',
  ),
  fn("isinstance", ["object", "classinfo"], "Verifica o tipo de um objeto."),
  fn("sum", ["iterable"], "Soma os elementos."),
  fn("sorted", ["iterable"], "Retorna uma lista ordenada."),
  ...words(
    "abs all any bool dict divmod filter format list map max min next oct pow repr reversed round set slice tuple type",
    "function",
    "Função embutida do Python",
  ),
  ...Object.keys(pythonModules).map((label) => ({
    label,
    kind: "module" as const,
    detail: "Biblioteca padrão",
    description: `Módulo ${label} da biblioteca padrão do Python.`,
  })),
  {
    label: "def",
    kind: "snippet",
    detail: "Definir função",
    description: "Função com parâmetros e retorno.",
    insert: "def ${1:nome}(${2:valor}):\n\treturn ${3:valor}\n${0}",
  },
  {
    label: "for",
    kind: "snippet",
    detail: "Iterar com range",
    description: "Laço sobre uma sequência de inteiros.",
    insert: "for ${1:i} in range(${2:10}):\n\t${0:print(i)}",
  },
  {
    label: "if",
    kind: "snippet",
    detail: "Condição",
    description: "Executa o bloco quando a condição é verdadeira.",
    insert: "if ${1:condicao}:\n\t${0:pass}",
  },
];
const c: CodeSuggestion[] = [
  ...words(
    "auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while _Bool _Alignof _Static_assert",
    "keyword",
    "Palavra-chave C",
  ),
  ...words(
    "size_t ptrdiff_t int8_t int16_t int32_t int64_t uint8_t uint16_t uint32_t uint64_t FILE",
    "type",
    "Tipo da biblioteca padrão; inclua o header correspondente",
  ),
  ...words(
    "NULL EOF EXIT_SUCCESS EXIT_FAILURE",
    "constant",
    "Constante da biblioteca C",
  ),
  fn(
    "printf",
    ["format", "values"],
    "Escreve saída formatada. Header: <stdio.h>.",
    'printf("${1:%d}\\n", ${2:valor});',
  ),
  fn(
    "puts",
    ["text"],
    "Escreve uma string e uma quebra de linha. Header: <stdio.h>.",
  ),
  fn("putchar", ["character"], "Escreve um caractere. Header: <stdio.h>."),
  fn(
    "snprintf",
    ["buffer", "size", "format", "values"],
    "Formata respeitando o tamanho do buffer. Header: <stdio.h>.",
  ),
  fn(
    "malloc",
    ["size"],
    "Aloca memória; verifique o retorno e libere com free. Header: <stdlib.h>.",
  ),
  fn(
    "calloc",
    ["count", "size"],
    "Aloca e zera a memória. Header: <stdlib.h>.",
  ),
  fn(
    "realloc",
    ["pointer", "size"],
    "Altera o tamanho de uma alocação. Header: <stdlib.h>.",
  ),
  fn("free", ["pointer"], "Libera uma alocação. Header: <stdlib.h>."),
  fn(
    "strlen",
    ["text"],
    "Comprimento da string até o primeiro byte nulo. Header: <string.h>.",
  ),
  fn("strcmp", ["left", "right"], "Compara duas strings. Header: <string.h>."),
  fn(
    "memcpy",
    ["destination", "source", "size"],
    "Copia bytes; os intervalos não podem se sobrepor. Header: <string.h>.",
  ),
  fn(
    "memmove",
    ["destination", "source", "size"],
    "Copia bytes permitindo sobreposição. Header: <string.h>.",
  ),
  fn(
    "memset",
    ["destination", "byte", "size"],
    "Preenche a região com um byte. Header: <string.h>.",
  ),
  fn(
    "memcmp",
    ["left", "right", "size"],
    "Compara uma quantidade de bytes. Header: <string.h>.",
  ),
  fn("fopen", ["path", "mode"], "Abre um arquivo. Header: <stdio.h>."),
  fn("fclose", ["file"], "Fecha um arquivo. Header: <stdio.h>."),
  fn(
    "fread",
    ["buffer", "size", "count", "file"],
    "Lê dados do arquivo. Header: <stdio.h>.",
  ),
  fn(
    "fwrite",
    ["buffer", "size", "count", "file"],
    "Escreve dados no arquivo. Header: <stdio.h>.",
  ),
  {
    label: "main",
    kind: "snippet",
    detail: "Programa C completo",
    description: "Ponto de entrada com a biblioteca de entrada e saída.",
    insert: "#include <stdio.h>\n\nint main(void) {\n\t${0}\n\treturn 0;\n}",
  },
  {
    label: "for",
    kind: "snippet",
    detail: "Laço contado",
    description: "Repete um bloco com um índice.",
    insert: "for (int ${1:i} = 0; ${1:i} < ${2:10}; ${1:i}++) {\n\t${0}\n}",
  },
  {
    label: "if",
    kind: "snippet",
    detail: "Bloco condicional",
    description: "Executa o bloco se a condição for verdadeira.",
    insert: "if (${1:condicao}) {\n\t${0}\n}",
  },
];
export const cppStandard = [
  ...words(
    "cout cerr cin endl hex dec boolalpha",
    "variable",
    "Stream ou manipulador da biblioteca C++",
  ),
  {
    label: "vector",
    kind: "type" as const,
    detail: "std::vector<T>",
    description: "Sequência dinâmica. Header: <vector>.",
    insert: "vector<${1:int}>",
  },
  {
    label: "string",
    kind: "type" as const,
    detail: "std::string",
    description: "String da biblioteca padrão. Header: <string>.",
  },
  ...words(
    "array unique_ptr shared_ptr span string_view uint8_t uint32_t uint64_t size_t",
    "type",
    "Tipo da biblioteca padrão C++",
  ),
  fn(
    "make_unique",
    ["arguments"],
    "Cria um objeto gerenciado por unique_ptr. Header: <memory>.",
    "make_unique<${1:Tipo}>(${2})",
  ),
  fn("move", ["value"], "Permite mover recursos do objeto. Header: <utility>."),
  fn("sort", ["begin", "end"], "Ordena um intervalo. Header: <algorithm>."),
];
const windows = [
  fn(
    "MessageBoxW",
    ["hWnd", "lpText", "lpCaption", "uType"],
    "Mostra uma caixa de mensagem Unicode. Header: <windows.h>.",
    'MessageBoxW(nullptr, L"${1:Mensagem}", L"${2:Nucleo}", MB_OK);',
  ),
  fn(
    "CreateFileW",
    [
      "lpFileName",
      "dwDesiredAccess",
      "dwShareMode",
      "lpSecurityAttributes",
      "dwCreationDisposition",
      "dwFlagsAndAttributes",
      "hTemplateFile",
    ],
    "Abre ou cria um arquivo e retorna um HANDLE. Header: <windows.h>.",
  ),
  fn(
    "ReadFile",
    [
      "hFile",
      "lpBuffer",
      "nNumberOfBytesToRead",
      "lpNumberOfBytesRead",
      "lpOverlapped",
    ],
    "Lê bytes de um handle. Header: <windows.h>.",
  ),
  fn(
    "WriteFile",
    [
      "hFile",
      "lpBuffer",
      "nNumberOfBytesToWrite",
      "lpNumberOfBytesWritten",
      "lpOverlapped",
    ],
    "Escreve bytes em um handle. Header: <windows.h>.",
  ),
  fn(
    "CloseHandle",
    ["hObject"],
    "Libera o handle do objeto. Header: <windows.h>.",
  ),
  fn(
    "GetLastError",
    [],
    "Código de erro da thread atual. Header: <windows.h>.",
  ),
  fn("GetModuleHandleW", ["lpModuleName"], "Handle de um módulo já carregado."),
  fn(
    "GetProcAddress",
    ["hModule", "lpProcName"],
    "Endereço de uma função exportada.",
  ),
  fn("RegCloseKey", ["hKey"], "Fecha uma chave do registro."),
  ...words(
    "HANDLE DWORD WORD BYTE BOOL WCHAR LPVOID LPCWSTR HKEY",
    "type",
    "Tipo da Windows API",
  ),
  ...words(
    "MB_OK MB_OKCANCEL MB_YESNO GENERIC_READ GENERIC_WRITE OPEN_EXISTING CREATE_ALWAYS FILE_ATTRIBUTE_NORMAL INVALID_HANDLE_VALUE TRUE FALSE",
    "constant",
    "Constante da Windows API",
  ),
];
const instructions: Record<string, string> = {
  mov: "Copia origem para destino. Preserva as flags.",
  lea: "Calcula um endereço efetivo sem ler seu conteúdo.",
  add: "Soma ao destino e atualiza as flags aritméticas.",
  sub: "Subtrai do destino e atualiza as flags.",
  inc: "Incrementa em 1; preserva CF.",
  dec: "Decrementa em 1; preserva CF.",
  mul: "Multiplicação sem sinal; o resultado usa largura dupla.",
  imul: "Multiplicação com sinal.",
  div: "Divisão sem sinal; divide o dividendo de largura dupla.",
  idiv: "Divisão com sinal.",
  and: "AND bit a bit.",
  or: "OR bit a bit.",
  xor: "XOR bit a bit.",
  not: "Inverte os bits e preserva as flags.",
  shl: "Desloca bits à esquerda.",
  shr: "Desloca bits à direita, inserindo zeros.",
  sar: "Desloca à direita preservando o sinal.",
  rol: "Rotaciona os bits à esquerda.",
  ror: "Rotaciona os bits à direita.",
  cmp: "Calcula as flags de uma subtração sem armazenar o resultado.",
  test: "Calcula as flags de um AND sem armazenar o resultado.",
  jmp: "Desvio incondicional.",
  je: "Desvia quando ZF = 1.",
  jne: "Desvia quando ZF = 0.",
  jz: "Desvia quando ZF = 1.",
  jnz: "Desvia quando ZF = 0.",
  jg: "Maior, com sinal: ZF = 0 e SF = OF.",
  jge: "Maior ou igual, com sinal: SF = OF.",
  jl: "Menor, com sinal: SF ≠ OF.",
  jle: "Menor ou igual, com sinal: ZF = 1 ou SF ≠ OF.",
  ja: "Acima, sem sinal: CF = 0 e ZF = 0.",
  jae: "Acima ou igual, sem sinal: CF = 0.",
  jb: "Abaixo, sem sinal: CF = 1.",
  jbe: "Abaixo ou igual, sem sinal: CF = 1 ou ZF = 1.",
  call: "Salva o endereço de retorno e transfere o fluxo.",
  ret: "Retorna para o endereço na stack.",
  push: "Empilha um valor e ajusta SP.",
  pop: "Desempilha um valor e ajusta SP.",
  nop: "Não altera registradores nem flags.",
  xchg: "Troca os valores de dois operandos.",
  neg: "Calcula o complemento de dois.",
};
export const assemblyInstructions = Object.keys(instructions);
export const registers =
  "rax rbx rcx rdx rsp rbp rsi rdi rip r8 r9 r10 r11 r12 r13 r14 r15 eax ebx ecx edx esp ebp esi edi ax bx cx dx sp bp si di al ah bl bh cl ch dl dh spl bpl sil dil r8d r9d r10d r11d r12d r13d r14d r15d r8w r9w r10w r11w r12w r13w r14w r15w r8b r9b r10b r11b r12b r13b r14b r15b".split(
    " ",
  );
const assembly = Object.entries(instructions).map(
  ([label, description]): CodeSuggestion => ({
    label,
    kind: "keyword",
    detail: "Instrução x86",
    description,
  }),
);
const fasm = [
  ...assembly,
  ...words(
    "format entry section segment readable writeable executable import library include macro endm match rept times db dw dd dq rb rw rd rq equ use32 use64",
    "keyword",
    "Diretiva FASM",
  ),
  {
    label: "format",
    kind: "snippet" as const,
    detail: "Executável PE64",
    description: "Declara o formato PE para Windows x64.",
    insert:
      "format PE64 GUI\nentry ${1:start}\n\nsection '.text' code readable executable\n${1:start}:\n\t${0:ret}",
  },
  {
    label: "section",
    kind: "snippet" as const,
    detail: "Seção do executável",
    description: "Declara uma seção com permissões.",
    insert: "section '.${1:data}' data readable writeable\n${0}",
  },
];
export const cHeaders = [
  "stdio.h",
  "stdlib.h",
  "stdint.h",
  "stddef.h",
  "string.h",
  "stdbool.h",
  "limits.h",
  "math.h",
  "inttypes.h",
];
export const cppHeaders = [
  ...cHeaders,
  "windows.h",
  "iostream",
  "vector",
  "string",
  "array",
  "memory",
  "algorithm",
  "utility",
  "cstdint",
  "cstring",
  "cstdio",
];
export const completionCatalog: Record<CompletionDialect, CodeSuggestion[]> = {
  python,
  c,
  cpp: [
    ...c.filter((item) => !(item.kind === "snippet" && item.label === "main")),
    ...windows,
    ...words(
      "alignas alignof bool catch class constexpr consteval decltype delete explicit false friend namespace new noexcept nullptr operator private protected public static_assert template this throw true try typename using virtual",
      "keyword",
      "Palavra-chave C++",
    ),
    {
      label: "std",
      kind: "module",
      detail: "Biblioteca padrão C++",
      description: "Namespace da biblioteca padrão.",
    },
    {
      label: "main",
      kind: "snippet",
      detail: "Programa C++ completo",
      description: "Programa com saída padrão.",
      insert:
        '#include <iostream>\n\nint main() {\n\tstd::cout << "${1:Olá}" << std::endl;\n\treturn 0;\n}\n${0}',
    },
  ],
  assembly,
  fasm,
};
