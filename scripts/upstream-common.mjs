import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function git(root, args, { allowFailure = false, inherit = false } = {}) {
    const result = spawnSync('git', args, {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
        ...(inherit ? { stdio: 'inherit' } : {}),
    });
    if (result.error) throw result.error;
    if (result.status !== 0 && !allowFailure) {
        throw new Error(`git ${args[0]} failed: ${(result.stderr || '').trim() || `exit ${result.status}`}`);
    }
    return result;
}

export function context(cwd = process.cwd()) {
    const root = git(cwd, ['rev-parse', '--show-toplevel']).stdout.trim();
    const config = JSON.parse(fs.readFileSync(path.join(root, 'upstream-sync.json'), 'utf8'));
    if (config.schemaVersion !== 1 || !/^[a-f0-9]{40}$/.test(config.lastReviewedCommit || '')) {
        throw new Error('upstream-sync.json needs schemaVersion 1 and a full lastReviewedCommit SHA.');
    }
    const repository = new URL(config.repository);
    if (repository.protocol !== 'https:' || repository.username || repository.password
        || repository.search || repository.hash) {
        throw new Error('The upstream repository must be an HTTPS URL without credentials, query, or fragment.');
    }
    if (typeof config.branch !== 'string'
        || git(root, ['check-ref-format', `refs/heads/${config.branch}`], { allowFailure: true }).status !== 0) {
        throw new Error('Invalid upstream branch in upstream-sync.json.');
    }
    return { root, config, trackingRef: `refs/remotes/upstream/${config.branch}` };
}

