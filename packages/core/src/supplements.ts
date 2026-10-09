export const supplements = [
  {
    id: "camadas-do-software",
    title: "O software em três perspectivas",
    label: "Anatomia interativa",
    minutes: 12,
    concept: "CPU · memória · executável",
    description:
      "Conecte o que está no arquivo, o que existe na memória e o que a CPU executa.",
    objective:
      "Distinguir a organização de um executável, sua representação em memória e o estado da CPU.",
    steps: [
      "Selecione Executável e identifique as três seções do exemplo.",
      "Mude para Memória e observe a representação little-endian do valor 8.",
      "Selecione CPU: a instrução ADD transforma RAX de 5 em 8.",
      "Agrupe as camadas e gire o modelo. São perspectivas lógicas do mesmo programa, não uma disposição física do hardware.",
    ],
    takeaway:
      "Arquivo, memória e CPU estão relacionados, mas usam representações e endereços diferentes. O modelo 3D ajuda a conectar essas perspectivas; não representa dimensões ou posições físicas.",
    question: "Qual camada descreve RAX e os efeitos de ADD?",
    choices: ["CPU", "Cabeçalho DOS", "Tabela de importações"],
    sources: [
      {
        title: "Intel — manuais de arquitetura",
        url: "https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html",
      },
      {
        title: "Microsoft — formato PE",
        url: "https://learn.microsoft.com/en-us/windows/win32/debug/pe-format",
      },
    ],
  },
  {
    id: "fluxo-de-controle",
    title: "A decisão está nas flags",
    label: "Fluxo de controle",
    minutes: 18,
    concept: "CMP · JG · JA · ZF · CF",
    description:
      "Veja por que os mesmos bits podem levar a caminhos diferentes em uma comparação.",
    objective:
      "Relacionar CMP e as flags à escolha de um salto com ou sem sinal.",
    steps: [
      "Use A = -1 e B = 1. Os operandos são inteiros de 8 bits.",
      "Execute CMP. AL e BL não mudam; as flags registram a subtração.",
      "Com sinal, -1 não é maior que 1: JG não desvia.",
      "Mude para sem sinal. Os bits 11111111 representam 255: JA desvia.",
      "Experimente valores iguais e observe a flag ZF.",
    ],
    takeaway:
      "CMP calcula flags de A − B sem guardar a diferença. JG interpreta os operandos com sinal (ZF = 0 e SF = OF). JA usa a comparação sem sinal (CF = 0 e ZF = 0).",
    question:
      "Após CMP AL, BL, com AL = 0xFF e BL = 0x01, qual salto é tomado?",
    choices: [
      "JA, na comparação sem sinal",
      "JG, na comparação com sinal",
      "JE, porque os valores são iguais",
    ],
    sources: [
      {
        title: "Intel — referência de instruções, volume 2",
        url: "https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html",
      },
    ],
  },
  {
    id: "ponto-flutuante",
    title: "Por dentro de um float",
    label: "IEEE 754 · binary32",
    minutes: 20,
    concept: "Sinal · expoente · fração",
    description:
      "Manipule os 32 bits de um número e observe arredondamento, subnormais, infinito e NaN.",
    objective:
      "Decompor binary32 e reconhecer quando o valor decimal não é exatamente representável.",
    steps: [
      "Digite 0.1 e compare a entrada decimal com o valor armazenado.",
      "Selecione o bit 31 para trocar o sinal, preservando expoente e fração.",
      "Carregue o menor subnormal: expoente zero e fração igual a 1.",
      "Compare +0 e -0. O sinal é diferente, mesmo quando ambos comparam como zero.",
      "Carregue infinito e NaN e observe expoente 255 e a fração.",
    ],
    takeaway:
      "Binary32 usa 1 bit de sinal, 8 de expoente e 23 de fração. Números normais têm um 1 implícito; subnormais usam 0 e expoente efetivo −126. Expoente 255 é reservado a infinito e NaN.",
    question:
      "Qual é a quantidade de bits armazenados no campo fração de binary32?",
    choices: ["23 bits", "24 bits", "32 bits"],
    sources: [
      {
        title: "Oracle — IEEE Arithmetic e formato single",
        url: "https://docs.oracle.com/cd/E19957-01/806-3568/ncg_math.html",
      },
      {
        title: "MDN — DataView.setFloat32",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView/setFloat32",
      },
    ],
  },
  {
    id: "ordem-dos-bytes",
    title: "O endereço não conta tudo",
    label: "Little-endian / big-endian",
    minutes: 10,
    concept: "Offset · significância · uint32",
    description:
      "Reconstrua um inteiro a partir dos bytes e descubra a importância da ordem.",
    objective:
      "Diferenciar o endereço do byte e seu peso na representação de um inteiro.",
    steps: [
      "Selecione little-endian e observe 78 no menor endereço.",
      "Selecione big-endian: 12 passa a ocupar o menor endereço.",
      "Clique em cada byte e compare offset, hexadecimal e binário.",
      "O número representado continua 0x12345678: muda a convenção de armazenamento.",
    ],
    takeaway:
      "Endianness ordena os bytes de um valor multibyte. Não inverte os bits dentro de um byte. Para interpretar corretamente um dump, você precisa conhecer a largura e a ordem usadas.",
    question: "Em little-endian, qual é o primeiro byte de 0x12345678?",
    choices: ["0x78", "0x12", "0x87"],
    sources: [
      {
        title: "MDN — leitura e escrita com DataView",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView",
      },
    ],
  },
] as const;
export type SupplementId = (typeof supplements)[number]["id"];
