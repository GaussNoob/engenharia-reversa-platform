import { describe, expect, it } from "vitest";
import { exerciseDefinitions, exercises } from "@nucleo/content/server";
import { parseProgram, runCpu } from "@nucleo/models";
import type { ExerciseDefinition, ExecutionResult } from "@nucleo/core";
import { gradeExercise, parseInteger } from "./grade.ts";
const find = (id: string): ExerciseDefinition =>
  exerciseDefinitions.find((item) => item.id === id)!;
describe("Exercícios: correção e referências executáveis", () => {
  it("aceita bases e sinal explícitos, rejeitando respostas numéricas ambíguas", () => {
    for (const input of ["42", "0x2a", "0b101010", "0o52", "+42"])
      expect(gradeExercise(find("hexadecimal-para-decimal"), input)).toBe(true);
    for (const input of ["", "42 bytes", "42.0", "4.2e1", "NaN", "0xZZ", "41"])
      expect(gradeExercise(find("hexadecimal-para-decimal"), input)).toBe(
        false,
      );
    expect(parseInteger("-0x80")).toBe(-128n);
    expect(gradeExercise(find("complemento-de-dois-16"), "-0x80")).toBe(true);
  });
  it("confere sequência e largura dos bytes sem aceitar lixo ou outra ordem", () => {
    for (const input of ["61 00 E9 00", "6100e900", "0x61, 0x00, 0xE9, 0x00"])
      expect(gradeExercise(find("utf16-little-endian"), input)).toBe(true);
    for (const input of [
      "00 61 00 E9",
      "61 00 E9",
      "6100e900ZZ",
      "061 00 E9 00",
    ])
      expect(gradeExercise(find("utf16-little-endian"), input)).toBe(false);
    expect(gradeExercise(find("ascii-reconstruir-string"), "nucleo")).toBe(
      false,
    );
    expect(gradeExercise(find("ascii-reconstruir-string"), "NUCLEO")).toBe(
      true,
    );
  });
  it("valida os programas Assembly de referência e rejeita os pontos de partida incompletos", () => {
    for (const item of exerciseDefinitions) {
      if (item.kind !== "code" || item.language !== "assembly") continue;
      const evidence = (source: string): ExecutionResult => {
        const cpu = runCpu(parseProgram(source, item.mode));
        return {
          stdout: "",
          stderr: "",
          exitCode: 0,
          durationMs: 0,
          truncated: false,
          artifacts: [],
          cpu: {
            mode: cpu.mode,
            registers: Object.fromEntries(
              Object.entries(cpu.registers).map(([name, value]) => [
                name.toUpperCase(),
                value.toString(),
              ]),
            ),
            flags: cpu.flags,
            ip: cpu.ip.toString(),
            memory: [],
            steps: cpu.steps,
            halted: cpu.halted,
            output: cpu.output,
          },
        };
      };
      expect(
        gradeExercise(item, "", evidence(item.solutionCode)),
        item.id,
      ).toBe(true);
      expect(gradeExercise(item, "", evidence(item.starterCode)), item.id).toBe(
        false,
      );
    }
  });
  it("não aceita saída parcial, truncada ou processo com erro como solução", () => {
    const item = find("python-tres-representacoes");
    const result: ExecutionResult = {
      stdout: "decimal=42\nhexadecimal=0x2a\nbinario=0b101010\n",
      stderr: "",
      exitCode: 0,
      durationMs: 1,
      truncated: false,
      artifacts: [],
    };
    expect(gradeExercise(item, "", result)).toBe(true);
    expect(
      gradeExercise(item, "", {
        ...result,
        stdout: "prefixo\n" + result.stdout,
      }),
    ).toBe(false);
    expect(gradeExercise(item, "", { ...result, exitCode: 1 })).toBe(false);
    expect(gradeExercise(item, "", { ...result, truncated: true })).toBe(false);
    expect(gradeExercise(item, "", null)).toBe(false);
  });
  it("distribui a coleção pelos nove módulos e preserva respostas privadas", () => {
    expect(exercises).toHaveLength(45);
    expect(new Set(exercises.map((item) => item.moduleNumber)).size).toBe(9);
    for (const item of exercises) {
      expect(item.lessonIds.length).toBeGreaterThan(0);
      for (const key of ["answer", "criteria", "explanation", "solutionCode"])
        expect(item).not.toHaveProperty(key);
    }
  });
});
