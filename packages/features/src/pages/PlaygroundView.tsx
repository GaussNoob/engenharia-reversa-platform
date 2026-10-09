import type {
  UserSummary,
  PublicCatalog,
  ProgressSummary,
  PublicExercise,
  Lab,
  ReferenceDocument,
} from "@nucleo/core";
import { PageHeader } from "@nucleo/features/components/PageHeader";
import { Playground } from "@nucleo/features/modules/labs/Playground";
export function PlaygroundView({}: {}) {
  return (
    <>
      <PageHeader section="Playground" />
      <main id="main" className="page-body playground-page">
        <span className="overline">CURIOSIDADE SEM ROTEIRO</span>
        <h1 className="page-title">
          Uma bancada aberta
          <br />
          para as suas perguntas.
        </h1>
        <p className="page-intro">
          Experimente um conceito fora da sequência da aula. Mude o código,
          altere um byte e procure a relação.
        </p>
        <Playground />
      </main>
    </>
  );
}