export function commit(root, ref) {
    return git(root, ['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]).stdout.trim();
}

export function fetchUpstream({ root, config, trackingRef }) {
    // Fetch directly from the declared source: an unrelated local remote named
    // "upstream" must not silently become the translation source.
    git(root, ['fetch', '--no-tags', '--no-write-fetch-head', '--', config.repository,
        `+refs/heads/${config.branch}:${trackingRef}`], { inherit: true });
}

export function parseArgs(argv, { prepare = false } = {}) {
    const options = { fetch: true, output: path.join(os.tmpdir(), 'controlsfreak-upstream-report') };
    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        if (argument === '--no-fetch') options.fetch = false;
        else if (argument === '--help' || argument === '-h') options.help = true;
        else if (argument === '--output' || (prepare && argument === '--branch')) {
            const value = argv[++index];
            if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value.`);
            options[argument.slice(2)] = value;
        } else throw new Error(`Unknown option: ${argument}`);
    }
    return options;
}

export function changedFiles(root, baseline, latest) {
    const tokens = git(root, ['diff', '--name-status', '-z', '--find-renames', baseline, latest, '--'])
        .stdout.split('\0');
    const files = [];
    while (tokens.length && tokens[0]) {
        const status = tokens.shift();
        const firstPath = tokens.shift();
        if (/^[RC]/.test(status)) files.push({ status, previousPath: firstPath, path: tokens.shift() });
        else files.push({ status, path: firstPath });
    }
    return files;
}

export function reviewTarget(file) {
    const source = file.path;
    const quiz = source.match(/^html\/_data\/quizzes\/(.+)\.js$/);
    if (quiz) return { ...file, category: 'quiz', translation: `html/_data/quiz-translations/ko/${quiz[1]}.js` };
    if (source === 'html/_data/glossary.js') {
        return { ...file, category: 'glossary', translation: 'html/_data/glossary-translations/ko.js' };
    }
    if (source === 'html/_data/bacnetEnums.js') {
        return { ...file, category: 'BACnet data', translation: 'html/_data/bacnetEnumTranslations.js' };
    }
    if (/^html\/(?!ko\/|_|scripts\/|assets\/).+\.html$/.test(source)) {
        return { ...file, category: 'page', translation: source.replace(/^html\//, 'html/ko/') };
    }
    if (/^html\/(?:_includes|_data|scripts)\//.test(source)
        || source === '.eleventy.js' || source.startsWith('lib/')) {
        return { ...file, category: 'shared code/data', translation: 'Review shared UI, runtime messages, and locale contracts' };
    }
    return { ...file, category: 'other', translation: null };
}

export function createReport({ root, config, trackingRef }) {
    const baseline = commit(root, config.lastReviewedCommit);
    const latest = commit(root, trackingRef);
    const sourceHistoryIsLinear = git(root, ['merge-base', '--is-ancestor', baseline, latest],
        { allowFailure: true }).status === 0;
    const changed = changedFiles(root, baseline, latest).map(reviewTarget);
    const commits = git(root, ['log', '--format=%H%x00%s', `${baseline}..${latest}`, '--'])
        .stdout.trim().split('\n').filter(Boolean).map(line => {
            const [sha, subject] = line.split('\0');
            return { sha, subject };
        });
    return {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        repository: config.repository,
        branch: config.branch,
        baseline,
        latest,
        status: !sourceHistoryIsLinear ? 'history-diverged'
            : baseline === latest ? 'up-to-date' : 'updates-available',
        sourceHistoryIsLinear,
        commitCount: commits.length,
        commits,
        changedFiles: changed,
        translationCandidates: changed.filter(file => file.category !== 'other'),
    };
}

function cell(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\|/g, '&#124;').replace(/`/g, '&#96;').replace(/[\r\n]/g, ' ');
}

export function markdownReport(report) {
    const repository = report.repository.replace(/\.git$/, '');
    const lines = [
        '# Upstream translation review',
        '',
        `Status: **${report.status}**`,
        '',
        `- Last reviewed source: [${report.baseline.slice(0, 12)}](${repository}/commit/${report.baseline})`,
        `- Current upstream: [${report.latest.slice(0, 12)}](${repository}/commit/${report.latest})`,
        `- New commits: ${report.commitCount}`,
        `- Changed files: ${report.changedFiles.length}`,
        `- Translation or shared-code candidates: ${report.translationCandidates.length}`,
        '',
        'This report does not merge, translate, update review hashes, push, or deploy anything.',
        'AI assistance and a maintainer review are still required; the Korean edition is not professionally reviewed.',
        '',
    ];
    if (!report.sourceHistoryIsLinear) {
        lines.push('**Upstream history diverged from the reviewed baseline. Inspect the history before preparing a merge.**', '');
    }
    if (report.changedFiles.length) {
        lines.push('## Changed files', '', '| Change | Source | Review target |', '| --- | --- | --- |');
        for (const file of report.changedFiles) {
            const source = file.previousPath ? `${file.previousPath} → ${file.path}` : file.path;
            lines.push(`| ${cell(file.status)} | ${cell(source)} | ${cell(file.translation || 'Review upstream change')} |`);
        }
        lines.push('');
    }
    if (report.commits.length) {
        lines.push('## Commits', '');
        for (const item of report.commits) {
            lines.push(`- [${item.sha.slice(0, 12)}](${repository}/commit/${item.sha}) ${cell(item.subject)}`);
        }
        lines.push('');
    }
    lines.push('## Next step', '',
        'Follow `docs/upstream-maintenance.md`. Start from a clean, updated fork main and run `npm run upstream:prepare`.',
        'Review every changed source and its Korean counterpart before updating `lastReviewedCommit` or translation hashes.',
        'Merge to main only after the build, lints, and tests pass.', '');
    return lines.join('\n');
}

export function writeReport(report, output) {
    const directory = path.resolve(output);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'upstream-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(path.join(directory, 'upstream-report.md'), markdownReport(report));
    console.log(`Upstream ${report.status}: ${report.commitCount} commits, ${report.changedFiles.length} changed files.`);
    console.log(`Report: ${path.join(directory, 'upstream-report.md')}`);
    return directory;
}

export function requireCleanMain(root) {
    if (git(root, ['status', '--porcelain=v1', '--untracked-files=normal']).stdout.trim()) {
        throw new Error('Working tree is not clean. Commit or move your current changes before preparing an upstream merge.');
    }
    const branch = git(root, ['symbolic-ref', '--quiet', '--short', 'HEAD'], { allowFailure: true });
    if (branch.status !== 0 || branch.stdout.trim() !== 'main') {
        throw new Error('Start from the fork main branch. Run git switch main and git pull --ff-only origin main first.');
    }
    for (const state of ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply']) {
        const gitPath = git(root, ['rev-parse', '--git-path', state]).stdout.trim();
        if (fs.existsSync(path.resolve(root, gitPath))) {
            throw new Error(`Finish or abort the existing ${state} operation before preparing an upstream merge.`);
        }
    }
}

export function prepareMerge(ctx, report, branch) {
    requireCleanMain(ctx.root);
    if (!report.sourceHistoryIsLinear) throw new Error('Upstream history diverged; inspect it before merging.');
    if (report.status === 'up-to-date') {
        console.log('The reviewed upstream source is current. No branch or merge was created.');
        return { changed: false };
    }
    if (typeof branch !== 'string' || !branch.startsWith('sync/upstream-')
        || git(ctx.root, ['check-ref-format', '--branch', branch], { allowFailure: true }).status !== 0) {
        throw new Error('Use a valid review branch beginning with sync/upstream-.');
    }
    if (git(ctx.root, ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], { allowFailure: true }).status === 0) {
        throw new Error(`Branch ${branch} already exists. Resume that review or choose a new --branch name.`);
    }
    git(ctx.root, ['switch', '-c', branch], { inherit: true });
    const merge = git(ctx.root, ['merge', '--no-ff', '--no-commit', report.latest],
        { allowFailure: true, inherit: true });
    const mergeHead = git(ctx.root, ['rev-parse', '--verify', 'MERGE_HEAD'], { allowFailure: true });
    if (merge.status !== 0) {
        if (mergeHead.status !== 0) throw new Error(`Merge failed on ${branch}; inspect git status before continuing.`);
        console.log(`Merge conflicts are preserved on ${branch}. Resolve them, then translate and validate before committing.`);
        return { changed: true, conflicts: true, branch };
    }
    console.log(`Prepared ${branch}. Review and translate the changes, then run all checks before committing.`);
    console.log('No review baseline was updated, and nothing was pushed or deployed.');
    return { changed: true, conflicts: false, branch };
}
