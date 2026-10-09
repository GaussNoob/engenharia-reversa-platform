# ADR 001 — interface compartilhada e shells locais

Status: implementado. Targets: Web, Desktop e Android. iOS foi retirado do escopo por solicitação do usuário.

## Contexto

A base já separava Next.js, Hono, PostgreSQL e um runner Linux com Docker/gVisor. Essa separação é preservada. A auditoria confirmou Next 16.4.0, React 19.3.0, TypeScript 7.0.2 e Better Auth 1.7.7. O ambiente local usa Node 24.21.0; a web fixa Node 24, suportado pela Vercel, e as imagens do runner continuam com Node 26. As dependências existentes foram preservadas. O gVisor local foi identificado como release-20260928.0; a distribuição nova e a CI fixam essa versão e validam o runtime antes de qualquer atualização.

A aplicação usa páginas de servidor, cookies e rotas dinâmicas. A página de aula encontrada vazia foi restaurada. A documentação local instalada do Next estava incompleta, então as decisões também foram conferidas na documentação oficial.

## Decisão

Manter Next.js na web e compartilhar os componentes e a composição visual educacional em React. As páginas web continuam buscando dados no servidor e passam props para as mesmas views usadas pelos shells. Não houve conversão da web inteira em SPA ou exportação estática.

O Tauri 2 e o Capacitor 8 empacotam bundles locais criados com esbuild, já presente na stack. Cada aplicação tem entrada, target, build e adaptações próprias. Uma composição instalada compartilhada resolve as rotas existentes por hash, consulta a API, exige sessão e inicia em login/dashboard. Não importa a página de marketing nem possui uma rota para ela. Os experimentos 3D também são conteúdo educacional; foram movidos para um módulo de cenas compartilhado, separado da landing.

Pacotes novos:

- api-client: HTTP, erros, assets, transporte Bearer e contrato mínimo de cofre de sessão.
- platform: contrato de navegação, links, download e abertura de URLs. Implementações ficam nos clientes.
- features: componentes, views, hooks, editores e estilos reais da experiência educacional. Reexports antigos preservam caminhos de importação existentes.
- design-tokens: paleta e fontes CSS existentes, sem alteração de identidade.

Não foram criados ui/auth-client separados porque não acrescentariam uma responsabilidade independente nesta entrega. core, models e content permanecem com suas responsabilidades originais. O lint impede dependências de Next/Tauri/Capacitor no código de features e dependências de interface no domínio.

## Alternativas consideradas

Exportar o Next existente: rejeitado porque sessões por request e páginas dinâmicas dependem de servidor. Remover esses recursos apenas para obter HTML estático quebraria os fluxos.

Carregar o site remoto dentro dos aplicativos: rejeitado para esta entrega porque vincularia o produto instalado ao deploy web, impediria a separação física da landing e dificultaria controle de CSP, versões e análise pelas lojas.

Reescrever os clientes: rejeitado por duplicar regras, aparência e manutenção. A extração mantém o mesmo editor, simulador e conteúdo visual.

## Autenticação e sincronização

Web: cookies Better Auth, HttpOnly e Secure sob HTTPS. O navegador usa /api no próprio domínio, e o Next encaminha para a API. SSR continua verificando sessões no backend.

Instalados: plugin Bearer com requireSignature=true; sessão no PostgreSQL e validação real em cada endpoint privado. Tauri usa keyring (Credential Manager, Keychain ou Secret Service) via comandos limitados. Android usa SecureStorage com proteção nativa; a integração iCloud é desabilitada e backups Android estão desativados. Não há token em localStorage nem segredo de servidor nos bundles.

Expiração, renovação, logout, troca de senha, exclusão de conta e revogação seguem Better Auth. Recuperação envia um link HTTPS para a web e revoga sessões após a troca. Email/senha não exige callback/deep link nativo. Se OAuth for adicionado futuramente, será necessário implementar esse fluxo explicitamente.

Todos os clientes consultam o mesmo progresso e exercícios. Rascunhos mantêm expectedVersion e a proteção contra sobrescrita concorrente. A retomada atualiza a sessão; uma falha temporária de rede não apaga a credencial. Não há fila offline de alterações nem sincronização em tempo real nesta versão.

## Consequências e limites

As views compartilhadas podem executar no servidor Next ou no cliente nativo. Carregamento de editores e Three.js permanece sob demanda, com movimento reduzido preservado. Android força CodeMirror, usa safe areas com fallback do SystemBars, teclado configurado, controles maiores e compartilhamento nativo de downloads. Desktop mantém Monaco, sidebar, atalhos de busca, janela redimensionável e diálogo de salvar.

Os aplicativos locais ainda precisam de conectividade para autenticação, conteúdo e progresso. Os modelos de CPU são didáticos e locais; nenhum cliente executa código não confiável no host. Execução remota continua cliente → API → fila PostgreSQL → runner → Docker/gVisor.

Atualização automática não foi habilitada: sem endpoint de releases, chaves e instaladores assinados, isso seria incompleto. A distribuição inicial usa instaladores versionados e atualização manual. Assinatura de código e updater são tarefas externas descritas no runbook.

## Fontes verificadas

- [Next: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next: Static Exports](https://nextjs.org/docs/app/guides/static-exports)
- [Tauri: integração com Next](https://v2.tauri.app/start/frontend/nextjs/)
- [Better Auth: Bearer](https://better-auth.com/docs/plugins/bearer)
- [Capacitor 8: requisitos](https://capacitorjs.com/docs/getting-started/environment-setup)
- [Capacitor: SystemBars e safe areas](https://capacitorjs.com/docs/apis/system-bars)
- [Vercel: versões Node suportadas](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)

- [Capacitor: Keyboard Android](https://capacitorjs.com/docs/apis/keyboard)
- [gVisor: instalação e distribuição completa](https://gvisor.dev/docs/user_guide/install/)
