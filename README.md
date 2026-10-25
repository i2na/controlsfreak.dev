# Controls Freak 한국어판

[Controls Freak](https://controlsfreak.dev/)의 계산기, 제어·설비 학습 자료와 퀴즈에 한국어 지원을 추가한 **독립 운영 포크**입니다. 원본 도구와 콘텐츠는 **EWH2000 / Controls Freak**가 제작했고, 이 한국어판은 **i2na**가 별도로 유지합니다. 원작자가 운영하거나 검수하는 공식 한국어판이 아닙니다.

- 원본 사이트: <https://controlsfreak.dev/>
- 원본 저장소: <https://github.com/EWH2000/controlsfreak.dev>
- 한국어판 저장소·오류 제보: <https://github.com/i2na/controlsfreak.dev>
- 라이선스: [MIT](LICENSE). 원본 저작권 고지와 라이선스를 유지합니다.

**한국어 번역은 AI를 활용해 작성했습니다. 한국의 전문 제어·설비 엔지니어가 번역하거나 검수한 자료가 아닙니다.** 번역 누락·오역·기술적 오류가 있을 수 있습니다. 실제 설계, 시공, 시운전과 운전 판단에는 영문 원문, 제조사 문서와 적용 기준을 함께 확인하세요. 자동 검사는 구조와 동작을 확인하며 전문 기술 검수를 대신하지 않습니다.

## 제공하는 내용

BACnet·Modbus, 풍량, 습공기, 수배관, 전기와 냉매 계산기, 제어 시뮬레이터, 학습 자료 및 퀴즈를 영어와 한국어로 제공합니다. 한국어판은 `/ko/`에 있으며 언어 전환으로 같은 내용의 영어판을 볼 수 있습니다. Vercel의 첫 화면 `/`는 한국어판으로 이동하며, 영어 홈은 `/en/`에 있습니다.

번역 페이지는 원문을 상속하므로 계산 로직과 페이지별 스크립트를 복제하지 않습니다. 퀴즈 답안·식별자·수식·단위는 원본과 공유합니다. 원문이 바뀌면 해시와 구조 검사에서 번역 재검토가 필요한 곳을 알려 줍니다.

## 로컬 실행

Node.js 22와 npm을 사용합니다.

```sh
npm ci
npm run dev
```

<http://localhost:8000/ko/>에서 한국어판을 확인하세요. 로컬 정적 서버의 `/`는 원본 구조 점검을 위해 영어 홈을 제공합니다. Vercel의 첫 화면 이동은 `vercel.json`에 정의되어 있습니다.

```sh
npm run build
npx playwright install chromium
npm test -- --workers=4
npm run test:upstream
npm run test:deployment
npm run prose-lint
npm run metric-lint
```

빌드 결과는 `_site/`입니다. 번역 계약 검사는 빌드에 포함되며, 원문 변경을 검토하지 않고 해시만 갱신해서 통과시키면 안 됩니다.

## Vercel에 배포

1. Vercel에서 `i2na/controlsfreak.dev`를 Import합니다.
2. 프로젝트 이름은 **`controlsfreak-ko`**, Production Branch는 **`main`**으로 설정합니다. 이 이름을 사용할 수 있다면 기본 주소는 `controlsfreak-ko.vercel.app`입니다. 실제 도메인은 Vercel에서 프로젝트를 만들 때 확정됩니다.
3. Node.js 22를 선택하고 Deploy합니다. 저장소의 `vercel.json`이 Eleventy, `npm ci`, `npm run build`, `_site` 출력 경로를 설정합니다.

별도의 메일·AI API 키가 필요하지 않습니다. 문의는 이 포크의 공개 GitHub 이슈로 연결합니다. 원본의 Cloudflare Worker, Turnstile, Resend 계정이나 원본 도메인 소유권 토큰을 배포에 사용하지 않습니다.

canonical, hreflang, Open Graph, 사이트맵과 robots.txt의 도메인은 다음 순서로 정합니다.

1. `SITE_URL` — 직접 지정한 HTTPS 도메인. 예: `https://my-korean-edition.example`
2. Vercel의 `VERCEL_PROJECT_PRODUCTION_URL` — 실제 프로젝트의 Production 도메인
3. 로컬 기본값 `https://controlsfreak-ko.vercel.app`

Vercel의 시스템 환경 변수 노출 설정을 유지하세요. 별도 도메인을 연결하거나 시스템 변수를 비활성화했다면 Production과 Preview 환경 모두에 `SITE_URL`을 설정하세요. Preview는 `noindex`와 robots 차단을 출력하고 canonical은 Production 주소를 사용합니다. 원본 주소를 `SITE_URL`에 넣으면 빌드가 거부됩니다.

소스 frontmatter에는 원본 canonical을 유지해 원본 병합을 쉽게 하고, 빌드 결과에서 포크 주소로 변환합니다. 원작자 표기와 원본으로 연결되는 출처 링크는 그대로 유지됩니다.

`src/worker.js`, `wrangler.jsonc`, 일부 기존 문서·스크립트는 원본과의 비교를 위해 남아 있습니다. 이 포크의 배포 경로는 Vercel이며 해당 Worker는 실행하지 않습니다. 원본 IndexNow 워크플로도 이 포크에서는 실행되지 않습니다.

## 원본 변경과 AI 번역 유지

```sh
npm run upstream:check
npm run upstream:prepare
```

매주 월요일 **오전 6시 17분(한국 시간)** GitHub Actions가 원본 변경을 읽어 보고서와 번역 대상 목록을 남깁니다. 첫 사용 시 저장소의 **Actions** 탭에서 포크 워크플로를 활성화해야 할 수 있습니다. 보고서는 해당 실행의 Summary와 `upstream-translation-review` artifact에 있습니다.

이 주간 점검은 **변경 감지**입니다. AI 번역을 자동 실행하거나 `main`을 자동 변경하지 않습니다. `upstream:prepare`는 깨끗한 `main`에서 검토용 브랜치를 만들고 원본 병합을 커밋하지 않은 상태로 준비합니다. 그다음 AI에게 변경 보고서와 [유지보수 절차·복사해서 쓰는 요청문](docs/upstream-maintenance.md)을 주어 번역을 갱신하고, 테스트를 통과한 변경을 `main`에 합치면 됩니다.

원문 번역 기준과 파일 구조는 [국제화 문서](docs/i18n.md), 마지막으로 반영한 원본 커밋은 [upstream-sync.json](upstream-sync.json)에 기록합니다. 원본 기능과 설계의 상세 설명은 [원본 README](https://github.com/EWH2000/controlsfreak.dev#readme)를 참고하세요.
