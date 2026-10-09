# Páginas, fluxos e componentes

## Mapa de rotas

As URLs abaixo são propostas, não rotas já implementadas.

| Rota | Acesso | Função |
| --- | --- | --- |
| `/` | Público | Home narrativa com demonstrações educativas reais |
| `/entrar` | Público | Login e retorno ao destino pretendido |
| `/criar-conta` | Público | Cadastro e verificação quando configurada |
| `/recuperar-acesso` | Público | Solicitação e conclusão de recuperação de acesso |
| `/dashboard` | Conta | Continuar, curso atual, histórico e próxima recomendação |
| `/aprender` | Público | Entrada da trilha e curso disponível |
| `/aprender/fundamentos` | Público | Visão completa dos nove módulos, pré-requisitos e progresso pessoal quando logado |
| `/aprender/fundamentos/:modulo/:aula` | Teoria pública; conta para persistência | Aula, checkpoints e bancada integrada |
| `/laboratorios` | Público | Catálogo de práticas com filtro por módulo e motor |
| `/laboratorios/:id` | Modelo público; conta para execuções remotas | Laboratório com objetivo e estado da tentativa |
| `/playground` | Público | Escolha de Assembly, C/Python, hexadecimal, PE e memória |
| `/playground/:ambiente` | Modelo público; conta para execução remota | Bancada independente, com exemplos e reset |
| `/progresso` | Conta | Progresso, tempo ativo, exercícios e laboratórios realizados |
| `/referencias` | Público, conforme permissão editorial | Entrada para tabelas, padrões, funções, ferramentas e bibliografia |
| `/referencias/:categoria/:item` | Público, conforme permissão editorial | Referência vinculável a uma aula e pesquisável |
| `/referencias/sobre-o-livro` | Público | Autor, instituição, atribuição, versão e histórico |

A busca global abre como dialog em qualquer rota. Não exige uma página vazia só para apresentar um campo de busca. Resultados possuem URLs diretas para o conteúdo ou âncora relevante.

## Home

A home tem uma sequência narrativa de demonstrações do produto:

1. **Entenda o software por dentro.** Título grande, explicação curta, Começar a aprender e Explorar o conteúdo. Uma pequena execução MOV/ADD já permite avançar e observar RAX com valores corretos.
2. **Um número, várias representações.** O visitante altera um byte e vê binário, hexadecimal, decimal e interpretação signed. Conecta o começo da trilha a um problema concreto.
3. **O endereço aponta para algo.** A memória mostra bytes, ponteiro e conteúdo; selecionar uma faixa atualiza o texto e a interpretação little-endian.
4. **Um executável tem estrutura.** Um PE didático válido mostra MZ, assinatura, cabeçalhos e seções. Selecionar um campo realça seus bytes e revela sua explicação.
5. **Aprenda e teste no mesmo espaço.** Uma bancada funcional permite carregar o exemplo, editar o código e conferir o resultado. Não usar uma imagem estática de editor como substituto de interação.
6. **A trilha completa.** Os nove módulos aparecem em composição editorial, com conteúdos reais e uma entrada clara no estudo. Créditos do livro e referências ficam visíveis no encerramento.

As demonstrações usam fixtures leves e os mesmos motores educativos da plataforma. Não carregar Monaco ou todos os exemplos no primeiro viewport. A atividade da home não cria progresso fictício na conta.

## Dashboard

O primeiro elemento é “Continuar” com a última aula visitada, ponto de retomada e ação direta. O curso em andamento ocupa uma grande faixa com progresso, aula atual e sequência próxima. Tempo estudado, aulas concluídas, exercícios e laboratórios aparecem agrupados por significado, sem uma grade de pequenos cards equivalentes.

Nova conta: convite para a primeira aula e progresso zero. Conta com atividade: dados persistidos e ordenação por última visita. Curso concluído: acesso a revisões e laboratórios pendentes; não inventar um certificado ou um curso adicional.

