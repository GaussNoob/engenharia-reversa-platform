export const softwareLayers = [
  {
    id: "cpu",
    label: "CPU",
    title: "ADD soma 3 ao que já estava em RAX.",
    subtitle: "Execução",
    code: "ADD RAX, 3",
    detail:
      "RAX tinha 5 e passa a ter 8. As flags são atualizadas conforme o resultado da soma.",
    href: "/playground/assembly",
    action: "Avançar uma instrução",
    address: "RAX  0x0000000000000008",
  },
  {
    id: "memory",
    label: "Memória",
    title: "Cada valor tem um endereço.",
    subtitle: "Representação",
    code: "08 00 00 00",
    detail:
      "O inteiro de 32 bits 8 ocupa quatro bytes. Em little-endian, o byte menos significativo fica no menor endereço.",
    href: "/playground/memory",
    action: "Explorar a memória",
    address: "DWORD  0x00000008",
  },
  {
    id: "binary",
    label: "Executável",
    title: "O executável é dividido em seções.",
    subtitle: "Organização",
    code: ".text  .data  .idata",
    detail:
      "No PE de exemplo, o código, os dados e a lista de funções importadas ficam em seções separadas. Ao abrir o programa, o Windows copia cada uma para a memória.",
    href: "/playground/pe",
    action: "Inspecionar um executável",
    address: "PE32+  ·  AMD64",
  },
] as const;
export type LayerIndex = 0 | 1 | 2;

// A small, intentional memory sample: uint32(8), followed by "NUCLEO\0".
export const memorySample = [
  8,
  0,
  0,
  0,
  0x4e,
  0x55,
  0x43,
  0x4c,
  0x45,
  0x4f,
  ...Array<number>(22).fill(0),
];
export const memoryBase = 0x00402000;
export const layerComponents = [
  [
    {
      label: "ALU",
      value: "5 + 3 = 8",
      detail:
        "A unidade lógica e aritmética calcula o resultado de ADD. Aqui, os operandos são 5 e 3.",
    },
    {
      label: "RAX",
      value: "0x0000000000000008",
      detail:
        "O registrador RAX recebe o resultado. Antes da instrução, seu valor era 5.",
    },
    {
      label: "Flags",
      value: "ZF 0 · SF 0 · CF 0 · OF 0",
      detail:
        "O resultado é positivo e diferente de zero; esta soma não gera carry nem overflow com sinal.",
    },
    {
      label: "RIP",
      value: "Próxima instrução",
      detail:
        "O ponteiro de instrução avança para a instrução seguinte. A distância depende de quantos bytes codificam a instrução atual.",
    },
  ],
  memorySample.map((value, index) => ({
    label: `+${index.toString(16).padStart(2, "0").toUpperCase()}`,
    value: `0x${(memoryBase + index).toString(16).padStart(8, "0").toUpperCase()} → ${value.toString(16).padStart(2, "0").toUpperCase()}`,
    detail:
      index < 4
        ? `Byte ${index + 1} do inteiro de 32 bits 8. Os quatro bytes são 08 00 00 00, armazenados em little-endian.`
        : index < 10
          ? `Byte da string ASCII NUCLEO: "${String.fromCharCode(value)}" é ${value} em decimal, ou 0x${value.toString(16).toUpperCase()}.`
          : index === 10
            ? "O byte nulo marca o fim da string ASCII NUCLEO."
            : "Byte zerado no restante desta amostra de memória. Cada posição possui um endereço próprio.",
  })),
  [
    {
      label: ".text",
      value: "Código executável",
      detail:
        "Instruções de máquina. No arquivo PE de exemplo, esta seção tem permissões de leitura e execução.",
    },
    {
      label: ".data",
      value: "Dados do programa",
      detail:
        "Valores inicializados, como variáveis globais. O loader os copia para a imagem mapeada do programa.",
    },
    {
      label: ".idata",
      value: "Importações",
      detail:
        "Bibliotecas e funções externas usadas pelo programa. O loader resolve seus endereços e preenche a IAT.",
    },
  ],
];
