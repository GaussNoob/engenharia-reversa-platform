import type { ExerciseDefinition, ExecutionResult } from "@nucleo/core";

export function parseInteger(input: string): bigint | null {
  const text = input.trim();
  if (!/^[+-]?(?:\d+|0x[0-9a-f]+|0b[01]+|0o[0-7]+)$/i.test(text)) return null;
  const sign = text.startsWith("-") ? -1n : 1n;
  try {
    return sign * BigInt(text.replace(/^[+-]/, ""));
  } catch {
    return null;
  }
}
function byteSequence(input: string): string | null {
  const text = input.trim();
  if (/^(?:[0-9a-f]{2})+$/i.test(text)) return text.toUpperCase();
  if (!/^(?:0x)?[0-9a-f]{2}(?:[\s,]+(?:0x)?[0-9a-f]{2})*$/i.test(text))
    return null;
  return text.replace(/0x|[\s,]/gi, "").toUpperCase();
}
export function gradeExercise(
  definition: ExerciseDefinition,
  answer: string,
  result?: ExecutionResult | null,
): boolean {
  if (definition.kind === "number") {
    const value = parseInteger(answer);
    return value !== null && value === parseInteger(definition.answer);
  }
  if (definition.kind === "bytes") {
    const bytes = byteSequence(answer);
    return bytes !== null && bytes === byteSequence(definition.answer);
  }
  if (definition.kind === "text")
    return (
      answer.trim().normalize("NFC") === definition.answer.normalize("NFC")
    );
  if (definition.kind === "choice") return answer === definition.answer;
  if (!result || result.exitCode !== 0 || result.truncated) return false;
  const { criteria } = definition;
  if (
    criteria.stdout !== undefined &&
    result.stdout.replace(/\r\n/g, "\n").trimEnd() !== criteria.stdout.trimEnd()
  )
    return false;
  if (
    criteria.minSteps !== undefined &&
    (result.cpu?.steps ?? 0) < criteria.minSteps
  )
    return false;
  if (criteria.registers) {
    if (!result.cpu || result.cpu.mode !== definition.mode) return false;
    for (const [register, expected] of Object.entries(criteria.registers)) {
      const actual = result.cpu.registers[register];
      if (
        actual === undefined ||
        parseInteger(actual) !== parseInteger(expected)
      )
        return false;
    }
  }
  return true;
}
