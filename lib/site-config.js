"use strict";

const UPSTREAM_ORIGIN = "https://controlsfreak.dev";
const REPOSITORY = "https://github.com/i2na/controlsfreak.dev";

function resolveSiteOrigin(env = process.env) {
    const configured = env.SITE_URL
        || (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`)
        || "https://controlsfreak-ko.vercel.app";
    const url = new URL(configured);
    if (url.protocol !== "https:" || url.username || url.password
        || url.pathname !== "/" || url.search || url.hash) {
        throw new Error("SITE_URL must be an HTTPS origin without a path, credentials, query, or fragment.");
    }
    if (url.origin === UPSTREAM_ORIGIN || url.hostname === "www.controlsfreak.dev") {
        throw new Error("SITE_URL must belong to this fork, not the upstream author.");
    }
    return url.origin;
}

const SITE_ORIGIN = resolveSiteOrigin();

// Source frontmatter retains upstream URLs to keep future merges small.
// Only output URLs are rebased. Explicit attribution links are never rewritten.
function deploymentUrl(value) {
    if (!value) return "";
    const raw = String(value);
    if (raw.startsWith("/") && !raw.startsWith("//")) return SITE_ORIGIN + raw;
    if (raw === UPSTREAM_ORIGIN || raw.startsWith(`${UPSTREAM_ORIGIN}/`)) {
        return SITE_ORIGIN + raw.slice(UPSTREAM_ORIGIN.length);
    }
    return raw;
}

module.exports = {
    UPSTREAM_ORIGIN, SITE_ORIGIN, REPOSITORY, resolveSiteOrigin, deploymentUrl,
    name: "Controls Freak 한국어판",
    isPreview: process.env.VERCEL_ENV === "preview",
};
