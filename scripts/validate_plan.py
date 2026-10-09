"""Validate the audit/plan independently; never claim application tests passed."""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
from collections import Counter
from itertools import product
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
DATA = PROJECT / "analysis"
SOURCE = PROJECT / "references/fundamentos-engenharia-reversa"


def load(name):
    return json.loads((DATA / name).read_text())


def sha(data):
    return hashlib.sha256(data).hexdigest()


def verify_sources(inventory, examples, tables):
    tracked = subprocess.check_output(["git", "ls-files", "-z"], cwd=SOURCE).decode().split("\0")
    expected = {name for name in tracked if name}
    assert expected == {f["path"] for f in inventory["files"]}
    for file in inventory["files"]:
        assert sha((SOURCE / file["path"]).read_bytes()) == file["sha256"], file["path"]
    assert len({e["id"] for e in examples}) == len(examples) == 141
    for example in examples:
        lines = (SOURCE / example["sourcePath"]).read_text().splitlines()
        chunk = lines[example["startLine"] - 1:example["endLine"]]
        if example["style"] == "fenced":
            assert chunk[0].startswith("```") and chunk[-1].startswith("```")
            raw = "\n".join(chunk[1:-1]) + "\n"
        else:
            assert all(line.startswith("\t") or line.startswith("    ") for line in chunk)
            raw = "\n".join(line[1:] if line.startswith("\t") else line[4:] for line in chunk)
        assert sha(raw.encode()) == example["sha256"], example["id"]
        assert example["validationStatus"] == "candidate-not-executed"
    assert len({t["id"] for t in tables}) == len(tables) == 43
    for table in tables:
        lines = (SOURCE / table["sourcePath"]).read_text().splitlines()
        assert sha("\n".join(lines[table["startLine"] - 1:table["endLine"]]).encode()) == table["sha256"]
    return "81 arquivos, 141 blocos e 43 tabelas com hashes e spans conferidos"


def verify_course(inventory, course, examples, labs):
    source_pages = {e["path"] for e in inventory["summary"] if e["path"][:2].isdigit()}
    lessons = [l for m in course["modules"] for l in m["lessons"]]
    ids = {l["id"] for l in lessons}
    assert len(course["modules"]) == 9 and len(lessons) == len(ids) == 63
    refs = [r for lesson in lessons for r in lesson["sourceRefs"]]
    assert {r["path"] for r in refs} == source_pages
    page_map = {p["id"]: p for p in inventory["pages"]}
    for path in source_pages:
        spans = sorted((r["startLine"], r["endLine"]) for r in refs if r["path"] == path)
        position = 1
        for start, end in spans:
            assert start == position and start <= end, (path, spans)
            position = end + 1
        assert position == page_map[path]["lines"] + 1, path
    assigned = [code for lesson in lessons for code in lesson["codeExampleIds"]]
    expected = [e["id"] for e in examples if e["sourcePath"] in source_pages]
    assert Counter(assigned) == Counter(expected)
    all_accounted = source_pages | {r["path"] for r in course["referencePages"]} | {e["sourceRef"]["path"] for e in course["editorialPages"]}
    assert all_accounted == {p["id"] for p in inventory["pages"]}
    for lesson in lessons:
        assert lesson["objective"] and lesson["adaptationStatus"] == "planned-not-written"
        assert all(p in ids for p in lesson["prerequisiteLessonIds"])
    for i, lesson in enumerate(lessons):
        earlier = {l["id"] for l in lessons[:i]}
        assert set(lesson["prerequisiteLessonIds"]) <= earlier
    assert len(labs) == len({l["id"] for l in labs}) == 35
    for lab in labs:
        assert lab["implementationStatus"] == "planned-not-implemented"
        assert set(lab["relatedLessonIds"]) <= ids
        for ref in lab["sourceRefs"]:
            assert ref["path"] in page_map and ref["fileSha256"] == page_map[ref["path"]]["sha256"]
    return "51 documentos com destino; 41 páginas particionadas; 63 aulas e 35 laboratórios válidos"


