# Execução, laboratórios e segurança

## Resultado da análise dos exemplos

O livro tem **141 blocos** reconhecidos pelo parser: 130 delimitados por fences e 11 indentados. Há código executável, fragmentos, protótipos, estruturas, tabelas textuais, bytes e saídas. A linguagem marcada no Markdown não é suficiente para decidir execução.

O [registro completo](../analysis/examples.json) contém ID, arquivo, linhas, hash, classificação, candidato a motor e motivo para cada bloco. Todos estão em `candidate-not-executed`. Esta etapa determinou caminhos viáveis de implementação; não compilou nem executou os programas da fonte e não declara que todos funcionam sem adaptação.

| Caminho proposto | Blocos | Tratamento |
| --- | ---: | --- |
| Python isolado | 35 | 32 transcrições de REPL e três programas; extrair entradas e outputs sem transformar a saída em código |
| C candidato a programa portátil | 6 | Revisar includes e definições ausentes; compilar e rodar em sandbox, declarando o ambiente |
| Fragmento C com harness | 1 | Construir programa de contexto explícito; um fragmento não é um arquivo completo |
| Windows API: modelo ou VM | 13 | Seis programas e sete fragmentos dependentes de Windows; nenhuma execução fingida em runner Linux |
| Assembly: modelo ou emulador isolado | 26 | Um programa fasm e 25 fragmentos; contexto, modo, base numérica e estado inicial obrigatórios |
| Bytes de instruções para disassembly | 3 | Decodificar com arquitetura explícita, sem executar o binário |
| Visualizadores | 17 | Sete estruturas, cinco conjuntos de constantes, três diagramas de registradores e duas tabelas de caracteres |
| Comandos e transcrições de ferramenta | 5 | Adapter de análise delimitado ou prática guiada no ambiente da fonte |
| Referência ou dados visuais | 10 | Bits, bytes e saídas sem comando de execução |
| Sem execução | 25 | 20 protótipos, quatro saídas e um template de sintaxe |

Entre os programas C candidatos, o exemplo de `.rdata` omite `<stdio.h>` e o exemplo de seis argumentos omite a definição de `soma`. Precisam de contexto complementar antes da compilação. Os protótipos com anotações `[in]`, `[out]` e `[optional]` são documentação de API; não são arquivos C prontos para compilar.

## Ambientes de prática

### Python e C portátil

Python aceita os programas revisados do livro e as entradas extraídas de REPL, com stdout, stderr e diagnóstico. Contexto de uma sequência de exemplos é explícito: o aluno pode executar um arquivo inteiro ou uma célula no estado do laboratório, sem pressupor variáveis invisíveis de uma tentativa anterior.

C utiliza arquivos virtuais e um compilador fixado na imagem. Os exemplos que dependem somente de C/stdio podem rodar em Linux, com o ambiente indicado. Artefatos produzidos aí são ELF; não serão usados como evidência de comportamento de seções PE ou de ABI Microsoft x64.

O uso de `ctypes.c_byte` no capítulo de números negativos pode ser executado pelo Python nativo isolado como conversão de valor. Não equivale a permitir FFI do código do aluno no processo da aplicação ou ao acesso às bibliotecas do servidor web.

### Assembly

O primeiro motor será pedagógico e determinístico, com instruções e limites documentados. Pode modelar MOV, ADD, SUB, INC, DEC, AND, OR, XOR, NOT, shifts, rotates, CMP, TEST, JMP/Jcc, PUSH, POP, CALL, RET, LEA, NOP e XCHG conforme o subconjunto validado. MUL/DIV exigem seus registradores implícitos e estados indefinidos corretos; não devem ser implementados como operações simplificadas que ensinam resultados falsos.

Modo de execução, dialeto de números, largura de operandos e ABI são atributos do exemplo. O byte `0x40` usado como INC EAX em um trecho legado não será interpretado assim em long mode, onde ele é prefixo REX. Endereços e registradores de 64 bits exigem precisão integral.

O aluno pode avançar, rodar até um limite, colocar breakpoint, comparar estados e resetar. Erros de parse, instruções não suportadas, memória inválida e limites de passos geram feedback específico. A UI identifica o motor como modelo pedagógico; não promete CPU Intel completa, sistema Windows em browser ou tempos de hardware.

Para relacionar código e bytes, fasm ou outro assembler adequado roda em um sandbox de compilação. O exemplo `ou.asm` produz um PE para análise, mas não possui encerramento completo de programa e não deve ser executado nativamente como exercício de dois comandos. A comparação de opcodes usa o artefato produzido, não bytes decorativos hardcoded fora do estado do modelo.

### Windows API

MessageBox, CreateFile/WriteFile/CloseHandle e RegCreateKey/RegSetKeyValue/RegCloseKey terão bancadas com modelo de chamadas e recursos virtuais. Parâmetros, encoding, handles, retornos, erros e efeitos ficam visíveis. Os programas C/C++ originais permanecem disponíveis para reprodução no ambiente Windows indicado no livro.

