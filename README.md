# Núcleo — Engenharia Reversa

Plataforma de estudo em português com trilha, aulas, checkpoints, progresso persistente, editor, execução isolada e laboratórios interativos. O ambiente local está disponível em **http://localhost:3050**. Banco PostgreSQL independente; Supabase não é utilizado.

O livro [Fundamentos de Engenharia Reversa](https://github.com/mentebinaria/fundamentos-engenharia-reversa), de Fernando Mercês / Mente Binária, foi auditado no commit `3d24fc9313560d734d7a27c56c53d695f01163e1` antes da implementação. A importação representa os nove capítulos em **63 aulas, 35 laboratórios, 63 checkpoints e nove documentos de referência**, preservando os 141 blocos de código/dados, as 43 tabelas e as 28 imagens. Os conteúdos possuem proveniência até as linhas da fonte, e os complementos pedagógicos são identificados.

A coleção em **http://localhost:3050/exercicios** acrescenta **45 exercícios complementares nos nove módulos**, incluindo oito desafios de programação executados no ambiente isolado. Enunciados, dicas e critérios ficam em `content/exercises.json`, separados do conteúdo original do livro e da interface.

## Experiência disponível

- Home narrativa com Three.js, transições contextuais e demonstrações de Assembly, bytes, PE e editor.
- Anatomia 3D com camadas independentes, componentes selecionáveis, isolamento de um componente, endereços e rotação.
- Trilha, dashboard, referências, busca com `Ctrl + K`, sessões, progresso, retomada de leitura e rascunhos por conta.
- Exercícios de análise, números, bytes, strings e programação, com filtros próprios, dicas graduais, soluções comentadas após uma tentativa, correção no servidor e progresso por conta. Aulas e laboratórios apontam para as práticas relacionadas.
- Monaco no desktop e CodeMirror no celular, ambos com autocomplete contextual em Python, C, C++, Assembly e FASM, snippets e símbolos dos arquivos da bancada.
- Destaque de sintaxe nos códigos das aulas, soluções, comparações e visualizadores, preservando integralmente o texto original. A bancada da Windows API mantém espaço entre as abas e os campos do formulário.
- No celular, um acesso fixo abre a bancada em uma aba sobre a aula; código e posição de leitura são preservados. O painel acompanha o teclado virtual.
- Menus personalizados com teclado e busca por prefixo; nenhum seletor de laboratório usa `select` nativo.
- Registradores, flags, stack, memória, disassembly, histórico, breakpoints, hex, PE, imports, exports, strings e conversão de endereços.
- Quatro experimentos complementares: camadas do software, desvios com/sem sinal, IEEE 754 binary32 e ordem dos bytes.
- Imagens originais com ampliação e zoom; interfaces verificadas em larguras de 320, 390, 768, 1024 e 1440 pixels.

## Arquitetura

`apps/web` contém Next.js/React/TypeScript. `apps/api` contém uma API Hono independente com Better Auth, Drizzle e PostgreSQL. `apps/runner` consome a fila do banco com leases e executa tarefas em containers descartáveis com gVisor. `packages/core` define os contratos; `packages/models` contém modelos testáveis de CPU, bytes e PE; `packages/content` lê o catálogo importado no servidor. Conteúdo e respostas de avaliação permanecem separados do JSX e do cliente.

A API e o runner usam roles distintas, sem superusuário. O runner não lê tabelas de sessão. A API valida origem, sessão, propriedade dos recursos, entradas e quotas. Python e C executam fora da API, sem rede, sem credenciais, com usuário restrito, limites de tempo/CPU/memória/processos/saída e filesystem temporário. Cancelamento e conclusão têm controle de concorrência.

O modelo x86 cobre um subconjunto explícito de instruções e memória virtual didática; instruções não suportadas geram erro. **FASM e C++/Windows geram PE para download e inspeção; o executável Windows não é executado nesta instalação Linux.** Os painéis de loader e Windows API são modelos pedagógicos identificados na interface. Autocomplete usa um índice local de funções, snippets e declarações, sem exigir um servidor de linguagem externo.

## Executar em um novo ambiente

Requisitos: Node.js 24 para web/clientes e Node.js 26 para o runner, npm, Python 3, Docker e gVisor `runsc`. O runner exige um host Linux; a instalação do runtime está em `infrastructure/setup-gvisor.sh`.

```bash
npm ci
python3 -m pip install -r scripts/requirements-analysis.txt
node scripts/init-env.mjs
```

O script cria `.env` com segredos aleatórios e permissões `0600`, sem sobrescrever configurações existentes. Depois, prepare o conteúdo e os assets:

```bash
git clone https://github.com/mentebinaria/fundamentos-engenharia-reversa.git references/fundamentos-engenharia-reversa
git -C references/fundamentos-engenharia-reversa checkout 3d24fc9313560d734d7a27c56c53d695f01163e1
npm run content:import
npm run assets:prepare
npm run runner:build
```

O Monaco é compilado localmente com DOMPurify 3.4.16; o script também copia as licenças das fontes. A fonte Commit Mono e sua licença estão em `apps/web/public/fonts`.

```bash
docker compose --env-file .env -f infrastructure/development/compose.yaml up -d
npm run db:migrate
npm run db:seed
docker build -f infrastructure/runner-images/Dockerfile --target compiler -t nucleo-compiler:local .
docker build -f infrastructure/runner-images/Dockerfile --target python -t nucleo-python:local .
docker build -f infrastructure/runner-images/Dockerfile --target native -t nucleo-native:local .
docker build -f infrastructure/runner-images/Dockerfile --target model -t nucleo-model:local .
npm run dev
```

`npm run dev` supervisiona frontend, API e runner. `Ctrl + C` encerra seus processos. Portas: web `3050`, API `3060`, PostgreSQL `5549`, todas locais.

## Implantação segura

- **Proxy reverso obrigatório em produção.** A API identifica o cliente pela última entrada de `X-Forwarded-For`, usada nos limites de login (5 por minuto) e cadastro (5 por hora). O proxy precisa sobrescrever o cabeçalho com o endereço real, por exemplo no nginx: `proxy_set_header X-Forwarded-For $remote_addr;`. Sem isso, um cliente consegue forjar o IP.
- `PUBLIC_ORIGIN` precisa usar `https` em produção; a API não inicia caso contrário. Com https, o frontend também envia HSTS.
- O runner exige gVisor. Usar `RUNNER_DOCKER_RUNTIME=runc` só é aceito com `RUNNER_ALLOW_RUNC=true`, e nunca em produção.
- Programas do usuário veem `/workspace` somente leitura; apenas o compilador escreve nele. PEs gerados expiram em 7 dias e o runner apaga os arquivos vencidos.
- A fila recusa novas execuções acima de 60 tarefas pendentes, além da cota por conta.

## Publicar na Vercel

A Vercel hospeda apenas o frontend (`apps/web`). A API, o runner e o PostgreSQL ficam num servidor Linux próprio: o runner precisa de Docker com gVisor, que não existe nas funções da Vercel.

1. **Servidor (VPS):** PostgreSQL, `apps/api` e `apps/runner`, como em "Executar em um novo ambiente". Publique a API com HTTPS atrás do nginx, por exemplo em `https://api.seudominio.com`, com `proxy_set_header X-Forwarded-For $remote_addr;`.
2. **Variáveis da API:** `PUBLIC_ORIGIN` igual ao domínio do site na Vercel (os cookies de sessão são desse domínio) e `API_PROXY_SECRET` com 64 caracteres aleatórios (`openssl rand -hex 32`).
3. **Projeto na Vercel:** Root Directory `apps/web`. O `apps/web/vercel.json` instala o monorepo e gera o Monaco antes do build. Variáveis: `API_INTERNAL_URL=https://api.seudominio.com`, `PUBLIC_ORIGIN` (o mesmo domínio do site) e o mesmo `API_PROXY_SECRET`.

O navegador conversa só com o domínio da Vercel; `/api/*` é repassado para a API. O `src/proxy.ts` envia o IP real do visitante assinado com `API_PROXY_SECRET`, e a API só aceita esse IP quando o segredo confere. Sem o segredo, os limites de login e cadastro passariam a contar o IP da Vercel, e não o do visitante.

## Verificação

```bash
npm run check:content
npm run typecheck
npm test
npm run build
npm run test:integration
npm run test:e2e
```

Integração e E2E exigem banco, aplicação e runner ativos. Execute as duas suítes em sequência para respeitar os limites reais de criação de conta. Os testes de integração verificam sessões, autorização, isolamento entre contas, concorrência, progresso, rascunhos, correção de exercícios e execução real em gVisor. Os testes de navegador verificam conta, retomada, execução, laboratórios, exercícios, imagens, menus, autocomplete, mobile e movimento reduzido. `node scripts/review-refinements.mjs` e `node scripts/review-exercises.mjs` registram capturas e medidas de layout em `.runtime/qa`.

O inventário e o planejamento original estão em [docs](docs/01-inventario.md). `analysis/validation-report.json` valida o planejamento; `analysis/content-validation.json` valida a importação. Esses relatórios não substituem os testes da aplicação.

A revisão da experiência e os resultados dos testes estão em [Implementação e validação](docs/10-implementacao-e-validacao.md).

A ampliação de exercícios, o destaque de código e as correções de layout estão em [Exercícios e acabamento](docs/11-exercicios-e-acabamento.md).

## Limites de publicação

A fonte auditada não declara uma licença para redistribuição integral. A publicação dos textos e imagens em produção permanece protegida pela configuração `BOOK_DISTRIBUTION_AUTHORIZED`; o material integral está disponível no ambiente local de estudo. O link externo do AnalyseMe-00 respondeu HTTP 403 na auditoria; as práticas usam os exemplos disponíveis e um PE próprio, sem afirmar que reproduzem a análise do binário original. O transporte de recuperação de senha por email precisa de credenciais e remetente validado; a execução nativa de Windows continua fora do escopo do runner Linux.

## Web, Desktop e Android

A arquitetura existente foi preservada e ampliada com Tauri 2 e Capacitor 8. A landing permanece exclusiva da web. Os clientes instalados empacotam React compartilhado e iniciam em login/dashboard; não exportam o Next como HTML estático. iOS foi excluído do escopo a pedido do usuário.

Comandos: dev:web, dev:desktop, dev:mobile; build:web, build:desktop, build:mobile, build:android e build:aab. Builds distribuíveis exigem NUCLEO_API_URL com a API HTTPS real.

[Decisão arquitetural](docs/12-adr-multiplataforma.md), [builds e deploy](docs/13-distribuicao-e-deploy.md), [serviços Linux](infrastructure/production/README.md) e [validação e pendências](docs/14-validacao-multiplataforma.md).

## Site e downloads

[Site público na Vercel](https://engenharia-reversa-platform.vercel.app/) — landing publicada e verificada em 9 de outubro de 2026. Login, progresso e execução ainda aguardam a conexão do backend real.

[Downloads no GitHub Releases](https://github.com/GaussNoob/engenharia-reversa-platform/releases/tag/builds-teste-2026-10-09): Windows x64 (.exe), Linux x64 (.AppImage/.deb), macOS arm64 (.dmg), Android APK debug e AAB não assinado, com SHA256SUMS. São builds de teste com origem de API https://localhost:3060, sem assinatura de distribuição; não se conectam ao site publicado. Os commits e as execuções aprovadas da CI estão nas notas da pré-release.
