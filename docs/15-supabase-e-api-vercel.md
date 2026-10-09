# ADR 002 — API Hono na Vercel e PostgreSQL gerenciado

O usuário não dispõe de VPS e escolheu Supabase para o banco. A API HTTP existente pode executar em funções Node da Vercel sem alterar as regras de domínio, o Better Auth ou o contrato dos clientes. O runner continua exclusivo de Linux controlado com Docker/gVisor. Supabase REST não substitui a API do produto.

## Distribuição

- Web: projeto engenharia-reversa-platform, root apps/web, Next.js com páginas de servidor.
- API: projeto nucleo-api, root apps/api, framework Hono, Node 24, região gru1. A entrada index.mjs carrega um bundle do mesmo Hono usado pelo servidor Linux.
- Banco: projeto EngenhariaReversa, PostgreSQL Supabase. O runtime usa session pooler IPv4, role nucleo_app e pool de uma conexão por instância. Migrations usam conexão administrativa separada.
- Runner: implantação Linux pendente. RUNNER_ENABLED=false faz o backend recusar novas execuções; nenhum resultado é simulado.

A alternativa de reescrever a API para Supabase Edge Functions foi descartada: Better Auth/pg e o serviço existente são Node, enquanto Edge Functions usam Deno. Embutir a API no Next também acrescentaria dependências desnecessárias à distribuição web.

## Configuração e segurança

Configure na API, somente no servidor: DATABASE_URL, DATABASE_SSL_CA_B64, DATABASE_POOL_MAX=1, BETTER_AUTH_SECRET, PUBLIC_ORIGIN, API_PROXY_SECRET, NATIVE_CLIENTS_ENABLED=true e RUNNER_ENABLED=false. BOOK_DISTRIBUTION_AUTHORIZED permanece false até a autorização do conteúdo. A web recebe API_INTERNAL_URL e o mesmo API_PROXY_SECRET; nenhuma dessas credenciais é NEXT_PUBLIC_. Builds instalados recebem apenas a URL HTTPS pública da API.

O helper databasePoolConfig mantém verificação do certificado e hostname com a CA oficial. Ele remove somente os parâmetros TLS da URI que fariam o parser do pg substituir a CA explícita. Não há rejectUnauthorized=false. Os certificados públicos em infrastructure/supabase/production-ca.crt vieram do Supabase CLI no commit 065888b22180b335a545d8027b056d4cd2473da4; as raízes expiram em 2031 e 2035.

Depois de db:migrate e db:seed, execute infrastructure/supabase/rls.sql no projeto dedicado. As 14 tabelas do Núcleo têm RLS habilitado e privilégios de anon/authenticated revogados. nucleo_app recebe somente os privilégios definidos pelas migrations; nucleo_runner acessa somente fila e artefatos. A política de backend permite suas operações autorizadas; a API continua responsável por verificar sessão e proprietário em cada recurso. O frontend não consulta essas tabelas pelo REST do Supabase.

As chaves Supabase publishable/anon/service_role não são necessárias para Better Auth com PostgreSQL e não foram incorporadas aos aplicativos. Credenciais administrativas e passwords locais ficam em .env.supabase, ignorado pelo Git. Preview deve usar outro banco e outro conjunto de secrets.

## Build reproduzível

npm run build:api compila a API e os módulos compartilhados com esbuild, preservando URLs relativas dos arquivos de dados. Isso evita que o builder da Vercel mantenha exports de workspace apontando para .ts depois de emitir JavaScript. O TypeScript estrito continua validado separadamente na CI. O comando também prepara os dados do servidor usando a fonte auditada fixada em 3d24fc9313560d734d7a27c56c53d695f01163e1 e a dependência Python fixada em scripts/requirements-analysis.txt. A configuração Hono inclui JSON e assets privados na função; nenhum gabarito ou texto integral é copiado para public/. O guard de distribuição existente continua aplicado pelo servidor. O deploy Git exige Git, Python 3 e npm Workspaces no ambiente de build.

## Limites operacionais

A API em função não inicia worker nem Docker. Downloads de artefatos hoje dependem de arquivos no host do runner. Para habilitar execução com a API em função será necessário armazenamento privado de objetos ou um gateway autenticado de artefatos; alternativamente, mova a API para o mesmo ambiente Linux previsto no runbook. Não ative RUNNER_ENABLED antes de validar essa integração, cancelamento e isolamento.

Recuperação de senha depende de RESEND_API_KEY e EMAIL_FROM verificado. Assinatura de instaladores, aprovação Android e atualização automática continuam externas. Não há sincronização offline de alterações.

## Referências

- [Hono na Vercel](https://vercel.com/docs/frameworks/backend/hono)
- [Conexões PostgreSQL Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
