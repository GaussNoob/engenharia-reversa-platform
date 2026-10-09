# Design system e direção de arte

## Tese visual

**Uma bancada de engenharia com qualidade editorial.** A identidade combina grandes títulos, leitura calma e instrumentos precisos. O produto mostra o software por dentro através de exemplos que respondem à interação. Tipografia, composição e estado da atividade sustentam a direção visual.

O nome de trabalho é **Núcleo**. A marca pode ser tipográfica, com um pequeno sinal geométrico de organização de camadas. Não usar caveiras, escudos, cadeados, máscaras, verde Matrix, circuitos decorativos ou hexadecimal sem relação com a atividade.

Foi consultada a [home atual do Framer](https://www.framer.com/) e capturado seu primeiro viewport em desktop. A referência contribui com espaço negativo, contraste tipográfico, uma grande superfície de demonstração e apresentação do próprio produto. A paleta, os componentes e as interações serão próprios. Não reproduzir sua marca, layout exato, vídeo ou efeitos de cor.

## Paleta proposta

| Token | Valor | Uso |
| --- | --- | --- |
| `canvas` | `#0d0f10` | Fundo geral |
| `surface` | `#15181a` | Leitura e superfícies de trabalho |
| `panel` | `#1c2023` | Editor, controles e zonas secundárias |
| `raised` | `#242a2e` | Paleta de comandos e menus |
| `ink` | `#f1f0eb` | Texto principal |
| `muted` | `#a7afb5` | Texto secundário legível |
| `metadata` | `#89939a` | Metadados auxiliares; validar sobre cada fundo |
| `accent` | `#e8ba70` | Ação principal, ponto ativo e realce de aprendizado |
| `accent-ink` | `#17130d` | Texto sobre a ação preenchida |
| `focus` | `#f0c589` | Foco visível |
| `positive` | `#b2c7a6` | Resultado correto e adição em diff |
| `negative` | `#e69c88` | Erro, remoção e falha de execução |
| `info` | `#98bbca` | Referência e informação técnica |
| `divider` | `#333a3f` | Separação não interativa |
| `control-border` | `#697681` | Limite de campos quando essencial à identificação |

Grafite e âmbar dominam; cores auxiliares existem para significados definidos. A interface não usa brilho constante. Um halo muito discreto pode acompanhar o foco de uma instrução ou uma superfície demonstrativa, mas não todas as bordas.

Textos comuns precisam de contraste mínimo de 4,5:1. Estados e limites essenciais de controles precisam de contraste de 3:1. Tokens serão verificados nas combinações realmente usadas, inclusive seleção, hover, foco, error, disabled e zoom. A amostra de cores isolada não é prova de acessibilidade de uma página inteira.

As 37 combinações propostas de texto, controles, foco e botão principal passaram pela verificação matemática de contraste. O [registro](../analysis/contrast-check.json) inclui os valores; a revisão de acessibilidade das páginas continua pendente.

## Tipografia pesquisada

| Papel | Família | Aplicação |
| --- | --- | --- |
| Interface e títulos | Instrument Sans | Precisão de navegação e força em títulos grandes |
| Leitura técnica | Literata | Texto longo de aula, com ritmo de livro e confortável leitura digital |
| Código e valores | Commit Mono | Código, endereços, registradores, bytes, terminal e tabelas técnicas |

[Instrument Sans](https://github.com/Instrument/instrument-sans) é uma família variável disponibilizada pelo próprio estúdio. [Literata](https://github.com/googlefonts/literata) foi desenhada para leitura digital longa. [Commit Mono](https://github.com/eigilnikolajsen/commit-mono) é uma fonte de programação com desenho neutro. As três distribuem os arquivos de fonte sob SIL Open Font License; as licenças acompanham os arquivos hospedados localmente.

A escolha é uma proposta a validar em telas de leitura e IDE, especialmente nos pares `0/O`, `1/l/I`, diacríticos portugueses, sublinhados e endereços extensos. Não adicionar uma quarta família por um detalhe de landing page.

| Uso | Tamanho inicial | Entrelinha |
| --- | --- | --- |
| Hero desktop | `clamp(3.25rem, 7.5vw, 7.25rem)` | `0.98–1.04` |
| Título de página | `2.5–4rem` | `1.06–1.15` |
| Título de aula | `2.25–3.25rem` | `1.12` |
| Leitura | `1.125–1.25rem` | `1.7–1.8` |
| Interface principal | `1rem` | `1.45–1.6` |
| Controles e tabelas técnicas | `0.875–1rem` | `1.5` |
| Metadados auxiliares | `0.8125–0.875rem` | `1.5` |

Corpo de leitura entre 58 e 70 caracteres por linha. Tracking negativo é reservado a títulos grandes; código não recebe aperto de espaçamento. Usar números tabulares nos instrumentos e métricas, ligaduras opcionais no editor e zeros distinguíveis. Fontes em WOFF2, hospedadas localmente, com fallback ajustado e `font-display: swap`. Literata pode carregar apenas em superfícies de leitura.

## Composição

Espaçamento base de 4 px, com passos 8, 12, 16, 24, 32, 48, 64, 96 e 128. O intervalo não obriga todos os componentes a uma grade mecânica: serve para manter relações consistentes.

A home usa um grid de 12 colunas, largura máxima por volta de 1440 px e margens fluidas. Títulos podem ocupar oito colunas e descrições quatro. Demonstrações técnicas ocupam grandes superfícies; texto e instrumento alternam de lado durante a narrativa, com eixos de alinhamento claros.

O dashboard tem uma atividade principal dominante, uma faixa de progresso e uma sequência editorial de próximos conteúdos. Métricas auxiliares aparecem em linha ou tipografia, não em seis cards semelhantes. A trilha usa linhas de módulos e expansão de aulas, em vez de uma coleção repetitiva de cartões.

A aula combina navegação estreita, leitura confortável e bancada ajustável. Cada superfície tem densidade adequada: a teoria não imita um terminal; o editor não adota o espaçamento de uma landing page. O aluno pode expandir leitura ou prática sem perder contexto.

## Superfícies e primitives

Cantinhos pequenos: cerca de 4 px para controles, 6–8 px para menus e até 12 px para uma grande janela de demonstração. Não envolver toda informação em um card arredondado.

Separadores aparecem onde há fronteira real: abas de arquivos, editor/terminal, início de seção e linha de módulo. Profundidade usa diferença de luminosidade e sombra contida em elementos sobrepostos. Desfoque de fundo, se usado, é restrito a uma paleta de comandos; leitura e IDE permanecem sólidas.

Primitives previstas: botão, link, campo, seletor, tabs, dialog, tooltip, menu, árvore, splitter, tabela, progress e status. Cada primitive possui variantes de foco, loading útil, erro e desabilitado. A aparência será customizada; não herdar um tema default de biblioteca como identidade final.

Ícones pertencem a uma única família consistente e têm função: busca, expandir árvore, executar, avançar, resetar e indicar arquivo. Tamanho comum 16–20 px. Ícones nunca substituem rótulos essenciais sem nome acessível. Nenhum emoji na interface; símbolos Unicode presentes nos exemplos de codificação continuam como conteúdo técnico original.

## Movimento

| Contexto | Movimento | Duração inicial |
| --- | --- | --- |
| Hover e foco | Cor e luminosidade; sem deslocamento | 120–160 ms |
| Mudança de registrador | Realce da faixa alterada e antes/depois | 140–220 ms |
| Abrir módulo | Expansão suave e preservação de foco | 180–240 ms |
| Reveal editorial | Opacidade + deslocamento de até 12 px | 220–320 ms |
| Alternar aula/código/terminal | Transição de estado sem animar linhas de texto | 160–220 ms |
| Paleta de comandos | Opacidade e escala muito discreta | 140–180 ms |
| Mudança de aula | Conteúdo curto em fade e foco no título | 180–240 ms |

Animações de entrada podem ter stagger curto em um pequeno conjunto de elementos. Não animar cada caractere, repetir reveal ao reler uma seção ou fazer um componente saltar. Não usar partículas, typing falso, números aleatórios ou movimentos que mudem o estado do laboratório sem ação do aluno.

Parallax, se aplicado à home, deve afetar apenas uma área não essencial e desaparecer com reduced motion. Durante uma execução, feedback de status substitui loaders sem informação. Valores não ficam interpolando números fictícios entre estados; o registro mostra o valor técnico resultante.

O sistema respeita `prefers-reduced-motion`, com alterações instantâneas ou fades curtos e nenhuma animação de scroll obrigatória. O conteúdo e as práticas têm exatamente a mesma funcionalidade com movimento reduzido. [Acessibilidade de animações no Motion](https://motion.dev/docs/react-accessibility).

## Responsividade e acessibilidade

Desktop: sidebar de cerca de 232 px, título e breadcrumbs compactos, texto com largura limitada e bancada com espaço suficiente para endereços de 64 bits. O splitter é operável por teclado e possui limites de largura.

Tablet: navegação recolhível e escolha entre leitura e prática quando não couber uma divisão útil. Mobile: tabs Aula, Código e Terminal; estado preservado ao alternar. O visualizador adapta colunas ou permite rolagem dentro da área técnica, sem gerar rolagem horizontal da página inteira.

Telas precisam funcionar a 360 px e com texto ampliado em 200%. Controles de toque têm área de pelo menos 44 × 44 px, mesmo quando o ícone é menor. Inputs têm labels; breadcrumbs, árvores, tabs e resultados de busca têm semântica apropriada. Não usar `role="application"` na página inteira.

Focus states são visíveis em todos os fundos. Dialogs preservam e restauram foco. O editor oferece modo acessível e comandos por botões; atalhos não são a única forma de agir. Mudanças de output e estado usam anúncios resumidos, evitando que um leitor de tela recite um dump inteiro a cada instrução.

## Revisão visual por página

Antes de fechar uma página, verificar a razão de cada componente, a hierarquia de uma captura sem cores, o ponto focal e o uso de dados reais. Composições repetitivas de cards, bordas ou ícones exigem revisão. Também conferir a página vazia, em erro, com título longo, com progresso zero e em mobile; a qualidade não pode depender de dados cuidadosamente curtos.

O acabamento será julgado na experiência implementada, por captura e uso em desktop/mobile. Este documento define a direção; não apresenta o design final como validado.
