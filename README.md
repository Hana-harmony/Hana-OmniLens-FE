# Hana Omni-Connect FE

Hana Omni-Connect API의 대외 소개·개발자 문서와 파트너 회원·관리자 백오피스를 제공하는 React/Vite 웹 애플리케이션이다. 회원과 관리자 기능은 Omni-Connect API 저장소의 웹 전용 `/api/v1/portal/**` API를 호출한다.

## 기능

- 회원가입, 로그인, 홈 헤더 로그아웃, 비밀번호 확인, 비밀번호 변경
- 회원별 파트너 API 키 신청·취소, 현재 비밀번호 재확인 후 횟수 제한 없는 발급 키 조회, 재발급·폐기 요청
- `ADMIN` RBAC 기반 API 키 승인·반려·재발급·폐기
- 관리자 대시보드, API 키 관리, 고유어 설명 분석, 제한세율 적용신청 처리 탭 네비게이션
- Hana Montana AI가 검증한 세무 서류의 OCR 값을 실제 경정청구서 PDF 좌표에 자동 적용
- API가 렌더링한 공식 PDF 양식 위에서 값을 직접 편집한 뒤 PDF 생성·다운로드 또는 국세청 제출·회원 환급 승인 처리
- 한국 주식 시장, 뉴스·공시, 금융 고유어, 세무 OCR REST/WebSocket 계약 문서
- Figma 슬라이드의 배경·설명 장식은 제외하고 원본 아이폰 화면 노드만 사용한 8단계 핵심 기능 소개와 데스크톱 고정형 스크롤 전환·모바일 순차형 반응형 화면
- 모델 소개 화면에 K-FNSPID 한국어 논문 일부와 데이터 규모를 표시하고, 대상 종목 감성·시장영향 중요도를 동일 평가 범위의 KR-FinBERT-SC와 출처별로 비교한다.

## 뉴스·공시 AI 표시 기준

- 이벤트·종목 분류는 TF-IDF + One-vs-Rest Logistic Regression이다.
- 이벤트·종목 분류 화면은 실제 뉴스 이벤트 macro F1만 표시한다. 평가 범위를 함께 설명하지 않으면 오해를 줄 수 있는 실제 뉴스 종목 정확도 100% 수치는 대외 화면에서 제외한다.
- 대상 종목 감성은 Figma와 동일한 개발셋·seed 17 비교를 출처별로 표시한다. 국내 뉴스 Macro-F1은 Hana Montana AI `0.6183` / KR-FinBERT-SC `0.5707`, 국내 공시는 `0.9252` / `0.9135`다. 이 수치는 개발 진단값이며 신규 v6 확증 Test나 SOTA 결과로 표현하지 않는다.
- 공시 의미 중요도와 시장영향 중요도를 분리한다. 의미 모델은 Gold를 보지 않고 Validation으로 제목+요약 뷰를 선택했으며, 기존 모델 Gold macro F1 `0.8355`, 모델 단독 `0.9470`, 존속위험 정책 포함 운영 Gold 910건 `0.9962`를 구분해 표시한다.
- K-FNSPID v4는 뉴스 524,696건과 공시 722,989건, 총 1,247,685문서와 10,691,998행 파일 기반 일별 시세를 포함한다. 공시 실제 원문 8,972건을 연결하며 시장영향의 뉴스·공시 모델과 Validation 보정을 서로 분리한다.
- 시간 외삽 Test에서 뉴스 전문가는 9,560건, accuracy 0.5247 / macro F1 0.3745 / QWK 0.4754이고 공시 전문가는 4,615건, accuracy 0.4750 / macro F1 0.3216 / QWK 0.1550이다. 동일 Test의 KR-FinBERT-SC Macro-F1은 각각 `0.3506`, `0.3131`이며, 거래일 군집 검정상 뉴스 우위만 확인하고 공시 우위는 확정하지 않는다.
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
- 관리자 비밀번호는 애플리케이션 설정으로 주입하지 않으며 제한된 운영 DB 절차로만 생성·초기화한다.
- 비밀번호는 API 계약과 동일하게 12~128자를 받고, 회원가입 전화번호는 국가번호 선택과 자동 하이픈 서식을 지원한다. 비밀번호 변경 시 기존 토큰이 즉시 폐기된다.
- 활성 파트너 API 키는 소유 회원이 현재 비밀번호를 재확인하면 횟수 제한 없이 다시 볼 수 있다. 관리자는 신청자 이름·아이디·기술용 파트너 ID만 확인하며 원문 키를 볼 수 없다.
- 확인한 API 키는 파트너 서버 시크릿 저장소에 이관해야 하며 브라우저·모바일 앱에 포함하면 안 된다.

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
| 소유 회원 API 키 반복 조회 | `POST /api/v1/portal/api-key-applications/{id}/reveal` + 현재 비밀번호 |
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

`npm test`는 새로고침 가능한 콘솔 탭 URL, Omni-Connect 브랜드, Figma 원본 아이폰 화면 에셋, 소유 회원 API 키 반복 조회 계약을 검증한다. `npm run build`는 TypeScript 프로젝트 검사와 Vite 운영 빌드를 모두 수행한다.

GitHub Actions는 `feature`/`main` 대상 PR과 push에서 Node.js 24, `npm ci`, 운영 의존성 보안 감사, TypeScript/Vite 빌드를 필수 체크로 실행한다.
