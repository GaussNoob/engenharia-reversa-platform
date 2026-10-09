"""Read-only audit of the pinned book. Does not execute source code examples."""

from __future__ import annotations

import hashlib
import json
import re
import struct
import subprocess
from collections import Counter
from pathlib import Path
from typing import Any

import mistune

PROJECT = Path(__file__).resolve().parents[1]
SOURCE = PROJECT / "references/fundamentos-engenharia-reversa"
OUTPUT = PROJECT / "analysis"
REPOSITORY = "https://github.com/mentebinaria/fundamentos-engenharia-reversa"
PIN = "3d24fc9313560d734d7a27c56c53d695f01163e1"
PARSER = mistune.create_markdown(renderer="ast", plugins=["table", "strikethrough", "url"])


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_json(name: str, value: object) -> None:
    OUTPUT.mkdir(exist_ok=True)
    (OUTPUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def walk(nodes: list[dict[str, Any]]):
    for node in nodes:
        yield node
        yield from walk(node.get("children", []))


def plain(nodes: list[dict[str, Any]]) -> str:
    return "".join(node.get("raw", "") + plain(node.get("children", [])) for node in nodes)


def clean_title(title: str) -> str:
    rendered = plain(PARSER(title)).strip()
    return re.sub(r"^[\s\U0001F000-\U0001FFFF\u2600-\u27BF\uFE0F\u200D]+", "", rendered).strip()


def source_metadata(text: str) -> tuple[str, dict[str, str]]:
    lines = text.splitlines(keepends=True)
    if not lines or lines[0].strip() != "---":
        return text, {}
    end = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), None)
    if end is None:
        raise ValueError("Unclosed front matter")
    metadata = {}
    for line in lines[1:end]:
        key, separator, value = line.partition(":")
        if separator:
            metadata[key.strip()] = value.strip()
    return "\n" * (end + 1) + "".join(lines[end + 1:]), metadata


def table_cells(line: str) -> list[str]:
    return [c.strip() for c in re.split(r"(?<!\\)\|", line.strip().strip("|"))]


def analysis_table_repairs(text: str) -> tuple[str, list[dict[str, object]]]:
    """Keep line positions; an empty malformed trailing row must not hide a table."""
    lines = text.splitlines(keepends=True)
    repairs = []
    for i, line in enumerate(lines):
        if "-" not in line or not re.fullmatch(r"\|[\s:|\-]+\|", line.strip()) or i == 0:
            continue
        expected = len(table_cells(lines[i - 1]))
        j = i + 1
        while j < len(lines) and lines[j].startswith("|"):
            cells = table_cells(lines[j])
            if len(cells) != expected and not any(cells):
                repairs.append({"line": j + 1, "kind": "malformed-empty-table-row",
                                "expectedColumns": expected, "actualColumns": len(cells),
                                "action": "blank-row-for-analysis-only-source-unchanged"})
                lines[j] = "\n"
            j += 1
    return "".join(lines), repairs


def tables_for_page(path: str, lines: list[str], spans, ast):
    excluded = {i for b in spans for i in range(b["startLine"], b["endLine"] + 1)}
    found = []
    for i, line in enumerate(lines):
        if i + 1 in excluded or "-" not in line or not re.fullmatch(r"\|[\s:|\-]+\|", line):
            continue
        start, end = i - 1, i + 1
        while end < len(lines) and lines[end].startswith("|"):
            end += 1
        found.append((start + 1, end))
    nodes = [n for n in ast if n["type"] == "table"]
    assert len(found) == len(nodes), (path, "table spans differ", len(found), len(nodes))
    result = []
    for index, ((start, end), node) in enumerate(zip(found, nodes), 1):
        header = next(n for n in node["children"] if n["type"] == "table_head")
        rows = [n for n in walk(node["children"]) if n["type"] == "table_row"]
        result.append({"id": f"{path}::table-{index:02}", "sourcePath": path, "sourceCommit": PIN,
                       "startLine": start, "endLine": end, "rowCount": len(rows),
                       "columnLabels": [plain(c.get("children", [])) for c in header["children"]],
                       "sha256": digest("\n".join(lines[start - 1:end]).encode()),
                       "adaptationStatus": "source-table-not-transformed"})
    return result


