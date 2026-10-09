import type {
  UserSummary,
  PublicCatalog,
  ProgressSummary,
  PublicExercise,
  Lab,
  ReferenceDocument,
} from "@nucleo/core";

import { PageHeader } from "@nucleo/features/components/PageHeader";
import { ExerciseCatalog } from "@nucleo/features/modules/exercises/ExerciseCatalog";
export function ExercisesView({
  catalog,
  exercises,
}: {
  catalog: PublicCatalog;
  exercises: PublicExercise[];
}) {
  return (
    <>
      <PageHeader section="Exercícios" detail="Uma hipótese. Um resultado." />
      <main id="main" className="page-body exercises-page">
        <div className="exercise-catalog-intro">
          <div>
            <span className="overline">APRENDA FAZENDO</span>
            <h1>
              O próximo passo
              <br />é experimentar.
            </h1>
            <p>
              Preveja um resultado. Investigue na bancada. Transforme os
              conceitos da trilha em decisões que você sabe explicar.
            </p>
          </div>
          <div className="exercise-catalog-total">
            <strong>{exercises.length}</strong>
            <span>exercícios complementares</span>
            <small>9 módulos · do primeiro byte à depuração</small>
          </div>
        </div>
        <ExerciseCatalog
          exercises={exercises}
          modules={catalog.modules.map(({ number, title }) => ({
            number,
            title,
          }))}
        />
      </main>
    </>
  );
}
