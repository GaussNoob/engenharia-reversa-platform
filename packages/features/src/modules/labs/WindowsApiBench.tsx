"use client";
import { useState } from "react";
import { SyntaxCode } from "@nucleo/features/components/CodeSnippet";
import { FileText, MessageSquare, Database } from "lucide-react";
export function WindowsApiBench({ registry = false }: { registry?: boolean }) {
  const [tab, setTab] = useState(registry ? "Registro" : "MessageBox");
  const [text, setText] = useState("Estou estudando a Windows API");
  const [title, setTitle] = useState("Núcleo");
  const [files, setFiles] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [log, setLog] = useState<string[]>([]);
  const [message, setMessage] = useState(false);
  const [ret, setRet] = useState("—");
  const event = (rows: string[]) =>
    setLog((previous) => [...previous, ...rows].slice(-30));
  const call = () => {
    if (tab === "MessageBox") {
      setMessage(true);
      event([
        "MessageBoxW(NULL, lpText, lpCaption, MB_YESNO)",
        "Textos representados em UTF-16-LE.",
      ]);
    } else if (tab === "Arquivos") {
      setFiles({ ...files, "log.txt": text });
      setRet("TRUE");
      event([
        'CreateFileW("log.txt", GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, …)',
        "HANDLE 0x00000100 criado.",
        `WriteFile: ${new TextEncoder().encode(text).length} bytes escritos.`,
        "CloseHandle(0x00000100) → TRUE",
      ]);
    } else {
      setValues({ ...values, Website: text, Habilitado: "1" });
      setRet("ERROR_SUCCESS");
      event([
        'RegCreateKeyW(HKCU, "Software\\Nucleo", &hKey)',
        `RegSetKeyValueW: Website = ${text} (REG_SZ)`,
        "RegSetKeyValueW: Habilitado = 1 (REG_DWORD)",
        "RegCloseKey(hKey)",
      ]);
    }
  };
  return (
    <div className="concept-bench windows-api-bench">
      <div className="bench-heading">
        <span className="overline">WINDOWS API / MODELO DIDÁTICO</span>
        <h3>
          Uma chamada.
          <br />
          Um efeito observável.
        </h3>
      </div>
      <p className="bench-explanation">
        Recursos virtuais da bancada. Nenhum arquivo ou registro do seu sistema
        é alterado.
      </p>
      <div className="bench-tabs" role="tablist">
        {["MessageBox", "Arquivos", "Registro"].map((item) => (
          <button
            role="tab"
            aria-selected={tab === item}
            key={item}
            className={tab === item ? "active" : ""}
            onClick={() => {
              setTab(item);
              setRet("—");
            }}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="bench-fields">
        {tab === "MessageBox" && (
          <label>
            Título
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={80}
            />
          </label>
        )}
        <label>
          {tab === "Registro" ? "Valor de Website" : "Texto / buffer"}
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={256}
          />
        </label>
      </div>
      <button className="button button-small" onClick={call}>
        Simular chamada
      </button>
      {message && (
        <div className="messagebox-model" role="dialog" aria-label={title}>
          <strong>{title}</strong>
          <p>{text}</p>
          <div>
            {[
              ["Sim", "IDYES / 6"],
              ["Não", "IDNO / 7"],
            ].map(([label, value]) => (
              <button
                className="button button-secondary button-small"
                key={label}
                onClick={() => {
                  setRet(value!);
                  setMessage(false);
                  event([`MessageBoxW retorna ${value}.`]);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="api-return">
        <span className="mono">RETORNO</span>
        <strong>{ret}</strong>
      </div>
      {tab === "Arquivos" && (
        <div className="virtual-resources">
          {Object.entries(files).map(([name, value]) => (
            <div key={name}>
              <FileText size={17} />
              <strong>{name}</strong>
              <code>{value}</code>
            </div>
          ))}
        </div>
      )}
      {tab === "Registro" && (
        <div className="virtual-resources">
          <strong>HKCU\Software\Nucleo</strong>
          {Object.entries(values).map(([name, value]) => (
            <div key={name}>
              <Database size={15} />
              <span>{name}</span>
              <code>{value}</code>
            </div>
          ))}
        </div>
      )}
      <pre className="model-log" aria-live="polite">
        <SyntaxCode
          source={log.length ? log.join("\n") : "Aguardando uma chamada."}
          language="cpp"
        />
      </pre>
    </div>
  );
}
