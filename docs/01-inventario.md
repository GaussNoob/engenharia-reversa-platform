# Inventário e análise da fonte

## Fonte e método

Clone do repositório no commit `3d24fc9313560d734d7a27c56c53d695f01163e1`. Foram lidos os documentos, os blocos de código e os apêndices e inspecionadas as imagens. Nenhum executável ou código do livro foi rodado.

O inventário combina parser e auditoria de linhas. Front matter é metadado, não título de aula; códigos indentados são preservados; a linha vazia malformada no catálogo de montadores recebe reparo apenas na entrada do parser, sem mudança no clone. Os hashes correspondem à fonte original.

## Contagens

| Medida | Total |
| --- | ---: |
| Arquivos versionados | 81 |
| Documentos Markdown | 51 |
| Imagens PNG | 28 |
| Páginas no sumário | 49 |
| Páginas didáticas | 41 |
| Títulos e subtítulos | 251 |
| Blocos de código, dados ou saída | 141 |
| Tabelas, incluindo uma recuperada | 43 |
| Entradas de ferramentas | 97 |
| Seções intituladas Exercício/Exercícios | 5 |
| Ocorrências de links | 185 |
| Palavras por separação de espaços, incluindo código e tabelas | 34565 |

As 141 ocorrências se dividem em 130 blocos delimitados e 11 indentados. Não são 141 programas executáveis. As cinco seções de exercícios também não esgotam a prática, que aparece em exemplos e perguntas no texto.

O índice de análise contém 198 termos/aliases com ocorrência na fonte, 102 candidatos a símbolos de funções e 24 nomes de comandos. São registros de pesquisa; símbolos inferidos requerem curadoria antes da busca pública.

## Documentos e destino