Editar parâmetros de uma chamada modelada e compilar um programa C/C++ completo são operações diferentes. O modelo não deve fingir compilar qualquer código C++. Para geração de PE, uma compilação cruzada isolada pode gerar um arquivo inspecionável; ela não demonstra automaticamente comportamento de runtime Windows.

Uma futura execução nativa integrada de Windows requer VM descartável dedicada, toolchain/licenças disponíveis e protocolo específico de interação GUI. Ela não será substituída por Wine compartilhando o host de produção nem por um `exec` com permissões amplas. O curso pode oferecer práticas guiadas de reprodução nativa e uma experiência integrada modelada para os exemplos, com limites claros.

### PE, hexadecimal e memória

Inspeção binária não precisa executar o arquivo. O parser trabalha com bytes, valida MZ, `e_lfanew`, assinatura, COFF, cabeçalho opcional, seções e limites antes de seguir offsets. Distingue PE32/PE32+, RVA/VA/offset e a exceção do Certificate Table, que utiliza posição em arquivo.

Imports podem ser por nome ou ordinal; strings têm encoding e limite; seções com zero-fill e dados que só existem em memória não recebem um offset fictício. Diretórios ausentes, referências fora do arquivo, truncamento e estruturas não suportadas têm respostas delimitadas.

Arquivos do aluno podem ser inspecionados localmente em worker, sem upload automático. Fixtures do curso têm hash, origem e permissões registradas. Uma análise enviada ao serviço tem limite de tamanho e roda em worker isolado. Upload de binário jamais autoriza executá-lo.

## Depuração e AnalyseMe-00

O livro referencia `https://menteb.in/analyseme00`; no acesso realizado, o link redirecionou para o fórum da Mente Binária, que exigiu uma verificação de acesso HTTP 403. O arquivo não integra o repositório clonado. Seu hash, arquitetura e versão reais não foram confirmados nesta etapa.

O capítulo mistura screenshots e passos de 32 e 64 bits. O modelo precisa carregar fixtures separadas e identificar a arquitetura da atividade. Não inferir que todo o capítulo opera com EIP ou todo ele opera com RIP.

A prática de edição da string passada a DeleteFileA usará um filesystem virtual ou um alvo didático próprio com arquivos efêmeros. Ela preserva a aprendizagem: endereço da string, alteração dos bytes, argumento, retorno e LastError/LastStatus. Não há acesso a `C:\Windows\System32` de um host real pela plataforma.

O modelo complementar não será identificado como o binário original. Para incorporar o AnalyseMe-00 real, obter a amostra permitida, registrar hash e versão, verificar propriedades estaticamente e reproduzir as etapas em uma VM descartável. A pendência do artefato permanece explícita nos critérios de aceitação do conteúdo.

## Pipeline de execução remota

```mermaid
sequenceDiagram
  participant Browser as Navegador
  participant API as API
  participant DB as PostgreSQL
  participant Queue as Fila
  participant Runner as Controlador
  participant Box as Sandbox
  Browser->>API: Arquivos virtuais, perfil, atividade e ID de submissão
  API->>API: Sessão, proprietário, revisão, quota e schema
  API->>DB: Tentativa + outbox em transação
  API-->>Browser: Job ID, estado queued
  DB->>Queue: Publicar solicitação comprometida
  Queue->>Runner: Claim com lease e deadline
  Runner->>Box: Arquivos limitados e comando permitido
  Box-->>Runner: Output limitado, exit status e artefatos
  Runner->>Runner: Descartar sandbox e conferir limites
  Runner->>DB: Resultado e estado final idempotente
  Browser->>API: Consultar resultado por ID
  API->>API: Conferir proprietário
  API-->>Browser: Output, diagnóstico e artefatos autorizados
```

A entrega é ao menos uma vez. O ID de submissão deduplica repetição do browser e da fila. Finalização usa compare-and-set do estado e revisão do job. Resultado de um lease expirado não sobrescreve uma execução mais recente. Retentativas automáticas se restringem a falhas transitórias de infraestrutura; não repetir silenciosamente o programa do aluno por um erro de compilação.

Estados: queued, provisioning, compiling, running, succeeded, failed, timed_out, memory_limited, output_limited e cancelled. Cancelar é idempotente; um deadline também é aplicado por um supervisor externo ao guest. Desconectar o browser não elimina os limites do job.

## Perfis iniciais de limites

São valores propostos para testes e calibração, não limites já aplicados.

| Recurso | Python | C / programa | Compilação | Modelos / análise |
| --- | --- | --- | --- | --- |
| Tempo de parede | 5 s | 5 s | 15 s | 3 s, além do limite de passos |
| CPU | 1 CPU; 2 s acumulados | 1 CPU; 2 s acumulados | 1 CPU; 10 s acumulados | 1 CPU; 2 s acumulados |
| Memória guest | 128 MiB | 128 MiB | 512 MiB | 128 MiB |
| Processos/threads | 32 | 32 | 64 | 16 |
| Output | 64 KiB total | 64 KiB total | 64 KiB total | 64 KiB total |
| Filesystem de trabalho | 16 MiB efêmeros | 16 MiB efêmeros | 32 MiB efêmeros | Leitura limitada de fixture |
| Rede | Desabilitada | Desabilitada | Desabilitada | Desabilitada |

