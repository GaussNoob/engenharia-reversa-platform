"use client";
import { hex, readRegister, type CpuState } from "@nucleo/models";
export function RegisterPanel({ state }: { state: CpuState }) {
  const names =
    state.mode === "x86-64"
      ? ["RAX", "RBX", "RCX", "RDX", "RSP", "RBP", "R8", "R9"]
      : ["EAX", "EBX", "ECX", "EDX", "ESP", "EBP"];
  return (
    <section className="register-panel">
      <header>
        <span className="mono">REGISTRADORES</span>
        <span className="tag">
          {state.mode === "x86-64" ? "64 bits" : "32 bits"}
        </span>
      </header>
      <div className="register-grid">
        {names.map((name) => (
          <div
            key={name}
            className={
              state.changes.includes(name.toUpperCase()) ? "changed" : ""
            }
          >
            <span>{name}</span>
            <strong>
              {hex(
                readRegister(state, name),
                state.mode === "x86-64" ? 64 : 32,
              ).slice(2)}
            </strong>
          </div>
        ))}
      </div>
      <div className="cpu-flags">
        {Object.entries(state.flags).map(([name, value]) => (
          <div key={name} className={value === true ? "set" : ""}>
            <span>{name}</span>
            <strong>{value === null ? "?" : value ? "1" : "0"}</strong>
          </div>
        ))}
      </div>
      <div className="ip-indicator">
        <span>{state.mode === "x86-64" ? "RIP" : "EIP"}</span>
        <code>{hex(state.ip, state.mode === "x86-64" ? 64 : 32)}</code>
        <small>{state.steps} instruções</small>
      </div>
    </section>
  );
}
