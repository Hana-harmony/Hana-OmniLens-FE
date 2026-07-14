# Hana OmniLens FE

Hana OmniLens API의 대외 소개·개발자 문서와 파트너 회원·관리자 백오피스를 제공하는 React/Vite 웹 애플리케이션이다. 회원과 관리자 기능은 `Hana-OmniLens-API`의 웹 전용 `/api/v1/portal/**` API를 호출한다.

## 기능

- 회원가입, 로그인, 홈 헤더 로그아웃, 비밀번호 확인, 비밀번호 변경
- 회원별 파트너 API 키 신청·취소, 발급 결과 조회, 재발급·폐기 요청
- `ADMIN` RBAC 기반 API 키 승인·반려·재발급·폐기
- 관리자 대시보드, API 키 관리, 고유어 설명 분석, 제한세율 적용신청 처리 탭 네비게이션
- Hana Montana AI가 검증한 세무 서류의 OCR 값을 실제 경정청구서 PDF 좌표에 자동 적용
- API가 렌더링한 공식 PDF 양식 위에서 값을 직접 편집한 뒤 PDF 생성·다운로드 또는 국세청 제출·회원 환급 승인 처리
- 한국 주식 시장, 뉴스·공시, 금융 고유어, 세무 OCR REST/WebSocket 계약 문서
- 모델 소개 화면에 Hana Montana AI(KF-DeBERTa + K-FNSPID), 파일 기반 K-FNSPID v3 가격반응 중요도 보조 모델, 공개 Test·운영 Gold·시간 외삽 Test 지표를 구분해 표시

## 뉴스·공시 AI 표시 기준

- 이벤트·종목 분류는 TF-IDF + One-vs-Rest Logistic Regression이다.
- 감성은 KF-DeBERTa LoRA 80% + 기존 모델 20% 확률 앙상블이며 공개 금융 Test macro F1 `0.8840`, 실제 뉴스 Gold accuracy `0.9000`을 각각 표시한다.
- 공시 의미 중요도와 시장영향을 분리한다. 의미 모델은 Gold를 보지 않고 Validation으로 제목+요약 뷰를 선택해 모델 단독 기본 공시 Gold 600건에서 accuracy 98.50% / macro F1 0.9470, 존속위험 정책 포함 910건에서 accuracy 99.89% / macro F1 0.9962를 기록했다. K-FNSPID v3는 550,662문서·10,691,998행 일별 시세·공시 실제 원문 8,972건과 Validation 전용 class-prior 보정을 사용한다.
- 시장영향은 seed 17/42/73 중 Validation으로 선택한 seed 73을 표시한다. 2026-04-01 이후 Test 10,750건에서 accuracy 0.5095 / macro F1 0.3820 / QWK 0.4694이며 TF-IDF 기준선 QWK 0.3141을 넘는다. 공시 하위집합 회귀는 AI 모델 문서의 한계로 공개한다.
- REST·STOMP·raw WebSocket은 `importance`와 `marketImpactImportance/Score/Confidence`, 복합 `modelVersion`을 함께 보존하며 화면과 파트너 문서에서 서로 다른 신호로 표시한다.
- 시장영향은 의미 중요도를 덮어쓰지 않고 등급·점수·confidence를 별도 제공한다. 단독 투자 신호나 인과적 중요도로 표현하지 않는다.

## 실행 환경

- Node.js 22 이상
- npm 10 이상
- Hana OmniLens API: 기본 `http://127.0.0.1:8080`

```bash
npm ci
cp .env.example .env.local
npm run dev -- --host 0.0.0.0
```

웹은 기본 `http://localhost:5173`에서 실행된다. API 주소는 배포 환경별로 설정한다.

```dotenv
VITE_OMNILENS_API_BASE_URL=https://api.example.com
```

## 인증과 권한