def summary_entries() -> list[dict[str, object]]:
    entries: list[dict[str, object]] = []
    parents: dict[int, str] = {}
    for line in (SOURCE / "SUMMARY.md").read_text().splitlines():
        match = re.match(r"^( *)\* \[([^\]]+)\]\(([^)]+)\)", line)
        if not match:
            continue
        spaces, title, path = match.groups()
        depth = len(spaces) // 2
        entries.append({"order": len(entries), "title": clean_title(title), "path": path,
                        "depth": depth, "parentPath": parents.get(depth - 1) if depth else None})
        parents[depth] = path
    return entries


def lexical_blocks(lines: list[str]) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    headings: list[dict[str, object]] = []
    blocks: list[dict[str, object]] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        fence = re.match(r"^(`{3,}|~{3,})(.*)$", line)
        if fence:
            first, info = fence.groups()
            start = i
            i += 1
            while i < len(lines) and not re.match(r"^" + re.escape(first) + r"\s*$", lines[i]):
                i += 1
            if i == len(lines):
                raise ValueError(f"Unclosed fence on line {start + 1}")
            blocks.append({"startLine": start + 1, "endLine": i + 1, "style": "fenced",
                           "languageLabel": info.strip() or None,
                           "raw": "\n".join(lines[start + 1:i]) + "\n"})
        elif (line.startswith("\t") or line.startswith("    ")) and not re.match(r"^\s+[*-]\s", line):
            start = i
            raw: list[str] = []
            while i < len(lines) and (lines[i].startswith("\t") or lines[i].startswith("    ")):
                raw.append(lines[i][1:] if lines[i].startswith("\t") else lines[i][4:])
                i += 1
            blocks.append({"startLine": start + 1, "endLine": i, "style": "indent",
                           "languageLabel": None, "raw": "\n".join(raw)})
            continue
        else:
            heading = re.match(r"^(#{1,6})\s+(.*)$", line)
            if heading:
                marks, title = heading.groups()
                headings.append({"level": len(marks), "title": clean_title(title), "line": i + 1})
        i += 1
    return headings, blocks


