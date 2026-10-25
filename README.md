# Controls Freak 한국어판

빌딩 자동제어·HVAC 계산기, 시뮬레이터, 학습 자료와 퀴즈를 한국어로 제공합니다.

**[사이트 바로가기](https://controlsfreak-ko.vercel.app/ko/)** · [원본 사이트](https://controlsfreak.dev/) · [오류 제보](https://github.com/i2na/controlsfreak.dev/issues)

[EWH2000 / Controls Freak](https://github.com/EWH2000/controlsfreak.dev)의 원본 프로젝트에 한국어 지원을 추가한 포크입니다. 한국어판은 i2na가 원작자와 별도로 운영합니다.

> 번역은 AI의 도움으로 작성했으며, 한국의 전문 제어·설비 엔지니어가 번역하거나 검수하지 않았습니다. 실제 업무에 적용하기 전에는 영문 원문, 제조사 문서와 관련 기준을 함께 확인해 주세요.

## 로컬에서 실행하기

Node.js 22와 npm이 필요합니다.

```sh
npm ci
npm run dev
```

[localhost:8000/ko/](http://localhost:8000/ko/)에서 확인할 수 있습니다. `npm run build`로 빌드하면 결과는 `_site/`에 생성됩니다.

## 배포

Vercel에서 이 저장소를 연결하고 운영 브랜치를 `main`으로 설정합니다. 빌드 설정은 [vercel.json](vercel.json)에 포함되어 있으며, 첫 화면은 한국어판(`/ko/`)으로 연결됩니다.

도메인과 환경 변수 설정은 [배포 안내](docs/deployment.md)를 참고하세요.

## 번역 업데이트

GitHub Actions가 매주 월요일 오전 6시 17분(한국 시간)에 원본 변경 사항과 번역할 내용을 보고서로 남깁니다. 번역과 병합은 보고서를 확인한 뒤 진행합니다.

```sh
npm run upstream:check    # 원본 변경 확인
npm run upstream:prepare  # 번역 작업용 브랜치와 병합 준비
```

AI에게 전달할 요청문과 검증 절차는 [유지보수 안내](docs/upstream-maintenance.md)에 있습니다. 번역 구조와 용어 기준은 [국제화 문서](docs/i18n.md)를 참고하세요.

## 라이선스

[MIT](LICENSE). 원본 제작자의 저작권 고지와 라이선스를 유지합니다.
