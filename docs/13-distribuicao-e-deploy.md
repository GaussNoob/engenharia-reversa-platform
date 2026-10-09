# Desenvolvimento, distribuição e publicação

## Monorepo

apps/web mantém Next e a landing; apps/desktop contém Tauri; apps/mobile contém Capacitor e Android; apps/api contém Hono; apps/runner executa exclusivamente em Linux. packages/core, models e content são preservados. packages/features, platform, api-client e design-tokens concentram o compartilhamento. infrastructure/production contém nginx, PostgreSQL, systemd e procedimentos de backup/restore.

## Preparação

Use npm ci na raiz. O package-lock.json fixa dependências JavaScript; Cargo.lock fixa as Rust. Consulte README para importação do livro, preparação de assets, migrations e seed. Nunca configure a licença do livro como autorizada sem a autorização correspondente: BOOK_DISTRIBUTION_AUTHORIZED permanece false por padrão.

Node 24 é usado no frontend Vercel e nos testes locais; Node 26 permanece nos ambientes do runner. npm run dev:web inicia o Next; dev:api inicia a API; dev:desktop inicia Tauri e o bundle local; dev:mobile serve a interface Android no navegador para desenvolvimento. A prévia mobile em navegador usa cookies, sem fallback de tokens em localStorage. Ela não substitui o teste em Android.

## Builds independentes

- npm run build:web: assets e build Next, sem módulos nativos.
- npm run build:desktop: instalador Tauri no sistema atual. Defina NUCLEO_API_URL como origem HTTPS real. Windows precisa de MSVC e WebView2; Linux precisa de WebKitGTK/GTK e Secret Service; macOS precisa das ferramentas Apple. Windows gera instalador NSIS .exe; Linux gera .deb/.AppImage; macOS gera .app/.dmg.
- npm run build:desktop:ui: bundle local desktop, antes da etapa Rust.
- npm run build:mobile: bundle local Android, com a mesma origem HTTPS da API.
- npm run build:android: build da interface, cap sync android e Gradle assembleDebug. Gera APK de teste.
- npm run build:aab: interface, sync e Gradle bundleRelease. Sem signingConfig, o AAB é não assinado e não é um release de loja.

Para prévias locais: node scripts/build-native.mjs desktop --development e node scripts/build-native.mjs mobile --development. Essas saídas são de desenvolvimento e não devem ser publicadas como releases. A origem padrão local é http://localhost:3060. Em Android real, localhost é o aparelho; configure uma API HTTPS acessível antes de empacotar.

O projeto Android foi preparado a partir do template oficial do Capacitor 8.5.3 e tem identidade com.nucleo.estudo. Execute npm run sync:android -w @nucleo/mobile antes de abrir o projeto. Esse passo gera a lista real de plugins e copia assets; exige uma CLI em ambiente com acesso normal ao usuário do sistema. Requisitos: Android Studio 2025.2.1+, JDK 21 e SDK/API 36. Não habilite cleartext ou mixed content para contornar TLS. iOS está fora do escopo desta entrega.

## Backend

Siga infrastructure/production/README.md. São necessários servidor Linux, domínio da API, TLS, PostgreSQL, Node, Docker/gVisor e permissões dos serviços. A API fica no loopback atrás do nginx. Somente o runner recebe acesso ao daemon Docker; a API não recebe o ambiente do runner nem as credenciais administrativas de migration.

NATIVE_CLIENTS_ENABLED=true habilita tokens assinados e as origens locais de Tauri/Capacitor. WEB_ORIGINS é uma lista de origens HTTPS exatas para outros clientes web autorizados. Não utilize wildcard de previews nem aceite qualquer Origin. API_PROXY_SECRET só fica na API e no ambiente de servidor da Vercel. NUCLEO_API_URL é público e pode ser embarcado; DATABASE_URL, BETTER_AUTH_SECRET e secrets de proxy/email não podem.

Configure RESEND_API_KEY e EMAIL_FROM juntos para recuperação de senha. Sem o transporte, a interface informa indisponibilidade em vez de simular um envio. Valide o domínio remetente no provedor e faça um teste real antes de disponibilizar a recuperação.

## Vercel

Ao criar o projeto, conecte-o ao repositório GitHub. Root Directory: apps/web. Node: 24.x. apps/web/vercel.json executa npm ci na raiz e prepara Monaco antes do next build. Os pacotes compartilhados são resolvidos pelo workspace/tsconfig e transpilePackages. Não altere output para export.

Variáveis de produção, todas somente no servidor:

