import { PlaygroundEnvironmentView } from "@nucleo/features/pages/PlaygroundEnvironmentView";
import { notFound } from "next/navigation";
import { PageHeader } from "@nucleo/features/components/PageHeader";
import { Playground } from "@nucleo/features/modules/labs/Playground";
export default async function PlaygroundEnvironmentPage({
  params,
}: {
  params: Promise<{ environment: string }>;
}) {
  const { environment } = await params;
  if (
    ![
      "assembly",
      "c",
      "hex",
      "pe",
      "memory",
      "encoding",
      "float",
      "flow",
      "anatomy",
    ].includes(environment)
  )
    notFound();
  return <PlaygroundEnvironmentView environment={environment} />;
}