def classify(path: str, raw: str, label: str | None) -> dict[str, str]:
    """Candidate routing, deliberately distinct from successful execution validation."""
    if label == "python" or ">>>" in raw:
        return {"kind": "python-repl" if ">>>" in raw else "python-program",
                "language": "python", "execution": "isolated-python",
                "reason": "Normalize REPL input/output; review ctypes as pure value conversion."}
    if path == "02-numeros/calculos-com-binarios.md" and "x =" in raw:
        return {"kind": "python-program", "language": "python", "execution": "isolated-python",
                "reason": "Unlabelled XOR-swap program; output must be added explicitly."}
    if path.startswith("apendices/a-") or path.startswith("apendices/b-"):
        return {"kind": "character-table", "language": "text", "execution": "visualizer",
                "reason": "Reference data; preserve source and verify code points."}
    if path == "08-assembly/registradores.md" and "+---" in raw:
        return {"kind": "register-diagram", "language": "text", "execution": "visualizer",
                "reason": "ASCII diagram describes aliasing of registers."}
    if "Dump of file" in raw or re.match(r"^110\.222", raw.strip()):
        return {"kind": "expected-output", "language": "text", "execution": "none",
                "reason": "Output transcript; never submit as executable source."}
    if re.search(r"(?:^|>)\s*(?:dumpbin|rundll32|tasklist|\$ hdump)", raw, re.M):
        return {"kind": "command-transcript", "language": "shell", "execution": "guided-tool",
                "reason": "Windows/environment-dependent or mixed commands/output; bounded analysis adapter only."}
    if label in {"c", "cpp"}:
        if path == "apendices/d-funcoes-api-win.md" or re.search(r"\[(?:in|out)", raw):
            return {"kind": "api-prototype", "language": label, "execution": "none",
                    "reason": "API prototype, possibly with SAL annotations; not a standalone C/C++ program."}
        if "typedef struct" in raw:
            return {"kind": "type-definition", "language": label, "execution": "visualizer",
                    "reason": "Map structure fields to binary ranges; Microsoft LLP64 widths."}
        if "#define" in raw and not re.search(r"\bmain\s*\(", raw):
            return {"kind": "constant-definitions", "language": label, "execution": "visualizer",
                    "reason": "Constants/bit masks, not a standalone program."}
        if "windows-api" in path or "windows.h" in raw.lower() or "MessageBox" in raw:
            return {"kind": "windows-program" if "main(" in raw or "main(void)" in raw else "windows-fragment",
                    "language": label, "execution": "windows-model-or-vm",
                    "reason": "Native Windows API; use explicit model or disposable Windows VM, not a Linux C runner."}
        complete = bool(re.search(r"\bmain\s*\(", raw))
        return {"kind": "portable-c-program" if complete else "c-fragment", "language": label,
                "execution": "isolated-c" if complete else "isolated-c-with-harness",
                "reason": "Review includes, C23 binary literal support and missing soma definition; Linux artifacts are ELF, not PE."}
    assembly = label in {"asm", "x86"} or path.startswith("08-assembly/") or path.startswith("apendices/c-")
    if assembly:
        if re.fullmatch(r"[0-9A-Fa-f\s]+", raw.strip()):
            return {"kind": "machine-bytes", "language": "hex", "execution": "disassembler",
                    "reason": "Read as encoded instruction bytes with explicit execution mode."}
        if raw.strip().startswith("opcode "):
            return {"kind": "syntax-template", "language": "text", "execution": "none",
                    "reason": "Illustrative syntax, not an instruction."}
        return {"kind": "assembly-program" if "format PE64" in raw else "assembly-fragment",
                "language": "assembly", "execution": "assembly-model-or-isolated-emulator",
                "reason": "Resolve assembler vs debugger number dialect, x86/x64, labels, imports and initial CPU/stack state."}
    return {"kind": "data-or-output", "language": "text", "execution": "visualizer-or-reference",
            "reason": "Bytes, bit diagrams or textual output; not arbitrary source code."}


def example_context(path: str, raw: str, kind: str) -> dict[str, str]:
    if kind.startswith("assembly-") or kind == "machine-bytes":
        if re.search(r"\b40\s+inc\s+eax", raw, re.I):
            return {"architecture": "x86-32", "architectureBasis": "Legacy one-byte INC encoding in the source disassembly.",
                    "numericDialect": "debugger-hex", "readiness": "requires-declared-initial-cpu-memory-and-entry-state"}
        if path.startswith("apendices/"):
            return {"architecture": "context-required-x86-or-x86-64", "architectureBasis": "Generic instruction patterns; mode changes aliasing effects.",
                    "numericDialect": "explicit-literals-where-given", "readiness": "requires-harness-labels-and-mode"}
        return {"architecture": "x86-64", "architectureBasis": "Current chapter declares long mode/PE32+; legacy exceptions are recorded separately.",
                "numericDialect": "fasm" if "format PE64" in raw else "annotate-assembler-vs-debugger-hex",
                "readiness": "requires-declared-initial-cpu-memory-and-entry-state"}
    if kind.startswith("python-"):
        return {"architecture": "portable-value-semantics", "environment": "Python 3 in isolated runtime",
                "readiness": "review-transcript-input-output-and-cell-dependencies"}
    if kind.startswith("windows-") or kind == "api-prototype":
        return {"architecture": "windows-api-with-declared-pointer-width", "environment": "Windows native or explicitly labelled API model",
                "readiness": "reference-only" if kind == "api-prototype" else "review-source-and-compiler-context"}
    if kind == "type-definition":
        return {"architecture": "pe32-plus" if "IMAGE_OPTIONAL_HEADER_64" in raw else "fixed-width-pe-structure",
                "environment": "Format parser, not a standalone C executable", "readiness": "reference-and-field-visualization"}
    return {"architecture": "declared-by-lab-profile" if kind in {"portable-c-program", "c-fragment"} else "not-applicable",
            "readiness": "candidate-requires-validation" if kind in {"portable-c-program", "c-fragment"} else "reference-or-visualization"}


