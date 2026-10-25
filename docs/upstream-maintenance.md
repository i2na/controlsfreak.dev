# 원본 업데이트와 AI 보조 번역

이 저장소는 [EWH2000/controlsfreak.dev](https://github.com/EWH2000/controlsfreak.dev)의 독립적인 한국어 지원 포크입니다. 원본 사이트는 [controlsfreak.dev](https://controlsfreak.dev/)입니다. 한국어판은 AI의 도움을 받아 유지하며, 한국인 전문 제어·HVAC 엔지니어가 번역하거나 전문적으로 검수한 자료가 아닙니다. 자동 검사가 통과해도 기술 번역의 정확성이 보증되는 것은 아닙니다.

원본 코드와 영어 콘텐츠는 가능한 한 그대로 유지하고, 한국어 콘텐츠는 `html/ko/`, 퀴즈·용어집 번역은 대응하는 데이터 오버레이에서 관리합니다. 번역 구조와 검증 규칙은 [i18n.md](i18n.md)를 따릅니다.

## 매주 원본 변경 확인

`.github/workflows/upstream-check.yml`은 매주 **월요일 오전 6시 17분(한국 시간)**에 원본 `main`을 가져와 `upstream-sync.json`의 마지막 검토 커밋과 비교합니다. GitHub 예약 실행은 지연될 수 있으며, 포크의 Actions가 비활성화되어 있다면 저장소의 **Actions**에서 활성화해야 합니다. **Check upstream for Korean translation updates → Run workflow**로 수동 실행할 수도 있습니다.

워크플로 실행의 Summary와 `upstream-translation-review` 아티팩트에서 다음 내용을 확인할 수 있습니다.

- 원본의 신규 커밋과 변경 파일
- 검토할 한국어 페이지·퀴즈·용어집·공통 코드의 위치
- 마지막 검토 커밋과 현재 원본 커밋

이 작업은 보고서만 작성합니다. 자동 번역·병합·푸시·배포는 하지 않으며, 유료 AI API나 AI 서비스 비밀 키도 사용하지 않습니다. AI 번역 작업은 아래 프롬프트로 직접 시작합니다. GitHub 알림은 계정의 Actions 알림 설정을 따르며, 변경 감지 시 이메일이나 이슈를 자동 발송하지는 않습니다.

로컬에서도 확인할 수 있습니다. Node.js 22 이상과 Git이 필요하며, 검사 스크립트 자체에는 추가 패키지가 필요하지 않습니다.

```sh
npm run upstream:check
```

기본 보고서 경로는 운영체제 임시 디렉터리의 `controlsfreak-upstream-report/`입니다. `--output`으로 지정할 수 있으며, `--no-fetch`는 이미 가져온 `upstream/main`만 사용합니다.

```sh
npm run upstream:check -- --output /tmp/controlsfreak-upstream-review
```

## 번역 작업 준비

진행 중인 변경을 먼저 커밋하거나 별도로 보관하고 포크의 `main`을 갱신합니다.

```sh
git switch main
git pull --ff-only origin main
npm run upstream:prepare
```

준비 스크립트는 작업 트리가 깨끗한 `main`에서만 실행됩니다. 선언된 원본 저장소를 가져온 뒤 `sync/upstream-날짜-커밋` 브랜치를 만들고 `git merge --no-ff --no-commit`으로 번역 검토용 병합을 준비합니다. 기존 검토 브랜치를 덮어쓰지 않으며, `main`, 번역 해시, 마지막 검토 커밋을 갱신하지 않습니다. 이미 최신이면 브랜치나 병합을 만들지 않습니다.

충돌이 있으면 검토 브랜치에 그대로 남기고 종료 코드 1로 끝납니다. `git status`로 충돌 파일을 확인하고 해결한 뒤 번역을 계속합니다. 같은 준비 명령을 다시 실행하지 마세요. 준비된 병합만 취소하려면, 그 이후 작성한 번역 작업을 먼저 보관한 뒤 `git merge --abort`를 사용합니다. 원본의 히스토리가 재작성되었다면 자동 준비가 중단되므로 먼저 커밋 관계를 확인해야 합니다.

## AI에게 전달할 프롬프트

아래 프롬프트를 이 저장소를 연 AI 코딩 도구에 전달합니다. 작업 중인 검토 브랜치가 있다면 그 브랜치에서 이어가도록 요청하세요.

```text
이 저장소는 EWH2000/controlsfreak.dev의 독립적인 한국어 지원 포크다.
docs/i18n.md, docs/upstream-maintenance.md, upstream-sync.json과
최근 upstream-report.md / upstream-report.json을 읽고 원본 변경을 반영해 줘.

작업 트리가 깨끗한 최신 main이고 아직 검토 브랜치가 없다면
npm run upstream:prepare로 검토 브랜치를 준비해 줘.
이미 검토 브랜치나 병합 충돌이 있으면 현재 작업을 보존하고 이어서 작업해 줘.

1. 마지막 검토 커밋부터 보고서의 latest 커밋까지 원본 diff와 변경된
   전체 문맥을 읽어라. 원본의 새 페이지·삭제·이름 변경도 한국어 경로에 반영해라.
2. 본문, 제목·설명·FAQ·구조화 데이터, SVG 접근성 텍스트, 표,
   퀴즈의 문제·선택지·해설, 용어집, 동적인 성공·오류·빈 상태 메시지까지
   빠짐없이 자연스러운 한국어로 번역해라.
3. ID, 선택지 키, 정답, 계산식, 단위, 프로토콜 식별자, DOM 구조와
   공통 실행 로직을 보존해라. 원본과 번역의 사실적 범위를 일치시켜라.
4. 원문과 번역을 실제로 비교한 뒤에만 sourceContentHash,
   sourceMessageHash와 html/_data/i18nSourceHashes.js의 관련 해시를 갱신해라.
   빌드를 통과시키려고 해시만 일괄 교체하거나 검증을 끄지 마라.
5. 독립 포크라는 표시, 원본 제작자와 https://controlsfreak.dev/ 링크,
   AI 보조 번역이며 한국인 전문 엔지니어가 번역·검수하지 않았다는 안내,
   MIT 저작권 표시, 포크의 Vercel 배포 설정을 보존해라.
6. npm ci, npm run build, npm run prose-lint, npm run metric-lint,
   npm run test:upstream, npm run test:deployment, npm test를 실행해라. 변경된 한국어 화면과
   인터랙션도 확인하고 실패 원인을 해결해라.
7. 모든 변경을 반영하고 검증한 뒤 upstream-sync.json의
   lastReviewedCommit을 실제로 검토한 보고서 latest의 전체 SHA로,
   reviewedAt을 검토 날짜로 갱신해라. 검사 결과와 남은 한계를 보고해라.
8. 검토 브랜치에 변경을 커밋해라. main으로 병합하거나 배포하기 전에
   모든 검사가 통과한 결과를 검토할 수 있게 제시해라.
```

## 검토 완료와 배포

`upstream-sync.json`의 `lastReviewedCommit`은 **원본 변경을 가져온 시점**이 아니라 **한국어 반영까지 검토를 마친 원본 커밋**입니다. 원본이 작업 도중 더 진행되어도 실제로 번역한 보고서의 `latest`만 기록합니다. 이후 커밋은 다음 검사에서 다시 보고됩니다.

빌드 검증은 번역 페이지 누락, 오래된 원문 해시, 메시지 키·보간 변수 불일치, 퀴즈·용어집·BACnet 데이터의 계약 위반을 탐지합니다. 원문 의미와 번역 품질, 실제 화면과 동작은 별도로 검토합니다.

검토 브랜치의 변경과 테스트 결과를 확인한 뒤 포크 저장소에 브랜치를 푸시하고 `main`을 대상으로 PR을 만들거나, 검토한 변경을 로컬에서 `main`으로 병합합니다. CI가 통과한 변경만 `main`에 반영합니다. Vercel의 Production Branch가 `main`이면 그 반영이 운영 배포로 이어집니다. 스크립트는 이 단계를 자동 실행하지 않습니다.
