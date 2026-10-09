import type {
  UserSummary,
  PublicCatalog,
  ProgressSummary,
  PublicExercise,
  Lab,
  ReferenceDocument,
} from "@nucleo/core";
import { Link } from "@nucleo/platform";
import { supplements } from "@nucleo/core";
import { PageHeader } from "@nucleo/features/components/PageHeader";
import { SupplementBench } from "@nucleo/features/modules/explore/SupplementBench";
import { SupplementCheck } from "@nucleo/features/modules/explore/SupplementCheck";
export function SupplementView({
  item,
  offline = false,
}: {
  item: (typeof supplements)[number];
  offline?: boolean;
}) {
  const next =
    supplements[(supplements.indexOf(item) + 1) % supplements.length]!;
  return (
    <>
      <PageHeader section="Experimentos" detail={item.label} />
      <main id="main" className="page-body supplement-page">
        <div className="lab-detail-intro">
          <span className="overline">
            CONTEÚDO COMPLEMENTAR / {item.minutes} MIN
          </span>
          <h1>{item.title}</h1>
          <p>{item.objective}</p>
        </div>
        <div className="supplement-layout">
          <div>
            <div className="standalone-bench supplement-bench">
              <SupplementBench id={item.id} />
            </div>
            <section className="supplement-takeaway">
              <span className="overline">O QUE ESSA EXPERIÊNCIA MOSTRA</span>
              <p>{item.takeaway}</p>
            </section>
          </div>
          <aside>
            <section className="experiment-guide">
              <span className="overline">ROTEIRO DE INVESTIGAÇÃO</span>
              <ol>
                {item.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
            {offline ? (
              <section className="experiment-guide">
                <span className="overline">BANCADA LOCAL</span>
                <p>
                  Explore livremente. A avaliação e o registro de progresso
                  ficam disponíveis ao conectar sua conta.
                </p>
              </section>
            ) : (
              <SupplementCheck id={item.id} />
            )}
            <section className="supplement-sources">
              <span className="overline">PARA INVESTIGAR MAIS</span>
              {item.sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {source.title} ↗
                </a>
              ))}
            </section>
          </aside>
        </div>
        <nav className="supplement-next" aria-label="Outros experimentos">
          <Link href="/explorar">Todos os experimentos</Link>
          <Link href={`/explorar/${next.id}`}>
            Próxima investigação: {next.title} →
          </Link>
        </nav>
      </main>
    </>
  );
}
