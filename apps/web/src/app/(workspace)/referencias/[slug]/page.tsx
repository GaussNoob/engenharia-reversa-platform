import { ReferenceView } from "@nucleo/features/pages/ReferenceView";
import { notFound } from "next/navigation";
import { getCatalog, serverApi } from "@/lib/server-api";
import type { ReferenceDocument } from "@nucleo/core";
import { PageHeader } from "@nucleo/features/components/PageHeader";
import { ContentRenderer } from "@nucleo/features/modules/learning/ContentRenderer";
export default async function ReferencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = await getCatalog();
  if (!catalog.references.some((reference) => reference.slug === slug))
    notFound();
  const reference = await serverApi<ReferenceDocument>(`/references/${slug}`);
  return <ReferenceView reference={reference} />;
}
