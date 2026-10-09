import { SupplementView } from "@nucleo/features/pages/SupplementView";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supplements } from "@nucleo/core";
import { PageHeader } from "@nucleo/features/components/PageHeader";
import { SupplementBench } from "@nucleo/features/modules/explore/SupplementBench";
import { SupplementCheck } from "@nucleo/features/modules/explore/SupplementCheck";
export function generateStaticParams() {
  return supplements.map((item) => ({ slug: item.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = supplements.find((item) => item.id === slug);
  return {
    title: item?.title ?? "Experimento",
    description: item?.description,
  };
}
export default async function SupplementPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = supplements.find((item) => item.id === slug);
  if (!item) notFound();
  return <SupplementView item={item} />;
}
