"""Produce a pedagogical plan with exhaustive source coverage, not published lessons."""

from __future__ import annotations

import json
import math
from collections import Counter
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
DATA = PROJECT / "analysis"
SOURCE = PROJECT / "references/fundamentos-engenharia-reversa"
COURSE = "fundamentos-engenharia-reversa"
INVENTORY = json.loads((DATA / "inventory.json").read_text())
EXAMPLES = json.loads((DATA / "examples.json").read_text())
PAGES = {page["id"]: page for page in INVENTORY["pages"]}

# Each interval partitions an actual source page; zero means the end of that page.
SPLITS = {
    "02-numeros/sistemas-de-numeracao.md": [
        ("bases", "Decimal, binário e octal", 1, 43),
        ("hexadecimal", "Hexadecimal e endereços", 44, 105),
        ("sistema-proprio", "Construir um sistema de numeração", 106, 0)],
    "02-numeros/calculos-com-binarios.md": [
        ("and-or", "Conjunção e disjunção", 1, 84),
        ("xor", "XOR: diferenças, troca e reversibilidade", 85, 177),
        ("shift-rotate", "Deslocamentos e rotações", 178, 245),
        ("not", "Negação e largura dos dados", 246, 0)],
    "03-cadeias-de-texto/unicode.md": [
        ("utf-8", "Unicode e UTF-8", 1, 36),
        ("utf-16", "UTF-16, BOM e endianness", 37, 103),
        ("utf-32", "UTF-32 e representação de wide strings", 104, 0)],
    "06-execucao-de-programas/README.md": [
        ("privilegios", "Privilégios: usuário e kernel", 1, 16),
        ("dependencias", "Dependências e bibliotecas de execução", 17, 36),
        ("loader", "O loader e a imagem em memória", 37, 0)],
    "07-windows-api/caixas-de-mensagens.md": [
        ("messagebox", "Construir uma caixa de mensagem", 1, 35),
        ("retorno-messagebox", "Retornos, Unicode e variantes A/W", 36, 0)],
    "07-windows-api/manipulacao-de-arquivos.md": [
        ("createfile", "CreateFile e o ciclo de vida de um handle", 1, 103),
        ("writefile", "WriteFile: escrever bytes e conferir o resultado", 104, 0)],
    "08-assembly/registradores.md": [
        ("registradores", "Registradores e subregistradores", 1, 104),
        ("primeiro-pe", "Montar o primeiro PE com fasm", 105, 135),
        ("rip", "RIP e o tamanho de uma instrução", 136, 147),
        ("rflags", "RFLAGS e o estado de uma operação", 148, 0)],
    "08-assembly/instrucoes-basicas.md": [
        ("mov", "Instruções e cópia de valores", 1, 22),
        ("aritmetica", "Aritmética em Assembly", 23, 58),
        ("bitwise", "Operações bit a bit em Assembly", 59, 69),
        ("cmp-test", "Comparar com CMP e TEST", 70, 86),
        ("saltos", "Saltos e decisões de fluxo", 87, 0)],
    "08-assembly/funcoes-e-pilha.md": [
        ("funcoes", "Funções e reutilização", 1, 58),
        ("call-ret", "CALL, RET e a convenção Microsoft x64", 59, 132),
        ("pilha", "A pilha: PUSH, POP e endereços de retorno", 133, 178),
        ("shadow-space", "Argumentos na pilha e shadow space", 179, 239),
        ("messagebox-assembly", "Reconstruir uma chamada à MessageBox", 240, 0)],
}

