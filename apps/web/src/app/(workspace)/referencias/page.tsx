import { ReferencesView } from "@nucleo/features/pages/ReferencesView";
import Link from "next/link";
import { getCatalog } from "@/lib/server-api";
import { PageHeader } from "@nucleo/features/components/PageHeader";
export const metadata = { title: "Referências" };
export default async function ReferencesPage() {
  const catalog = await getCatalog();
  return <ReferencesView catalog={catalog} />;
}
