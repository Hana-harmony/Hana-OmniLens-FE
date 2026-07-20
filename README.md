# Hana Omni-Connect FE

Hana Omni-Connect API의 대외 소개·개발자 문서와 파트너 회원·관리자 백오피스를 제공하는 React/Vite 웹 애플리케이션이다. 회원과 관리자 기능은 Omni-Connect API 저장소의 웹 전용 `/api/v1/portal/**` API를 호출한다.

## 기능

- 회원가입, 로그인, 홈 헤더 로그아웃, 비밀번호 확인, 비밀번호 변경
- 회원별 파트너 API 키 신청·취소, 발급 결과 조회, 재발급·폐기 요청
- `ADMIN` RBAC 기반 API 키 승인·반려·재발급·폐기
- 관리자 대시보드, API 키 관리, 고유어 설명 분석, 제한세율 적용신청 처리 탭 네비게이션
- Hana Montana AI가 검증한 세무 서류의 OCR 값을 실제 경정청구서 PDF 좌표에 자동 적용
- API가 렌더링한 공식 PDF 양식 위에서 값을 직접 편집한 뒤 PDF 생성·다운로드 또는 국세청 제출·회원 환급 승인 처리
- 한국 주식 시장, 뉴스·공시, 금융 고유어, 세무 OCR REST/WebSocket 계약 문서
- Figma 슬라이드의 배경·설명 장식은 제외하고 원본 아이폰 화면 노드만 사용한 8단계 핵심 기능 소개와 데스크톱 고정형 스크롤 전환·모바일 순차형 반응형 화면
- 모델 소개 화면에 Hana Montana AI(KF-DeBERTa + K-FNSPID), 파일 기반 K-FNSPID v4 뉴스·공시 출처별 가격반응 전문가, 공개 Test·운영 Gold·시간 외삽 Test 지표를 구분해 표시

## 뉴스·공시 AI 표시 기준

- 이벤트·종목 분류는 TF-IDF + One-vs-Rest Logistic Regression이다.
- 감성은 정규화 중복·충돌 제거 공개 Test 932건에서 Validation Selection으로 잠근 KF-DeBERTa LoRA 후보를 표시한다. Macro F1은 `0.8849`로 KR-FinBERT-SC `0.7266`보다 높지만, 실제 뉴스 Gold accuracy `0.8625`가 운영 gate `0.90`에 미달해 신규 후보를 승격하지 않고 기존 모델로 fail closed한다. 공개 Test는 과거 반복 조회되어 독립 SOTA가 아닌 재현 비교로 명시한다.
- 공시 의미 중요도와 시장영향을 분리한다. 의미 모델은 Gold를 보지 않고 Validation으로 제목+요약 뷰를 선택해 모델 단독 기본 공시 Gold 600건에서 accuracy 98.50% / macro F1 0.9470, 존속위험 정책 포함 910건에서 accuracy 99.89% / macro F1 0.9962를 기록했다.
- K-FNSPID v4는 뉴스 524,696건과 공시 722,989건, 총 1,247,685문서와 10,691,998행 파일 기반 일별 시세를 포함한다. 공시 실제 원문 8,972건을 연결하며 시장영향의 뉴스·공시 모델과 Validation 보정을 서로 분리한다.
- 시간 외삽 Test에서 뉴스 전문가는 9,560건, accuracy 0.5247 / macro F1 0.3745 / QWK 0.4754이고 공시 전문가는 4,615건, accuracy 0.4750 / macro F1 0.3216 / QWK 0.1550이다. 두 출처 모두 자체 TF-IDF 기준선보다 Macro-F1과 QWK가 높고 거래일 군집 부트스트랩 95% CI가 0보다 크다.
- 요청 `sourceType`과 시장영향 전문가의 출처가 다르면 추론을 거부한다. 공시 기준선은 독립 배포 gate를 통과하지 못해 공시 Transformer 장애 시 무조건 기준선으로 후퇴하지 않고 시장영향 필드를 생략한다.
- REST·STOMP·raw WebSocket은 `importance`와 `marketImpactImportance/Score/Confidence`, 복합 `modelVersion`을 함께 보존하며 화면과 파트너 문서에서 서로 다른 신호로 표시한다.
- 시장영향은 의미 중요도를 덮어쓰지 않고 등급·점수·confidence를 별도 제공한다. 단독 투자 신호나 인과적 중요도로 표현하지 않는다.

## 실행 환경

- Node.js 22 이상
- npm 10 이상
- Hana Omni-Connect API: 기본 `http://127.0.0.1:8080`
- 운영 FE: `https://hanaomni.cloud`
- 운영 API: `https://api.hanaomni.cloud`

```bash
npm ci
npm run dev -- --host 0.0.0.0
```

웹은 기본 `http://localhost:5173`에서 실행된다. 로컬 개발과 운영 빌드 모두 Git에 포함된 `.env.production`을 단일 기준으로 사용한다. Vercel 프로젝트에는 동일한 API 주소 환경변수를 중복 등록하지 않는다.

```dotenv
VITE_OMNI_CONNECT_API_BASE_URL=https://api.hanaomni.cloud
```

## 인증과 권한

- 접근 토큰은 브라우저 `sessionStorage`에만 저장하고 API에 `Authorization: Bearer ...`로 전송한다.
- 홈 헤더의 로그아웃은 `sessionStorage` 토큰과 React 세션 상태를 함께 제거한 뒤 홈으로 이동한다.
- 회원 API는 인증된 `MEMBER` 또는 `ADMIN`, 관리자 API는 `ADMIN`만 호출할 수 있다. 화면 제어와 무관하게 API가 Spring Security RBAC를 강제한다.
- 초기 관리자 비밀번호는 API 서버의 `OMNI_CONNECT_PORTAL_BOOTSTRAP_ADMIN_PASSWORD`로만 주입한다. 저장소에 기본 비밀번호를 두지 않으며 초기 로그인 뒤 비밀번호를 변경해야 관리자 기능을 이용할 수 있다.
- 비밀번호는 API 계약과 동일하게 12~128자를 받고, 회원가입 전화번호는 국가번호 선택과 자동 하이픈 서식을 지원한다. 비밀번호 변경 시 기존 토큰이 즉시 폐기된다.
- 파트너 API 키는 회원이 확인한 뒤 서버 시크릿 저장소에 이관해야 하며 브라우저·모바일 애에 포함하면 안 된다.

## 경정청구서 처리 흐름

1. 거래소 BE가 신청 건과 Hana Montana AI 검증 완료 서류의 `extractedFields`를 Omni-Connect API에 동기화한다.
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
npm test
npm run build
```

`npm test`는 새로고침 가능한 콘솔 탭 URL 계약, Omni-Connect 브랜드, Figma 원본 아이폰 화면 에셋 계약을 검증한다. `npm run build`는 TypeScript 프로젝트 검사와 Vite 운영 빌드를 모두 수행한다.

GitHub Actions는 `feature`/`main` 대상 PR과 push에서 Node.js 24, `npm ci`, 운영 의존성 보안 감사, TypeScript/Vite 빌드를 필수 체크로 실행한다.