- 접근 토큰은 브라우저 `sessionStorage`에만 저장하고 API에 `Authorization: Bearer ...`로 전송한다.
- 홈 헤더의 로그아웃은 `sessionStorage` 토큰과 React 세션 상태를 함께 제거한 뒤 홈으로 이동한다.
- 회원 API는 인증된 `MEMBER` 또는 `ADMIN`, 관리자 API는 `ADMIN`만 호출할 수 있다. 화면 제어와 무관하게 API가 Spring Security RBAC를 강제한다.
- 초기 관리자는 Flyway가 DB에 아이디/비밀번호 `admin`/`admin`으로 생성한다. 초기 로그인 토큰은 비밀번호 변경 API만 호출할 수 있고, 비밀번호를 변경해야 관리자 기능을 이용할 수 있다.
- 비밀번호는 8~128자를 받고, 회원가입 전화번호는 국가번호 선택과 자동 하이픈 서식을 지원한다. 비밀번호 변경 시 기존 토큰이 즉시 폐기된다.
- 파트너 API 키는 회원이 확인한 뒤 서버 시크릿 저장소에 이관해야 하며 브라우저·모바일 애에 포함하면 안 된다.

## 경정청구서 처리 흐름

1. 거래소 BE가 신청 건과 Hana Montana AI 검증 완료 서류의 `extractedFields`를 OmniLens API에 동기화한다.
2. 관리자가 신청 건에서 인증된 원본 서류 3개를 확인하고 `정보 자동 불러오기`를 누르면 이름, 생년월일, 전화번호, 거주지국, TIN, 주소, 귀속연도 등이 편집기에 입력된다.
3. API가 서버에 고정된 2쪽 공식 PDF를 PNG로 렌더링하고 동일한 출력 좌표·크기를 전달한다. 관리자는 별도 폼이 아니라 PDF 양식 위의 강조된 칸에서 값을 직접 수정한다.
4. `PDF 다운로드`는 현재 값으로 PDF를 생성하고 API DB에 필드, PDF, SHA-256를 함께 저장한다.
5. `국세청 제출 및 승인`은 현재 값으로 최종 PDF를 저장한 뒤 상태를 `REFUND_APPROVED`로 변경한다. 거래소 BE가 상태를 재동기화하면 회원에게 승인으로 표시된다.

## 주요 웹 API

| 기능 | API |
| --- | --- |
| 회원가입·로그인 | `POST /api/v1/portal/auth/sign-up`, `POST /api/v1/portal/auth/login` |
| 비밀번호 변경 | `POST /api/v1/portal/me/password` |
| API 키 신청·취소·재발급·폐기 요청 | `GET/POST /api/v1/portal/api-key-applications`, `POST .../{id}/cancel|reissue|revoke` |
| 관리자 API 키 심사·직접 조치 | `POST /api/v1/portal/admin/api-key-applications/{id}/approve|reject|reissue|revoke` |
| 고유어 클릭 시계열 | `GET /api/v1/portal/admin/term-analytics?period=DAY|MONTH|YEAR|ALL` |
| PDF 편집 좌표·양식 페이지 | `GET /api/v1/portal/admin/tax/correction-request/template/layout`, `GET .../template/pages/{pageNumber}` |
| 경정청구 초기값 | `GET /api/v1/portal/admin/tax/refund-cases/{caseId}/correction-fields` |
| PDF 생성·저장 | `POST /api/v1/portal/admin/tax/refund-cases/{caseId}/correction-request.pdf` |
| 환급 승인 | `POST /api/v1/portal/admin/tax/refund-cases/{caseId}/approve` |

## 검증

```bash
npm ci
npm run build
```

`npm run build`는 TypeScript 프로젝트 검사와 Vite 운영 빌드를 모두 수행한다.

GitHub Actions는 `feature`/`main` 대상 PR과 push에서 Node.js 24, `npm ci`, 운영 의존성 보안 감사, TypeScript/Vite 빌드를 필수 체크로 실행한다.
