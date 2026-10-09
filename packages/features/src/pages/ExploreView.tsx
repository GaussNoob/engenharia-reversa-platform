import type {
  UserSummary,
  PublicCatalog,
  ProgressSummary,
  PublicExercise,
  Lab,
  ReferenceDocument,
} from "@nucleo/core";
import { Link } from "@nucleo/platform";
import { ArrowUpRight } from "lucide-react";
import { supplements } from "@nucleo/core";
import { PageHeader } from "@nucleo/features/components/PageHeader";
export function ExploreView({}: {}) {
  return (
    <>
      <PageHeader section="Experimentos" />
      <main id="main" className="page-body explore-page">
        <span className="overline">ALÉM DA TRILHA / CONTEÚDO COMPLEMENTAR</span>
        <h1 className="page-title">
          Novas formas
          <br />
          de enxergar o código.
        </h1>
        <p className="page-intro">
          Pequenas investigações para conectar conceitos. Estes materiais foram
          criados para a plataforma e complementam o livro, com referências
          próprias.
        </p>
        <div className="experiment-index">
          {supplements.map((item, index) => (
            <Link
              key={item.id}
              href={`/explorar/${item.id}`}
              className="experiment-index-row"
            >
              <span className="experiment-number mono">0{index + 1}</span>
              <div>
                <span className="overline">{item.label}</span>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                <span className="experiment-concepts">{item.concept}</span>
              </div>
              <span className="experiment-time">
                {item.minutes} min
                <ArrowUpRight size={22} />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
