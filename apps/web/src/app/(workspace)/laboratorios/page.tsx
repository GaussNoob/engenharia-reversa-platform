import { LabsView } from "@nucleo/features/pages/LabsView";
import { LabCatalog } from "@nucleo/features/modules/labs/LabCatalog";
import { getCatalog } from "@/lib/server-api";
import { PageHeader } from "@nucleo/features/components/PageHeader";
export const metadata = { title: "Laboratórios" };
export default async function LabsPage() {
  const catalog = await getCatalog();
  return <LabsView catalog={catalog} />;
}