| Documento | Título | Linhas | Código/dados | Tabelas | Destino |
| --- | --- | ---: | ---: | ---: | --- |
| [README.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/README.md#L1) | Apresentação | 29 | 0 | 0 | Referência/editorial |
| [01-introducao/README.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/01-introducao/README.md#L1) | Introdução | 58 | 0 | 0 | Trilha |
| [01-introducao/antes-de-comecar.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/01-introducao/antes-de-comecar.md#L1) | Antes de Começar | 58 | 2 | 0 | Trilha |
| [02-numeros/README.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/02-numeros/README.md#L1) | Números | 13 | 0 | 0 | Trilha |
| [02-numeros/sistemas-de-numeracao.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/02-numeros/sistemas-de-numeracao.md#L1) | Sistemas de Numeração | 125 | 5 | 2 | Trilha |
| [02-numeros/o-byte.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/02-numeros/o-byte.md#L1) | O Byte | 17 | 0 | 1 | Trilha |
| [02-numeros/numeros-negativos.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/02-numeros/numeros-negativos.md#L1) | Números Negativos | 47 | 3 | 1 | Trilha |
| [02-numeros/calculos-com-binarios.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/02-numeros/calculos-com-binarios.md#L1) | Cálculos com Binários | 270 | 16 | 5 | Trilha |
| [03-cadeias-de-texto/README.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/03-cadeias-de-texto/README.md#L1) | Cadeias de Texto | 9 | 0 | 0 | Trilha |
| [03-cadeias-de-texto/ascii.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/03-cadeias-de-texto/ascii.md#L1) | ASCII | 69 | 2 | 1 | Trilha |
| [03-cadeias-de-texto/unicode.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/03-cadeias-de-texto/unicode.md#L1) | Unicode | 133 | 12 | 0 | Trilha |
| [03-cadeias-de-texto/c-strings.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/03-cadeias-de-texto/c-strings.md#L1) | C Strings | 34 | 2 | 0 | Trilha |
| [04-arquivos/README.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/04-arquivos/README.md#L1) | Arquivos | 28 | 1 | 0 | Trilha |
| [04-arquivos/formatos.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/04-arquivos/formatos.md#L1) | Formatos | 55 | 0 | 1 | Trilha |
| [05-o-formato-pe/README.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/README.md#L1) | O formato PE | 13 | 0 | 0 | Trilha |
| [05-o-formato-pe/cabecalhos/README.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/cabecalhos/README.md#L1) | Cabeçalhos | 14 | 0 | 1 | Trilha |
| [05-o-formato-pe/cabecalhos/dos.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/cabecalhos/dos.md#L1) | MS-DOS | 82 | 2 | 0 | Trilha |
| [05-o-formato-pe/cabecalhos/coff.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/cabecalhos/coff.md#L1) | COFF | 101 | 3 | 1 | Trilha |
| [05-o-formato-pe/cabecalhos/opcional.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/cabecalhos/opcional.md#L1) | Opcional | 76 | 1 | 1 | Trilha |
| [05-o-formato-pe/cabecalhos/diretorios.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/cabecalhos/diretorios.md#L1) | Diretórios de Dados | 40 | 1 | 0 | Trilha |
| [05-o-formato-pe/cabecalhos/cabecalhos-das-secoes.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/cabecalhos/cabecalhos-das-secoes.md#L1) | Cabeçalhos das Seções | 59 | 1 | 1 | Trilha |
| [05-o-formato-pe/secoes.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/secoes.md#L1) | Seções | 83 | 3 | 0 | Trilha |
| [05-o-formato-pe/import-table.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/import-table.md#L1) | Import Table | 75 | 2 | 0 | Trilha |
| [05-o-formato-pe/enderecamento.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/05-o-formato-pe/enderecamento.md#L1) | Endereçamento | 63 | 2 | 0 | Trilha |
| [06-execucao-de-programas/README.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/06-execucao-de-programas/README.md#L1) | Execução de Programas | 53 | 1 | 0 | Trilha |
| [06-execucao-de-programas/executaveis.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/06-execucao-de-programas/executaveis.md#L1) | Executáveis | 46 | 1 | 0 | Trilha |
| [06-execucao-de-programas/bibliotecas.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/06-execucao-de-programas/bibliotecas.md#L1) | Bibliotecas | 27 | 2 | 0 | Trilha |
| [06-execucao-de-programas/processos.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/06-execucao-de-programas/processos.md#L1) | Processos | 38 | 1 | 0 | Trilha |
| [07-windows-api/README.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/07-windows-api/README.md#L1) | Windows API | 72 | 4 | 1 | Trilha |
| [07-windows-api/caixas-de-mensagens.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/07-windows-api/caixas-de-mensagens.md#L1) | Caixas de Mensagens | 78 | 2 | 1 | Trilha |
| [07-windows-api/manipulacao-de-arquivos.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/07-windows-api/manipulacao-de-arquivos.md#L1) | Manipulação de Arquivos | 151 | 9 | 0 | Trilha |
| [07-windows-api/acesso-ao-registro.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/07-windows-api/acesso-ao-registro.md#L1) | Acesso ao Registro | 139 | 6 | 0 | Trilha |
| [08-assembly/README.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/README.md#L1) | Assembly | 60 | 2 | 1 | Trilha |
| [08-assembly/registradores.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/registradores.md#L1) | Registradores | 165 | 5 | 3 | Trilha |
| [08-assembly/instrucoes-basicas.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/instrucoes-basicas.md#L1) | Instruções Básicas | 148 | 11 | 2 | Trilha |
| [08-assembly/funcoes-e-pilha.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/08-assembly/funcoes-e-pilha.md#L1) | Funções e Pilha | 266 | 14 | 0 | Trilha |
| [09-depuracao/README.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/09-depuracao/README.md#L1) | Depuração | 7 | 0 | 0 | Trilha |
| [09-depuracao/debugger.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/09-depuracao/debugger.md#L1) | O Debugger | 54 | 0 | 0 | Trilha |
| [09-depuracao/disassembly.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/09-depuracao/disassembly.md#L1) | Disassembly | 41 | 0 | 0 | Trilha |
| [09-depuracao/breakpoints.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/09-depuracao/breakpoints.md#L1) | Breakpoints | 35 | 0 | 0 | Trilha |
| [09-depuracao/manipulacao.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/09-depuracao/manipulacao.md#L1) | Manipulação do fluxo | 41 | 0 | 0 | Trilha |
| [09-depuracao/patches.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/09-depuracao/patches.md#L1) | Patches | 17 | 0 | 0 | Trilha |
| [apendices/README.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/apendices/README.md#L1) | Apêndices | 23 | 0 | 0 | Referência/editorial |
| [apendices/a-tabela-ascii.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/apendices/a-tabela-ascii.md#L1) | Tabela ASCII | 21 | 1 | 0 | Referência/editorial |
| [apendices/b-tabela-iso-8859-1.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/apendices/b-tabela-iso-8859-1.md#L1) | Tabela ISO-8859-1/Latin-1 | 23 | 1 | 0 | Referência/editorial |
| [apendices/c-exemplos-de-codigo-em-assembly.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/apendices/c-exemplos-de-codigo-em-assembly.md#L1) | Exemplos de Código em Assembly | 59 | 7 | 0 | Referência/editorial |
| [apendices/d-funcoes-api-win.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/apendices/d-funcoes-api-win.md#L1) | Funções da API do Windows | 211 | 15 | 0 | Referência/editorial |
| [apendices/e-ferramentas.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/apendices/e-ferramentas.md#L1) | Ferramentas | 245 | 1 | 20 | Referência/editorial |
| [referencias.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/referencias.md#L1) | Referências | 28 | 0 | 0 | Referência/editorial |
| [01-introducao/registro-de-alteracoes.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/01-introducao/registro-de-alteracoes.md#L1) | Registro de alterações | 16 | 0 | 0 | Referência/editorial |
| [SUMMARY.md](https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/3d24fc9313560d734d7a27c56c53d695f01163e1/SUMMARY.md#L1) | Table of contents | 51 | 0 | 0 | Estrutura |

O histórico `01-introducao/registro-de-alteracoes.md` não está no sumário; recebe destino em Sobre o livro / Histórico. `SUMMARY.md` alimenta a estrutura, sem virar aula concluível. `.gitignore` e `.github/FUNDING.yml` são arquivos de manutenção e apoio, também registrados no manifesto de arquivos.

## Imagens e diagramas

Há cinco diagramas conceituais e 23 screenshots. Cada uma das 28 imagens tem uma referência resolvida na fonte; não foram encontrados links locais de imagem quebrados. Quatro diagramas têm transparência e elementos pretos: precisam de fundo adequado para serem legíveis em dark mode.

| Asset | Dimensões | Tipo/assunto |
| --- | --- | --- |
| `04_die_arquivo.png` | 1020 × 502 | Screenshot de ferramenta ou resultado |
| `04_hxd_arquivo.png` | 933 × 294 | Screenshot de ferramenta ou resultado |
| `04_hxdgif.png` | 966 × 584 | Screenshot de ferramenta ou resultado |
| `05_alinhamento.png` | 214 × 156 | Alinhamento de seções e permissões |
| `05_die_calc_coff.png` | 2375 × 1095 | Screenshot de ferramenta ou resultado |
| `05_die_calc_it.png` | 1792 × 849 | Screenshot de ferramenta ou resultado |
| `05_die_calc_pe_advanced.png` | 1458 × 1047 | Screenshot de ferramenta ou resultado |
| `05_hxd_calc_dos.png` | 937 × 657 | Screenshot de ferramenta ou resultado |
| `05_hxd_tables.png` | 935 × 1089 | Screenshot de ferramenta ou resultado |
| `05_memoria_virtual.png` | 466 × 333 | Memória virtual e páginas compartilhadas |
| `05_pe.png` | 133 × 299 | Estrutura PE |
| `06_execucao_programas.png` | 397 × 225 | Execução Windows e fronteiras de privilégio |
| `06_shellabouta.png` | 1004 × 809 | Screenshot de ferramenta ou resultado |
| `07_msgboxw.png` | 261 × 157 | Screenshot de ferramenta ou resultado |
| `07_visual_studio_project.png` | 1336 × 862 | Screenshot de ferramenta ou resultado |
| `08_7400.png` | 399 × 240 | Circuito lógico e portas NAND |
| `09_manipulacao_deletefilea.png` | 841 × 36 | Screenshot de ferramenta ou resultado |
| `09_manipulacao_dump_alterado.png` | 527 × 28 | Screenshot de ferramenta ou resultado |
| `09_manipulacao_edit_string.png` | 908 × 414 | Screenshot de ferramenta ou resultado |
| `09_manipulacao_follow_in_dump.png` | 745 × 196 | Screenshot de ferramenta ou resultado |
| `09_manipulacao_intermodular_calls.png` | 843 × 476 | Screenshot de ferramenta ou resultado |
| `09_manipulacao_lasterror.png` | 319 × 258 | Screenshot de ferramenta ou resultado |
| `09_patches.png` | 511 × 475 | Screenshot de ferramenta ou resultado |
| `09_x64dbg_analyseme00_disassembly.png` | 2128 × 286 | Screenshot de ferramenta ou resultado |
| `09_x64dbg_analyseme00_inicial.png` | 3584 × 2158 | Screenshot de ferramenta ou resultado |
| `09_x64dbg_breakpoint.png` | 1390 × 234 | Screenshot de ferramenta ou resultado |
| `09_x64dbg_breakpoints.png` | 1806 × 218 | Screenshot de ferramenta ou resultado |
| `hxd_ou_exe.png` | 746 × 424 | Screenshot de ferramenta ou resultado |

Preservar as imagens de origem como referência e transformar relações de memória/PE/CPU em instrumentos acessíveis. Redesenhar um diagrama funcional não elimina o registro de sua fonte. Screenshots têm descrições e possibilidade de ampliação, sem depender de zoom de uma imagem minúscula para explicar um conceito.

## Exemplos, exercícios e execução

Classificação por bloco em [examples.json](../analysis/examples.json); campos e spans das 43 tabelas em [tables.json](../analysis/tables.json). Linguagens marcadas: Python (33), C (47), C++ (5), asm (5), x86 (2), text (1), além de 48 blocos sem rótulo, incluindo os indentados.

A fonte não contém arquivos `.c`, `.cpp`, `.asm`, `.py`, `.exe`, `.dll` ou testes de correção. O código está dentro do Markdown. Há programas completos, fragmentos, structs, macros, protótipos, opcodes e saída de ferramentas. Windows API e análise de seções exigem ambiente próprio; [o plano de execução](06-execucao.md) delimita esses casos.

## Ferramentas, comandos e referências

As 97 entradas de [tools.json](../analysis/tools.json) conservam nome, categoria, URL e rótulo de licença do livro. O registro não afirma que cada ferramenta foi instalada, testada ou que sua licença atual foi auditada.

Os [links de origem](../analysis/references.json) incluem referências internas, ferramentas, artigos, vídeos e bibliografia. Há 125 destinos externos HTTP(S) distintos nas ocorrências de links, além de diretivas GitBook registradas nos documentos. Um link de Procyon possui esquema `hhttps` e exige reparo editorial.

Comandos Windows incluem dumpbin, findstr, rundll32 e tasklist; depuração inclui StepOver/step/sto/st e SetBPX/bp/bpx; o apêndice inclui hdump, heksa, hexyl, hd, od e xxd. A presença no índice não autoriza execução de uma shell arbitrária.

## Limitações verificadas

O texto mistura x86 legado e x86-64. Há erros e lacunas técnicas que receberam [registro de revisão](08-revisao-editorial.md). O repositório não declara licença, e as amostras GIF, calc.exe, Shell32.dll e AnalyseMe-00 não estão no clone. O download do AnalyseMe-00 exigiu verificação de acesso e não foi obtido.

Os 63 planos de aula e 35 laboratórios têm proveniência e estados de implementação explícitos. A cobertura desta etapa é a do planejamento; textos adaptados, bancos, execução e interfaces ainda precisam ser implementados e testados.
