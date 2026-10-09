import { ExploreView } from "@nucleo/features/pages/ExploreView";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { supplements } from "@nucleo/core";
import { PageHeader } from "@nucleo/features/components/PageHeader";
export const metadata = {
  title: "Experimentos complementares",
  description:
    "Explore fluxo de controle, ponto flutuante, endianness e a anatomia do software com experimentos interativos.",
};
export default function ExplorePage() {
  return <ExploreView />;
}