def link_record(path: str, node: dict[str, Any]) -> dict[str, object]:
    url = node.get("attrs", {}).get("url", "")
    target = url.split("#", 1)[0]
    external = bool(re.match(r"^https?://", url))
    local = (SOURCE / path).parent / target
    resolved = local.resolve()
    exists = resolved.exists() if target and not external else None
    fallback = None
    if node["type"] == "image" and not exists:
        candidates = list((SOURCE / ".gitbook/assets").glob(Path(target).name))
        if len(candidates) == 1:
            fallback = candidates[0].relative_to(SOURCE).as_posix()
    return {"sourcePath": path, "kind": node["type"], "label": plain(node.get("children", [])),
            "target": url, "external": external, "localExists": exists,
            "canonicalLocalPath": resolved.relative_to(SOURCE).as_posix() if not external and exists else None,
            "proposedRepair": fallback, "networkStatus": "not-checked" if external else None}


def audit_page(path: Path, listed: dict[str, dict[str, object]]):
    relative = path.relative_to(SOURCE).as_posix()
    text = path.read_text()
    lines = text.splitlines()
    headings, scanned = lexical_blocks(lines)
    body, metadata = source_metadata(text)
    body, repairs = analysis_table_repairs(body)
    ast = list(walk(PARSER(body)))
    code = [node for node in ast if node["type"] == "block_code"]
    assert len(scanned) == len(code), (relative, len(scanned), len(code))
    examples = []
    for index, (span, node) in enumerate(zip(scanned, code), 1):
        raw = node["raw"]
        assert raw.rstrip() == str(span["raw"]).rstrip(), (relative, index)
        classification = classify(relative, raw, span["languageLabel"])
        examples.append({"id": f"{relative}::code-{index:02}", "sourcePath": relative,
                         "sourceCommit": PIN, "ordinal": index,
                         "startLine": span["startLine"], "endLine": span["endLine"],
                         "style": span["style"], "languageLabel": span["languageLabel"],
                         "sha256": digest(raw.encode()), "validationStatus": "candidate-not-executed",
                         **classification, **example_context(relative, raw, classification["kind"])})
    links = [link_record(relative, n) for n in ast if n["type"] in {"link", "image"}]
    counts = Counter(n["type"] for n in ast)
    page = {"id": relative, "title": headings[0]["title"] if headings else relative,
            "sha256": digest(path.read_bytes()), "lines": len(lines), "wordsWhitespace": len(text.split()),
            "summaryEntry": listed.get(relative), "headings": headings, "frontMatter": metadata,
            "analysisRepairs": repairs,
            "codeIds": [e["id"] for e in examples], "astCounts": dict(sorted(counts.items())),
            "exerciseHeadings": [h for h in headings if re.match(r"^Exerc[ií]cios?$", str(h["title"]), re.I)],
            "gitbookDirectives": [{"line": i, "directive": l.strip()} for i, l in enumerate(lines, 1)
                                  if "{%" in l and "{%" == l.strip()[:2]],
            "editorialStatus": "audited-source-not-adapted"}
    tables = tables_for_page(relative, lines, scanned, ast)
    return page, examples, links, tables


