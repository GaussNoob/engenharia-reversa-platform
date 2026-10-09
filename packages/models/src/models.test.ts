import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  parseProgram,
  createCpu,
  stepCpu,
  runCpu,
  readRegister,
  parsePe,
  rvaToOffset,
  extractStrings,
  encodeFloat32,
  inspectFloat32,
} from "./index.ts";
describe("CPU: resultados pedagógicos e arquitetura", () => {
  it("preserva aliases parciais e zera os 32 bits superiores ao escrever EAX", () => {
    const program = parseProgram(
      "mov rax, 0x1122334455667788\nmov al, 0xaa\nmov ax, 0x1234\nmov eax, 0x10",
    );
    const cpu = createCpu(program);
    stepCpu(program, cpu);
    stepCpu(program, cpu);
    expect(readRegister(cpu, "rax")).toBe(0x11223344556677aan);
    stepCpu(program, cpu);
    expect(readRegister(cpu, "rax")).toBe(0x1122334455661234n);
    stepCpu(program, cpu);
    expect(readRegister(cpu, "rax")).toBe(16n);
  });
  it("CMP distingue comparação signed/unsigned sem alterar operandos; MOV preserva flags", () => {
    const cpu = runCpu(
      parseProgram("mov al, 0xff\nmov bl, 1\ncmp al, bl\nmov cl, 7"),
    );
    expect(readRegister(cpu, "al")).toBe(255n);
    expect(cpu.flags).toMatchObject({
      CF: false,
      ZF: false,
      SF: true,
      OF: false,
    });
    expect(
      readRegister(
        runCpu(
          parseProgram(
            "mov al, 0xff\ncmp al, 1\nja maior\nmov dl, 0\njmp fim\nmaior:\nmov dl, 1\nfim:\nnop",
          ),
        ),
        "dl",
      ),
    ).toBe(1n);
    expect(
      readRegister(
        runCpu(
          parseProgram(
            "mov al, 0xff\ncmp al, 1\njg maior\nmov dl, 0\njmp fim\nmaior:\nmov dl, 1\nfim:\nnop",
          ),
        ),
        "dl",
      ),
    ).toBe(0n);
  });
  it("CALL/RET escreve endereço de retorno e restaura RSP", () => {
    const program = parseProgram(
      "mov ecx, 3\nmov edx, 4\ncall soma\njmp fim\nsoma:\nadd ecx, edx\nmov eax, ecx\nret\nfim:\nnop",
    );
    const cpu = createCpu(program);
    stepCpu(program, cpu);
    stepCpu(program, cpu);
    stepCpu(program, cpu);
    expect(cpu.frames).toHaveLength(1);
    expect(readRegister(cpu, "rsp")).toBe(0x200ff8n);
    runCpu(program, cpu);
    expect(readRegister(cpu, "rax")).toBe(7n);
    expect(readRegister(cpu, "rsp")).toBe(0x201000n);
    expect(cpu.frames).toHaveLength(0);
  });
  it("limita loops e rejeita memória fora do modelo", () => {
    expect(() => runCpu(parseProgram("loop:\njmp loop"))).toThrow(/Limite/);
    expect(() => runCpu(parseProgram("mov eax, dword [0x100]"))).toThrow(
      /fora das regiões/,
    );
    expect(() => parseProgram("syscall")).toThrow(/não suportada/);
  });
  it("codifica deslocamentos reais de saltos e immediates", () => {
    const program = parseProgram("mov eax, 5\njmp fim\nmov ebx, 3\nfim:\nnop");
    expect(program.instructions[0]?.bytes).toEqual([0xb8, 5, 0, 0, 0]);
    expect(program.instructions[1]?.bytes).toEqual([0xe9, 5, 0, 0, 0]);
  });
  it("rejeita larguras incompatíveis e formas não suportadas", () => {
    expect(() => parseProgram("mov rax, ebx")).toThrow();
    expect(() => parseProgram("imul eax, ebx")).toThrow();
    expect(() => parseProgram("shl eax, bl")).toThrow();
  });
  it("DIV de 8 bits usa AX como dividendo e AL/AH no resultado", () => {
    const cpu = runCpu(parseProgram("mov ax, 513\nmov bl, 4\ndiv bl"));
    expect(readRegister(cpu, "al")).toBe(128n);
    expect(readRegister(cpu, "ah")).toBe(1n);
  });
});
describe("Binary32: arredondamento e casos especiais", () => {
  it("mostra a aproximação representável de 0.1", () => {
    const result = encodeFloat32(0.1);
    expect(result.bits).toBe(0x3dcccccd);
    expect(result.value).toBe(0.10000000149011612);
  });
  it("preserva zero negativo, menor subnormal, infinito e NaN", () => {
    expect(Object.is(inspectFloat32(0x80000000).value, -0)).toBe(true);
    expect(inspectFloat32(1).value).toBe(2 ** -149);
    expect(inspectFloat32(1).category).toBe("subnormal");
    expect(inspectFloat32(0x7f800000).value).toBe(Infinity);
    expect(inspectFloat32(0x7fc00001).category).toBe("NaN");
  });
});
describe("PE: arquivo real e dados não confiáveis", () => {
  const bytes = new Uint8Array(
    readFileSync(
      new URL("../../../content/fixtures/bancada.exe", import.meta.url),
    ),
  );
  it("lê as seções e imports do PE de estudo", () => {
    const pe = parsePe(bytes);
    expect(pe.architecture).toBe("x86-64");
    expect(pe.sections.map((section) => section.name)).toEqual([
      ".text",
      ".data",
      ".idata",
    ]);
    expect(
      pe.imports.flatMap((item) => item.functions.map((fn) => fn.name)),
    ).toContain("MessageBoxW");
    expect(rvaToOffset(pe, pe.entrypointRva)).toBe(pe.sections[0]?.offset);
    expect(rvaToOffset(pe, 0x3c)).toBe(0x3c);
  });
  it("rejeita arquivos truncados e RVA sem dados", () => {
    expect(() => parsePe(bytes.slice(0, 100))).toThrow();
    const pe = parsePe(bytes);
    expect(rvaToOffset(pe, 0xffffffff)).toBeNull();
  });
  it("encontra strings ASCII e UTF-16LE sem executar o arquivo", () => {
    const found = extractStrings(bytes);
    expect(found.some((item) => item.text === "MessageBoxW")).toBe(true);
    expect(
      extractStrings(
        new Uint8Array([72, 0, 101, 0, 108, 0, 108, 0, 111, 0, 0, 0]),
      ),
    ).toContainEqual({
      offset: 0,
      size: 10,
      encoding: "UTF-16LE",
      text: "Hello",
    });
  });
});