- API_INTERNAL_URL: https://api.seudominio.com, sem barra final ou path.
- PUBLIC_ORIGIN: origem HTTPS do domínio do site.
- API_PROXY_SECRET: o mesmo valor aleatório usado na API.

Crie ambiente preview com API/banco de staging separados e suas próprias variáveis. PUBLIC_ORIGIN deve corresponder à URL autorizada do preview e a API de staging precisa incluí-la exatamente; preview de forks não deve receber secrets. Não configure produção para aceitar todos os domínios vercel.app.

O domínio é configurado no projeto Vercel e no DNS, mantendo os registros indicados pela plataforma. HTTPS só deve ser considerado validado após o domínio estar ativo e a resposta apresentar os headers esperados. O frontend já mantém CSP, HSTS sob HTTPS, proteção contra framing, nosniff e Permissions-Policy.

O MCP precisa estar conectado à conta/equipe que controla o projeto; sem isso não há capacidade de criar projeto ou deployment nesta sessão. Alternativamente, o workflow web-deploy usa VERCEL_ORG_ID, VERCEL_PROJECT_ID e VERCEL_TOKEN de ambiente GitHub, com um deploy manual separado para preview/production. Configure aprovações de ambiente para produção. O workflow usa a CLI Vercel fixada; Git Integration também pode publicar os commits da main após vincular o projeto.

Validação após publicação: landing, aliases login/register/app, login e logout, dashboard protegido, aula, laboratório, rascunho, progresso, execução real em gVisor, cancelamento e download autenticado. Um build Next concluído não comprova esses serviços externos.

Rollback web: escolha o deployment anterior validado na Vercel e restaure/promova seu alias de produção. Mantenha a API compatível durante a troca; rollback do frontend não reverte migrations. Consulte o runbook Linux para retornar releases dos serviços.

## CI e releases

quality.yml faz npm ci, conteúdo auditado, typecheck, lint de dependências/formatação, unitários, Next e bundles nativos. Usa PostgreSQL efêmero para a integração de sessões nativas. Testes UI usam fixtures apenas no ambiente de testes e não simulam os serviços em produção.

desktop.yml gera artefatos Windows/Linux/macOS por tag vX.Y.Z. mobile.yml gera APK de debug e AAB não assinado por tag. Nenhum desses workflows declara assinatura concluída. version-release.mjs aplica a tag aos manifests e ao versionCode Android. Não crie uma tag de release até os checks passarem e NUCLEO_API_URL estar configurada no repositório. workflow_dispatch permite api_origin explícita para um build de teste, sem alterar a variável de produção. Artefatos compilados com uma API de teste não são releases publicáveis.

Assinatura Android: crie um keystore de release fora do repositório, defina NUCLEO_ANDROID_KEYSTORE (caminho absoluto), NUCLEO_ANDROID_STORE_PASSWORD, NUCLEO_ANDROID_KEY_ALIAS e NUCLEO_ANDROID_KEY_PASSWORD no ambiente de build. O Gradle já usa essas quatro variáveis somente quando todas estão presentes; sem elas o AAB fica não assinado. Separe esses secrets no CI e forneça o keystore por arquivo externo e use chave de upload separada da chave de distribuição Play App Signing. Não versione senhas ou keystores. Valide com apksigner e bundletool antes de submeter. Certificados/chaves não foram fornecidos nesta sessão.

Assinatura desktop: Windows usa certificado/provider de code signing e timestamp; macOS usa Developer ID e notarização. Configure pelo ambiente de CI e overlays de Tauri, com secrets separados de URLs públicas. A assinatura de instalador é distinta da assinatura exigida pelo updater. Para habilitar updater futuro, será necessário manifest e downloads HTTPS, chave pública embarcada, chave privada protegida e validação de assinatura; nenhum fallback sem verificação deve ser introduzido.

## Loja Android

A interface é embarcada e os dados vêm da API; não há download remoto de JavaScript para trocar a funcionalidade do app. Os laboratórios usam o servidor isolado e simuladores didáticos. Disponibilize política de privacidade, suporte e declaração de coleta de dados coerente com email, sessões, progresso e rascunhos. A exclusão de conta foi implementada. Valide requisitos de exclusão dentro e fora do app, classificação de conteúdo, target SDK, acessibilidade e funcionamento real antes de submeter. Configurar um AAB não comprova aprovação na loja.

Fontes: [Capacitor](https://capacitorjs.com/docs/getting-started/environment-setup), [Google Play: funcionalidade e experiência](https://support.google.com/googleplay/android-developer/answer/9898783), [Tauri: assinatura Windows](https://v2.tauri.app/distribute/sign/windows/), [Tauri: updater](https://v2.tauri.app/plugin/updater/).
