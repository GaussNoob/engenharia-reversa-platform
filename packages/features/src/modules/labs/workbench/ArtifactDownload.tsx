"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { apiResponse } from "@nucleo/api-client";
import { usePlatform } from "@nucleo/platform";
export function ArtifactDownload({
  artifact,
}: {
  artifact: { id: string; name: string; size: number };
}) {
  const platform = usePlatform();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        className="artifact-download"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const response = await apiResponse(
              "/executions/artifacts/" + encodeURIComponent(artifact.id),
            );
            await platform.download(
              new Uint8Array(await response.arrayBuffer()),
              artifact.name,
            );
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Não foi possível baixar.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <Download size={14} />
        {busy ? "Baixando…" : artifact.name + " · " + artifact.size + " bytes"}
      </button>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </>
  );
}
