"""Generate reviewable reports and a term/reference index from audited data."""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
DATA = PROJECT / "analysis"
DOCS = PROJECT / "docs"
SOURCE = PROJECT / "references/fundamentos-engenharia-reversa"

TERMS = {
    "numbers": "binário|octal|hexadecimal|byte|bit|nibble|WORD|DWORD|QWORD|signed|unsigned|complemento de dois|AND|OR|XOR|NOT|SHL|SHR|ROL|ROR|MSB",
    "text": "ASCII|Unicode|code point|code page|UTF-8|UTF-16|UTF-16-LE|UTF-16-BE|UTF-32|BOM|little-endian|big-endian|string|wide string|nullbyte|LF|CR|CrLf|ISO-8859-1",
    "files": "offset|magic number|metadados|filesystem|GIF|header",
    "pe": "PE|PE32|PE32+|COFF|MZ|e_magic|e_lfanew|Machine|NumberOfSections|TimeDateStamp|SizeOfOptionalHeader|Characteristics|AddressOfEntryPoint|ImageBase|Subsystem|DllCharacteristics|DataDirectory|VirtualSize|VirtualAddress|SizeOfRawData|PointerToRawData|SectionAlignment|FileAlignment|.text|.data|.rdata|.idata|IDT|ILT|IAT|Hint/Name|exports|ordinal|RVA|VA|memória virtual|página|ASLR|DEP|CLR|Certificate Table",
    "execution": "user mode|kernel mode|ring|thread|processo|PID|loader|linker|compilador|DLL|biblioteca|handle",
    "windows-api": "Windows API|MessageBox|CreateFile|WriteFile|CloseHandle|RegCreateKey|RegSetKeyValue|RegCloseKey|HWND|LPCSTR|LPCWSTR|TCHAR|WCHAR|LPTSTR|LPCTSTR|BOOL|HKEY|REG_DWORD|REG_SZ|HKEY_CURRENT_USER|HKCU",
    "assembly": "opcode|operando|mnemônico|registrador|subregistrador|GPR|long mode|RAX|RBX|RCX|RDX|RSP|RBP|RSI|RDI|RIP|EAX|ESP|EIP|AX|AH|AL|R8|R8D|R8W|R8B|RFLAGS|EFLAGS|CF|ZF|SF|OF|PF|MOV|ADD|SUB|INC|DEC|MUL|DIV|CMP|TEST|JMP|JE|JZ|JNE|JNZ|JA|JAE|JB|JBE|JG|JGE|JL|JLE|JS|JNS|JO|JNO|JCXZ|JECXZ|CALL|RET|PUSH|POP|LEA|NOP|XCHG|ABI|shadow space|pilha|stack frame|LIFO",
    "debugging": "disassembly|debugger|breakpoint|INT3|Step over|Step into|LastError|LastStatus|patch|dump|entrypoint",
}
ALIASES = {
    "hexadecimal": ["hexa"], "byte": ["octeto"], "nullbyte": ["null byte", "nullbytes"],
    "little-endian": ["little endian"], "big-endian": ["big endian"],
    "entrypoint": ["entry point", "EP", "ponto de entrada"], "breakpoint": ["ponto de parada"],
    "RVA": ["Relative Virtual Address", "Endereço Virtual Relativo"],
    "VA": ["Virtual Address", "Endereço Virtual"], "pilha": ["stack"],
    "PE": ["Portable Executable"], "COFF": ["Common Object File Format"],
}
COMMANDS = ["dumpbin", "findstr", "rundll32", "tasklist", "regedit", "chmod", "cat", "grep",
            "hdump", "heksa", "hexyl", "hexdump", "hd", "od", "xxd", "fasm", "objdump",
            "StepOver", "step", "sto", "st", "SetBPX", "bp", "bpx"]
DIAGRAMS = {"05_pe.png": "Estrutura PE", "05_alinhamento.png": "Alinhamento de seções e permissões",
            "05_memoria_virtual.png": "Memória virtual e páginas compartilhadas",
            "06_execucao_programas.png": "Execução Windows e fronteiras de privilégio",
            "08_7400.png": "Circuito lógico e portas NAND"}


