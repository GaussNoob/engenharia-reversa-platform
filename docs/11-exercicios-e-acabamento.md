# Exercícios e acabamento — 7 de outubro de 2026

A coleção está em http://localhost:3050/exercicios. São 45 exercícios adicionais, identificados como conteúdo complementar, sem substituir as 63 aulas, os 63 checkpoints ou os 35 laboratórios existentes. O banco é PostgreSQL independente; Supabase não é utilizado.

## Conteúdo e experiência

| Módulo | Exercícios |
| --- | ---: |
| Introdução | 3 |
| Números | 8 |
| Cadeias de Texto | 5 |
| Arquivos | 4 |
| O formato PE | 6 |
| Execução de Programas | 4 |
| Windows API | 4 |
| Assembly | 8 |
| Depuração | 3 |

A coleção inclui interpretação de bytes, conversões de base, complemento de dois, máscaras, rotação, UTF-8 e UTF-16, C strings, cabeçalhos GIF, endereços PE, importações, realocação, flags da Windows API, aliases de registradores, saltos, stack, chamadas de função e debugging.

Cada prática informa objetivo, dificuldade, duração e instruções. Dicas são reveladas gradualmente. Uma tentativa registrada permite consultar a solução comentada; consultar a solução não conclui o exercício. As respostas recebem feedback e a conclusão reaparece após recarregar ou restaurar a sessão. Filtros de módulo e dificuldade usam os seletores personalizados; a busca global também encontra os exercícios. Aulas e laboratórios oferecem os links relacionados.

Os oito desafios de programação são três em Python, um em C e quatro no modelo didático de Assembly. A bancada acompanha o exercício, preserva rascunhos próprios e oferece o mesmo acesso fixo no celular usado nas aulas. As oito soluções foram executadas e validadas pelo runner em gVisor. Assembly utiliza o subconjunto de instruções do modelo, identificado na interface.

## Contratos e correção

- `content/exercises.json`: definições tipadas, enunciados, dicas, respostas, soluções e critérios.
- `packages/core/src/exercises.ts`: contratos de conteúdo, respostas e resultados.
- `packages/content/src/exercises.ts`: leitura e seleção explícita dos campos públicos, sem transmitir respostas ou soluções antes da consulta autorizada.
- `apps/api/src/modules/exercises`: correção e progresso, com sessão, propriedade dos recursos e limites de tentativas.
- `apps/web/src/modules/exercises`: catálogo, prática, dicas, submissão e integração com aulas e bancada.

A correção de programação lê o resultado persistido pelo runner. O job precisa pertencer à conta, ao exercício e à linguagem e arquitetura exigidas. Saída, registradores e passos são conferidos conforme os critérios; saída truncada ou execução com erro não passa. Respostas numéricas, sequências de bytes, texto e alternativas têm validadores próprios.

Tentativas e eventos usam as tabelas de avaliação e progresso existentes. Submissões repetidas são idempotentes; tentativas simultâneas não duplicam a conclusão. Soluções exigem uma tentativa da própria conta. Os testes verificam isolamento entre contas e entre exercícios, assim como a rejeição de resultados fabricados pelo cliente.

O runner também passou a validar o payload depois de confirmar a reserva do job. Um payload inválido termina como falha e permite processar o próximo job, evitando que uma entrada incompatível bloqueie a fila.

## Código e layout

Os trechos de código das aulas agora possuem cores de sintaxe, assim como soluções, comparações, histórico e exemplos dos visualizadores. O destaque compartilha os parsers de Python e C/C++ e o índice de Assembly/FASM do editor. Os tokens são renderizados como texto React, sem inserir HTML da fonte. Uma verificação reconstrói os 141 blocos originais e confirma que seu conteúdo não foi alterado.

A bancada da Windows API ganhou uma separação de 28 px entre abas e campos no desktop e 24 px no celular. Labels e inputs também possuem espaçamento próprio. A navegação lateral mantém os controles da conta acessíveis em telas baixas, com rolagem independente dos links quando necessário.

## Validação

| Verificação | Resultado |
| --- | --- |
| Conteúdo | 45 exercícios nos nove módulos; oito desafios de programação; conteúdo original preservado |
| Testes unitários | 26 aprovados |
| Testes de integração | 17 aprovados |
| Testes E2E Chromium | 15 aprovados |
| TypeScript e build de produção | Aprovados |
| Auditoria npm | Zero vulnerabilidades conhecidas |
| Layout dos exercícios | Catálogo, exercício numérico e bancada de código em 320, 390, 768, 1024 e 1440 px; sem overflow horizontal ou erros de página |
| Windows API | Espaçamento conferido em 320, 390 e 1440 px |

Os E2E incluem filtros, busca, dicas, tentativa incorreta, consulta da solução, conclusão e restauração, além de edição e execução no celular. A suíte anterior de conta, aulas, laboratórios, autocomplete, imagens e movimento reduzido continua passando. As capturas e medidas são produzidas por `scripts/review-exercises.mjs` em `.runtime/qa`.

Esses resultados correspondem ao ambiente local. Os limites de publicação e os recursos que precisam de configuração em produção estão documentados no [README](../README.md).
