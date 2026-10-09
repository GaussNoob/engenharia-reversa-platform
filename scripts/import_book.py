"""Transform audited book sections into typed, local-study learning documents."""
from __future__ import annotations
import ast
import hashlib
import html
import json
import re
from pathlib import Path
from urllib.parse import urlparse
import mistune
from audit_source import PIN, SOURCE, source_metadata, analysis_table_repairs, plain

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'content/.generated'
PLAN = json.loads((ROOT / 'analysis/course-plan.json').read_text())
EXAMPLES = json.loads((ROOT / 'analysis/examples.json').read_text())
LABS = json.loads((ROOT / 'analysis/labs.json').read_text())
QUESTIONS = json.loads((ROOT / 'content/quizzes.pydata.json').read_text())
PARSER = mistune.create_markdown(renderer='ast', plugins=['table', 'strikethrough', 'url'])
REVISION = PIN + ':pedagogy-1'
ROUTES = {l['sourceRefs'][0]['path']: f"/aprender/fundamentos/{l['moduleId']}/{l['slug']}" for m in reversed(PLAN['modules']) for l in reversed(m['lessons'])}

def save(name, data):
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

def href(value, path):
    if value.startswith('hhttps://'): value = value[1:]
    if value.startswith(('https://', 'http://', '#')): return value
    resolved = ((SOURCE / path).parent / value.split('#')[0]).resolve()
    if resolved.is_relative_to(SOURCE):
        rel = resolved.relative_to(SOURCE).as_posix()
        return ROUTES.get(rel, '/referencias/' + Path(rel).stem)
    return 'https://github.com/mentebinaria/fundamentos-engenharia-reversa'

def inline(nodes, path):
    result = []
    for node in nodes:
        kind = node['type']
        if kind in ('strong','emphasis'): result.append({'type':kind, 'children':inline(node.get('children',[]),path)})
        elif kind == 'link': result.append({'type':'link','href':href(node['attrs']['url'],path),'children':inline(node.get('children',[]),path)})
        elif kind == 'codespan': result.append({'type':'code','text':node['raw']})
        elif kind in ('softbreak','linebreak'): result.append({'type':'break'})
        elif kind == 'image': result.append({'type':'text','text':plain(node.get('children',[]))})
        elif node.get('children'): result.extend(inline(node['children'],path))
        else: result.append({'type':'text','text':html.unescape(node.get('raw',''))})
    return result

def repl_source(raw):
    if '>>>' not in raw: return raw
    lines = []
    for line in raw.splitlines():
        if line.startswith('>>> '): lines.append(line[4:])
        elif line.startswith('... '): lines.append(line[4:])
    tree = ast.parse('\n'.join(lines))
    for index, node in enumerate(tree.body):
        if isinstance(node, ast.Expr) and not (isinstance(node.value, ast.Call) and isinstance(node.value.func,ast.Name) and node.value.func.id == 'print'):
            tree.body[index] = ast.Expr(value=ast.Call(func=ast.Name(id='print',ctx=ast.Load()),args=[ast.Call(func=ast.Name(id='repr',ctx=ast.Load()),args=[node.value],keywords=[])],keywords=[]))
    return ast.unparse(ast.fix_missing_locations(tree)) + '\n'

def corrected_code(raw, path):
    note = None
    fixed = raw.replace('MessageBox(NULL, "Mundo", "Olá"), 0x31);','MessageBox(NULL, "Mundo", "Olá", 0x31);')
    if path.endswith('acesso-ao-registro.md'): fixed = fixed.replace('RegCloseKey(hKey);','RegCloseKey(hChave);')
    if path.endswith('a-tabela-ascii.md'):
        fixed = fixed.replace('I      y','i      y').replace('−      =','-      =')
    if fixed != raw: note = 'Correção editorial aplicada; a versão original permanece vinculada à fonte.'
    return fixed, note