Entrada inicial: até oito arquivos virtuais, nomes ASCII permitidos, sem paths absolutos, `..`, separadores ou links; 64 KiB por arquivo e 256 KiB total. Binários para análise: até 8 MiB, com limites próprios de estruturas e strings. Modelos: limite explícito de instruções, memória e profundidade; a primeira proposta é 5.000 passos por execução.

Uma compilação e a execução subsequente têm budgets e sandboxes separados. Imagem do compilador não acompanha o programa em execução. Qualquer ajuste de limites fica em perfis do servidor, jamais em flags escolhidas pelo browser.

## Isolamento necessário

- Host de runner separado do web/API e do banco.
- Imagens fixadas por digest, provisionadas antes do job; sem download de dependências durante a execução.
- Processo sem privilégios, filesystem raiz read-only e diretório de trabalho em tmpfs limitado.
- Nenhum socket Docker, mount do host, credencial ou variável de ambiente de infraestrutura no guest.
- Network namespace sem egress e sem acesso a metadata endpoints, DNS, banco, API ou interfaces do controlador.
- Capabilities removidas, `no-new-privileges`, seccomp e runtime com fronteira adicional, como gVisor.
- Limites reais por cgroups/runtime e supervisor, incluindo pids e output; não apenas um timer em JavaScript.
- Diretório descartável, coleta restrita de artefatos regulares, rejeição de symlinks e cleanup após erro, cancelamento ou crash.
- Pool e quotas por aluno/IP, concorrência limitada e backpressure global da fila.

Containers comuns não serão descritos como garantia de segurança suficiente para código hostil. O isolamento precisa ser validado no runtime e no ambiente escolhidos. [Segurança do Docker](https://docs.docker.com/engine/security/) e [arquitetura do gVisor](https://gvisor.dev/docs/).

O controlador usa comandos fixos e argumentos validados. Nenhum nome de linguagem, opção de compilador ou filename define uma shell arbitrária. Código do aluno é escrito como dado dentro do sandbox. Não usar `exec(userInput)`, `eval`, Function, import dinâmico de código do aluno ou processo filho no servidor principal.

## Segurança da aplicação

| Risco | Controle concreto e verificação |
| --- | --- |
| XSS no conteúdo | AST de vocabulário permitido, HTML arbitrário desativado, protocolos de URL validados, sanitização de embeds e CSP |
| XSS no output | Renderização como texto, sem HTML; sequências OSC/clipboard e links de terminal não confiáveis removidos |
| CSRF | Sessões protegidas, checagem de origem e proteção de mutações; cookie não substitui validação da requisição |
| SQL injection | Queries parametrizadas pelo ORM/driver; nenhuma interpolação de entrada em SQL |
| IDOR | Proprietário obtido da sessão e condição de propriedade em progresso, drafts, tentativas, jobs e artefatos |
| Sessão expirada/revogada | Verificação no backend e teste de revogação antes de operações privadas |
| Abuso de execução | Quotas atômicas, concorrência por usuário, tamanho, linguagem e budgets impostos no servidor |
| Traversal/artefato | Nomes virtuais, coleta allowlist, sem symlinks, download autorizado e expiração |
| Parser malicioso | Bounds em offsets, strings, diretórios, imports, recursos e número de seções; worker e budget independentes |
| SSRF | Nenhum download de URL arbitrária a pedido do aluno; destinos de serviços são fixos |
| Cache entre usuários | Dados privados sem cache público; consultas e chaves vinculadas à sessão e revisão |
| Vazamento de gabarito | Definições de avaliação reservadas fora do bundle, índice e endpoints públicos |

O plano cobre fronteiras reais de confiança; nenhum desses controles será considerado implementado porque há um botão desabilitado no frontend.

## Verificação antes da liberação

Casos obrigatórios: loop infinito, consumo de memória, output sem fim, fork/process storm, tentativa de rede, leitura do host, busca de env secrets, symlink e path traversal, linguagem não permitida, opção de compilador não permitida, arquivo PE truncado, job de outro usuário e cancelamento durante compilação/execução.

Em cada caso verificar efeito real: processo eliminado, sandbox removido, nenhum acesso externo, resultado limitado e status correto. Distinguir erro do programa de indisponibilidade do runner; a aula e o código permanecem recuperáveis durante falha de infraestrutura.

Logs registram job ID, perfil, budgets, estado e causa, sem credenciais ou conteúdo desnecessário da conta. Métricas observam fila, latência, timeout, cleanup e saturação. Retenção de código, tentativas e artefatos tem política explícita; o filesystem efêmero do guest nunca é usado como persistência do aluno.