MODULE_OBJECTIVES = {
    "01": "Explicar o processo de engenharia reversa e preparar um ambiente de estudo reproduzível.",
    "02": "Interpretar números em bases diferentes e operar sobre bits de largura definida.",
    "03": "Relacionar texto, code points, codificações e terminadores a sequências de bytes.",
    "04": "Inspecionar arquivos pelo conteúdo e localizar campos por offset.",
    "05": "Interpretar cabeçalhos PE, seções, importações e endereços sem executar o arquivo.",
    "06": "Explicar compilação, linkedição, carregamento, bibliotecas, processos e threads.",
    "07": "Reconhecer chamadas Windows API, argumentos, handles, retornos e alterações em recursos.",
    "08": "Ler instruções Intel e acompanhar registradores, flags, fluxo e pilha com ABI explícita.",
    "09": "Depurar um alvo didático, usar breakpoints e produzir alterações verificáveis e reversíveis.",
}

PAGE_OBJECTIVES = {
    "01-introducao/README.md": "Explicar como estrutura e comportamento permitem inferir a lógica de um programa e identificar áreas de aplicação.",
    "01-introducao/antes-de-comecar.md": "Preparar o ambiente e associar Python, Visual Studio, fasm, HxD, DIE e x64dbg às tarefas do curso.",
    "02-numeros/README.md": "Relacionar estados binários, representação de quantidades e operações do processador.",
    "02-numeros/o-byte.md": "Calcular faixas de valores de BYTE, WORD, DWORD e QWORD e distinguir quantidade de representação.",
    "02-numeros/numeros-negativos.md": "Calcular complemento de dois em largura definida e interpretar o mesmo padrão com e sem sinal.",
    "03-cadeias-de-texto/README.md": "Distinguir caractere, scan code, code point e sequência de bytes.",
    "03-cadeias-de-texto/ascii.md": "Encontrar caracteres, controles e relações de maiúsculas e dígitos na ASCII e distinguir code pages.",
    "03-cadeias-de-texto/c-strings.md": "Reconhecer terminadores nulos e construir buscas de strings em ASCII e UTF-16-LE.",
    "04-arquivos/README.md": "Separar conteúdo e metadados e inferir o tipo de arquivo pelos bytes em vez da extensão.",
    "04-arquivos/formatos.md": "Localizar bytes por offset e interpretar assinatura, largura e altura de um GIF em little-endian.",
    "05-o-formato-pe/README.md": "Reconhecer as partes de um PE e o papel de compiladores, linker e loader na estrutura do arquivo.",
    "05-o-formato-pe/cabecalhos/README.md": "Relacionar tipos Microsoft a larguras fixas e interpretar máscaras de bits em estruturas binárias.",
    "05-o-formato-pe/cabecalhos/dos.md": "Localizar MZ, e_lfanew, o stub DOS e a assinatura PE sem confundir valor com posição de um campo.",
    "05-o-formato-pe/cabecalhos/coff.md": "Ler os campos COFF, identificar a máquina alvo e interpretar as flags sem tomar timestamp como prova de origem.",
    "05-o-formato-pe/cabecalhos/opcional.md": "Distinguir PE32 e PE32+, localizar entrypoint e ImageBase e interpretar Subsystem e DllCharacteristics.",
    "05-o-formato-pe/cabecalhos/diretorios.md": "Reconhecer os diretórios de exports, imports, recursos, certificados, IAT e CLR e a natureza de seus endereços.",
    "05-o-formato-pe/cabecalhos/cabecalhos-das-secoes.md": "Relacionar cada campo de IMAGE_SECTION_HEADER ao nome, tamanho, offset, RVA e permissões de uma seção.",
    "05-o-formato-pe/secoes.md": "Explicar .text, .data, .rdata e .idata e mapear seções em páginas com alinhamento e permissões.",
    "05-o-formato-pe/import-table.md": "Percorrer IDT, ILT, Hint/Name e IAT e identificar DLL e função, incluindo importação por ordinal.",
    "05-o-formato-pe/enderecamento.md": "Distinguir memória física e virtual, VA, RVA e offset e calcular o VA do entrypoint.",
    "06-execucao-de-programas/executaveis.md": "Separar compilação e linkedição e comparar executáveis estáticos e dinamicamente ligados.",
    "06-execucao-de-programas/bibliotecas.md": "Reconhecer funções importadas e exportadas e explicar as limitações de chamadas via rundll32.",
    "06-execucao-de-programas/processos.md": "Distinguir arquivo executável, processo, PID, handles e threads e interpretar tasklist.",
    "07-windows-api/README.md": "Ler protótipos, tipos, anotações de entrada/saída, handles e flags de uma chamada Windows API.",
    "07-windows-api/acesso-ao-registro.md": "Associar chaves, valores e tipos e reconstruir chamadas RegCreateKey, RegSetKeyValue e RegCloseKey.",
    "08-assembly/README.md": "Relacionar opcodes, operandos e mnemônicos e explicar a dependência da arquitetura no código de máquina.",
    "09-depuracao/README.md": "Definir o propósito da depuração e identificar o alvo de estudo e o papel do debugger.",
    "09-depuracao/debugger.md": "Configurar a bancada e identificar disassembly, helper, dump, registradores, convenção de chamada e pilha.",
    "09-depuracao/disassembly.md": "Interpretar endereços e opcodes e distinguir step into, step over, run e restart.",
    "09-depuracao/breakpoints.md": "Inserir, desabilitar e remover breakpoints de software e explicar a troca temporária de um byte por INT3.",
    "09-depuracao/manipulacao.md": "Seguir chamadas intermodulares e modificar uma string em memória observando retorno, LastError e LastStatus.",
    "09-depuracao/patches.md": "Distinguir alteração em memória e patch persistente e revisar os bytes antes de exportar a modificação.",
}

