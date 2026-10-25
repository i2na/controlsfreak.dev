import { rmSync } from 'node:fs';

// A fresh production build must not retain removed pages or upstream tokens.
// Resolve against this script rather than the caller's working directory.
rmSync(new URL('../_site/', import.meta.url), { recursive: true, force: true });
