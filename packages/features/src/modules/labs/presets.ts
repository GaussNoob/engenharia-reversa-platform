import type { ExecutionLanguage } from "@nucleo/core";
export const defaultCode: Record<ExecutionLanguage, string> = {
  assembly:
    "; acompanhe os registradores a cada passo\nmov rax, 0x05\nadd rax, 0x03\nmov rbx, rax\nxor rcx, rcx\n",
  python:
    'valor = 0b1010\nprint(f"decimal: {valor}")\nprint(f"hexadecimal: {valor:#x}")\nprint(f"binário: {valor:#b}")\n',
  c: '#include <stdio.h>\n\nint main(void) {\n    unsigned int valor = 0x12345678;\n    unsigned char *bytes = (unsigned char *)&valor;\n    for (unsigned int i = 0; i < sizeof(valor); i++)\n        printf("%02X ", bytes[i]);\n    return 0;\n}\n',
  fasm: "format PE64 GUI\nentry start\n\nsection '.text' code readable executable\nstart:\n    mov eax, 0x20\n    or eax, 0x18\n",
  "windows-cpp":
    '#include <windows.h>\n\nint main() {\n    MessageBoxW(nullptr, L"Estou estudando a Windows API", L"Nucleo", MB_OK);\n    return 0;\n}\n',
};
export const labCode: Record<string, string> = {
  debugger:
    "mov ecx, 3\nmov edx, 4\ncall soma\njmp fim\nsoma:\nadd ecx, edx\nmov eax, ecx\nret\nfim:\nnop\n",
  breakpoints: "mov eax, 1\nadd eax, 2\nmov ebx, eax\nadd ebx, 4\n",
  "register-aliases":
    "mov rax, 0x1122334455667788\nmov al, 0xaa\nmov ax, 0x1234\nmov eax, 0x10\n",
  "flags-branches":
    "mov eax, 0x05\ncmp eax, 0x05\nje iguais\nmov ebx, 0xff\njmp fim\niguais:\nmov ebx, 0x01\nfim:\nnop\n",
  "call-stack":
    "mov ecx, 0x03\nmov edx, 0x04\ncall soma\njmp fim\nsoma:\nadd ecx, edx\nmov eax, ecx\nret\nfim:\nnop\n",
  abi: "sub rsp, 0x48\nmov dword [rsp+0x20], 5\nmov dword [rsp+0x28], 6\nmov ecx, 1\nmov edx, 2\nmov r8d, 3\nmov r9d, 4\ncall soma\nadd rsp, 0x48\njmp fim\nsoma:\nadd ecx, edx\nadd ecx, r8d\nadd ecx, r9d\nadd ecx, dword [rsp+0x28]\nadd ecx, dword [rsp+0x30]\nmov eax, ecx\nret\nfim:\nnop\n",
  "assembly-patterns": "xor ecx, ecx\nloop:\ninc ecx\ncmp ecx, 0x0a\njl loop\n",
  "python-inicial": 'print("Execute isto na console do Python!")\n',
  "c-inicial":
    '#include <stdio.h>\nint main(void) {\n    printf("Compilar com o Visual Studio e executar!\\n");\n    return 0;\n}\n',
  xor: 'x, y = 8, 5\nx ^= y\ny ^= x\nx ^= y\nprint("valores trocados:", x, y)\nvalor, chave = 2025, 0x42\ncifrado = valor ^ chave\nprint("recuperado:", cifrado ^ chave)\n',
};
export function entryName(language: ExecutionLanguage) {
  return language === "python"
    ? "main.py"
    : language === "c"
      ? "main.c"
      : language === "windows-cpp"
        ? "main.cpp"
        : "main.asm";
}