def blocks(text, path, lesson_id, code_ids):
    if path.endswith('instrucoes-basicas.md'):
        text=text.replace('o operando de destino é **maior** que o de origem.','o operando de destino é **menor** que o de origem, desde que não haja overflow na interpretação com sinal.')
        text=text.replace('o operando de destino é **menor** que o de origem.','o operando de destino é **maior** que o de origem, desde que não haja overflow na interpretação com sinal.')
        text=text.replace('Em ambas as instruções, depois de executadas, o resultado é que o registrador RCX terá o valor 0 e a _flag_ ZF será _ligada_, como em qualquer operação que resulte em zero.', 'As duas instruções podem zerar RCX, mas MOV preserva as flags. XOR define ZF segundo o resultado, que neste caso é zero.')
    body, _ = source_metadata(text)
    body, _ = analysis_table_repairs(body)
    result = []
    code_candidates = {e['id']: e for e in EXAMPLES if e['id'] in code_ids}
    used = set()
    def add(value):
        result.append({'id': f'{lesson_id}:block-{len(result)+1:03}', **value})
    for node in PARSER(body):
        kind = node['type']
        if kind == 'heading':
            title = plain(node.get('children',[])).strip()
            title = re.sub(r'^[\s\U0001F000-\U0001FFFF\u2600-\u27BF\uFE0F\u200D]+','',title)
            add({'type':'heading','level':node['attrs']['level'],'text':title})
        elif kind == 'block_code':
            raw = node['raw']; hashed = hashlib.sha256(raw.encode()).hexdigest()
            example = next((e for e in code_candidates.values() if e['sha256']==hashed and e['id'] not in used),None)
            if example: used.add(example['id'])
            fixed,note = corrected_code(raw,path)
            language = example['language'] if example else node.get('attrs',{}).get('info','text')
            practice = repl_source(fixed) if language == 'python' else fixed
            if example and example['kind'] == 'portable-c-program' and '#include' not in practice:
                practice = '#include <stdio.h>\n' + practice
                note = 'O arquivo de prática inclui o contexto de compilação omitido no trecho original.'
            if example and example['kind'] == 'c-fragment':
                practice = '#include <stdio.h>\nint main(void) {\n' + practice + '\nreturn 0;\n}\n'
                note = 'O fragmento foi inserido em um programa completo para a bancada.'
            add({'type':'code','raw':fixed,'language':language,'exampleId':example['id'] if example else None,
                 'practiceSource':practice,'executable':bool(example and example['execution'] in ('isolated-python','isolated-c','isolated-c-with-harness','assembly-model-or-isolated-emulator','windows-model-or-vm')),
                 'architecture':example.get('architecture') if example else None,'note':note})
        elif kind in ('paragraph','block_quote'):
            children = node.get('children',[])
            images = [n for n in children if n['type']=='image']
            if images:
                for image in images: add({'type':'image','asset':Path(image['attrs']['url']).name,'alt':plain(image.get('children',[])) or 'Resultado de uma ferramenta no exemplo original.'})
                continue
            if kind=='block_quote': children=[n for child in children for n in child.get('children',[])]
            value = plain(children)
            if '{%' in value:
                match = re.search(r'embed url="([^"]+)"',value)
                if match: add({'type':'embed','url':match[1],'title':'Vídeo de apoio da fonte'})
                continue
            add({'type':'quote' if kind=='block_quote' else 'paragraph','content':inline(children,path)})
        elif kind == 'list':
            items=[]
            for item in node['children']:
                contents = [n for child in item.get('children',[]) for n in child.get('children',[])]
                items.append(inline(contents,path))
            add({'type':'list','ordered':bool(node.get('attrs',{}).get('ordered')),'items':items})
        elif kind == 'table':
            head = next(n for n in node['children'] if n['type']=='table_head')
            rows = next(n for n in node['children'] if n['type']=='table_body')
            headers = [inline(c.get('children',[]),path) for c in head['children']]
            values = [[inline(c.get('children',[]),path) for c in r['children']] for r in rows['children']]
            if path.endswith('opcional.md'):
                for row in values:
                    names=' '.join(n.get('text','') for cell in row for n in cell)
                    if 'DYNAMIC_BASE' in names: row[0]=[{'type':'text','text':'6'}]
                    if 'NX_COMPAT' in names: row[0]=[{'type':'text','text':'8'}]
            add({'type':'table','headers':headers,'rows':values})
        elif kind == 'block_html': add({'type':'paragraph','content':[{'type':'text','text':html.unescape(node.get('raw',''))}]})
    return result

