"use client";
import { useEffect, useState } from "react";
import { Link } from "@nucleo/platform";
import { ArrowUpRight, Check, Search } from "lucide-react";
import type { Lab, PublicCatalog } from "@nucleo/core";
import { useAccount } from "@nucleo/features/components/AccountProvider";
import { api } from "@nucleo/api-client";
const categories = [
  { id: "all", label: "Todos" },
  { id: "cpu", label: "Assembly e CPU" },
  { id: "bytes", label: "Bytes e memória" },
  { id: "binary", label: "Executáveis" },
  { id: "code", label: "Código e APIs" },
];
const category = (lab: Lab) =>
  ["assembly", "debugger-model"].includes(lab.engine)
    ? "cpu"
    : ["pe", "patch", "loader-model", "process-model", "assembler"].includes(
          lab.engine,
        )
      ? "binary"
      : ["python", "c-portable", "windows-api-model"].includes(lab.engine)
        ? "code"
        : "bytes";
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
export function LabCatalog({ catalog }: { catalog: PublicCatalog }) {
  const [filter, setFilter] = useState("all"),
    [query, setQuery] = useState("");
  const [completed, setCompleted] = useState<string[]>([]);
  const { user } = useAccount();
  useEffect(() => {
    if (!user) {
      setCompleted([]);
      return;
    }
    void api<string[]>("/labs/progress")
      .then(setCompleted)
      .catch(() => {});
  }, [user]);
  const labs = catalog.labs.filter(
    (lab) =>
      (filter === "all" || category(lab) === filter) &&
      normalize(`${lab.title} ${lab.learningOutcome}`).includes(
        normalize(query),
      ),
  );
  return (
    <>
      <div className="lab-filters">
        <div role="group" aria-label="Área dos laboratórios">
          {categories.map((item) => (
            <button
              key={item.id}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label>
          <Search size={16} />
          <input
            aria-label="Filtrar laboratórios"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busque uma bancada…"
          />
        </label>
      </div>
      <div className="lab-result-count" role="status">
        {labs.length} laboratórios
        {completed.length > 0 ? ` · ${completed.length} concluídos` : ""}
      </div>
      <div className="lab-index">
        {catalog.modules.map((module) => {
          const moduleLabs = labs.filter(
            (lab) => lab.moduleNumber === module.number,
          );
          if (!moduleLabs.length) return null;
          return (
            <section key={module.id}>
              <header>
                <span className="mono">{module.number}</span>
                <h2>{module.title}</h2>
                <span>{moduleLabs.length} bancadas</span>
              </header>
              {moduleLabs.map((lab) => (
                <Link
                  className="lab-index-row"
                  href={`/laboratorios/${lab.id}`}
                  key={lab.id}
                >
                  <strong>
                    {lab.title}
                    {completed.includes(lab.id) && (
                      <Check aria-label="Concluído" size={15} />
                    )}
                  </strong>
                  <p>{lab.learningOutcome}</p>
                  <span className="tag">
                    {
                      categories.find((item) => item.id === category(lab))
                        ?.label
                    }
                  </span>
                  <span>{lab.minutes} min</span>
                </Link>
              ))}
            </section>
          );
        })}
        {!labs.length && (
          <p className="empty-state">
            Nenhuma bancada encontrada. Experimente outro termo ou área.
          </p>
        )}
      </div>
      <Link href="/explorar" className="labs-extra-link">
        <div>
          <span className="overline">CONTINUE A INVESTIGAÇÃO</span>
          <strong>4 experimentos complementares</strong>
          <p>Fluxo de controle, IEEE 754, endianness e uma exploração em 3D.</p>
        </div>
        <ArrowUpRight size={24} />
      </Link>
    </>
  );
}
