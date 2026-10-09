# Revisão editorial e dependências

## Política

A adaptação preserva escopo e significado da fonte. Uma inconsistência não deve contaminar o visualizador ou o avaliador. Correções recebem identificação, fonte, justificativa e revisão; o clone permanece intacto.

Os itens abaixo distinguem erro confirmado, complemento necessário, clarificação e dependência ainda não resolvida. Não representam uma revisão executada em todas as toolchains Windows. A compilação dos exemplos será validada no ambiente declarado durante a fase de conteúdo/runner.

## Semântica de Assembly

A checagem utilizou o [Intel Software Developer’s Manual, volume 2, revisão 093](https://cdrdv2-public.intel.com/929352/325383-093-sdm-vol-2abcd.pdf), consultado pelas entradas CMP, MOV, INC, MUL e Jcc.

| ID | Fonte | Achado | Tratamento |
| --- | --- | --- | --- |
| ASM-01 | `instrucoes-basicas.md:80` | Relações maior/menor estão invertidas na explicação da subtração de CMP | Explicar destino menos origem e avaliar signed/unsigned pelas flags, considerando overflow |
| ASM-02 | `instrucoes-basicas.md:66` | O texto atribui alteração de ZF tanto a MOV zero quanto a XOR | MOV preserva flags; XOR altera as flags pertinentes |
| ASM-03 | `instrucoes-basicas.md:39` | ADD por um e INC são apresentados como equivalentes sem tratar CF | Acrescentar que INC preserva CF; teste compara os estados completos |
| ASM-04 | `instrucoes-basicas.md:51` | A descrição de MUL registra somente a parte baixa | Mostrar o resultado largo em RDX:RAX para o operando de 64 bits e as flags indefinidas |
| ASM-05 | `instrucoes-basicas.md:98` e `:114` | Os exemplos de salto codificam INC EAX como `0x40` em uma seção sob contexto x64 | Preservar o exemplo como modo legado de 32 bits ou fornecer uma versão x64 recodificada com origem explícita |
| ASM-06 | `instrucoes-basicas.md:139` | Condições de JG/JGE/JL/JLE estão em branco | Completar como complemento verificado: JG `!ZF && SF==OF`, JGE `SF==OF`, JL `SF!=OF`, JLE `ZF OR (SF!=OF)` |
| ASM-07 | `README.md:50` do capítulo Assembly | Literais sem prefixo usam comentários em hexadecimal e podem ter outra interpretação no assembler | Declarar dialeto e normalizar literais nos exemplos executáveis, sem alterar a transcrição original |
| ASM-08 | `registradores.md:105` | Programa fasm de dois comandos sem encerramento de execução | Compilar para inspeção; fornecer estado delimitado no modelo em vez de executá-lo como programa nativo completo |
| ASM-09 | `funcoes-e-pilha.md:261` | Endereço reconstruído de MessageBoxW diverge do endereço carregado em RDX | Conferir o endereço `0x140002038` do trecho e identificar o C exibido como reconstrução/pseudocódigo |
| ASM-10 | `instrucoes-basicas.md:39` e `:43` | Afirmação geral de que INC é mais rápida que ADD | Tratar desempenho como dependente de microarquitetura e contexto, sem usar essa afirmação como regra do simulador |

As correções ASM-01 a ASM-06 devem ter testes de referência. Operações que não definem uma flag não produzem zero por conveniência gráfica. Estimativas de performance não são propriedades semânticas de uma instrução.

## Formato PE

Valores e estruturas foram comparados à [especificação PE da Microsoft](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format).

| ID | Fonte | Achado | Tratamento |
| --- | --- | --- | --- |
| PE-01 | `cabecalhos/opcional.md:71` | DYNAMIC_BASE e NX_COMPAT aparecem como bits 5 e 7 | Corrigir para bits 6 (`0x0040`) e 8 (`0x0100`) |
| PE-02 | `cabecalhos/coff.md:56` | A descrição pode confundir posição da assinatura com início de Machine | Mostrar assinatura em `e_lfanew` e COFF em `e_lfanew + 4`; para assinatura em `0x100`, Machine começa em `0x104` |
| PE-03 | `import-table.md:65` e seguintes | A atividade segue um RVA diretamente como offset no HxD | Converter conforme a seção; igualdade de valores em um exemplo não é regra geral |
| PE-04 | `cabecalhos/diretorios.md:26` | Recursos descritos como árvore binária | Mostrar árvore de diretórios com múltiplas entradas, não uma estrutura de dois filhos |
| PE-05 | `cabecalhos/diretorios.md:18` | EAT descrita como preenchida em memória | Distinguir a EAT existente no arquivo do preenchimento/resolução da IAT |
| PE-06 | `cabecalhos/diretorios.md:3` | “16 diretórios” pode virar premissa fixa do parser | Preservar a referência usual e validar NumberOfRvaAndSizes e SizeOfOptionalHeader |
| PE-07 | `cabecalhos/diretorios.md:28` | Natureza do endereço do Certificate Table precisa de contexto | Acrescentar que esse diretório usa offset em arquivo, não RVA |

O exercício de PE precisa de um arquivo conhecido ou do arquivo do aluno; versões de `calc.exe` variam. Valores do screenshot e do dump original permanecem como exemplos, não como constantes universais da calculadora do Windows.

## Windows API e compilação

| ID | Fonte | Achado | Tratamento |
| --- | --- | --- | --- |
| WIN-01 | `07-windows-api/README.md:67` | Chamada MessageBox com parêntese extra antes da última vírgula | Corrigir a sintaxe na versão compilável e registrar a diferença |
| WIN-02 | `acesso-ao-registro.md:59` | RegCloseKey recebe `hKey`, mas a variável declarada é `hChave` | Usar a variável realmente criada |
| WIN-03 | `acesso-ao-registro.md:28` | Protótipo W chamado de versão ASCII | Identificar como Unicode e manter A/W distinguíveis |
| WIN-04 | `manipulacao-de-arquivos.md:25` | Tipo escrito como LPCSWSTR | Corrigir para LPCWSTR conforme o próprio protótipo |
| WIN-05 | `caixas-de-mensagens.md:63` | Explicação cita `res` em vez de `ret` | Alinhar anotação à variável do programa |
| WIN-06 | `manipulacao-de-arquivos.md:88` | Valor numérico de INVALID_HANDLE_VALUE descrito sem largura | Tratar a constante com o tipo/pointer width do ambiente; não reduzir um handle x64 a DWORD |
| WIN-07 | `manipulacao-de-arquivos.md:143` | WriteFile síncrona passa nulos para bytes escritos e OVERLAPPED | Fornecer variável DWORD para bytes escritos; checar o contrato da versão alvo |
| C-01 | `05-o-formato-pe/secoes.md:41` | Exemplo de leitura omite o include de stdio | Adicionar harness/include identificado antes de compilar |
| C-02 | `08-assembly/funcoes-e-pilha.md:229` | main usa soma com seis argumentos sem definição da função | Preservar como reconstrução e fornecer definição complementar para a prática compilável |
| C-03 | Exemplos de seções e dependências | Local de armazenamento e DLLs dependem do compilador e opções | Coletar o artefato real da toolchain fixada; não prometer seção ou CRT específica por uma regra de C |

WIN-07 está apoiado no contrato de [WriteFile](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-writefile): a chamada síncrona precisa tratar o parâmetro de bytes escritos conforme a documentação. Isso não será inferido somente pelo rótulo “optional”. Tipos e retorno de CreateFileW são conferidos em sua [documentação oficial](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew).

Fechamento de handles em caminhos de falha e checagem dos retornos de registro são complementos de robustez úteis. Os exemplos originais não serão reclassificados como código pronto para produção só porque ilustram uma chamada com sucesso.

## Codificações, tabelas e assets

| ID | Fonte | Achado | Tratamento |
| --- | --- | --- | --- |
| TXT-01 | `03-cadeias-de-texto/unicode.md:39` | UTF-16 apresentado como equivalente a UCS-2 | Distinguir suporte a surrogate pairs e caracteres suplementares |
| TXT-02 | `unicode.md:113` | BOM dito obrigatório em um contexto que precisa ser delimitado | Explicar o comportamento do encoder do exemplo e a distinção entre UTF-32, LE/BE e convenções do protocolo |
| TXT-03 | `apendices/a-tabela-ascii.md:14` | A posição `0x69` aparece com I maiúsculo | Tabela interativa deve mostrar `i`; validar os 128 code points |
| TXT-04 | `a-tabela-ascii.md:18` | A célula `0x2D` usa visualmente um sinal de menos Unicode | Distinguir o hyphen-minus ASCII `-` de U+2212 |
| REF-01 | `apendices/e-ferramentas.md:138` | URL de Procyon começa com `hhttps` | Registrar reparo de esquema; não declarar que o destino atual foi validado |
| REF-02 | `e-ferramentas.md:206` | Nome do comando xxd aparece como xdd na descrição | Corrigir o comando; o exemplo abaixo já usa xxd |
| REF-03 | `e-ferramentas.md:76` | Linha vazia de tabela possui número incorreto de colunas e faz o parser descartar cinco montadores | Recuperar a tabela na análise e adaptação, mantendo referência ao reparo; fonte intacta |
| IMG-01 | Quatro diagramas PNG transparentes | Texto e linhas pretos desaparecem num fundo escuro | Preservar original em fundo adequado e criar visualização funcional com tema e descrição acessível |
| IMG-02 | `06_shellabouta.png` | Imagem referenciada com alt vazio | Acrescentar descrição contextual na adaptação |

A distinção TXT-01 e as convenções de BOM foram conferidas na [FAQ do Unicode Consortium](https://www.unicode.org/faq/utf_bom.html). Os dois code points ASCII podem ser verificados diretamente por conversão de caracteres; o avaliador não usará os caracteres errados do desenho como gabarito.

A recuperação REF-03 alterou a contagem correta para **43 tabelas e 97 entradas de ferramentas**. Sem ela, o parser reconhece só 42 tabelas e o catálogo automático deixa de fora FASM, GAS, MASM, NASM e YASM. A auditoria guarda o reparo aplicado à análise e o hash do arquivo original.

Os quatro diagramas transparentes foram inspecionados sobre fundo claro: estrutura PE, alinhamento de seções, memória virtual e arquitetura de execução. Há também um diagrama lógico do CI 7400. As imagens de debugger misturam gerações e arquiteturas; a adaptação não as usará como prova de uma única versão do alvo.

## Dependências de conteúdo e publicação

**Arquitetura mista:** apresentação e parte do texto legado falam em 32 bits, enquanto Antes de Começar, PE32+ e capítulos de Assembly usam x86-64. Cada exemplo terá modo explícito; material antigo terá contexto e, quando útil, uma versão complementar atualizada. A [fonte primária](https://github.com/mentebinaria/fundamentos-engenharia-reversa) permanece o registro do texto analisado.

**Licença não declarada:** o clone não contém uma licença para o livro e a API do GitHub retornou `license: null`. Isso não permite inferir uma autorização de redistribuição integral a partir do acesso público. Antes de distribuir texto e imagens adaptados, esclarecer os termos com uma evidência de licença ou autorização aplicável. A [orientação do GitHub sobre licenciamento](https://docs.github.com/pt/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository) distingue acesso/fork de permissão para distribuição e obras derivadas.

**AnalyseMe-00:** download não obtido por verificação de acesso do fórum; fonte, hash, arquitetura e versão do executável pendentes. A documentação da plataforma deve separar o exemplo original, o modelo educativo complementar e uma eventual execução nativa validada.

**GIF, calculadora e DLLs:** há screenshots e transcrições, mas os arquivos correspondentes não estão no clone. Usar fixture própria com origem indicada ou arquivo fornecido pelo aluno e deixar claro quando os valores diferem. Não fabricar um arquivo e chamá-lo de amostra original.

**Ferramentas e links:** o catálogo preserva todas as entradas da fonte, incluindo livres, freeware, shareware e comerciais. Esses rótulos não são uma auditoria de licenças nem uma confirmação de manutenção atual. Disponibilidade, versões e licenças específicas serão verificadas antes de oferecer download ou instrução de instalação atualizada.

As dependências de publicação não impedem construir infraestrutura, componentes próprios e conteúdo pedagógico complementar baseado nos conceitos. Elas impedem declarar distribuição integral autorizada ou amostras externas verificadas sem evidência.
