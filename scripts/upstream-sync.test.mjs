import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { context, createReport, git, markdownReport, prepareMerge, writeReport } from './upstream-common.mjs';

function fixture(t, { update = true, conflict = false } = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'controlsfreak-sync-test-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    git(root, ['init', '-b', 'main']);
    git(root, ['config', 'user.email', 'test@example.invalid']);
    git(root, ['config', 'user.name', 'Sync Test']);
    const source = path.join(root, 'html/education/example.html');
    fs.mkdirSync(path.dirname(source), { recursive: true });
    fs.writeFileSync(source, 'Original lesson\n');
    git(root, ['add', '.']);
    git(root, ['commit', '-m', 'Original source']);
    const baseline = git(root, ['rev-parse', 'HEAD']).stdout.trim();
    fs.writeFileSync(path.join(root, 'upstream-sync.json'), JSON.stringify({
        schemaVersion: 1,
        repository: 'https://github.com/EWH2000/controlsfreak.dev.git',
        branch: 'main',
        lastReviewedCommit: baseline,
    }));
    if (conflict) fs.writeFileSync(source, 'Fork lesson change\n');
    git(root, ['add', '.']);
    git(root, ['commit', '-m', 'Korean fork configuration']);
    const main = git(root, ['rev-parse', 'HEAD']).stdout.trim();
    let latest = baseline;
    if (update) {
        git(root, ['switch', '-c', 'source-update', baseline]);
        fs.writeFileSync(source, 'Updated upstream lesson\n');
        fs.mkdirSync(path.join(root, 'html/_data/quizzes'), { recursive: true });
        fs.writeFileSync(path.join(root, 'html/_data/quizzes/example.js'), 'module.exports = [];\n');
        git(root, ['add', '.']);
        git(root, ['commit', '-m', 'New source | <script> update']);
        latest = git(root, ['rev-parse', 'HEAD']).stdout.trim();
        git(root, ['switch', 'main']);
    }
    git(root, ['update-ref', 'refs/remotes/upstream/main', latest]);
    return { root, baseline, latest, main, ctx: context(root) };
}

test('reports new source pages and quiz review targets without modifying branch or baseline', t => {
    const fixtureData = fixture(t);
    const { root, ctx, baseline, latest, main } = fixtureData;
    const report = createReport(ctx);
    assert.equal(report.status, 'updates-available');
    assert.equal(report.baseline, baseline);
    assert.equal(report.latest, latest);
    assert.equal(report.commitCount, 1);
    assert.deepEqual(report.translationCandidates.map(file => file.translation), [
        'html/_data/quiz-translations/ko/example.js', 'html/ko/education/example.html',
    ]);
    assert.match(markdownReport(report), /New source &#124; &lt;script&gt; update/);
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'controlsfreak-report-test-'));
    t.after(() => fs.rmSync(output, { recursive: true, force: true }));
    writeReport(report, output);
    assert.equal(JSON.parse(fs.readFileSync(path.join(output, 'upstream-report.json'))).latest, latest);
    assert.equal(git(root, ['rev-parse', 'HEAD']).stdout.trim(), main);
    assert.equal(context(root).config.lastReviewedCommit, baseline);
    assert.equal(git(root, ['status', '--porcelain']).stdout, '');
});

test('prepare leaves a clean merge uncommitted on a dedicated branch and does not advance main', t => {
    const { root, ctx, main, baseline, latest } = fixture(t);
    const result = prepareMerge(ctx, createReport(ctx), 'sync/upstream-test');
    assert.deepEqual(result, { changed: true, conflicts: false, branch: 'sync/upstream-test' });
    assert.equal(git(root, ['symbolic-ref', '--short', 'HEAD']).stdout.trim(), 'sync/upstream-test');
    assert.equal(git(root, ['rev-parse', 'main']).stdout.trim(), main);
    assert.equal(git(root, ['rev-parse', 'MERGE_HEAD']).stdout.trim(), latest);
    assert.equal(context(root).config.lastReviewedCommit, baseline);
});

test('prepare rejects untracked work before creating a branch or merging', t => {
    const { root, ctx, main } = fixture(t);
    fs.writeFileSync(path.join(root, 'personal-note.txt'), 'Keep my work');
    assert.throws(() => prepareMerge(ctx, createReport(ctx), 'sync/upstream-test'), /not clean/);
    assert.equal(git(root, ['symbolic-ref', '--short', 'HEAD']).stdout.trim(), 'main');
    assert.equal(git(root, ['rev-parse', 'HEAD']).stdout.trim(), main);
    assert.equal(fs.readFileSync(path.join(root, 'personal-note.txt'), 'utf8'), 'Keep my work');
});

test('prepare preserves merge conflicts for review without changing main or review baseline', t => {
    const { root, ctx, main, baseline } = fixture(t, { conflict: true });
    const result = prepareMerge(ctx, createReport(ctx), 'sync/upstream-conflict');
    assert.equal(result.conflicts, true);
    assert.equal(git(root, ['rev-parse', 'main']).stdout.trim(), main);
    assert.equal(context(root).config.lastReviewedCommit, baseline);
    assert.match(git(root, ['status', '--porcelain']).stdout, /UU html\/education\/example.html/);
});

test('current upstream creates no branch or pending merge', t => {
    const { root, ctx } = fixture(t, { update: false });
    assert.deepEqual(prepareMerge(ctx, createReport(ctx), 'sync/upstream-test'), { changed: false });
    assert.equal(git(root, ['symbolic-ref', '--short', 'HEAD']).stdout.trim(), 'main');
    assert.notEqual(git(root, ['rev-parse', '--verify', 'MERGE_HEAD'], { allowFailure: true }).status, 0);
});

test('existing review branches and detached HEAD cannot be replaced', t => {
    const { root, ctx, main } = fixture(t);
    git(root, ['branch', 'sync/upstream-existing']);
    assert.throws(() => prepareMerge(ctx, createReport(ctx), 'sync/upstream-existing'), /already exists/);
    assert.equal(git(root, ['rev-parse', 'sync/upstream-existing']).stdout.trim(), main);
    git(root, ['switch', '--detach']);
    assert.throws(() => prepareMerge(ctx, createReport(ctx), 'sync/upstream-new'), /fork main branch/);
});

test('rewritten upstream history is reported and cannot be merged by prepare', t => {
    const { root, ctx, main } = fixture(t);
    git(root, ['switch', '--orphan', 'rewritten-upstream']);
    fs.writeFileSync(path.join(root, 'new-root.txt'), 'Rewritten history\n');
    git(root, ['add', '.']);
    git(root, ['commit', '-m', 'Rewritten source']);
    git(root, ['update-ref', 'refs/remotes/upstream/main', 'HEAD']);
    git(root, ['switch', 'main']);
    const report = createReport(ctx);
    assert.equal(report.status, 'history-diverged');
    assert.throws(() => prepareMerge(ctx, report, 'sync/upstream-rewritten'), /history diverged/);
    assert.equal(git(root, ['rev-parse', 'main']).stdout.trim(), main);
});
