# Entrega multiplataforma — escopo e validação

Data: 9 de outubro de 2026. iOS foi excluído por solicitação do usuário. Não houve alteração em infraestrutura de produção.

## Estrutura final

apps/web (Next.js), apps/desktop (Tauri 2), apps/mobile (Capacitor/Android), apps/api (Hono) e apps/runner (Linux/Docker/gVisor). Os pacotes core, models e content permanecem; api-client, platform, features e design-tokens concentram os contratos HTTP, as adaptações dos clientes e a experiência educacional compartilhada. infrastructure/production reúne PostgreSQL, nginx, serviços Linux e backups. scripts, tests e .github/workflows contêm builds e verificações independentes.

## Objetivos e estado

- **Implementado e validado:** arquitetura React compartilhada; preservação do Next com páginas de servidor; landing exclusiva da web; navegação dos shells em login/dashboard; Monaco desktop e CodeMirror mobile; aliases e proteção das páginas privadas web; typecheck de todos os workspaces; lint; testes unitários, UI e integração real descritos abaixo; build Next e bundles JavaScript independentes.
- **Implementado e validado (builds):** Tauri Windows tem compilação Rust e geração do instalador NSIS .exe concluídas; a CI também gerou pacotes Linux e macOS. Os testes UI do shell rodam em Chromium, não em uma janela WebView2 instalada. Armazenamento no Credential Manager, diálogo de arquivos e sessão real no aplicativo exigem teste no SO com a API.
- **Implementado mas não validado no ambiente atual:** teste instalado em aparelhos Android e sistemas desktop; cofre do SO; recuperação de senha por email; instalação dos serviços Linux/nginx/TLS no servidor de produção; backups/restore operacionais. Execução isolada, permissões de artefatos, progresso, rascunhos e cancelamento foram validados em Linux na CI, sem provisionar produção.
- **Implementado mas não validado no ambiente atual:** deploy Vercel e publicação de releases assinados. Os workflows desktop e Android foram executados manualmente e produziram artefatos de teste. O workflow de qualidade foi executado com sucesso no GitHub Actions, incluindo npm ci e autenticação real contra PostgreSQL.
- **Pendente:** publicação real na Vercel e validação do domínio/HTTPS; provisionamento/validação da API e runner Linux; assinatura/notarização de instaladores; APK/AAB de release assinado e submissão Google Play. A Vercel não está conectada via MCP e não foram fornecidos projeto/equipe, domínio/acesso à API ou credenciais de assinatura.

## Testes e builds executados