SEGMENT_OBJECTIVES = {
    "bases": "Converter a mesma quantidade entre decimal, binário e octal e reconhecer seus prefixos.",
    "hexadecimal": "Converter hexadecimal em binário e relacionar dígitos, larguras e incrementos de endereços.",
    "sistema-proprio": "Construir um sistema posicional com símbolos próprios e conferir a contagem no exemplo ternário.",
    "and-or": "Calcular AND e OR por tabelas verdade e demonstrar por que OR não equivale a soma.",
    "xor": "Aplicar XOR para detectar diferenças, zerar, trocar valores e recuperar um valor usando a mesma chave.",
    "shift-rotate": "Distinguir deslocamento de rotação, declarar a largura e prever os bits que entram e saem.",
    "not": "Calcular NOT em larguras finitas e explicar a diferença para o resultado inteiro da operação em Python.",
    "utf-8": "Separar code point e codificação e comparar o número de caracteres e bytes dos exemplos UTF-8.",
    "utf-16": "Identificar BOM, LE/BE, unidades de código e pares substitutos em strings UTF-16.",
    "utf-32": "Comparar UTF-32 LE/BE e compreender a dependência de wide strings em relação ao ambiente.",
    "privilegios": "Distinguir user mode, kernel mode e rings e explicar a mediação do sistema operacional.",
    "dependencias": "Relacionar chamadas de funções, bibliotecas de execução, API e kernel no exemplo printf.",
    "loader": "Ordenar mapeamento de seções, resolução de dependências, preenchimento de IAT e transferência ao entrypoint.",
    "messagebox": "Configurar texto, título e flags de MessageBoxW e localizar a mensagem no resultado.",
    "retorno-messagebox": "Interpretar IDYES/IDNO e relacionar macros UNICODE, variantes A/W e tipos de ponteiros de strings.",
    "createfile": "Escolher parâmetros de CreateFile, validar o retorno e fechar corretamente o handle.",
    "writefile": "Calcular bytes escritos, interpretar os parâmetros de WriteFile e conferir o arquivo resultante.",
    "registradores": "Reconhecer os GPRs e prever como alterações em RAX, EAX, AX, AH e AL afetam seus aliases.",
    "primeiro-pe": "Explicar diretivas fasm, compilar um PE e localizar o código na seção .text sem executar o programa incompleto.",
    "rip": "Avançar RIP pelo tamanho real de cada instrução e calcular o endereço seguinte.",
    "rflags": "Interpretar CF, ZF, SF e OF e distinguir estado definido, preservado e indefinido.",
    "mov": "Identificar opcodes e operandos e copiar valores respeitando largura e endianness.",
    "aritmetica": "Prever resultados de ADD, SUB, INC, DEC e MUL e seus registradores e flags afetados.",
    "bitwise": "Aplicar operações de bits em registradores e diferenciar o efeito de MOV e XOR sobre flags.",
    "cmp-test": "Explicar a subtração de CMP e o teste lógico de TEST sem modificar os operandos.",
    "saltos": "Escolher saltos signed/unsigned a partir de flags e interpretar deslocamentos relativos com modo explícito.",
    "funcoes": "Identificar parâmetros e retorno e comparar repetição de código com reutilização por função.",
    "call-ret": "Reconstruir soma(3,4), os argumentos RCX/RDX e o retorno em RAX usando a ABI Microsoft x64.",
    "pilha": "Acompanhar RSP, bytes na pilha e endereço de retorno durante PUSH, POP, CALL e RET.",
    "shadow-space": "Localizar os argumentos quinto e sexto, shadow space, variável local e alinhamento da pilha.",
    "messagebox-assembly": "Recuperar argumentos e strings de uma chamada MessageBoxW a partir dos registradores e endereços.",
}

