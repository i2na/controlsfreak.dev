import { context, createReport, fetchUpstream, parseArgs, prepareMerge, requireCleanMain, writeReport } from './upstream-common.mjs';

try {
    const options = parseArgs(process.argv.slice(2), { prepare: true });
    if (options.help) {
        console.log('Usage: node scripts/upstream-prepare.mjs [--no-fetch] [--branch sync/upstream-NAME] [--output DIRECTORY]');
        console.log('Start from clean fork main. Create a review branch and leave the upstream merge uncommitted for translation review.');
    } else {
        const ctx = context();
        requireCleanMain(ctx.root);
        if (options.fetch) fetchUpstream(ctx);
        const report = createReport(ctx);
        const branch = options.branch || `sync/upstream-${new Date().toISOString().slice(0, 10)}-${report.latest.slice(0, 8)}`;
        const result = prepareMerge(ctx, report, branch);
        writeReport(report, options.output);
        if (result.conflicts) process.exitCode = 1;
    }
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
