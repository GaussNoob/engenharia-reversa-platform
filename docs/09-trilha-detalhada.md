# Trilha detalhada e laboratórios

Proposta derivada do conteúdo real, com fontes e objetivos. As aulas e laboratórios abaixo ainda não estão implementados. Tempos são estimativas de estudo, não medições.

| Módulo | Aulas | Laboratórios | Duração estimada | Dificuldade |
| --- | ---: | ---: | ---: | --- |
| 01 · Introdução | 2 | 2 | 53 min | fundamentos |
| 02 · Números | 10 | 6 | 218 min | fundamentos |
| 03 · Cadeias de Texto | 6 | 2 | 113 min | fundamentos |
| 04 · Arquivos | 2 | 2 | 51 min | fundamentos |
| 05 · O formato PE | 10 | 6 | 211 min | intermediário |
| 06 · Execução de Programas | 6 | 3 | 99 min | intermediário |
| 07 · Windows API | 6 | 3 | 136 min | intermediário |
| 08 · Assembly | 15 | 7 | 291 min | intermediário |
| 09 · Depuração | 6 | 4 | 111 min | intermediário |

## 01 · Introdução

Explicar o processo de engenharia reversa e preparar um ambiente de estudo reproduzível.

| Aula | Objetivo | Fonte | Estudo estimado |
| --- | --- | --- | ---: |
| 01 · Introdução | Explicar como estrutura e comportamento permitem inferir a lógica de um programa e identificar áreas de aplicação. | [01-introducao/README.md · L1–58](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/01-introducao/README.md#L1-L58) | 11 min |
| 02 · Antes de começar | Preparar o ambiente e associar Python, Visual Studio, fasm, HxD, DIE e x64dbg às tarefas do curso. | [01-introducao/antes-de-comecar.md · L1–58](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/01-introducao/antes-de-comecar.md#L1-L58) | 12 min |

Laboratórios associados:

- **Primeiro resultado no Python** — Obter e explicar o resultado de uma expressão no REPL. Motor proposto: `python`.
- **Compilar e observar um programa C** — Compilar o programa inicial e conferir stdout e código de saída. Motor proposto: `c-portable`.

## 02 · Números

Interpretar números em bases diferentes e operar sobre bits de largura definida.

| Aula | Objetivo | Fonte | Estudo estimado |
| --- | --- | --- | ---: |
| 01 · Números | Relacionar estados binários, representação de quantidades e operações do processador. | [02-numeros/README.md · L1–13](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/02-numeros/README.md#L1-L13) | 8 min |
| 02 · Decimal, binário e octal | Converter a mesma quantidade entre decimal, binário e octal e reconhecer seus prefixos. | [02-numeros/sistemas-de-numeracao.md · L1–43](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/02-numeros/sistemas-de-numeracao.md#L1-L43) | 15 min |
| 03 · Hexadecimal e endereços | Converter hexadecimal em binário e relacionar dígitos, larguras e incrementos de endereços. | [02-numeros/sistemas-de-numeracao.md · L44–105](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/02-numeros/sistemas-de-numeracao.md#L44-L105) | 12 min |
| 04 · Construir um sistema de numeração | Construir um sistema posicional com símbolos próprios e conferir a contagem no exemplo ternário. | [02-numeros/sistemas-de-numeracao.md · L106–125](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/02-numeros/sistemas-de-numeracao.md#L106-L125) | 8 min |
| 05 · O Byte | Calcular faixas de valores de BYTE, WORD, DWORD e QWORD e distinguir quantidade de representação. | [02-numeros/o-byte.md · L1–17](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/02-numeros/o-byte.md#L1-L17) | 8 min |
| 06 · Números Negativos | Calcular complemento de dois em largura definida e interpretar o mesmo padrão com e sem sinal. | [02-numeros/numeros-negativos.md · L1–47](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/02-numeros/numeros-negativos.md#L1-L47) | 14 min |
| 07 · Conjunção e disjunção | Calcular AND e OR por tabelas verdade e demonstrar por que OR não equivale a soma. | [02-numeros/calculos-com-binarios.md · L1–84](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/02-numeros/calculos-com-binarios.md#L1-L84) | 16 min |
| 08 · XOR: diferenças, troca e reversibilidade | Aplicar XOR para detectar diferenças, zerar, trocar valores e recuperar um valor usando a mesma chave. | [02-numeros/calculos-com-binarios.md · L85–177](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/02-numeros/calculos-com-binarios.md#L85-L177) | 19 min |
| 09 · Deslocamentos e rotações | Distinguir deslocamento de rotação, declarar a largura e prever os bits que entram e saem. | [02-numeros/calculos-com-binarios.md · L178–245](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/02-numeros/calculos-com-binarios.md#L178-L245) | 20 min |
| 10 · Negação e largura dos dados | Calcular NOT em larguras finitas e explicar a diferença para o resultado inteiro da operação em Python. | [02-numeros/calculos-com-binarios.md · L246–270](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/02-numeros/calculos-com-binarios.md#L246-L270) | 8 min |

Laboratórios associados:

- **O mesmo número em quatro bases** — Representar o mesmo valor em binário, octal, decimal e hexadecimal. Motor proposto: `number-bench`.
- **Criar um alfabeto numérico** — Converter valores no sistema ternário descrito no livro e em um alfabeto escolhido. Motor proposto: `number-bench`.
- **Um byte, duas interpretações** — Demonstrar por que 0xF6 representa 246 sem sinal e -10 com sinal em oito bits. Motor proposto: `bit-bench`.
- **Operar sobre cada bit** — Reproduzir as tabelas AND e OR e separar disjunção de soma. Motor proposto: `bit-bench`.
- **Trocar e recuperar com XOR** — Reproduzir XOR-swap e a reversibilidade do exemplo com chave 0x42. Motor proposto: `python`.
- **Deslocar ou dar a volta** — Comparar SHL/SHR com ROL/ROR em largura definida e conferir 133 ROL 3. Motor proposto: `bit-bench`.

## 03 · Cadeias de Texto

Relacionar texto, code points, codificações e terminadores a sequências de bytes.

| Aula | Objetivo | Fonte | Estudo estimado |
| --- | --- | --- | ---: |
| 01 · Cadeias de Texto | Distinguir caractere, scan code, code point e sequência de bytes. | [03-cadeias-de-texto/README.md · L1–9](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/03-cadeias-de-texto/README.md#L1-L9) | 8 min |
| 02 · ASCII | Encontrar caracteres, controles e relações de maiúsculas e dígitos na ASCII e distinguir code pages. | [03-cadeias-de-texto/ascii.md · L1–69](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/03-cadeias-de-texto/ascii.md#L1-L69) | 15 min |
| 03 · Unicode e UTF-8 | Separar code point e codificação e comparar o número de caracteres e bytes dos exemplos UTF-8. | [03-cadeias-de-texto/unicode.md · L1–36](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/03-cadeias-de-texto/unicode.md#L1-L36) | 12 min |
| 04 · UTF-16, BOM e endianness | Identificar BOM, LE/BE, unidades de código e pares substitutos em strings UTF-16. | [03-cadeias-de-texto/unicode.md · L37–103](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/03-cadeias-de-texto/unicode.md#L37-L103) | 23 min |
| 05 · UTF-32 e representação de wide strings | Comparar UTF-32 LE/BE e compreender a dependência de wide strings em relação ao ambiente. | [03-cadeias-de-texto/unicode.md · L104–133](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/03-cadeias-de-texto/unicode.md#L104-L133) | 13 min |
| 06 · C Strings | Reconhecer terminadores nulos e construir buscas de strings em ASCII e UTF-16-LE. | [03-cadeias-de-texto/c-strings.md · L1–34](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/03-cadeias-de-texto/c-strings.md#L1-L34) | 12 min |

Laboratórios associados:

- **Texto visto como bytes** — Comparar UTF-8, UTF-16 LE/BE, UTF-32 e BOM nos exemplos originais. Motor proposto: `encoding`.
- **Encontrar o fim de uma string** — Localizar Erro e seu terminador em ASCII e UTF-16-LE. Motor proposto: `hex`.

## 04 · Arquivos

Inspecionar arquivos pelo conteúdo e localizar campos por offset.

| Aula | Objetivo | Fonte | Estudo estimado |
| --- | --- | --- | ---: |
| 01 · Arquivos | Separar conteúdo e metadados e inferir o tipo de arquivo pelos bytes em vez da extensão. | [04-arquivos/README.md · L1–28](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/04-arquivos/README.md#L1-L28) | 10 min |
| 02 · Formatos | Localizar bytes por offset e interpretar assinatura, largura e altura de um GIF em little-endian. | [04-arquivos/formatos.md · L1–55](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/04-arquivos/formatos.md#L1-L55) | 11 min |

Laboratórios associados:

- **Conteúdo e metadados** — Conferir os 19 bytes do texto e distinguir conteúdo, nome e extensão. Motor proposto: `hex`.
- **Ler um cabeçalho GIF** — Identificar GIF89a e interpretar largura e altura little-endian. Motor proposto: `hex`.

## 05 · O formato PE

Interpretar cabeçalhos PE, seções, importações e endereços sem executar o arquivo.

| Aula | Objetivo | Fonte | Estudo estimado |
| --- | --- | --- | ---: |
| 01 · O formato PE | Reconhecer as partes de um PE e o papel de compiladores, linker e loader na estrutura do arquivo. | [05-o-formato-pe/README.md · L1–13](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/README.md#L1-L13) | 8 min |
| 02 · Cabeçalhos | Relacionar tipos Microsoft a larguras fixas e interpretar máscaras de bits em estruturas binárias. | [05-o-formato-pe/cabecalhos/README.md · L1–14](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/cabecalhos/README.md#L1-L14) | 8 min |
| 03 · MS-DOS | Localizar MZ, e_lfanew, o stub DOS e a assinatura PE sem confundir valor com posição de um campo. | [05-o-formato-pe/cabecalhos/dos.md · L1–82](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/cabecalhos/dos.md#L1-L82) | 14 min |
| 04 · COFF | Ler os campos COFF, identificar a máquina alvo e interpretar as flags sem tomar timestamp como prova de origem. | [05-o-formato-pe/cabecalhos/coff.md · L1–101](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/cabecalhos/coff.md#L1-L101) | 17 min |
| 05 · Opcional | Distinguir PE32 e PE32+, localizar entrypoint e ImageBase e interpretar Subsystem e DllCharacteristics. | [05-o-formato-pe/cabecalhos/opcional.md · L1–76](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/cabecalhos/opcional.md#L1-L76) | 11 min |
| 06 · Diretórios de Dados | Reconhecer os diretórios de exports, imports, recursos, certificados, IAT e CLR e a natureza de seus endereços. | [05-o-formato-pe/cabecalhos/diretorios.md · L1–40](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/cabecalhos/diretorios.md#L1-L40) | 9 min |
| 07 · Cabeçalhos das Seções | Relacionar cada campo de IMAGE_SECTION_HEADER ao nome, tamanho, offset, RVA e permissões de uma seção. | [05-o-formato-pe/cabecalhos/cabecalhos-das-secoes.md · L1–59](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/cabecalhos/cabecalhos-das-secoes.md#L1-L59) | 11 min |
| 08 · Seções | Explicar .text, .data, .rdata e .idata e mapear seções em páginas com alinhamento e permissões. | [05-o-formato-pe/secoes.md · L1–83](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/secoes.md#L1-L83) | 16 min |
| 09 · Import Table | Percorrer IDT, ILT, Hint/Name e IAT e identificar DLL e função, incluindo importação por ordinal. | [05-o-formato-pe/import-table.md · L1–75](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/import-table.md#L1-L75) | 14 min |
| 10 · Endereçamento | Distinguir memória física e virtual, VA, RVA e offset e calcular o VA do entrypoint. | [05-o-formato-pe/enderecamento.md · L1–63](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/enderecamento.md#L1-L63) | 13 min |

Laboratórios associados:

- **Seguir MZ até PE** — Localizar e_magic e e_lfanew e seguir o offset até PE\0\0. Motor proposto: `pe`.
- **Identificar a máquina alvo** — Ler Machine, NumberOfSections, timestamp e Characteristics. Motor proposto: `pe`.
- **O ponto de entrada e suas flags** — Distinguir PE32/PE32+ e calcular o entrypoint com ImageBase. Motor proposto: `pe`.
- **Do disco para páginas de memória** — Mapear .text e .data com alinhamento e permissões sem sobreposição incorreta. Motor proposto: `memory`.
- **Seguir uma importação** — Percorrer IDT, ILT, Hint/Name e IAT, convertendo RVA para offset quando necessário. Motor proposto: `pe`.
- **Offset, RVA e VA** — Explicar a soma 0x1740 + 0x140000000 e fazer a conversão inversa. Motor proposto: `memory`.

## 06 · Execução de Programas

Explicar compilação, linkedição, carregamento, bibliotecas, processos e threads.

| Aula | Objetivo | Fonte | Estudo estimado |
| --- | --- | --- | ---: |
| 01 · Privilégios: usuário e kernel | Distinguir user mode, kernel mode e rings e explicar a mediação do sistema operacional. | [06-execucao-de-programas/README.md · L1–16](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/06-execucao-de-programas/README.md#L1-L16) | 8 min |
| 02 · Dependências e bibliotecas de execução | Relacionar chamadas de funções, bibliotecas de execução, API e kernel no exemplo printf. | [06-execucao-de-programas/README.md · L17–36](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/06-execucao-de-programas/README.md#L17-L36) | 9 min |
| 03 · O loader e a imagem em memória | Ordenar mapeamento de seções, resolução de dependências, preenchimento de IAT e transferência ao entrypoint. | [06-execucao-de-programas/README.md · L37–53](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/06-execucao-de-programas/README.md#L37-L53) | 8 min |
| 04 · Executáveis | Separar compilação e linkedição e comparar executáveis estáticos e dinamicamente ligados. | [06-execucao-de-programas/executaveis.md · L1–46](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/06-execucao-de-programas/executaveis.md#L1-L46) | 9 min |
| 05 · Bibliotecas | Reconhecer funções importadas e exportadas e explicar as limitações de chamadas via rundll32. | [06-execucao-de-programas/bibliotecas.md · L1–27](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/06-execucao-de-programas/bibliotecas.md#L1-L27) | 11 min |
| 06 · Processos | Distinguir arquivo executável, processo, PID, handles e threads e interpretar tasklist. | [06-execucao-de-programas/processos.md · L1–38](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/06-execucao-de-programas/processos.md#L1-L38) | 9 min |

Laboratórios associados:

- **Carregar uma imagem passo a passo** — Mapear seções, resolver bibliotecas, preencher IAT e transferir o fluxo ao entrypoint. Motor proposto: `loader-model`.
- **Imports, exports e chamadas** — Encontrar ShellAboutA/W e distinguir função exportada de chamada compatível com rundll32. Motor proposto: `pe`.
- **Programa, processo e thread** — Relacionar duas instâncias do mesmo executável a PIDs e espaços de endereçamento distintos. Motor proposto: `process-model`.

## 07 · Windows API

Reconhecer chamadas Windows API, argumentos, handles, retornos e alterações em recursos.

| Aula | Objetivo | Fonte | Estudo estimado |
| --- | --- | --- | ---: |
| 01 · Windows API | Ler protótipos, tipos, anotações de entrada/saída, handles e flags de uma chamada Windows API. | [07-windows-api/README.md · L1–72](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/07-windows-api/README.md#L1-L72) | 17 min |
| 02 · Construir uma caixa de mensagem | Configurar texto, título e flags de MessageBoxW e localizar a mensagem no resultado. | [07-windows-api/caixas-de-mensagens.md · L1–35](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/07-windows-api/caixas-de-mensagens.md#L1-L35) | 10 min |
| 03 · Retornos, Unicode e variantes A/W | Interpretar IDYES/IDNO e relacionar macros UNICODE, variantes A/W e tipos de ponteiros de strings. | [07-windows-api/caixas-de-mensagens.md · L36–78](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/07-windows-api/caixas-de-mensagens.md#L36-L78) | 9 min |
| 04 · CreateFile e o ciclo de vida de um handle | Escolher parâmetros de CreateFile, validar o retorno e fechar corretamente o handle. | [07-windows-api/manipulacao-de-arquivos.md · L1–103](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/07-windows-api/manipulacao-de-arquivos.md#L1-L103) | 22 min |
| 05 · WriteFile: escrever bytes e conferir o resultado | Calcular bytes escritos, interpretar os parâmetros de WriteFile e conferir o arquivo resultante. | [07-windows-api/manipulacao-de-arquivos.md · L104–151](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/07-windows-api/manipulacao-de-arquivos.md#L104-L151) | 11 min |
| 06 · Acesso ao Registro | Associar chaves, valores e tipos e reconstruir chamadas RegCreateKey, RegSetKeyValue e RegCloseKey. | [07-windows-api/acesso-ao-registro.md · L1–139](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/07-windows-api/acesso-ao-registro.md#L1-L139) | 22 min |

Laboratórios associados:

- **Parâmetros e retorno de MessageBox** — Interpretar flags, textos UTF-16 e retornos IDYES/IDNO. Motor proposto: `windows-api-model`.
- **Criar, escrever e fechar** — Verificar o ciclo de um handle e os bytes escritos em log.txt no filesystem virtual. Motor proposto: `windows-api-model`.
- **Chaves, valores e tipos** — Criar Habilitado e Website no registro virtual e conferir tipo, tamanho e terminador. Motor proposto: `windows-api-model`.

## 08 · Assembly

Ler instruções Intel e acompanhar registradores, flags, fluxo e pilha com ABI explícita.

| Aula | Objetivo | Fonte | Estudo estimado |
| --- | --- | --- | ---: |
| 01 · Assembly | Relacionar opcodes, operandos e mnemônicos e explicar a dependência da arquitetura no código de máquina. | [08-assembly/README.md · L1–60](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/README.md#L1-L60) | 15 min |
| 02 · Registradores e subregistradores | Reconhecer os GPRs e prever como alterações em RAX, EAX, AX, AH e AL afetam seus aliases. | [08-assembly/registradores.md · L1–104](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/registradores.md#L1-L104) | 18 min |
| 03 · Montar o primeiro PE com fasm | Explicar diretivas fasm, compilar um PE e localizar o código na seção .text sem executar o programa incompleto. | [08-assembly/registradores.md · L105–135](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/registradores.md#L105-L135) | 9 min |
| 04 · RIP e o tamanho de uma instrução | Avançar RIP pelo tamanho real de cada instrução e calcular o endereço seguinte. | [08-assembly/registradores.md · L136–147](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/registradores.md#L136-L147) | 8 min |
| 05 · RFLAGS e o estado de uma operação | Interpretar CF, ZF, SF e OF e distinguir estado definido, preservado e indefinido. | [08-assembly/registradores.md · L148–165](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/registradores.md#L148-L165) | 8 min |
| 06 · Instruções e cópia de valores | Identificar opcodes e operandos e copiar valores respeitando largura e endianness. | [08-assembly/instrucoes-basicas.md · L1–22](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/instrucoes-basicas.md#L1-L22) | 15 min |
| 07 · Aritmética em Assembly | Prever resultados de ADD, SUB, INC, DEC e MUL e seus registradores e flags afetados. | [08-assembly/instrucoes-basicas.md · L23–58](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/instrucoes-basicas.md#L23-L58) | 14 min |
| 08 · Operações bit a bit em Assembly | Aplicar operações de bits em registradores e diferenciar o efeito de MOV e XOR sobre flags. | [08-assembly/instrucoes-basicas.md · L59–69](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/instrucoes-basicas.md#L59-L69) | 8 min |
| 09 · Comparar com CMP e TEST | Explicar a subtração de CMP e o teste lógico de TEST sem modificar os operandos. | [08-assembly/instrucoes-basicas.md · L70–86](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/instrucoes-basicas.md#L70-L86) | 9 min |
| 10 · Saltos e decisões de fluxo | Escolher saltos signed/unsigned a partir de flags e interpretar deslocamentos relativos com modo explícito. | [08-assembly/instrucoes-basicas.md · L87–148](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/instrucoes-basicas.md#L87-L148) | 14 min |
| 11 · Funções e reutilização | Identificar parâmetros e retorno e comparar repetição de código com reutilização por função. | [08-assembly/funcoes-e-pilha.md · L1–58](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/funcoes-e-pilha.md#L1-L58) | 14 min |
| 12 · CALL, RET e a convenção Microsoft x64 | Reconstruir soma(3,4), os argumentos RCX/RDX e o retorno em RAX usando a ABI Microsoft x64. | [08-assembly/funcoes-e-pilha.md · L59–132](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/funcoes-e-pilha.md#L59-L132) | 17 min |
| 13 · A pilha: PUSH, POP e endereços de retorno | Acompanhar RSP, bytes na pilha e endereço de retorno durante PUSH, POP, CALL e RET. | [08-assembly/funcoes-e-pilha.md · L133–178](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/funcoes-e-pilha.md#L133-L178) | 14 min |
| 14 · Argumentos na pilha e shadow space | Localizar os argumentos quinto e sexto, shadow space, variável local e alinhamento da pilha. | [08-assembly/funcoes-e-pilha.md · L179–239](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/funcoes-e-pilha.md#L179-L239) | 12 min |
| 15 · Reconstruir uma chamada à MessageBox | Recuperar argumentos e strings de uma chamada MessageBoxW a partir dos registradores e endereços. | [08-assembly/funcoes-e-pilha.md · L240–266](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/funcoes-e-pilha.md#L240-L266) | 11 min |

Laboratórios associados:

- **Escrever em uma parte do registrador** — Observar RAX/EAX/AX/AH/AL, preservação parcial e zero-extension de EAX. Motor proposto: `assembly`.
- **Do Assembly aos bytes** — Codificar MOV EAX, 0x20 e OR EAX, 0x18 e localizar os bytes na seção .text. Motor proposto: `assembler`.
- **Decidir com flags** — Conferir CMP/TEST e saltos signed/unsigned, mantendo flags intactas após MOV. Motor proposto: `assembly`.
- **Ir, empilhar e voltar** — Mostrar PUSH/POP, CALL/RET, RSP e o endereço real de retorno. Motor proposto: `assembly`.
- **Seis argumentos na ABI Microsoft x64** — Reconhecer quatro argumentos em registradores, dois na pilha e shadow space. Motor proposto: `assembly`.
- **Reconstruir uma chamada da API** — Recuperar os quatro argumentos de MessageBoxW a partir das instruções. Motor proposto: `assembly`.
- **Reconhecer padrões de Assembly** — Verificar loops, teste de zero, NOP e XCHG com modo e opcodes explícitos. Motor proposto: `assembly`.

## 09 · Depuração

Depurar um alvo didático, usar breakpoints e produzir alterações verificáveis e reversíveis.

| Aula | Objetivo | Fonte | Estudo estimado |
| --- | --- | --- | ---: |
| 01 · Depuração | Definir o propósito da depuração e identificar o alvo de estudo e o papel do debugger. | [09-depuracao/README.md · L1–7](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/09-depuracao/README.md#L1-L7) | 8 min |
| 02 · O Debugger | Configurar a bancada e identificar disassembly, helper, dump, registradores, convenção de chamada e pilha. | [09-depuracao/debugger.md · L1–54](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/09-depuracao/debugger.md#L1-L54) | 9 min |
| 03 · Disassembly | Interpretar endereços e opcodes e distinguir step into, step over, run e restart. | [09-depuracao/disassembly.md · L1–41](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/09-depuracao/disassembly.md#L1-L41) | 9 min |
| 04 · Breakpoints | Inserir, desabilitar e remover breakpoints de software e explicar a troca temporária de um byte por INT3. | [09-depuracao/breakpoints.md · L1–35](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/09-depuracao/breakpoints.md#L1-L35) | 8 min |
| 05 · Manipulação do Fluxo | Seguir chamadas intermodulares e modificar uma string em memória observando retorno, LastError e LastStatus. | [09-depuracao/manipulacao.md · L1–41](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/09-depuracao/manipulacao.md#L1-L41) | 9 min |
| 06 · Patches | Distinguir alteração em memória e patch persistente e revisar os bytes antes de exportar a modificação. | [09-depuracao/patches.md · L1–17](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/09-depuracao/patches.md#L1-L17) | 8 min |

Laboratórios associados:

- **Step into e step over** — Diferenciar F7/F8 e explicar o estado antes e depois de uma CALL. Motor proposto: `debugger-model`.
- **Parar por endereço** — Inserir 0xCC, parar, restaurar o opcode e avançar sem perder a instrução original. Motor proposto: `debugger-model`.
- **Alterar o argumento em memória** — Editar cmd.exe para calc.exe em um alvo virtual e acompanhar DeleteFileA, EAX e LastError. Motor proposto: `debugger-model`.
- **Um patch com antes e depois** — Separar alteração temporária em memória de patch em arquivo e exportar um diff reproduzível. Motor proposto: `patch`.

## Referências e conteúdo editorial

- [Apresentação](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/README.md#L1) — material de consulta, atribuição ou apoio, fora do percentual de aulas.
- [Apêndices](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/apendices/README.md#L1) — material de consulta, atribuição ou apoio, fora do percentual de aulas.
- [Tabela ASCII](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/apendices/a-tabela-ascii.md#L1) — material de consulta, atribuição ou apoio, fora do percentual de aulas.
- [Tabela ISO-8859-1/Latin-1](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/apendices/b-tabela-iso-8859-1.md#L1) — material de consulta, atribuição ou apoio, fora do percentual de aulas.
- [Exemplos de Código em Assembly](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/apendices/c-exemplos-de-codigo-em-assembly.md#L1) — material de consulta, atribuição ou apoio, fora do percentual de aulas.
- [Funções da API do Windows](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/apendices/d-funcoes-api-win.md#L1) — material de consulta, atribuição ou apoio, fora do percentual de aulas.
- [Ferramentas](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/apendices/e-ferramentas.md#L1) — material de consulta, atribuição ou apoio, fora do percentual de aulas.
- [Referências](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/referencias.md#L1) — material de consulta, atribuição ou apoio, fora do percentual de aulas.
- Registro de alterações — Sobre o livro / Histórico.
- SUMMARY — estrutura da fonte e auditoria de cobertura, sem aula artificial.

IDs de aulas, pré-requisitos, capítulos de origem, seções e vínculos com exemplos estão em [course-plan.json](../analysis/course-plan.json). O laboratório de padrões Assembly vem do apêndice e integra a bancada do módulo 08, preservando essa proveniência.
