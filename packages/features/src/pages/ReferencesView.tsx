import type {
  UserSummary,
  PublicCatalog,
  ProgressSummary,
  PublicExercise,
  Lab,
  ReferenceDocument,
} from "@nucleo/core";
import { Link } from "@nucleo/platform";
import { PageHeader } from "@nucleo/features/components/PageHeader";
export function ReferencesView({ catalog }: { catalog: PublicCatalog }) {
  return (
    <>
      <PageHeader section="Referências" />
      <main id="main" className="page-body">
        <span className="overline">CONSULTA / APOIO / PROVENIÊNCIA</span>
        <h1 className="page-title">
          Um lugar para
          <br />
          voltar ao essencial.
        </h1>
        <p className="page-intro">
          Tabelas, padrões, APIs e ferramentas que acompanham sua jornada.
          Consulte um detalhe e retorne ao estudo.
        </p>
        <div className="reference-index">
          {catalog.references.map((reference, index) => (
            <Link key={reference.id} href={`/referencias/${reference.slug}`}>
              <span className="mono">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{reference.title}</strong>
                <span>{reference.sourceRefs[0]?.path}</span>
              </div>
              <span className="tag">Consulta</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