- npm run typecheck: sucesso em todos os workspaces, incluindo API, runner, Next, desktop, mobile e pacotes compartilhados.
- npm run lint: sucesso. Verifica formatação Prettier e dependências entre domínio/features/plataformas; não é uma análise ESLint completa.
- npm run check:content: sucesso; 63 aulas, 35 laboratórios, 45 exercícios complementares, 141 blocos de fonte, 43 tabelas e 28 imagens verificados. O executor Python foi adaptado para Windows/Linux com UTF-8 explícito.
- npm test: 7 arquivos, 35 testes aprovados. Inclui modelos de CPU/PE/bytes, correção de exercícios, autocomplete, HTTP/sessão nativa e allowlist de origens.
- npm run test:web-ui: 3 testes aprovados, cobrindo landing/login, redirecionamento privado no servidor e login/dashboard renderizado no servidor. API fixture restrita aos testes.
- npm run test:shells: 6 testes de desktop/mobile aprovados na execução final; verificam entrada sem landing, sessão/dashboard, editores, ausência de overflow mobile, aplicação de safe area simulada de 24px e indisponibilidade da API.
- npm run build:web: build Next de produção concluído, com páginas privadas dinâmicas e a rota de aula restaurada. Não usa output export.
- node scripts/build-native.mjs desktop --development e mobile --development: bundles independentes concluídos. Os bundles otimizados também foram compilados usando https://localhost:3060 apenas como configuração de teste, sem API publicada. Compilação de interface não comprova um instalador ou APK.
- npm run build:desktop: instalador Windows NSIS x64 .exe gerado (6,56 MiB), usando https://localhost:3060 como origem de teste. O instalador não está assinado e não aponta para uma API publicada. O MSI não foi gerado porque o processo WiX light.exe falhou neste ambiente; o target Windows adotado é NSIS, mantendo a distribuição .exe.
- GitHub Actions Android: [execução aprovada](https://github.com/GaussNoob/engenharia-reversa-platform/actions/runs/37874264438), incluindo cap sync, plugins nativos, assembleDebug e bundleRelease. APK debug e AAB não assinado disponíveis como artefatos de teste, usando https://localhost:3060.
- GitHub Actions Desktop: [execução aprovada](https://github.com/GaussNoob/engenharia-reversa-platform/actions/runs/37874064030), com instalador NSIS Windows x64, pacotes Linux x64 e .app/.dmg macOS arm64. Todos usam origem de teste e não receberam assinatura/notarização de distribuição.
- GitHub Actions Quality: [execução aprovada](https://github.com/GaussNoob/engenharia-reversa-platform/actions/runs/37873676967). npm ci, conteúdo, tipos, lint, testes, builds e um teste de autenticação nativa contra PostgreSQL real aprovados. Total: 35 unitários + 9 UI + 1 integração. O teste real cobre conta compartilhada, tokens sem assinatura, revogação, logout e CORS.
- GitHub Actions Linux sandbox integration: [execução aprovada](https://github.com/GaussNoob/engenharia-reversa-platform/actions/runs/37877312702), 18 testes reais com PostgreSQL 17, roles distintas, Docker e gVisor release-20260928.0. Cobertura: rede bloqueada, usuário sem privilégios, ausência de credenciais na sandbox, Python/C/modelo Assembly/FASM, oito soluções de programação, tempo/saída, cancelamento monotônico, download exclusivo do dono, rascunhos concorrentes, progresso e sessões. Total distinto nesta entrega: 35 unitários + 9 UI + 18 integrações = 62 testes.
- cargo check --locked: compilação Tauri/Rust Windows concluída com MSVC. cargo fmt --check: sucesso.

Os testes UI usam dados controlados para verificar composição e navegação; não comprovam autenticação real, entrega de email ou execução isolada. tests/integration/native-auth.test.ts verifica tokens assinados, revogação e origens contra Better Auth/PostgreSQL reais, e está incluído na CI e foi aprovado no GitHub Actions. A suíte completa de integração foi executada e aprovada no Linux da CI; não foi executada neste Windows. A suíte Playwright original completa (test:e2e) não foi executada; a validação de navegador desta entrega compreende as 9 verificações web/shells citadas.

## Arquivos principais criados e modificados

- packages/api-client/**: cliente HTTP, transporte nativo e testes. packages/platform/**: contrato/adaptação de navegação e lazy loading. packages/design-tokens/**: tokens originais. packages/features/**: componentes, páginas, editores, hooks e estilos extraídos; InstalledApp, rotas, configurações de conta, recuperação e histórico. Os antigos caminhos em apps/web permanecem como reexports compatíveis.
- apps/desktop/**: entrada React, manifest, Tauri/Cargo.lock, comandos de cofre, capacidades, janela e ícones. apps/mobile/**: entrada React, Capacitor, configuração de plugins e projeto Android.
- apps/web/src/app/**: composição Next, views compartilhadas, aula restaurada, configurações/histórico/recuperação; apps/web/src/components/WebPlatform.tsx; apps/web/src/lib/server-api.ts; apps/web/next.config.ts; apps/web/vercel.json; apps/web/package.json e tsconfig.
- apps/api/src/app.ts e main.ts; config.ts; auth; http/origins.ts e testes; módulos de execuções. apps/runner/src/**: configuração de usuário da sandbox e permissões compartilhadas de artefatos. Nenhuma execução de laboratório foi movida para o host do cliente. infrastructure/setup-gvisor.sh passou a preparar um checkout novo com download completo e checksum da versão original.
- scripts/build-native.mjs, build-desktop.mjs, build-mobile.mjs, version-release.mjs, lint.mjs, python.mjs e dev.ts; package.json, package-lock.json, tsconfig.base.json, tsconfig.json, .env.example e arquivos de ignore.
- tests/shells/**, tests/web-ui/** e tests/integration/native-auth.test.ts; .github/workflows/quality.yml, desktop.yml, mobile.yml, runner.yml e web-deploy.yml.
- infrastructure/production/**: compose, nginx, systemd, scripts de backup/restore e runbook. README.md e docs/12-adr-multiplataforma.md, 13-distribuicao-e-deploy.md e este relatório.

O diretório recebido não continha histórico Git. O primeiro commit registra o projeto completo, não uma comparação com um commit anterior. Arquivos locais, secrets, caches, conteúdo importado e dependências não são enviados. A lista exata de arquivos publicados fica no commit do GitHub.

## Limites e próximos passos externos

Node 24.21.0, npm 11.19.0 e Rust/MSVC foram usados localmente. A cópia original de node_modules estava incompleta; as dependências foram recuperadas respeitando as versões dos manifests. A instalação normal de workspaces foi confirmada por npm ci no GitHub Actions; o filesystem local não permitiu criar os links usuais do npm. A recuperação do cache Rust utilizou fontes oficiais HTTPS e checksums do Cargo.lock; nenhum TLS foi desabilitado.

A auditoria do archive local identificou gVisor release-20260928.0. A tentativa de CI com uma release posterior apresentou falhas ENOMEM em execuções simples; os limites maiores não resolveram. A configuração final fixa a versão original e preserva os limites anteriores: compilação 512 MiB, programas/modelos 128 MiB. A suíte final completa passou nessa configuração. Atualizações futuras do runtime devem passar por esse workflow antes de produção.

Sem Java/JDK/Android SDK local, o Gradle foi executado no GitHub Actions com JDK 21/SDK 36. Builds desktop foram executados nas toolchains Windows/Linux/macOS da CI. A interação com stores seguros e teclado/safe areas reais precisa de teste nos dispositivos. Não existem IPA ou objetivo iOS nesta entrega.

Configure a Vercel com Root Directory apps/web, Node 24.x e as variáveis server-only documentadas; conecte o MCP à conta para a publicação real. Configure a API HTTPS, trusted origins exatas, secrets, banco e runner pelo runbook. Conclua as verificações de sessão, email, sandbox, cancelamento, downloads e backups nesse ambiente antes de tratar a plataforma como publicada.

A importação integral do livro mantém a trava de distribuição já existente; BOOK_DISTRIBUTION_AUTHORIZED não foi habilitado. A UI local pode consultar conteúdo importado para estudo, mas a publicação integral depende da autorização correspondente.

Consulte [ADR](12-adr-multiplataforma.md), [builds/deploy](13-distribuicao-e-deploy.md) e [runbook Linux](../infrastructure/production/README.md) para decisões, comandos, ambientes, rollback e assinatura.