O histórico mostra atividade real e os conceitos associados às últimas aulas. Uma recomendação explica por que a próxima aula é útil, com referência ao objetivo da trilha, sem um algoritmo de recomendação opaco desnecessário.

## Trilha

Cada módulo mostra número, título, objetivo curto, duração estimada, dificuldade, aulas, laboratórios, pré-requisitos e progresso. Ao expandir, as aulas aparecem na ordem pedagógica, com identificação da posição atual e das concluídas.

O aluno consegue entrar diretamente numa aula, revisar um pré-requisito e voltar sem perder o ponto atual. O progresso usa os dados da conta; na consulta anônima, a interface explica que entrar permite guardar o estudo. Não oferecer “progresso sincronizado” usando somente localStorage.

## Aula e bancada

Desktop: árvore de módulos à esquerda; leitura e bancada no centro, com divisão ajustável. Breadcrumbs indicam curso, módulo e aula. O conteúdo pode ocupar a tela inteira ou manter a bancada ao lado.

A bancada organiza arquivos, editor, resultado, terminal e instrumentos. Nem todas as aulas mostram todos os instrumentos. Uma aula de codificação privilegia HexViewer; uma de ABI destaca registradores e pilha; um exemplo de C pode mostrar output e arquivo gerado.

Mobile: Aula, Código e Terminal são tabs operáveis por teclado e toque. Visão técnica adicional entra em um painel vinculado ao contexto, sem perder a seleção do editor. Alterar a tab não remonta o editor nem descarta draft. Navegação por módulos abre em drawer com foco preservado.

A conclusão é uma ação explícita com feedback e próximo passo. Falha ao salvar mostra estado pendente e opção de repetir; a UI não declara sincronização concluída antes da resposta. Trocar de aula cancela timers locais e guarda o último ponto válido.

## IDE

Monaco desktop recebe tema próprio, números de linha, syntax highlighting, seleção de linguagem e minimap configurável. Arquivos são modelos separados, com histórico de edição preservado. Existem carregar exemplo, resetar, executar, interromper e comparar solução.

Autocomplete tem escopo realista: instruções e registradores no Assembly, snippets e diagnósticos onde implementados. Não prometer o IntelliSense do Visual Studio para C/C++ apenas por instalar Monaco. Diagnósticos de compilação do runner são associados à linha e ao arquivo virtual de origem.

Terminal mostra stdout/stderr e comandos do ambiente educativo, como ajuda, limpar, executar, resetar, inspecionar memória e registradores. Não fornece uma shell irrestrita no servidor. A execução remota aparece como uma tarefa, com estado, tempo, erro e output limitado. O aluno consegue conferir o que foi rodado e recuperar o código após timeout ou falha.

Resetar repõe o exemplo e o estado da bancada, com confirmação contextual apenas quando houver código editado que seria perdido. A solução é exibida ao lado ou em diff, sem sobrescrever a tentativa automaticamente. O usuário escolhe se deseja carregá-la no editor.

## Componentes educativos reutilizáveis

