# Vercel 배포 안내

1. Vercel에서 `i2na/controlsfreak.dev`를 Import합니다.
2. 프로젝트 이름은 **`controlsfreak-ko`**, Production Branch는 **`main`**으로 설정합니다. 현재 한국어판 주소는 <https://controlsfreak-ko.vercel.app/ko/>입니다. 새로 배포한다면 사용할 수 있는 프로젝트 이름을 선택하세요.
3. Node.js 22를 선택하고 Deploy합니다. 저장소의 `vercel.json`이 Eleventy, `npm ci`, `npm run build`, `_site` 출력 경로를 설정합니다.

별도의 메일·AI API 키가 필요하지 않습니다. 문의는 이 포크의 공개 GitHub 이슈로 연결합니다. 원본의 Cloudflare Worker, Turnstile, Resend 계정이나 원본 도메인 소유권 토큰을 배포에 사용하지 않습니다.

## 도메인 설정

canonical, hreflang, Open Graph, 사이트맵과 robots.txt의 도메인은 다음 순서로 정합니다.

1. `SITE_URL` — 직접 지정한 HTTPS 도메인. 예: `https://my-korean-edition.example`
2. Vercel의 `VERCEL_PROJECT_PRODUCTION_URL` — 실제 프로젝트의 Production 도메인
3. 로컬 기본값 `https://controlsfreak-ko.vercel.app`

`SITE_URL`에는 `/ko/` 같은 경로 없이 도메인만 입력합니다. 이 사이트의 주소를 직접 지정하려면 `https://controlsfreak-ko.vercel.app`을 사용하세요.

Vercel의 시스템 환경 변수 노출 설정을 유지하세요. 별도 도메인을 연결하거나 시스템 변수를 비활성화했다면 Production과 Preview 환경 모두에 `SITE_URL`을 설정하세요. Preview는 `noindex`와 robots 차단을 출력하고 canonical은 Production 주소를 사용합니다. 원본 주소를 `SITE_URL`에 넣으면 빌드가 거부됩니다.

소스 frontmatter에는 원본 canonical을 유지해 원본 병합을 쉽게 하고, 빌드 결과에서 포크 주소로 변환합니다. 원작자 표기와 원본으로 연결되는 출처 링크는 그대로 유지됩니다.

## 원본 설정과의 관계

`src/worker.js`, `wrangler.jsonc`, 일부 기존 문서·스크립트는 원본과의 비교를 위해 남아 있습니다. 이 포크의 배포 경로는 Vercel이며 해당 Worker는 실행하지 않습니다. 원본 IndexNow 워크플로도 이 포크에서는 실행되지 않습니다.
