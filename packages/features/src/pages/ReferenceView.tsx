import type {
  UserSummary,
  PublicCatalog,
  ProgressSummary,
  PublicExercise,
  Lab,
  ReferenceDocument,
} from "@nucleo/core";

import { PageHeader } from "@nucleo/features/components/PageHeader";
import { ContentRenderer } from "@nucleo/features/modules/learning/ContentRenderer";
export function ReferenceView({ reference }: { reference: ReferenceDocument }) {
  return (
    <>
      <PageHeader section="Referências" detail={reference.title} />
      <main id="main" className="reference-document">
        <span className="overline">MATERIAL DE APOIO / FONTE ORIGINAL</span>
        <h1>{reference.title}</h1>
        <ContentRenderer blocks={reference.blocks} />
        <footer className="source-attribution">
          <strong>Fernando Mercês / Mente Binária</strong>
          <p>Material do repositório Fundamentos de Engenharia Reversa.</p>
        </footer>
      </main>
    </>
  );
}
