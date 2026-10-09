"use client";
import { useEffect, useState } from "react";
import { api } from "@nucleo/api-client";
import type { Job } from "@nucleo/core";
import { PageHeader } from "../../components/PageHeader";
import { ArtifactDownload } from "./workbench/ArtifactDownload";
export function ExecutionHistory() {
  const [jobs, setJobs] = useState<Job[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    void api<Job[]>("/executions", { signal: controller.signal })
      .then(setJobs)
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : "Histórico indisponível.",
          );
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);
  return (
    <>
      <PageHeader section="Execuções" />
      <main id="main" className="page-body">
        <h1 className="page-title">Suas últimas execuções.</h1>
        {error && <p role="alert">{error}</p>}
        {loading ? (
          <p role="status">Carregando…</p>
        ) : !jobs.length ? (
          <p>Nenhuma execução registrada.</p>
        ) : (
          jobs.map((job) => (
            <section className="execution-record" key={job.id}>
              <h2>
                {job.language} · {job.status}
              </h2>
              <small>{new Date(job.createdAt).toLocaleString("pt-BR")}</small>
              <pre>{job.result?.stdout}</pre>
              {job.result?.stderr && (
                <pre className="error-text">{job.result.stderr}</pre>
              )}
              {job.result?.artifacts.map((artifact) => (
                <ArtifactDownload key={artifact.id} artifact={artifact} />
              ))}
            </section>
          ))
        )}
      </main>
    </>
  );
}
