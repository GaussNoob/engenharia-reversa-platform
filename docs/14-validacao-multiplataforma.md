# Entrega multiplataforma — escopo e validação

Data: 9 de outubro de 2026. iOS foi excluído por solicitação do usuário.

## Estrutura e decisões

apps/web mantém Next.js com páginas de servidor e landing pública. apps/desktop empacota React com Tauri 2; apps/mobile empacota o mesmo produto com Capacitor/Android. apps/api mantém Hono/Better Auth; apps/runner permanece Linux/Docker/gVisor. Os pacotes core, models e content foram preservados. api-client, platform, features e design-tokens compartilham contratos HTTP, adaptações de plataforma, páginas, componentes, editores e a identidade visual original. infrastructure/production contém nginx, serviços, banco e backups; infrastructure/supabase contém TLS/RLS do banco gerenciado.

Os clientes instalados não dependem de um servidor Next local nem carregam páginas remotas. Não há exportação estática do App Router nem landing nos shells. Monaco é usado no desktop e CodeMirror no Android. A decisão está no [ADR 001](12-adr-multiplataforma.md). Sem VPS, a mesma API Hono foi publicada em projeto Vercel separado com PostgreSQL Supabase, conforme [ADR 002](15-supabase-e-api-vercel.md).

## Objetivos e estado

- **Implementado e validado:** web publicada em https://engenharia-reversa-platform.vercel.app/ e API real em https://nucleo-api.vercel.app; PostgreSQL no projeto EngenhariaReversa, migrations/seed, conexão pooler IPv4, TLS com CA verificada, roles distintas e RLS. Nenhum outro projeto Supabase foi alterado.
- **Implementado e validado:** cadastro/sessão real, dashboard, laboratórios e aula /aprender/fundamentos/01-introducao/visao-geral na Vercel; 404 personalizada com HTTP 404. A conta temporária da validação foi excluída. A autorização do usuário para publicar o conteúdo foi registrada na sessão; BOOK_DISTRIBUTION_AUTHORIZED=true foi aplicado somente na API de produção. O guard permanece no código.
- **Implementado e validado:** frontend compartilhado, landing exclusiva da web, entrada em login/dashboard, editores, safe areas simuladas, navegação, reconexão e quatro simuladores locais sem API. A tela de conexão foi refeita com a paleta/tipografia original e revisada visualmente em desktop e celular. Requests HTTP têm limite de 15 segundos e preservam cancelamento; retorno de rede e retomada do app verificam a sessão novamente.
- **Implementado e validado (builds anteriores):** CI gerou NSIS Windows x64, AppImage/deb Linux x64, dmg macOS arm64, APK debug e AAB sem assinatura de loja apontando para a API pública. Novos builds com a tela e os ícones atuais serão publicados por tag após a verificação da CI.
- **Implementado mas não validado no ambiente atual:** experiência instalada em aparelhos Android e nos três sistemas desktop, cofre do SO, teclado/safe areas reais e recuperação por email. Os testes UI de shell usam Chromium; eles não comprovam funcionamento do cofre nativo.
- **Pendente:** runner de produção em Linux, integração de artefatos privados com a API serverless, assinatura Windows/macOS/Android, notarização macOS e publicação Google Play. Não houve provisão de servidor pago nem alteração destrutiva em infraestrutura existente. iOS não faz parte da entrega.

## Validação executada

