import { context, createReport, fetchUpstream, parseArgs, writeReport } from './upstream-common.mjs';

try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
        console.log('Usage: node scripts/upstream-check.mjs [--no-fetch] [--output DIRECTORY]');
        console.log('Fetch the configured upstream and write a review report. Never merges or updates the reviewed baseline.');
    } else {
        const ctx = context();
        if (options.fetch) fetchUpstream(ctx);
        const report = createReport(ctx);
        writeReport(report, options.output);
        if (!report.sourceHistoryIsLinear) process.exitCode = 1;
    }
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