def tool_catalog() -> list[dict[str, object]]:
    file = "apendices/e-ferramentas.md"
    text, _ = analysis_table_repairs((SOURCE / file).read_text())
    nodes = PARSER(text)
    category = ""
    tools = []
    for node in nodes:
        if node["type"] == "heading":
            category = plain(node.get("children", []))
        elif node["type"] == "table":
            for row in walk(node.get("children", [])):
                if row["type"] != "table_row":
                    continue
                cells = row["children"]
                name = plain(cells[0].get("children", []))
                urls = [n.get("attrs", {}).get("url") for n in walk(cells[0].get("children", [])) if n["type"] == "link"]
                tools.append({"name": name, "category": category, "urls": urls,
                              "licenseLabelInBook": plain(cells[1].get("children", [])),
                              "sourcePath": file, "sourceCommit": PIN,
                              "status": "reference-listed-upstream-not-independently-tested"})
    return tools


def main() -> None:
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=SOURCE, text=True).strip()
    assert commit == PIN, f"Source differs from audited commit: {commit}"
    changes = subprocess.check_output(["git", "status", "--porcelain"], cwd=SOURCE, text=True)
    assert not changes, "Audit requires an unchanged source checkout."
    entries = summary_entries()
    listed = {str(e["path"]): e for e in entries}
    tracked = subprocess.check_output(["git", "ls-files", "-z"], cwd=SOURCE).decode().split("\0")
    paths = sorted(SOURCE / name for name in tracked if name)
    pages, examples, links, files, tables = [], [], [], [], []
    for path in paths:
        item: dict[str, object] = {"path": path.relative_to(SOURCE).as_posix(), "bytes": path.stat().st_size,
                                  "sha256": digest(path.read_bytes()), "extension": path.suffix or "none"}
        if path.suffix == ".png":
            width, height = struct.unpack(">II", path.read_bytes()[16:24])
            item["dimensions"] = {"width": width, "height": height}
        if path.suffix == ".md":
            page, codes, references, page_tables = audit_page(path, listed)
            pages.append(page)
            examples.extend(codes)
            links.extend(references)
            tables.extend(page_tables)
        files.append(item)
    counts = {"trackedFilesExcludingGit": len(files), "markdownFiles": len(pages),
              "pngAssets": sum(p.suffix == ".png" for p in paths), "summaryEntries": len(entries),
              "learningSourcePages": sum(bool(re.match(r"^\d{2}-", str(e["path"]))) for e in entries),
              "headingNodes": sum(len(p["headings"]) for p in pages), "codeBlocks": len(examples),
              "codeStyles": dict(Counter(e["style"] for e in examples)),
              "languageLabels": dict(Counter(e["languageLabel"] or "unlabelled" for e in examples)),
              "exampleKinds": dict(Counter(e["kind"] for e in examples)),
              "executionCandidates": dict(Counter(e["execution"] for e in examples)),
              "tables": sum(p["astCounts"].get("table", 0) for p in pages),
              "exerciseHeadings": sum(len(p["exerciseHeadings"]) for p in pages),
              "imageOccurrences": sum(r["kind"] == "image" for r in links),
              "brokenLocalImageOccurrences": sum(r["kind"] == "image" and r["localExists"] is False for r in links),
              "linkOccurrences": sum(r["kind"] == "link" for r in links),
              "toolEntries": len(tool_catalog()),
              "wordsWhitespaceIncludingCodeAndTables": sum(p["wordsWhitespace"] for p in pages)}
    write_json("inventory.json", {"schemaVersion": 1, "source": {"repository": REPOSITORY, "commit": PIN,
               "commitDate": "2026-05-27T10:56:14-03:00", "auditDate": "2026-10-06",
               "license": "not-declared-in-working-tree-or-github-api", "parser": f"mistune {mistune.__version__}"},
               "counts": counts, "summary": entries, "files": files, "pages": pages,
               "unlistedMarkdown": [p["id"] for p in pages if not p["summaryEntry"]]})
    write_json("examples.json", examples)
    write_json("references.json", links)
    write_json("tools.json", tool_catalog())
    write_json("tables.json", tables)
    print(json.dumps(counts, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
