# Fases de implementação e critérios de aceitação

## Estado atual

**Concluído:** clone, leitura e auditoria da fonte; inventário reproduzível; organização proposta de 63 aulas e 35 laboratórios; arquitetura pedagógica, técnica e visual; mapeamento de páginas, componentes e caminhos de execução.

**Pendente:** implementação das seis fases, conteúdo adaptado publicado, banco de runtime, autenticação, IDE, runners, modelos funcionais, testes da aplicação e validação de produção. Cobertura do inventário não equivale a cobertura de uma plataforma implementada.

Nenhuma fase de aplicação está declarada concluída por haver um documento de projeto. A fonte ainda precisa de esclarecimento de permissão para distribuição integral, e o binário externo AnalyseMe-00 ainda precisa ser obtido e verificado.

## Fase 1 — Fundação

Entregas: workspace TypeScript; web/API separados; tokens e primitives; schema do catálogo; importação validada; PostgreSQL e migrations; integração Drizzle; sessões; composição dos adapters; configuração de desenvolvimento sem credenciais no código; estrutura de testes.

A primeira fatia funcional será abrir uma aula, iniciar o estudo e guardar o ponto de retomada em PostgreSQL. Essa fatia exercita sessão, domínio, API e persistência antes da expansão visual. Não substituir o banco de runtime por um serviço de provider obrigatório ou por localStorage.

Saída verificável: setup reproduzível, migration sobre banco vazio, restart sem perda de dados, login/logout funcionando, origem correta, validação do catálogo e zero acoplamento de conteúdo ao JSX. Interfaces básicas usam a identidade própria desde o início.

## Fase 2 — Experiência de aprendizado

Entregas: dashboard, trilha, layout de aula, árvore de navegação, breadcrumbs, busca, iniciar/concluir, retomada, projeções de progresso, tempo ativo e estados de sincronização. Mobile já oferece navegação e leitura utilizáveis.

Saída verificável: aluno entra, abre curso, inicia aula, muda de seção, conclui, recarrega, sai, entra novamente e continua do ponto persistido. A conclusão repetida é idempotente. Uma segunda conta não lê nem altera os dados da primeira. Métricas do dashboard correspondem aos eventos persistidos.

## Fase 3 — Conteúdo do livro

Entregas: adaptação das 63 aulas; apêndices e referências; exemplos, imagens e tabelas; objetivos, checkpoints, quizzes, exercícios, rubricas e soluções; notas de correção e proveniência. Dados públicos e avaliação reservada são gerados separadamente.

Saída verificável: todas as 51 páginas têm destino; as 41 páginas didáticas estão cobertas; os 141 blocos, 43 tabelas, 28 imagens e 97 entradas de ferramentas estão representados ou possuem uma equivalência pedagógica explicitamente vinculada. Os onze blocos indentados e a tabela de montadores recuperada não podem desaparecer.

Cobertura inclui os exercícios intitulados e a prática em texto corrido. A existência de um programa no inventário não substitui a aula que o explica. Cada página é revisada contra a fonte, com assuntos complementares identificados e nenhuma remoção técnica para simplificar a interface.

Para o AnalyseMe-00, distinguir os artefatos disponíveis na fonte, a prática modelada e o binário real. Sua integração nativa ou estática depende de amostra, versão, hash e permissão verificáveis. Não marcar essa dependência como resolvida com uma fixture diferente.

## Fase 4 — IDE e execução

Entregas: Monaco desktop, adapter mobile, arquivos múltiplos, exemplos, diagnósticos, output, terminal educativo, reset, solução/diff e drafts; fila, leases, runner separado, imagens fixadas, limites, cancelamento e artefatos autorizados. Python e C portátil têm execução real isolada; geração de PE tem caminho de compilação próprio.

Saída verificável: executar um exemplo válido, alterar seu código e obter resultado diferente; receber erro de compilação com localização; interromper loop infinito; demonstrar limites de memória/output; negar rede e leitura de host; preservar draft após erro e logout/login; impedir acesso a jobs de outra conta.

Sem runtime isolado validado, execução remota permanece indisponível. Um container comum, uma função API com timeout ou um texto de “execução concluída” não satisfazem essa fase.

## Fase 5 — Visualizadores e laboratórios

Entregas: registradores/aliases, CPU state, AssemblyStepper, memória, stack/call stack, hex, PE/imports/exports, loader, encodings, bitwise, Windows API modelada e patch diff. Os 35 laboratórios têm atividade, feedback e conclusão persistida.

Saída verificável: cada instrução altera o estado compartilhado correto; RIP avança pelo tamanho codificado; flags indefinidas não recebem valores inventados; operações sobre EAX respeitam long mode; CALL/RET e shadow space respeitam a ABI declarada. O parser PE distingue posições no arquivo e endereços em memória e falha de maneira controlada em arquivos inválidos.

Os modelos têm escopo visível e são comparados a casos de referência independentes. A apresentação de um registrador, dump e call stack precisa corresponder à mesma execução. Laboratórios podem ser abertos pela aula ou pelo catálogo com estado equivalente.

## Fase 6 — Polimento e validação

