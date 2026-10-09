import { CodeSnippet } from "@nucleo/features/components/CodeSnippet";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  MousePointer2,
} from "lucide-react";
import { Navigation } from "@nucleo/features/components/Navigation";
import { DemoStepper } from "@nucleo/features/modules/labs/DemoStepper";
import { SoftwareScene } from "@nucleo/features/modules/scene/SoftwareScene";
import { ByteStory } from "@/modules/landing/ByteStory";
import { BinaryStory } from "@/modules/landing/BinaryStory";
import { Reveal } from "@/modules/landing/Reveal";
import coursePlan from "../../../../analysis/course-plan.json";

export default function Home() {
  const { modules } = coursePlan;
  const labCount = modules.reduce((sum, module) => sum + module.labCount, 0);
  const lessons = modules.reduce(
    (sum, module) => sum + module.lessons.length,
    0,
  );
  return (
    <div className="landing-v2">
      <Navigation variant="marketing" />
      <main id="main">
        <section className="landing-hero landing-container">
          <div className="landing-hero-copy">
            <div className="landing-eyebrow">
              <span className="status-pip" />
              <span>ENGENHARIA REVERSA EM PORTUGUÊS</span>
            </div>
            <h1>
              Entenda
              <br />o software
              <br />
              por <em>dentro.</em>
            </h1>
            <p className="landing-hero-description">
              Aprenda a abrir um executável, ler o Assembly
              <br className="desktop-break" /> e acompanhar o que acontece na
              memória,
              <br className="desktop-break" /> testando tudo no navegador.
            </p>
            <div className="landing-actions">
              <Link href="/aprender/fundamentos" className="button">
                Começar pela primeira aula
                <ArrowUpRight size={18} />
              </Link>
              <a href="#a-experiencia" className="landing-secondary">
                Ver como funciona
                <ArrowDown size={15} />
              </a>
            </div>
            <div className="hero-proof">
              <span>EXERCÍCIOS CORRIGIDOS</span>
              <i />
              <span>SEM INSTALAR NADA</span>
              <i />
              <span>NO SEU RITMO</span>
            </div>
          </div>
          <div className="landing-hero-scene">
            <SoftwareScene />
          </div>
          <div className="landing-hero-bottom">
            <span>Clique numa camada do modelo para ver o que tem dentro.</span>
            <a href="#a-experiencia">
              <span>CONTINUAR</span>
              <ArrowDown size={15} />
            </a>
            <span className="mono">01 — 09</span>
          </div>
        </section>
        <div className="landing-foundation">
          <div className="landing-container foundation-inner">
            <p>
              Baseado num livro aberto
              <br />
              <strong>e com prática em cada aula.</strong>
            </p>
            <div>
              <strong>{String(modules.length).padStart(2, "0")}</strong>
              <span>módulos</span>
            </div>
            <div>
              <strong>{lessons}</strong>
              <span>aulas</span>
            </div>
            <div>
              <strong>{labCount}</strong>
              <span>laboratórios</span>
            </div>
            <p className="foundation-source">
              A partir de{" "}
              <cite>
                Fundamentos
                <br />
                de Engenharia Reversa
              </cite>
              <span>Fernando Mercês · Mente Binária</span>
            </p>
          </div>
        </div>
        <section
          id="a-experiencia"
          className="landing-container experience-section"
        >
          <Reveal>
            <div className="section-kicker">
              <span>01 / ASSEMBLY</span>
              <span className="section-rule" />
            </div>
            <div className="experience-heading">
              <h2>
                Uma instrução por vez,
                <br />
                <span>com o estado à vista.</span>
              </h2>
              <p>
                Ler <code>add rax, 3</code> é fácil.
                <br />
                Difícil é lembrar o que muda nas flags.
              </p>
            </div>
          </Reveal>
          <Reveal className="instruction-story">
            <div className="story-copy">
              <span className="story-index mono">CPU / ESTADO / INSTRUÇÃO</span>
              <h3>
                Rode uma linha
                <br />e veja o que mudou.
              </h3>
              <p>
                Cada clique executa uma instrução, e os registradores que
                mudaram ficam destacados. Fica bem mais fácil perceber quando o
                resultado não é o que você esperava.
              </p>
              <Link className="story-link" href="/playground/assembly">
                Abrir o simulador de Assembly
                <ArrowUpRight size={17} />
              </Link>
              <div className="story-tip">
                <MousePointer2 size={16} />
                <span>
                  Clique em <strong>Avançar instrução</strong> aqui do lado.
                </span>
              </div>
            </div>
            <div className="story-product">
              <DemoStepper />
              <div className="product-footnote">
                <span className="mono">MOV → ADD → MOV → XOR</span>
                <span>Simulação real, não animação.</span>
              </div>
            </div>
          </Reveal>
        </section>
        <section className="memory-story-section">
          <div className="landing-container">
            <Reveal className="memory-story-layout">
              <ByteStory />
              <div className="story-copy">
                <div className="section-kicker">
                  <span>02 / MEMÓRIA</span>
                </div>
                <h2>
                  Quatro bytes,
                  <br />
                  <span>duas ordens possíveis.</span>
                </h2>
                <p>
                  Num dump de memória, o mesmo trecho pode ser um número, parte
                  de um texto ou um endereço. Saber ler isso é metade do
                  trabalho de quem faz engenharia reversa.
                </p>
                <p>
                  Troque entre little-endian e big-endian ao lado e veja por que
                  0x12345678 aparece como 78 56 34 12 num PC comum.
                </p>
                <Link className="story-link" href="/playground/memory">
                  Abrir o laboratório de memória
                  <ArrowUpRight size={17} />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
        <section className="landing-container executable-story">
          <Reveal className="executable-story-layout">
            <div className="story-copy">
              <div className="section-kicker">
                <span>03 / EXECUTÁVEIS</span>
              </div>
              <h2>
                O que tem dentro
                <br />
                <span>de um .exe.</span>
              </h2>
              <p>
                Cabeçalhos, seções, funções importadas e o ponto onde o programa
                começa a rodar. Você aprende a achar cada um desses pedaços
                olhando direto para os bytes do arquivo.
              </p>
              <Link className="story-link" href="/playground/pe">
                Abrir o inspetor de PE
                <ArrowUpRight size={17} />
              </Link>
              <div className="source-pill">
                <Code2 size={15} />
                <span>
                  Arquivo de exemplo feito para o curso · nada sai do seu
                  navegador
                </span>
              </div>
            </div>
            <BinaryStory />
          </Reveal>
        </section>
        <section className="workbench-story">
          <div className="landing-container">
            <Reveal>
              <div className="section-kicker">
                <span>04 / CÓDIGO</span>
                <span className="section-rule" />
              </div>
              <div className="experience-heading">
                <h2>
                  Escreva, compile
                  <br />
                  <span>e confira a saída.</span>
                </h2>
                <p>
                  C, Python e Assembly direto na aula.
                  <br />O código roda num ambiente isolado.
                </p>
              </div>
            </Reveal>
            <Reveal className="workbench-showcase">
              <div className="workbench-showcase-sidebar">
                <span className="mono">A SUA BANCADA</span>
                <div className="showcase-file">
                  <Code2 size={16} />
                  primeiro_programa.c
                </div>
                <p>
                  <Check size={15} />
                  Edite o exemplo da aula
                </p>
                <p>
                  <Check size={15} />
                  Rode sem instalar compilador
                </p>
                <p>
                  <Check size={15} />
                  Seu código fica salvo na conta
                </p>
                <Link className="button" href="/playground/c">
                  Abrir o editor
                  <ArrowUpRight size={17} />
                </Link>
              </div>
              <div className="showcase-code">
                <header>
                  <span>primeiro_programa.c</span>
                  <span>C / GCC</span>
                </header>
                <CodeSnippet
                  language="c"
                  source={
                    '// Em que ordem os bytes ficam na memória?\n#include <stdio.h>\n\nint main(void) {\n    unsigned int valor = 0x12345678;\n    unsigned char *bytes = (unsigned char *)&valor;\n\n    for (unsigned int i = 0; i < sizeof(valor); i++)\n        printf("%02X ", (unsigned int)bytes[i]);\n\n    return 0;\n}'
                  }
                />
                <div className="showcase-output">
                  <span className="mono">STDOUT / LITTLE-ENDIAN</span>
                  <strong>78 56 34 12</strong>
                  <span>O byte menos significativo vem primeiro.</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
        <section id="a-trilha" className="landing-container curriculum-story">
          <Reveal>
            <div className="section-kicker">
              <span>A TRILHA</span>
              <span className="section-rule" />
            </div>
            <div className="experience-heading">
              <h2>
                Do primeiro byte
                <br />
                <span>ao programa inteiro.</span>
              </h2>
              <p>
                Primeiro números, texto e arquivos.
                <br />
                Depois PE, Windows, Assembly e depuração.
              </p>
            </div>
          </Reveal>
          <div className="curriculum-story-list">
            {modules.map((module, index) => (
              <Reveal key={module.id} delay={(index % 3) * 45}>
                <Link
                  href={`/aprender/fundamentos#${module.id}`}
                  className="curriculum-story-row"
                >
                  <span className="mono curriculum-number">
                    {module.id.slice(0, 2)}
                  </span>
                  <div>
                    <h3>{module.title}</h3>
                    <p>
                      {module.lessons
                        .slice(0, 3)
                        .map((lesson) => lesson.title)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="curriculum-lesson-count">
                    {module.lessons.length} aulas
                    <span>{module.labCount} laboratórios</span>
                  </span>
                  <ArrowUpRight size={21} />
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="curriculum-story-footer">
            <span>
              Crie uma conta para salvar o progresso e continuar de onde parou.
            </span>
            <Link className="story-link" href="/aprender/fundamentos">
              Ver todos os módulos
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
        <section className="landing-container extra-story">
          <Reveal>
            <div className="section-kicker">
              <span>EXTRAS</span>
            </div>
            <Link href="/explorar" className="extra-story-link">
              <div>
                <h2>Experimentos fora do livro.</h2>
                <p>
                  Saltos com e sem sinal, ponto flutuante bit a bit e ordem dos
                  bytes. Bons para quando uma aula deixou alguma dúvida.
                </p>
              </div>
              <ArrowUpRight size={35} />
            </Link>
          </Reveal>
        </section>
        <section className="landing-close">
          <div className="landing-close-grid" aria-hidden="true" />
          <Reveal>
            <span className="section-kicker">POR ONDE COMEÇAR</span>
            <h2>
              Sabe um pouco de programação?
              <br />
              Já <em>dá para começar.</em>
            </h2>
            <p>
              A trilha começa por como o computador guarda números.
              <br />
              Não precisa saber Assembly antes.
            </p>
            <Link href="/aprender/fundamentos" className="button">
              Ir para a primeira aula
              <ArrowUpRight size={18} />
            </Link>
          </Reveal>
        </section>
      </main>
      <footer className="landing-footer landing-container">
        <div>
          <Link href="/" className="brand">
            núcleo<span className="brand-dot">.</span>
          </Link>
          <p>
            Um curso prático de engenharia reversa,
            <br />
            em português.
          </p>
        </div>
        <nav aria-label="Links do rodapé">
          <Link href="/aprender/fundamentos">Trilha de aprendizado</Link>
          <Link href="/laboratorios">Laboratórios</Link>
          <Link href="/explorar">Experimentos</Link>
          <Link href="/referencias/sobre-o-livro">Livro e fontes</Link>
        </nav>
        <span className="mono">CONTEÚDO BASEADO NO LIVRO DA MENTE BINÁRIA</span>
      </footer>
    </div>
  );
}