LAB_DEFINITIONS = [
    ("python-inicial", "Primeiro resultado no Python", "01", "01-introducao/antes-de-comecar.md", "python", "Obter e explicar o resultado de uma expressão no REPL."),
    ("c-inicial", "Compilar e observar um programa C", "01", "01-introducao/antes-de-comecar.md", "c-portable", "Compilar o programa inicial e conferir stdout e código de saída."),
    ("conversao-bases", "O mesmo número em quatro bases", "02", "02-numeros/sistemas-de-numeracao.md", "number-bench", "Representar o mesmo valor em binário, octal, decimal e hexadecimal."),
    ("base-propria", "Criar um alfabeto numérico", "02", "02-numeros/sistemas-de-numeracao.md", "number-bench", "Converter valores no sistema ternário descrito no livro e em um alfabeto escolhido."),
    ("signed-byte", "Um byte, duas interpretações", "02", "02-numeros/numeros-negativos.md", "bit-bench", "Demonstrar por que 0xF6 representa 246 sem sinal e -10 com sinal em oito bits."),
    ("and-or", "Operar sobre cada bit", "02", "02-numeros/calculos-com-binarios.md", "bit-bench", "Reproduzir as tabelas AND e OR e separar disjunção de soma."),
    ("xor", "Trocar e recuperar com XOR", "02", "02-numeros/calculos-com-binarios.md", "python", "Reproduzir XOR-swap e a reversibilidade do exemplo com chave 0x42."),
    ("shift-rotate", "Deslocar ou dar a volta", "02", "02-numeros/calculos-com-binarios.md", "bit-bench", "Comparar SHL/SHR com ROL/ROR em largura definida e conferir 133 ROL 3."),
    ("encodings", "Texto visto como bytes", "03", "03-cadeias-de-texto/unicode.md", "encoding", "Comparar UTF-8, UTF-16 LE/BE, UTF-32 e BOM nos exemplos originais."),
    ("null-strings", "Encontrar o fim de uma string", "03", "03-cadeias-de-texto/c-strings.md", "hex", "Localizar Erro e seu terminador em ASCII e UTF-16-LE."),
    ("arquivo-conteudo", "Conteúdo e metadados", "04", "04-arquivos/README.md", "hex", "Conferir os 19 bytes do texto e distinguir conteúdo, nome e extensão."),
    ("gif", "Ler um cabeçalho GIF", "04", "04-arquivos/formatos.md", "hex", "Identificar GIF89a e interpretar largura e altura little-endian."),
    ("dos", "Seguir MZ até PE", "05", "05-o-formato-pe/cabecalhos/dos.md", "pe", "Localizar e_magic e e_lfanew e seguir o offset até PE\\0\\0."),
    ("coff", "Identificar a máquina alvo", "05", "05-o-formato-pe/cabecalhos/coff.md", "pe", "Ler Machine, NumberOfSections, timestamp e Characteristics."),
    ("optional", "O ponto de entrada e suas flags", "05", "05-o-formato-pe/cabecalhos/opcional.md", "pe", "Distinguir PE32/PE32+ e calcular o entrypoint com ImageBase."),
    ("sections", "Do disco para páginas de memória", "05", "05-o-formato-pe/secoes.md", "memory", "Mapear .text e .data com alinhamento e permissões sem sobreposição incorreta."),
    ("imports", "Seguir uma importação", "05", "05-o-formato-pe/import-table.md", "pe", "Percorrer IDT, ILT, Hint/Name e IAT, convertendo RVA para offset quando necessário."),
    ("addressing", "Offset, RVA e VA", "05", "05-o-formato-pe/enderecamento.md", "memory", "Explicar a soma 0x1740 + 0x140000000 e fazer a conversão inversa."),
    ("loader", "Carregar uma imagem passo a passo", "06", "06-execucao-de-programas/README.md", "loader-model", "Mapear seções, resolver bibliotecas, preencher IAT e transferir o fluxo ao entrypoint."),
    ("dll", "Imports, exports e chamadas", "06", "06-execucao-de-programas/bibliotecas.md", "pe", "Encontrar ShellAboutA/W e distinguir função exportada de chamada compatível com rundll32."),
    ("processos", "Programa, processo e thread", "06", "06-execucao-de-programas/processos.md", "process-model", "Relacionar duas instâncias do mesmo executável a PIDs e espaços de endereçamento distintos."),
    ("messagebox", "Parâmetros e retorno de MessageBox", "07", "07-windows-api/caixas-de-mensagens.md", "windows-api-model", "Interpretar flags, textos UTF-16 e retornos IDYES/IDNO."),
    ("windows-files", "Criar, escrever e fechar", "07", "07-windows-api/manipulacao-de-arquivos.md", "windows-api-model", "Verificar o ciclo de um handle e os bytes escritos em log.txt no filesystem virtual."),
    ("registry", "Chaves, valores e tipos", "07", "07-windows-api/acesso-ao-registro.md", "windows-api-model", "Criar Habilitado e Website no registro virtual e conferir tipo, tamanho e terminador."),
    ("register-aliases", "Escrever em uma parte do registrador", "08", "08-assembly/registradores.md", "assembly", "Observar RAX/EAX/AX/AH/AL, preservação parcial e zero-extension de EAX."),
    ("opcodes", "Do Assembly aos bytes", "08", "08-assembly/README.md", "assembler", "Codificar MOV EAX, 0x20 e OR EAX, 0x18 e localizar os bytes na seção .text."),
    ("flags-branches", "Decidir com flags", "08", "08-assembly/instrucoes-basicas.md", "assembly", "Conferir CMP/TEST e saltos signed/unsigned, mantendo flags intactas após MOV."),
    ("call-stack", "Ir, empilhar e voltar", "08", "08-assembly/funcoes-e-pilha.md", "assembly", "Mostrar PUSH/POP, CALL/RET, RSP e o endereço real de retorno."),
    ("abi", "Seis argumentos na ABI Microsoft x64", "08", "08-assembly/funcoes-e-pilha.md", "assembly", "Reconhecer quatro argumentos em registradores, dois na pilha e shadow space."),
    ("api-reconstruction", "Reconstruir uma chamada da API", "08", "08-assembly/funcoes-e-pilha.md", "assembly", "Recuperar os quatro argumentos de MessageBoxW a partir das instruções."),
    ("debugger", "Step into e step over", "09", "09-depuracao/disassembly.md", "debugger-model", "Diferenciar F7/F8 e explicar o estado antes e depois de uma CALL."),
    ("breakpoints", "Parar por endereço", "09", "09-depuracao/breakpoints.md", "debugger-model", "Inserir 0xCC, parar, restaurar o opcode e avançar sem perder a instrução original."),
    ("manipulation", "Alterar o argumento em memória", "09", "09-depuracao/manipulacao.md", "debugger-model", "Editar cmd.exe para calc.exe em um alvo virtual e acompanhar DeleteFileA, EAX e LastError."),
    ("patches", "Um patch com antes e depois", "09", "09-depuracao/patches.md", "patch", "Separar alteração temporária em memória de patch em arquivo e exportar um diff reproduzível."),
    ("assembly-patterns", "Reconhecer padrões de Assembly", "08", "apendices/c-exemplos-de-codigo-em-assembly.md", "assembly", "Verificar loops, teste de zero, NOP e XCHG com modo e opcodes explícitos."),
]