- Typecheck de todos os workspaces e lint aprovados. Lint verifica Prettier e limites de dependências; não é uma análise ESLint completa.
- 42 testes unitários aprovados, incluindo modelos, autocomplete, correção, origens, TLS, sessão nativa, timeout e cancelamento HTTP.
- 10 testes UI de shell aprovados: login sem landing, dashboard/editores, safe area simulada, reconexão, rota preservada e interação com os bytes sem rede e sem registrar avaliação. Fixtures existem somente nos testes.
- 5 testes web aprovados na [CI](https://github.com/GaussNoob/engenharia-reversa-platform/actions/runs/37882696727): landing/login, proteção privada no servidor, dashboard, landing com API indisponível e 404/responsividade. O build Next de produção foi concluído sem output export.
- Autenticação nativa foi testada contra a API publicada e o PostgreSQL Supabase reais: cadastro, conta compartilhada, assinatura de token, rejeição de token inválido, CORS, logout, revogação e exclusão. Sem tokens sensíveis em localStorage.
- Verificação de navegador em produção: dashboard, laboratórios e aula HTTP 200; rota inexistente HTTP 404; zero exceções JavaScript. A API respondeu health 200 com storage=postgresql, catálogo 200 e aula 200.
- [18 integrações Linux aprovadas](https://github.com/GaussNoob/engenharia-reversa-platform/actions/runs/37877312702): PostgreSQL 17, roles distintas, Docker e gVisor release-20260928.0; rede bloqueada, ausência de credenciais, usuário restrito, Python/C/Assembly/FASM, desafios, recursos/saída, cancelamento, artefatos do proprietário, rascunhos concorrentes e progresso. Produção ainda não tem esse runner.
- Total distinto das suítes unitária/UI/integração acima: 42 + 15 + 18 = 75 testes. A autenticação também foi repetida no ambiente publicado; essa repetição não aumenta a contagem.
- Conteúdo verificado: 63 aulas, 35 laboratórios, 45 exercícios complementares, 141 blocos de fonte, 43 tabelas e 28 imagens. Build API reproduzível com fonte auditada fixada e esbuild aprovado na CI; não há módulos TypeScript de workspace pendurados no runtime Vercel.

A suíte Playwright original completa, test:e2e, exige runner ativo e não foi executada nesta entrega. A validação de navegador compreende os testes web/shells e a inspeção real de produção descritos acima.

## Arquivos relevantes

- packages/features: composição compartilhada, rotas instaladas, tela de conexão, páginas, editores, autenticação e estilos; packages/platform: adaptação de navegação/download/lazy loading; packages/api-client: HTTP, bearer/cofre e testes; packages/design-tokens: tokens originais.
- apps/web/src/app: páginas Next, not-found.tsx e CSS da 404; server-api/proxy/next.config/vercel.json mantêm renderização de servidor e proxy autenticado. A landing usa metadados versionados e não depende de uma API disponível para renderizar.
- apps/desktop: shell React, Tauri, Cargo.lock, capacidades, cofre, janela e ícones. apps/mobile: shell React, Capacitor e Android com ícones legados, adaptativos e monocromáticos. assets/brand contém a fonte vetorial; npm run icons:prepare gera os assets, sem alterar a marca da landing.
- apps/api: Better Auth, contratos, permissões, quota, pool TLS e bundle Hono; apps/runner: reserva/cancelamento e sandbox Linux. scripts/build-api.mjs e prepare-api-content.mjs preservam os dados privados da função.
- .github/workflows: qualidade, desktop, Android, sandbox Linux e deploy web. scripts/version-release.mjs e publish-release.mjs versionam por tag e publicam instaladores/checksums após builds reais.
- infrastructure/production: nginx/TLS, serviços, backup/restore e runbook; infrastructure/supabase: CA pública e RLS. README e docs/12–15 documentam decisões, configuração, rollback e limites.

## Uso sem conexão e sessões

Os quatro experimentos de camadas, desvios, IEEE 754 e ordem dos bytes são embarcados e funcionam sem API ou sessão. Login, cursos do servidor, avaliação, progresso, rascunhos sincronizados e execução remota continuam exigindo conexão. Na bancada local, avaliação/registro ficam indisponíveis explicitamente; não há resultado fictício nem execução de código não confiável no host do cliente.

Web usa cookies Secure/HttpOnly; clientes instalados usam bearer assinado pelo Better Auth guardado no cofre do SO. Falhas de rede não apagam a sessão; rejeição 401 e logout revogam/limpam a sessão. Não há armazenamento alternativo inseguro. Não foi implementada sincronização offline de alterações ou atualização automática sem assinatura.

## Limitações externas e operação

A API de produção mantém RUNNER_ENABLED=false: solicitações de execução são recusadas com indisponibilidade explícita. Supabase hospeda PostgreSQL, não Docker/gVisor. Antes de habilitar execução, provisionar host Linux e armazenamento privado/gateway de artefatos, ou mover a API para o Linux previsto no runbook. Validar cancelamento, isolamento e downloads no ambiente real.

Recuperação de senha requer Resend e remetente verificado. AAB sem assinatura não é publicável em loja. Instaladores desktop ainda não têm assinatura/notarização. APK debug pode ter certificado diferente do build antigo; não desinstale a cópia existente sem considerar os dados locais. Validar a atualização no aparelho ou usar assinatura de distribuição estável.

Builds Android usam JDK 21/SDK 36 na CI. Desktop usa toolchains próprias de Windows/Linux/macOS. Node 24 é utilizado nos clientes/web/API; runner conserva Node 26. Dependências existentes não foram atualizadas indiscriminadamente. O MCP Vercel continuou indisponível; a publicação real foi feita pela CLI oficial autenticada e Git Integration.

Consulte [builds/deploy](13-distribuicao-e-deploy.md), [API/Supabase](15-supabase-e-api-vercel.md) e [runbook Linux](../infrastructure/production/README.md).