def verify_regressions(inventory, examples, tables, tools):
    assert len(tools) == 97
    expected_assemblers = {"flat assembler (FASM)", "GNU Assembler (GAS)", "Microsoft Macro Assembler (MASM)",
                           "Netwide Assembler (NASM)", "Yasm Modular Assembler (YASM)"}
    assert expected_assemblers <= {t["name"] for t in tools}
    assembler_tables = [t for t in tables if t["sourcePath"] == "apendices/e-ferramentas.md" and t["startLine"] == 69]
    assert len(assembler_tables) == 1 and assembler_tables[0]["rowCount"] == 5
    headings = {h["title"] for p in inventory["pages"] for h in p["headings"]}
    assert {".text", ".data", ".rdata", ".idata", "e_magic", "e_lfanew"} <= headings
    legacy = [e for e in examples if e["sourcePath"] == "08-assembly/instrucoes-basicas.md" and e["architecture"] == "x86-32"]
    assert len(legacy) == 2
    api_prototypes = [e for e in examples if e["sourcePath"] == "apendices/d-funcoes-api-win.md"]
    assert len(api_prototypes) == 15 and all(e["kind"] == "api-prototype" and e["execution"] == "none" for e in api_prototypes)
    assert sum(e["style"] == "indent" for e in examples) == 11
    assert sum(e["execution"] == "isolated-python" for e in examples) == 35
    assert sum(e["kind"] == "c-fragment" for e in examples) == 1
    assert not [r for r in load("references.json") if r["kind"] == "image" and r["localExists"] is False]
    return "Montadores, blocos indentados, nomes de campos, modo legado e protótipos preservados"


def luminance(color):
    values = [int(color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in values]
    return sum(x * y for x, y in zip(linear, (.2126, .7152, .0722)))


def verify_contrast():
    tokens = load("design-tokens.json")
    colors = tokens["colors"]
    combinations = [(fg, bg, 4.5) for fg, bg in product(["ink", "muted", "metadata", "accent", "positive", "negative", "info"],
                                                    ["canvas", "surface", "panel", "raised"])]
    combinations += [("control-border", bg, 3) for bg in ["canvas", "surface", "panel", "raised"]]
    combinations += [("focus", bg, 3) for bg in ["canvas", "surface", "panel", "raised"]]
    combinations += [("accent-ink", "accent", 4.5)]
    results = []
    for foreground, background, minimum in combinations:
        lo, hi = sorted([luminance(colors[foreground]), luminance(colors[background])])
        ratio = (hi + .05) / (lo + .05)
        assert ratio >= minimum, (foreground, background, ratio)
        results.append({"foreground": foreground, "background": background, "ratio": round(ratio, 3),
                        "required": minimum, "passed": True})
    (DATA / "contrast-check.json").write_text(json.dumps({"scope": "proposed-token-pairs-not-rendered-page-audit", "results": results}, indent=2) + "\n")
    return f"{len(results)} combinações propostas de texto, controle e foco com contraste adequado"


def verify_documents():
    documents = [PROJECT / "README.md", *sorted((PROJECT / "docs").glob("*.md"))]
    for document in documents:
        text = document.read_text()
        for target in re.findall(r"\]\(([^)]+)\)", text):
            if target.startswith(("https://", "http://", "#")):
                continue
            assert (document.parent / target.split("#", 1)[0]).exists(), (document.name, target)
    decisions = load("project-decisions.json")
    assert decisions["userConstraints"]["excludedProviders"] == ["Supabase"]
    assert decisions["stackProposal"]["database"] == "PostgreSQL" and decisions["stackProposal"]["orm"] == "Drizzle"
    assert isinstance(decisions["applicationImplemented"], bool)
    if decisions["applicationImplemented"]:
        assert decisions["stage"] == "implemented-local-platform"
    return "Links locais dos documentos válidos e restrição de provider registrada"


def main():
    inventory, course, examples, tables, labs, tools = [load(n) for n in
        ["inventory.json", "course-plan.json", "examples.json", "tables.json", "labs.json", "tools.json"]]
    checks = [verify_sources(inventory, examples, tables), verify_course(inventory, course, examples, labs),
              verify_regressions(inventory, examples, tables, tools), verify_contrast(), verify_documents()]
    report = {"status": "passed", "scope": "source-audit-and-plan-only", "checks": checks,
              "applicationTestsRun": False, "sandboxVerified": False, "coursePublished": False}
    (DATA / "validation-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
