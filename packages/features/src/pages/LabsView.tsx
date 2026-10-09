import type {
  UserSummary,
  PublicCatalog,
  ProgressSummary,
  PublicExercise,
  Lab,
  ReferenceDocument,
} from "@nucleo/core";
import { LabCatalog } from "@nucleo/features/modules/labs/LabCatalog";
import { PageHeader } from "@nucleo/features/components/PageHeader";
export function LabsView({ catalog }: { catalog: PublicCatalog }) {
  return (
    <>
      <PageHeader section="Laboratórios" />
      <main id="main" className="page-body">
        <span className="overline">CONCEITOS QUE RESPONDEM</span>
        <h1 className="page-title">
          Aprenda colocando
          <br />
          as mãos nos bytes.
        </h1>
        <p className="page-intro">
          Cada bancada conecta um conceito a um efeito observável. Edite,
          avance, inspecione e confira o que mudou.
        </p>
        <LabCatalog catalog={catalog} />
      </main>
    </>
  );
}