def source_ref(path: str, start: int = 1, end: int = 0) -> dict[str, object]:
    page = PAGES[path]
    return {"repository": INVENTORY["source"]["repository"], "commit": INVENTORY["source"]["commit"],
            "path": path, "startLine": start, "endLine": end or page["lines"], "fileSha256": page["sha256"]}


def make_lesson(entry: dict[str, object], ordinal: int, segment: tuple, previous: str | None):
    path = str(entry["path"])
    key, title, start, end = segment
    end = end or PAGES[path]["lines"]
    module = path.split("/", 1)[0]
    lesson_id = f"{COURSE}/{module}/{key}"
    lines = (SOURCE / path).read_text().splitlines()[start - 1:end]
    codes = [e["id"] for e in EXAMPLES if e["sourcePath"] == path and start <= e["startLine"] <= end]
    reading = max(1, math.ceil(len("\n".join(lines).split()) / 180))
    objective = SEGMENT_OBJECTIVES[key] if path in SPLITS else PAGE_OBJECTIVES[path]
    return {"id": lesson_id, "slug": key, "title": title, "moduleId": module,
            "chapterId": path.removesuffix(".md"), "order": ordinal, "objective": objective,
            "prerequisiteLessonIds": [previous] if previous else [], "sourceRefs": [source_ref(path, start, end)],
            "sections": [h for h in PAGES[path]["headings"] if start <= h["line"] <= end],
            "codeExampleIds": codes, "readingMinutesEstimate": reading,
            "studyMinutesEstimate": max(8, reading + 5 + 2 * len(codes)),
            "architecturePolicy": "annotate-per-example-x86-or-x86-64; never infer solely from register names",
            "adaptationStatus": "planned-not-written",
            "quizPolicy": "author-new-formative-questions-labelled-as-complement; server-grading-for-persisted-results"}


