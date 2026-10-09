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
export function PlaygroundEnvironmentView({
  environment,
}: {
  environment: string;
}) {
  return (
    <>
      <PageHeader section="Playground" />
      <main id="main" className="page-body playground-page">
        <Playground initial={environment} />
      </main>
    </>
  );
}
