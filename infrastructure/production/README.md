# Serviços Linux

O PostgreSQL fica em Docker com porta publicada apenas no loopback. A API e o runner executam via systemd, com contas, ambientes e roles diferentes. O nginx é a única entrada pública. Use um host Linux dedicado à sandbox: pertencer ao grupo docker concede controle do daemon, portanto nenhuma aplicação cliente ou processo de API recebe essa permissão.

1. Instale Node 26, Docker, nginx e gVisor com o script existente em infrastructure/setup-gvisor.sh. Valide docker info e um container real com --runtime=runsc antes de ativar o runner.
2. Crie grupo nucleo, usuários nucleo-api e nucleo-runner, e adicione apenas nucleo-runner ao grupo docker. Crie /var/lib/nucleo/jobs (0700, nucleo-runner:nucleo) e /var/lib/nucleo/artifacts (0750, nucleo-runner:nucleo). Use o mesmo UID/GID do runner nos containers; o código calcula esses valores.
3. Copie o release para /opt/nucleo/releases/<tag> e mantenha /opt/nucleo/current apontando para o release ativo. O código é somente leitura para os serviços. Instale npm ci, prepare conteúdo, assets e imagens conforme README raiz.
4. Em /etc/nucleo, crie postgres-password, api.env e runner.env a partir dos exemplos, com segredos distintos e permissões 0600. Não coloque MIGRATION_DATABASE_URL nos ambientes dos serviços. Nunca versionar esses arquivos.
5. Suba apenas o banco com docker compose -f infrastructure/production/compose.yaml up -d. Execute migrations e seed com credenciais administrativas num processo separado, usando também DATABASE_URL e RUNNER_DATABASE_URL para provisionar as roles restritas.
6. Gere as quatro imagens compiler, python, native e model. O runner cria containers descartáveis fora da API, com rede none, gVisor, limites de recursos e mounts restritos.
7. Instale as unidades systemd, ajuste /usr/bin/node para o executável instalado e configure nginx.conf com o domínio real. Provisione o certificado antes de habilitar o bloco TLS. Rode nginx -t, systemctl daemon-reload e só então habilite os serviços.
8. Configure na API PUBLIC_ORIGIN com o domínio web, API_PROXY_SECRET igual ao segredo da Vercel, e NATIVE_CLIENTS_ENABLED=true. WEB_ORIGINS aceita somente origens exatas; previews utilizam banco/API de staging separados.
9. Verifique /api/live e /api/health via HTTPS, login, progresso, uma execução real e download do artefato. /api/health valida o banco; runner:true informa configuração e não comprova que o worker está saudável. Monitore tarefas com leases vencidos, erros de jobs e logs do runner.

Não exponha 5549/3060 nem o socket Docker à internet. O cliente não contém DATABASE_URL, secrets de autenticação ou acesso a containers.

Backups: agende backup.sh diariamente numa partição criptografada, copie dumps para armazenamento externo criptografado e defina retenção conforme o volume e objetivos de recuperação. O script não remove backups. Faça restore.sh periodicamente para um banco novo; verificar o arquivo não substitui restaurar e conferir contagens e fluxos.

Rollback: preserve o release anterior; pare os serviços, retorne o symlink current ao release anterior e reinicie. Migrations devem ser compatíveis com o release anterior. Uma migração destrutiva requer plano explícito, backup restaurado em teste e autorização; não é revertida automaticamente. Atualizar a imagem postgres exige procedimento próprio, nunca trocar a major version apenas editando o compose.