def build_modules():
    modules = []
    previous_global = None
    covered: dict[str, list[tuple[int, int]]] = {}
    for entry in INVENTORY["summary"]:
        path = str(entry["path"])
        if not path[:2].isdigit():
            continue
        module_id = path.split("/", 1)[0]
        if not modules or modules[-1]["id"] != module_id:
            number = module_id[:2]
            modules.append({"id": module_id, "title": entry["title"], "order": len(modules),
                            "objective": MODULE_OBJECTIVES[number], "difficulty": "fundamentos" if int(number) <= 4 else "intermediário",
                            "prerequisiteModuleIds": [modules[-1]["id"]] if modules else [], "lessons": []})
        page_key = Path(path).stem if Path(path).stem != "README" else "visao-geral"
        if "cabecalhos/README" in path:
            page_key = "cabecalhos"
        segments = SPLITS.get(path, [(page_key, entry["title"], 1, 0)])
        covered[path] = []
        for segment in segments:
            lesson = make_lesson(entry, len(modules[-1]["lessons"]), segment, previous_global)
            modules[-1]["lessons"].append(lesson)
            previous_global = lesson["id"]
            ref = lesson["sourceRefs"][0]
            covered[path].append((ref["startLine"], ref["endLine"]))
    for path, spans in covered.items():
        position = 1
        for start, end in spans:
            assert start == position, (path, "gap or overlap", start, position)
            assert start <= end <= PAGES[path]["lines"]
            position = end + 1
        assert position == PAGES[path]["lines"] + 1, (path, "missing tail")
    return modules