def main():
    modules=[]; quizzes=[]; search=[]
    for module in PLAN['modules']:
        lessons=[]
        for source in module['lessons']:
            ref=source['sourceRefs'][0]; path=ref['path']; lines=(SOURCE/path).read_text().splitlines()
            text='\n'.join(lines[ref['startLine']-1:ref['endLine']])+'\n'
            key=module['id'][:2]+'/'+source['slug']; q=QUESTIONS[key]
            question_id=source['id']+':checkpoint'
            choices=[{'id':str(i),'text':answer} for i,answer in enumerate(q[1:4])]
            shift=int(hashlib.sha256(question_id.encode()).hexdigest()[:2],16)%3
            choices=choices[shift:]+choices[:shift]
            choices=[{'id':chr(97+i),'text':choice['text']} for i,choice in enumerate(choices)]
            correct_id=next(choice['id'] for choice in choices if choice['text']==q[1])
            quizzes.append({'id':question_id,'moduleNumber':module['id'][:2],'lessonIds':[source['id']], 'question':q[0],'choices':choices,'origin':'complement','correctId':correct_id,'explanation':q[4]})
            lab_ids=[l['id'] for l in LABS if source['id'] in l['relatedLessonIds']]
            lesson={'id':source['id'],'slug':source['slug'],'title':source['title'],'moduleId':module['id'],'order':source['order'],
                    'objective':source['objective'],'minutes':source['studyMinutesEstimate'],'prerequisites':source['prerequisiteLessonIds'],
                    'sourceRefs':source['sourceRefs'],'labIds':lab_ids,'summary':[source['objective'],q[4]],
                    'concepts':[h['title'] for h in source['sections'] if h['level']>=2][:8],
                    'blocks':blocks(text,path,source['id'],source['codeExampleIds']),'checkpointIds':[question_id],'revision':REVISION}
            lessons.append(lesson)
            route=f"/aprender/fundamentos/{module['id']}/{source['slug']}"
            search.append({'id':lesson['id'],'title':lesson['title'],'kind':'aula','description':source['objective'],'href':route,'keywords':lesson['concepts']})
        modules.append({'id':module['id'],'number':module['id'][:2],'title':module['title'],'objective':module['objective'],'difficulty':module['difficulty'],
                        'minutes':module['studyMinutesEstimate'],'prerequisites':module['prerequisiteModuleIds'],'lessons':lessons,'labCount':module['labCount']})
    labs=[{'id':l['id'],'title':l['title'],'moduleNumber':l['moduleNumber'],'engine':l['engine'],'learningOutcome':l['learningOutcome'],
           'lessonIds':l['relatedLessonIds'],'minutes':l['estimatedMinutes'],'sourceRefs':l['sourceRefs']} for l in LABS]
    references=[]
    for entry in PLAN['referencePages']:
        path=entry['path']; slug=Path(path).stem if Path(path).stem!='README' else 'sobre-o-livro' if path=='README.md' else 'apendices'
        references.append({'id':path,'slug':slug,'title':entry['title'],'sourceRefs':[entry['sourceRef']],
                           'blocks':blocks((SOURCE/path).read_text(),path,'reference/'+slug,[e['id'] for e in EXAMPLES if e['sourcePath']==path])})
    path='01-introducao/registro-de-alteracoes.md'
    references.append({'id':path,'slug':'historico','title':'Histórico do livro','sourceRefs':[PLAN['editorialPages'][0]['sourceRef']], 'blocks':blocks((SOURCE/path).read_text(),path,'reference/historico',[])})
    for reference in references: search.append({'id':reference['id'],'title':reference['title'],'kind':'referência','description':'Material de apoio e consulta do livro.','href':'/referencias/'+reference['slug'],'keywords':[]})
    for lab in labs: search.append({'id':'lab/'+lab['id'],'title':lab['title'],'kind':'laboratório','description':lab['learningOutcome'],'href':'/laboratorios/'+lab['id'],'keywords':[lab['engine']]})
    for tool in json.loads((ROOT/'analysis/tools.json').read_text()): search.append({'id':'tool/'+tool['name'],'title':tool['name'],'kind':'ferramenta','description':tool['category'],'href':'/referencias/e-ferramentas','keywords':[tool['category']]})
    for concept in json.loads((ROOT/'analysis/concepts.json').read_text()):
        occurrence=concept['sourceOccurrences'][0]; route=ROUTES.get(occurrence['path'],'/referencias')
        search.append({'id':concept['id'],'title':concept['term'],'kind':'conceito','description':concept['category'],'href':route,'keywords':concept['aliases']})
    for category,filename in [('função','functions.json'),('comando','commands.json')]:
        for entry in json.loads((ROOT/'analysis'/filename).read_text()):
            occurrence=entry['sourceOccurrences'][0]
            search.append({'id':category+'/'+entry['name'],'title':entry['name'],'kind':category,'description':'Referência na fonte original.','href':ROUTES.get(occurrence['path'],'/referencias/d-funcoes-api-win'),'keywords':[]})
    catalog={'id':'fundamentos-engenharia-reversa','title':'Fundamentos de Engenharia Reversa','revision':REVISION,'sourceCommit':PIN,'modules':modules,'labs':labs,'references':references,
             'sourceCounts':{'pages':51,'blocks':141,'tables':43,'images':28,'tools':97}}
    save('catalog.json',catalog);save('quizzes-private.json',quizzes);save('search.json',search)
    code_blocks=[b for m in modules for l in m['lessons'] for b in l['blocks'] if b['type']=='code']+[b for r in references for b in r['blocks'] if b['type']=='code']
    assert len(code_blocks)==141, len(code_blocks)
    assert len(quizzes)==63 and len(labs)==35
    print(f'Imported 63 lessons, 35 labs, {len(references)} reference documents, 141 code/data blocks and 63 private checkpoints.')

if __name__=='__main__': main()