| Componente | Entrada | Interação e aprendizagem |
| --- | --- | --- |
| `RegisterVisualizer` | Estado e aliases de registradores | Inspecionar RAX/EAX/AX/AH/AL e as faixas alteradas |
| `AssemblyStepper` | Programa, opcodes, modo, estado e limites | Step, run limitado, breakpoint e explicação do efeito da instrução |
| `CpuState` | Registradores, RIP/EIP e flags | Mostrar estado antes/depois; flags definidas, preservadas ou indefinidas |
| `MemoryVisualizer` | Regiões, permissões, bytes e ponteiros | Relacionar endereço, offset, conteúdo, largura e endianness |
| `StackVisualizer` | Estado da pilha e frames | Ver RSP/ESP, LIFO, argumentos, shadow space e endereço de retorno |
| `FunctionCallVisualizer` | Chamadas, ABI e argumentos | Diferenciar call stack e bytes da stack, entrar e voltar de funções |
| `HexViewer` | Array de bytes e faixas anotadas | OFFSET / HEX / ASCII, seleção, busca, endian inspector e terminadores |
| `BinaryExplorer` | PE validado e vínculos de campos | Headers, sections, imports, exports, entrypoint, strings, RVA/VA/offset |
| `LoaderVisualizer` | Imagem, seções e imports | Mostrar a imagem no disco e o mapeamento em memória, com preenchimento da IAT |
| `EncodingVisualizer` | Texto e codificação | Comparar code points, code units, bytes, BOM e terminador |
| `BitwiseBench` | Operandos e largura | Alternar bits e verificar AND, OR, XOR, NOT, shift, rotate e signed |
| `WindowsApiVisualizer` | Chamada permitida e recurso virtual | Mostrar parâmetros, handles, retornos e efeitos em arquivo/registro virtuais |
| `CodeRunner` | Arquivos e perfil de execução | Submeter job, acompanhar estados, cancelar e interpretar resultado |
| `Terminal` | Eventos e comandos permitidos | Output acessível e histórico limitado, sem interpolar HTML ou sequências perigosas |
| `PatchDiff` | Bytes originais e modificados | Conferir offsets, comparar, reverter e exportar um patch delimitado |
| `Checkpoint` / `Quiz` | Questão e submissão | Avaliar, explicar e guardar a tentativa conforme política do servidor |

Todos possuem configuração tipada e fontes conhecidas. Seus estados podem ser compartilhados por diferentes vistas de uma mesma bancada. Um registrador e o dump de memória nunca são animações independentes que contradizem a execução exibida.

Stack e call stack são representações distintas: uma mostra memória e endereços, a outra organiza chamadas. Heap entra como complemento delimitado onde houver contexto de memória/alocação; o livro não contém um curso aprofundado de gerenciamento de heap.

## Busca global

Atalhos Ctrl+K e Cmd+K, com botão visível. O índice inclui as 63 aulas, títulos e conceitos da fonte, instruções Assembly, funções Windows API, comandos, ferramentas, exercícios e laboratórios. Aliases tratam, por exemplo, JE/JZ, registrador/registro de CPU e import table/tabela de importações sem misturar “registro do Windows” com registradores.

Normalização de acentos e case, busca por prefixo e ranking por termo exato, título, alias e conteúdo. Resultados mostram tipo, módulo e um trecho curto útil. Teclas seta, Enter e Escape funcionam; o foco retorna ao controle de origem ao fechar.

Índice público carregado sob demanda e pesquisado fora do trabalho pesado da UI. Meta inicial: resposta em menos de 100 ms para o catálogo completo em um desktop intermediário, a medir. Resultados vazios, índice carregando e erro têm estados claros. Não enviar o conteúdo privado dos gabaritos ao índice.

## Estados que fazem parte da implementação

| Fluxo | Estados mínimos |
| --- | --- |
| Conta | Anônimo, sessão válida, expirada, credencial inválida, recuperação enviada e falha de transporte |
| Curso | Progresso zero, em curso, concluído, conteúdo indisponível e revisão atualizada |
| Aula | Lendo, iniciada, conclusão pendente, concluída e falha de sincronização |
| Editor | Exemplo original, modificado, draft restaurado, reset e conflito de revisão |
| Execução | Validando, na fila, compilando, rodando, sucesso, erro, timeout, limite de memória/output e cancelado |
| Binário | Fixture carregada, arquivo do aluno, tipo inválido, truncado e estrutura não suportada |
| Quiz/lab | Não iniciado, tentativa, feedback, aprovado, revisão da solução e falha ao guardar |

Os controles exibidos precisam ter comportamento completo. Uma função ainda indisponível será omitida ou identificada com uma limitação específica, sem botões que simulam sucesso.
