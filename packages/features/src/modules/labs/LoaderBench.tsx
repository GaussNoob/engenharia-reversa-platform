"use client";
import { useState } from "react";
import { StepForward, RotateCcw } from "lucide-react";
export function LoaderBench({ processes = false }: { processes?: boolean }) {
  const [step, setStep] = useState(0);
  const labels = [
    "Ler os cabeçalhos",
    "Reservar a imagem",
    "Mapear as seções",
    "Resolver dependências",
    "Preencher a IAT",
    "Transferir ao entrypoint",
  ];
  const [instances, setInstances] = useState(2);
  return (
    <div className="concept-bench">
      <div className="bench-heading">
        <span className="overline">
          {processes
            ? "PROCESSOS / MEMÓRIA VIRTUAL"
            : "LOADER / IMAGEM EM MEMÓRIA"}
        </span>
        <h3>
          {processes
            ? "O mesmo arquivo.\nInstâncias independentes."
            : "Entre o duplo clique\ne a primeira instrução."}
        </h3>
      </div>
      {processes ? (
        <>
          <button
            className="button button-small"
            disabled={instances >= 4}
            onClick={() => setInstances((value) => value + 1)}
          >
            Criar outra instância
          </button>
          <div className="process-map">
            {Array.from({ length: instances }, (_, index) => (
              <div key={index}>
                <span className="mono">PROCESSO {index + 1}</span>
                <strong>programa.exe</strong>
                <code>PID {1200 + index * 100}</code>
                <div className="process-region">
                  .text <span>R-X</span>
                </div>
                <div className="process-region">
                  .data <span>RW-</span>
                </div>
                <p>
                  Espaço virtual próprio
                  <br />
                  Threads e handles próprios
                </p>
              </div>
            ))}
          </div>
          <p className="bench-explanation">
            PIDs ilustram o modelo. As regiões virtuais podem apresentar o mesmo
            endereço em processos diferentes, sem serem a mesma região física.
          </p>
        </>
      ) : (
        <>
          <div className="loader-flow">
            {labels.map((label, index) => (
              <div className={index <= step ? "active" : ""} key={label}>
                <span className="mono">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <strong>{label}</strong>
                <small>
                  {index === step
                    ? "etapa atual"
                    : index < step
                      ? "concluída"
                      : "aguardando"}
                </small>
              </div>
            ))}
          </div>
          <div className="loader-state">
            <span className="mono">ESTADO DA IMAGEM</span>
            <div>
              <span>Cabeçalhos</span>
              <strong>{step >= 0 ? "Interpretados" : "—"}</strong>
            </div>
            <div>
              <span>.text / .data</span>
              <strong>
                {step >= 2 ? "Mapeadas com permissões" : "No arquivo"}
              </strong>
            </div>
            <div>
              <span>KERNEL32 / USER32</span>
              <strong>
                {step >= 3 ? "Dependências resolvidas" : "Aguardando"}
              </strong>
            </div>
            <div>
              <span>IAT</span>
              <strong>
                {step >= 4
                  ? "Endereços de funções disponíveis"
                  : "Importações por resolver"}
              </strong>
            </div>
            <div>
              <span>Fluxo</span>
              <strong>
                {step >= 5 ? "No entrypoint" : "Dentro do loader"}
              </strong>
            </div>
          </div>
          <div className="memory-controls">
            <button
              className="button button-small"
              disabled={step >= 5}
              onClick={() => setStep((value) => value + 1)}
            >
              <StepForward size={14} />
              Próxima etapa
            </button>
            <button
              className="icon-button"
              aria-label="Reiniciar carregamento"
              onClick={() => setStep(0)}
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <p className="bench-explanation">
            Modelo do processo de carregamento; não executa um loader Windows
            real.
          </p>
        </>
      )}
    </div>
  );
}