def build_labs(modules):
    labs = []
    for key, title, number, path, engine, outcome in LAB_DEFINITIONS:
        refs = [l["id"] for m in modules for l in m["lessons"] if any(r["path"] == path for r in l["sourceRefs"])]
        labs.append({"id": key, "title": title, "moduleNumber": number, "engine": engine,
                     "sourceRefs": [source_ref(path)], "relatedLessonIds": refs,
                     "codeExampleIds": [e["id"] for e in EXAMPLES if e["sourcePath"] == path],
                     "learningOutcome": outcome, "origin": "pedagogical-adaptation-based-on-book",
                     "estimatedMinutes": 15, "implementationStatus": "planned-not-implemented",
                     "completionPolicy": "server-validates-answers-or-replays-deterministic-model; do-not-trust-client-result",
                     "limitations": "Modelled Windows behavior must be labelled; no arbitrary native PE execution."})
    return labs


def main():
    modules = build_modules()
    labs = build_labs(modules)
    ids = [l["id"] for m in modules for l in m["lessons"]]
    assert len(set(ids)) == len(ids)
    assigned_codes = [c for m in modules for l in m["lessons"] for c in l["codeExampleIds"]]
    learning_codes = [e["id"] for e in EXAMPLES if e["sourcePath"][:2].isdigit()]
    assert Counter(assigned_codes) == Counter(learning_codes)
    assert len(modules) == 9 and len(ids) == 63 and len(labs) == 35
    for m in modules:
        m["lessonCount"] = len(m["lessons"])
        m["labCount"] = sum(l["moduleNumber"] == m["id"][:2] for l in labs)
        m["studyMinutesEstimate"] = sum(l["studyMinutesEstimate"] for l in m["lessons"]) + 15 * m["labCount"]
    references = [{**e, "sourceRef": source_ref(str(e["path"]))} for e in INVENTORY["summary"]
                  if not str(e["path"])[:2].isdigit()]
    for module in modules:
        module["chapters"] = [{"id": str(e["path"]).removesuffix(".md"), "title": e["title"],
                               "sourcePath": e["path"], "parentSourcePath": e["parentPath"],
                               "lessonIds": [l["id"] for l in module["lessons"] if l["chapterId"] == str(e["path"]).removesuffix(".md")]}
                              for e in INVENTORY["summary"] if str(e["path"]).startswith(module["id"] + "/")]
    editorial = [{"sourceRef": source_ref("01-introducao/registro-de-alteracoes.md"), "destination": "/referencias/sobre-o-livro/historico"},
                 {"sourceRef": source_ref("SUMMARY.md"), "destination": "curriculum-structure-and-coverage"}]
    course = {"schemaVersion": 1, "id": COURSE, "title": "Fundamentos de Engenharia Reversa",
              "status": "pedagogical-plan-not-published-course", "source": INVENTORY["source"],
              "counts": {"modules": len(modules), "plannedLessons": len(ids), "plannedLabs": len(labs),
                         "learningSourcePagesCovered": 41, "learningCodeBlocksCovered": len(learning_codes),
                         "minutesEstimateWithLabs": sum(m["studyMinutesEstimate"] for m in modules)},
              "modules": modules, "referencePages": references, "editorialPages": editorial,
              "coverage": {"allLearningPagesPartitioned": True, "eachLearningCodeAssignedExactlyOnce": True,
                           "allMarkdownAccountedFor": len(references) + 41 + len(editorial) == 51}}
    for name, data in [("course-plan.json", course), ("labs.json", labs)]:
        (DATA / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(course["counts"], ensure_ascii=False, indent=2))
    for m in modules:
        print(m["id"], m["lessonCount"], "aulas", m["labCount"], "laboratórios", m["studyMinutesEstimate"], "min estimados")


if __name__ == "__main__":
    main()