Entregas: home narrativa, animações contextuais, refinamento de todas as rotas, revisão editorial, keyboard/ARIA, reduced motion, mobile realista, otimização de bundles/assets, metadata/SEO, E2E, staging e operação do runner.

Saída verificável: nenhuma rota depende de dados fictícios; todas as ações apresentadas respondem; páginas com títulos longos e progresso zero mantêm a composição; leitura e edição funcionam em mobile; teclado acessa todos os fluxos; contrastes e foco são adequados; preferências de movimento são respeitadas.

Revisão visual em desktop, tablet e mobile. Usar capturas e interação, incluindo loading, erro, vazio, zoom 200% e conteúdo técnico largo. Se uma página reproduzir um template genérico, refazer a composição antes de encerrá-la.

## Testes críticos

### Unitários

- Importador: front matter, GitBook, bloco indentado, transcrição de REPL, tabela de montadores com linha vazia malformada, links e IDs estáveis.
- Progresso: iniciar, concluir, idempotência, evento atrasado, mudança de revisão e união de intervalos de tempo ativo.
- Domínio de execução: perfil permitido, quotas, transições, cancelamento, lease expirado e limitação de input/output.
- CPU/modelos: precisão 64 bits, aliases, MOV sem alterar flags, INC preservando CF, signed/unsigned, overflow, MUL com parte alta, shifts/rotates, CALL/RET e memória fora de limite.
- PE/hex/texto: limites, PE32/PE32+, RVA/VA/offset, zero-fill, import por ordinal/nome, Certificate Table, BOM, surrogate pairs e terminadores.

Esses testes verificam regras que podem produzir aprendizagem errada ou quebra de integridade. Não criar testes que apenas repetem a estrutura de um componente visual.

### Integração

PostgreSQL real, migrations e a role de runtime. Duas contas e sessões distintas. Tentativas concorrentes de conclusão, heartbeat e execução. Revogação de sessão, CSRF/origem, consulta a recurso alheio, quota atômica e exposição limitada de dados de avaliação.

Runner real e imagem fixada: execução bem-sucedida, compile error, timeout, OOM, output infinito, processos em excesso, rede/host bloqueados, symlink, cleanup e cancelamento. Não usar um runner fake nos testes que alegam validar isolamento.

### E2E mínimos

| Fluxo | Evidência de sucesso |
| --- | --- |
| Login | Sessão real, dashboard correto, erro útil para credencial inválida |
| Abrir curso | Trilha com módulos reais e navegação por aula |
| Concluir aula | Estado concluído, contagem e percentual coerentes |
| Salvar progresso | Refresh e restart do serviço preservam a conclusão e a âncora |
| Executar exercício | Job real isolado, output esperado, feedback e tentativa guardada |
| Restaurar sessão | Refresh reconhece sessão válida; sessão revogada não dá acesso privado |
| Continuar aula | Login posterior abre a aula e o ponto persistido, com draft recuperado |
| Buscar conteúdo | Ctrl/Cmd+K, seleção por teclado e link ao termo/âncora corretos |
| Mobile | Alternância Aula/Código/Terminal preserva estado e não causa overflow da página |
| Acesso entre contas | Progresso, draft, resultado e artefato de outra pessoa são inacessíveis |

Capturas de layout complementam os fluxos. E2E por viewport não substitui toda a avaliação de seleção e teclado virtual em aparelhos; registrar a limitação quando não houver teste em dispositivo real.

## Metas iniciais de desempenho

Metas, ainda não medidas: busca local abaixo de 100 ms para o catálogo; interação de step sem travar o main thread; mudanças visuais por transform/opacity quando possível; conteúdo principal legível antes de carregar o editor; imagens com dimensões para evitar saltos; nenhum bundle inicial com todas as aulas ou todos os motores.

Durante staging, medir métricas de página e do runner em equipamentos e rede representativos. Se o editor ou parser dominar o carregamento, revisar imports, workers e divisão de código; não acrescentar animações para esconder lentidão.

## Critérios finais

| Critério do produto | Estado atual | Evidência exigida para encerrar |
| --- | --- | --- |
| Conteúdo integral relevante disponível | Planejado | Auditoria de cobertura + revisão das aulas implementadas |
| Capítulos corretamente organizados | Mapeamento validado | Trilha e aulas navegáveis com fontes e dependências |
| Exercícios integrados | Planejado | Enunciados, tentativa, avaliação e soluções acessíveis |
| Progresso funciona | Arquitetura definida | Integração/E2E com PostgreSQL e restart |
| Navegação funciona | Rotas definidas | Fluxos e busca por teclado/mobile passando |
| Design consistente | Direção definida | Revisão visual das páginas reais e dos seus estados |
| Mobile utilizável | Comportamento definido | Leitura, edição e visualizadores verificados |
| Laboratórios integrados | Catálogo definido | 35 atividades implementadas, úteis e persistidas |
| Execução isolada | Arquitetura definida | Testes do runtime real e limites efetivos |
| Testes críticos passam | Plano definido | Relatórios reais de unitários, integração e E2E |

O projeto só será declarado concluído quando esses critérios tiverem evidências de implementação. A entrega atual encerra a etapa de análise e planejamento solicitada antes do código de produto.