def load(name):
    return json.loads((DATA / name).read_text())


def slug(text):
    normalized = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")


def cell(text):
    return str(text).replace("|", "\\|").replace("\n", " ")


def source_link(path, start=1, end=None):
    suffix = f"#L{start}" + (f"-L{end}" if end is not None else "")
    return f"https://github.com/mentebinaria/fundamentos-engenharia-reversa/blob/{load('inventory.json')['source']['commit']}/{path}{suffix}"


def term_index(inventory):
    corpus = [(page["id"], [(i, re.sub(r"(?<!\w)_(?=\w)|(?<=\w)_(?!\w)", "", re.sub(r"\\([_\[\]])", r"\1", line)))
                          for i, line in enumerate((SOURCE / page["id"]).read_text().splitlines(), 1)])
              for page in inventory["pages"] if page["id"] != "SUMMARY.md"]
    concepts = []
    seen = set()
    for category, names in TERMS.items():
        for term in names.split("|"):
            if term.lower() in seen:
                continue
            seen.add(term.lower())
            aliases = ALIASES.get(term, [])
            pattern = re.compile(r"(?<![\w])(?:" + "|".join(re.escape(t) for t in [term, *aliases]) + r")(?![\w])", re.I)
            occurrences = [{"path": path, "line": i} for path, lines in corpus for i, line in lines if pattern.search(line)]
            if occurrences:
                concepts.append({"id": f"concept/{category}/{slug(term)}", "term": term, "aliases": aliases,
                                 "category": category, "sourceOccurrences": occurrences,
                                 "status": "term-in-source-not-yet-curated-definition"})
    functions = {}
    for path, lines in corpus:
        for i, line in lines:
            names = {name.strip("_") for name in re.findall(r"\b([A-Za-z_]\w*)\(", line)}
            if path == "apendices/d-funcoes-api-win.md":
                names.update(re.findall(r"`([A-Za-z_]\w*)`", line))
            for name in names - {"", "if", "for", "while", "switch", "sizeof", "return", "void", "int", "type", "x", "y", "z"}:
                functions.setdefault(name, []).append({"path": path, "line": i})
    commands = []
    for command in COMMANDS:
        pattern = re.compile(r"(?<![\w])" + re.escape(command) + r"(?![\w])", re.I)
        occurrences = [{"path": path, "line": i} for path, lines in corpus for i, line in lines if pattern.search(line)]
        if occurrences:
            commands.append({"name": command, "sourceOccurrences": occurrences,
                             "status": "mentioned-in-source-not-host-shell-command"})
    for name, data in [("concepts.json", concepts), ("functions.json", [{"name": n, "sourceOccurrences": refs,
                       "status": "source-symbol-candidate-review-before-public-index"} for n, refs in sorted(functions.items())]),
                       ("commands.json", commands)]:
        (DATA / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return len(concepts), len(functions), len(commands)


def inventory_report(inventory, totals):
    c = inventory["counts"]
    text = ["# Inventário e análise da fonte", "", "## Fonte e método", "",
            f"Clone do repositório no commit `{inventory['source']['commit']}`. Foram lidos os documentos, os blocos de código e os apêndices e inspecionadas as imagens. Nenhum executável ou código do livro foi rodado.", "",
            "O inventário combina parser e auditoria de linhas. Front matter é metadado, não título de aula; códigos indentados são preservados; a linha vazia malformada no catálogo de montadores recebe reparo apenas na entrada do parser, sem mudança no clone. Os hashes correspondem à fonte original.", "",
            "## Contagens", "", "| Medida | Total |", "| --- | ---: |"]
    labels = {"trackedFilesExcludingGit": "Arquivos versionados", "markdownFiles": "Documentos Markdown", "pngAssets": "Imagens PNG",
              "summaryEntries": "Páginas no sumário", "learningSourcePages": "Páginas didáticas", "headingNodes": "Títulos e subtítulos",
              "codeBlocks": "Blocos de código, dados ou saída", "tables": "Tabelas, incluindo uma recuperada", "toolEntries": "Entradas de ferramentas",
              "exerciseHeadings": "Seções intituladas Exercício/Exercícios", "linkOccurrences": "Ocorrências de links", "wordsWhitespaceIncludingCodeAndTables": "Palavras por separação de espaços, incluindo código e tabelas"}
    text.extend(f"| {label} | {c[key]} |" for key, label in labels.items())
    text.extend(["", "As 141 ocorrências se dividem em 130 blocos delimitados e 11 indentados. Não são 141 programas executáveis. As cinco seções de exercícios também não esgotam a prática, que aparece em exemplos e perguntas no texto.", "",
                 f"O índice de análise contém {totals[0]} termos/aliases com ocorrência na fonte, {totals[1]} candidatos a símbolos de funções e {totals[2]} nomes de comandos. São registros de pesquisa; símbolos inferidos requerem curadoria antes da busca pública.", "",
                 "## Documentos e destino", "", "| Documento | Título | Linhas | Código/dados | Tabelas | Destino |", "| --- | --- | ---: | ---: | ---: | --- |"])
    pages = {p["id"]: p for p in inventory["pages"]}
    ordered = [e["path"] for e in inventory["summary"]] + inventory["unlistedMarkdown"]
    for path in ordered:
        p = pages[path]
        destination = "Trilha" if path[:2].isdigit() and "registro-de-alteracoes" not in path else "Estrutura" if path == "SUMMARY.md" else "Referência/editorial"
        text.append(f"| [{cell(path)}]({source_link(path)}) | {cell(p['title'])} | {p['lines']} | {len(p['codeIds'])} | {p['astCounts'].get('table',0)} | {destination} |")
    text.extend(["", "O histórico `01-introducao/registro-de-alteracoes.md` não está no sumário; recebe destino em Sobre o livro / Histórico. `SUMMARY.md` alimenta a estrutura, sem virar aula concluível. `.gitignore` e `.github/FUNDING.yml` são arquivos de manutenção e apoio, também registrados no manifesto de arquivos.", "",
                 "## Imagens e diagramas", "", "Há cinco diagramas conceituais e 23 screenshots. Cada uma das 28 imagens tem uma referência resolvida na fonte; não foram encontrados links locais de imagem quebrados. Quatro diagramas têm transparência e elementos pretos: precisam de fundo adequado para serem legíveis em dark mode.", "",
                 "| Asset | Dimensões | Tipo/assunto |", "| --- | --- | --- |"])
    for file in inventory["files"]:
        if file["extension"] != ".png":
            continue
        name = Path(file["path"]).name
        d = file["dimensions"]
        text.append(f"| `{name}` | {d['width']} × {d['height']} | {DIAGRAMS.get(name,'Screenshot de ferramenta ou resultado')} |")
    text.extend(["", "Preservar as imagens de origem como referência e transformar relações de memória/PE/CPU em instrumentos acessíveis. Redesenhar um diagrama funcional não elimina o registro de sua fonte. Screenshots têm descrições e possibilidade de ampliação, sem depender de zoom de uma imagem minúscula para explicar um conceito.", "",
                 "## Exemplos, exercícios e execução", "", "Classificação por bloco em [examples.json](../analysis/examples.json); campos e spans das 43 tabelas em [tables.json](../analysis/tables.json). Linguagens marcadas: Python (33), C (47), C++ (5), asm (5), x86 (2), text (1), além de 48 blocos sem rótulo, incluindo os indentados.", "",
                 "A fonte não contém arquivos `.c`, `.cpp`, `.asm`, `.py`, `.exe`, `.dll` ou testes de correção. O código está dentro do Markdown. Há programas completos, fragmentos, structs, macros, protótipos, opcodes e saída de ferramentas. Windows API e análise de seções exigem ambiente próprio; [o plano de execução](06-execucao.md) delimita esses casos.", "",
                 "## Ferramentas, comandos e referências", "", "As 97 entradas de [tools.json](../analysis/tools.json) conservam nome, categoria, URL e rótulo de licença do livro. O registro não afirma que cada ferramenta foi instalada, testada ou que sua licença atual foi auditada.", "",
                 "Os [links de origem](../analysis/references.json) incluem referências internas, ferramentas, artigos, vídeos e bibliografia. Há 125 destinos externos HTTP(S) distintos nas ocorrências de links, além de diretivas GitBook registradas nos documentos. Um link de Procyon possui esquema `hhttps` e exige reparo editorial.", "",
                 "Comandos Windows incluem dumpbin, findstr, rundll32 e tasklist; depuração inclui StepOver/step/sto/st e SetBPX/bp/bpx; o apêndice inclui hdump, heksa, hexyl, hd, od e xxd. A presença no índice não autoriza execução de uma shell arbitrária.", "",
                 "## Limitações verificadas", "", "O texto mistura x86 legado e x86-64. Há erros e lacunas técnicas que receberam [registro de revisão](08-revisao-editorial.md). O repositório não declara licença, e as amostras GIF, calc.exe, Shell32.dll e AnalyseMe-00 não estão no clone. O download do AnalyseMe-00 exigiu verificação de acesso e não foi obtido.", "",
                 "Os 63 planos de aula e 35 laboratórios têm proveniência e estados de implementação explícitos. A cobertura desta etapa é a do planejamento; textos adaptados, bancos, execução e interfaces ainda precisam ser implementados e testados.", ""])
    (DOCS / "01-inventario.md").write_text("\n".join(text))


def curriculum_report(course, labs):
    text = ["# Trilha detalhada e laboratórios", "", "Proposta derivada do conteúdo real, com fontes e objetivos. As aulas e laboratórios abaixo ainda não estão implementados. Tempos são estimativas de estudo, não medições.", "",
            "| Módulo | Aulas | Laboratórios | Duração estimada | Dificuldade |", "| --- | ---: | ---: | ---: | --- |"]
    for m in course["modules"]:
        text.append(f"| {m['id'][:2]} · {m['title']} | {m['lessonCount']} | {m['labCount']} | {m['studyMinutesEstimate']} min | {m['difficulty']} |")
    for m in course["modules"]:
        text.extend(["", f"## {m['id'][:2]} · {m['title']}", "", m["objective"], "",
                     "| Aula | Objetivo | Fonte | Estudo estimado |", "| --- | --- | --- | ---: |"])
        for l in m["lessons"]:
            r = l["sourceRefs"][0]
            label = f"{r['path']} · L{r['startLine']}–{r['endLine']}"
            text.append(f"| {l['order']+1:02} · {cell(l['title'])} | {cell(l['objective'])} | [{label}]({source_link(r['path'],r['startLine'],r['endLine'])}) | {l['studyMinutesEstimate']} min |")
        text.extend(["", "Laboratórios associados:", ""])
        text.extend(f"- **{lab['title']}** — {lab['learningOutcome']} Motor proposto: `{lab['engine']}`."
                    for lab in labs if lab["moduleNumber"] == m["id"][:2])
    text.extend(["", "## Referências e conteúdo editorial", ""])
    for entry in course["referencePages"]:
        text.append(f"- [{entry['title']}]({source_link(entry['path'])}) — material de consulta, atribuição ou apoio, fora do percentual de aulas.")
    text.extend(["- Registro de alterações — Sobre o livro / Histórico.", "- SUMMARY — estrutura da fonte e auditoria de cobertura, sem aula artificial.", "",
                 "IDs de aulas, pré-requisitos, capítulos de origem, seções e vínculos com exemplos estão em [course-plan.json](../analysis/course-plan.json). O laboratório de padrões Assembly vem do apêndice e integra a bancada do módulo 08, preservando essa proveniência.", ""])
    (DOCS / "09-trilha-detalhada.md").write_text("\n".join(text))


def main():
    inventory = load("inventory.json")
    totals = term_index(inventory)
    inventory_report(inventory, totals)
    curriculum_report(load("course-plan.json"), load("labs.json"))
    print(json.dumps({"reports": ["docs/01-inventario.md", "docs/09-trilha-detalhada.md"],
                      "termEntries": totals[0], "functionSymbolCandidates": totals[1], "commandEntries": totals[2]}))


if __name__ == "__main__":
    main()
