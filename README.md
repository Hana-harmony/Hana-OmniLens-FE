# Hana OmniLens FE

Hana OmniLens API의 대외 소개·개발자 문서와 파트너 회원·관리자 백오피스를 제공하는 React/Vite 웹 애플리케이션이다. 회원과 관리자 기능은 `Hana-OmniLens-API`의 웹 전용 `/api/v1/portal/**` API를 호출한다.

## 기능

- 회원가입, 로그인, 비밀번호 확인, 비밀번호 변경
- 회원별 파트너 API 키 신청·발급 결과 조회
- `ADMIN` RBAC 기반 API 키 신청 승인
- Hana Montana AI가 검증한 세무 서류의 OCR 값을 경정청구서 편집기에 자동 적용
- 자동 적용된 값을 수동 편집한 뒤 PDF 생성·다운로드 또는 국세청 제출·회원 환급 승인 처리
- 한국 주식 시장, 뉴스·공시, 금융 고유어, 세무 OCR REST/WebSocket 계약 문서

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
- 회원 API는 인증된 `MEMBER` 또는 `ADMIN`, 관리자 API는 `ADMIN`만 호출할 수 있다. 화면 제어와 무관하게 API가 Spring Security RBAC를 강제한다.
- 초기 관리자는 Flyway가 DB에 아이디/비밀번호 `admin`/`admin`으로 생성한다. 초기 로그인 토큰은 비밀번호 변경 API만 호출할 수 있고, 비밀번호를 변경해야 관리자 기능을 이용할 수 있다.
- 비밀번호는 12~128자를 받고, 변경 시 기존 토큰이 즉시 폐기된다.
- 파트너 API 키는 회원이 확인한 뒤 서버 시크릿 저장소에 이관해야 하며 브라우저·모바일 애에 포함하면 안 된다.

## 경정청구서 처리 흐름

1. 거래소 BE가 신청 건과 Hana Montana AI 검증 완료 서류의 `extractedFields`를 OmniLens API에 동기화한다.
2. 관리자가 신청 건을 열면 이름, 거주지국, TIN, 주소, 아포스티유 번호, 귀속연도, 환급 추정액 등이 편집기에 자동 입력된다.
3. 관리자가 값을 수동 편집한다. PDF 양식을 첨부하는 경우 편집 항목과 같은 이름의 AcroForm 필드가 있어야 한다.
4. `PDF 다운로드`는 현재 값으로 PDF를 생성하고 API DB에 필드, PDF, SHA-256를 함께 저장한다.
5. `국세청 제출 및 승인`은 현재 값으로 최종 PDF를 저장한 뒤 상태를 `REFUND_APPROVED`로 변경한다. 거래소 BE가 상태를 재동기화하면 회원에게 승인으로 표시된다.

## 주요 웹 API

| 기능 | API |
| --- | --- |
| 회원가입·로그인 | `POST /api/v1/portal/auth/sign-up`, `POST /api/v1/portal/auth/login` |
| 비밀번호 변경 | `POST /api/v1/portal/me/password` |
| API 키 신청 | `GET/POST /api/v1/portal/api-key-applications` |
| 관리자 API 키 승인 | `POST /api/v1/portal/admin/api-key-applications/{id}/approve` |
| 경정청구 초기값 | `GET /api/v1/portal/admin/tax/refund-cases/{caseId}/correction-fields` |
| PDF 생성·저장 | `POST /api/v1/portal/admin/tax/refund-cases/{caseId}/correction-request.pdf` |
| 환급 승인 | `POST /api/v1/portal/admin/tax/refund-cases/{caseId}/approve` |

## 검증

```bash
npm ci
npm run build
```

`npm run build`는 TypeScript 프로젝트 검사와 Vite 운영 빌드를 모두 수행한다.
