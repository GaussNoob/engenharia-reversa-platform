# Revisão da experiência — 7 de outubro de 2026

O ambiente local está em http://localhost:3050. A configuração usa PostgreSQL independente, API e runner separados; não utiliza Supabase. Instruções de instalação e limites de publicação estão no [README](../README.md).

## Alterações verificadas

- Anatomia 3D: selecionar CPU, memória ou executável isola a camada. Cada parte possui uma seleção equivalente por teclado, informações técnicas e uma ação para visualizar apenas aquele componente. Os bytes mostram o endereço, o valor e a interpretação do exemplo.
- IEEE 754: nova composição para comparar o valor digitado com o valor efetivamente armazenado. Bits organizados por byte, distinção entre sinal/expoente/fração, reconstrução do número e representação little-endian. Os valores especiais continuam disponíveis.
- Aulas no celular: acesso fixo abre a bancada sobre a leitura. Código e posição de leitura são preservados ao fechar; o painel acompanha o viewport do teclado virtual e mantém o fechamento visível durante a rolagem.
- Editor: autocomplete contextual, snippets, símbolos locais e informações de funções em Python, C, C++, Assembly e FASM. Monaco no desktop; CodeMirror em dispositivos móveis. O índice é local e não substitui análise semântica completa de um servidor de linguagem.
- Seletores: menus próprios em todas as seleções de linguagem, arquitetura, largura, operação, codificação e interpretação. Suportam teclado, busca por prefixo e posicionamento sobre o modal móvel. Nenhum `select` nativo permanece no frontend.
- Navegação: item ativo neutro, sem a borda lateral laranja.
- Imagens: corrigido o caminho de leitura dos assets na API. Todas as 28 imagens originais responderam com PNG válido; a aula oferece ampliação e zoom.
- Operações de bits: entradas, bytes e resultados reorganizados para a coluna lateral e para telas pequenas, incluindo valores de 64 bits.
- Monaco: runtime e worker locais, compilados com DOMPurify 3.4.16. A compilação verifica a inclusão efetiva do sanitizador; os antigos assets AMD gerados foram removidos da pasta pública.

## Resultado da validação

| Verificação | Resultado |
| --- | --- |
| Auditoria e importação do conteúdo | 63 aulas, 35 desafios de laboratório, 141 blocos originais, 43 tabelas e 28 imagens conferidos |
| TypeScript | Checagem do workspace web e de seus pacotes importados aprovada |
| Testes unitários | 20 aprovados |
| Testes de integração | 11 aprovados |
| Testes E2E Chromium | 11 aprovados |
| Build de produção | Aprovado |
| Auditoria npm | Zero vulnerabilidades conhecidas |
| Layout da home | 320, 390, 768, 1024 e 1440 px, sem overflow horizontal ou erros de página |
| Layout de bits, float e anatomia | 15 combinações de página e largura, sem overflow horizontal ou erros de página |

Os E2E exercitam criação de conta, login, conclusão de aula, persistência, restauração do código após recarregar, execução e validação do desafio, busca, edição móvel, sugestões nas cinco linguagens, menus, imagens e redução de movimento. A integração executa Python, C e modelos de Assembly em gVisor, verificando limites de saída, timeout, cancelamento, autorização entre contas, concorrência e rascunhos.

As capturas e as medidas de layout ficam em `.runtime/qa`. Esses resultados comprovam o ambiente local avaliado. A redistribuição integral do livro exige autorização da fonte; execução nativa de Windows e transporte de recuperação de senha continuam fora dos recursos disponíveis nesta instalação.
