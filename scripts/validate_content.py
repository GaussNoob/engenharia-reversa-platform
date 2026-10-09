"""Verify imported learning data and every source example and asset."""
from pathlib import Path
import json
import hashlib
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'references/fundamentos-engenharia-reversa'
catalog = json.loads((ROOT / 'content/.generated/catalog.json').read_text())
questions = json.loads((ROOT / 'content/.generated/quizzes-private.json').read_text())
examples = json.loads((ROOT / 'analysis/examples.json').read_text())
lessons = [lesson for module in catalog['modules'] for lesson in module['lessons']]
documents = lessons + catalog['references']
blocks = [block for document in documents for block in document['blocks']]
code = [block for block in blocks if block['type'] == 'code']
images = [block for block in blocks if block['type'] == 'image']
tables = [block for block in blocks if block['type'] == 'table']
lesson_ids = {lesson['id'] for lesson in lessons}
lab_ids = {lab['id'] for lab in catalog['labs']}
assert len(catalog['modules']) == 9 and len(lessons) == 63
assert len(code) == 141 and len(tables) == 43 and len(images) == 28
assert len(catalog['labs']) == 35 and len(questions) == 63 and len(catalog['references']) == 9
assert len(lesson_ids) == len(lessons)
assert len({block['id'] for block in blocks}) == len(blocks), 'Duplicate block ids'
assert {block['exampleId'] for block in code} == {example['id'] for example in examples}, 'Missing source example'
assert len({block['asset'] for block in images}) == 28
for document in documents:
    assert document['blocks'], document['id']
    for ref in document['sourceRefs']:
        assert (SOURCE / ref['path']).is_file(), ref['path']
for lesson in lessons:
    assert set(lesson['prerequisites']) <= lesson_ids
    assert set(lesson['labIds']) <= lab_ids
for lab in catalog['labs']:
    assert set(lab['lessonIds']) <= lesson_ids
for question in questions:
    assert set(question['lessonIds']) <= lesson_ids
    assert question['correctId'] in {choice['id'] for choice in question['choices']}
challenges = json.loads((ROOT / 'content/lab-challenges.json').read_text())
assert set(challenges) == lab_ids, 'Every lab must have a server-graded challenge'
exercises = json.loads((ROOT / 'content/exercises.json').read_text())
assert len(exercises) == 45
assert len({exercise['id'] for exercise in exercises}) == len(exercises)
exercise_modules = set()
for exercise in exercises:
    assert exercise['origin'] == 'complement'
    lab = next(lab for lab in catalog['labs'] if lab['id'] == exercise['labId'])
    module = next(module for module in catalog['modules'] if module['number'] == lab['moduleNumber'])
    exercise_modules.add(module['number'])
    assert set(exercise.get('lessonSlugs', [])) <= {lesson['slug'] for lesson in module['lessons']}
    assert exercise['hints'] and exercise['explanation'] and exercise['instructions']
    if exercise['kind'] == 'choice':
        assert exercise['answer'] in {choice['id'] for choice in exercise['choices']}
    if exercise['kind'] == 'code':
        assert exercise['starterCode'] != exercise['solutionCode']
        assert exercise['criteria'] and exercise['language'] in ['c', 'python', 'assembly']
assert len(exercise_modules) == 9
for block in images:
    data = (SOURCE / '.gitbook/assets' / block['asset']).read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', block['asset']
report = {
    'generatedAt': datetime.now(timezone.utc).isoformat(),
    'sourceCommit': catalog['sourceCommit'],
    'catalogSha256': hashlib.sha256((ROOT / 'content/.generated/catalog.json').read_bytes()).hexdigest(),
    'modules': 9, 'lessons': len(lessons), 'labsWithChallenges': len(challenges),
    'referenceDocuments': len(catalog['references']), 'sourceExamplesRepresented': len(code),
    'tables': len(tables), 'imagesPresent': len(images), 'checkpoints': len(questions),
    'additionalExercises': len(exercises), 'executableExerciseChallenges': sum(exercise['kind'] == 'code' for exercise in exercises),
    'checksPassed': True,
    'scope': 'Imported content structure, coverage, references and asset files. Browser and sandbox tests are separate.',
}
(ROOT / 'analysis/content-validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(f"Content verified: {len(lessons)} lessons, {len(challenges)} lab challenges, {len(exercises)} additional exercises, {len(code)} source blocks, {len(tables)} tables and {len(images)} PNG assets.")
