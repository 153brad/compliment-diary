# Architecture

## 폴더 구조

```
compliment-diary/
├── client/                      # React + Vite 프론트엔드
│   ├── public/
│   │   ├── manifest.json        # PWA 매니페스트
│   │   ├── sw.js                # 서비스 워커 (네트워크 우선 캐싱)
│   │   └── icons/                # 앱 아이콘 (192/512, apple-touch-icon 등)
│   └── src/
│       ├── App.jsx               # 전체 상태 관리 + 화면 전환 로직
│       ├── api.js                # 서버 REST API 호출 래퍼
│       ├── state/session.js      # deviceKey / personSession localStorage 관리
│       ├── lib/date.js           # 날짜 포맷/검증 유틸
│       └── components/           # 화면·UI 단위 컴포넌트
│           ├── Onboarding.jsx
│           ├── GroupSetup.jsx
│           ├── WriteScreen.jsx
│           ├── FriendsScreen.jsx
│           ├── FeedScreen.jsx
│           ├── ArchiveScreen.jsx
│           ├── ProfileOverlay.jsx
│           ├── RecoveryCodeScreen.jsx / RecoverScreen.jsx
│           ├── PhotoModal.jsx
│           ├── BottomTabBar.jsx / NoGroupState.jsx / icons.jsx
│
├── server/                      # Express 백엔드
│   ├── index.js                  # REST API 라우트 전부 + 정적 파일 서빙
│   ├── db.js                     # DB 연결, 스키마 생성/마이그레이션, 쿼리 함수
│   ├── lib/
│   │   ├── streak.js             # 스트릭·완료 상태 계산
│   │   ├── colors.js             # 아바타 색상/이니셜
│   │   └── date.js               # 날짜 검증 (YYYY-MM-DD, YYYY-MM)
│   └── data/                     # 로컬 개발용 SQLite 파일 (gitignore, 배포 환경에서는 미사용)
│
├── render.yaml                   # Render 배포 설정 (Blueprint)
└── package.json                  # 루트 스크립트 (dev/build/start)
```

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프론트엔드 | React 18, Vite |
| 백엔드 | Node.js (ESM), Express |
| 데이터베이스 | [Turso](https://turso.tech) (libSQL, SQLite 호환) — `@libsql/client`로 접속. 로컬 개발 시 `TURSO_*` 값이 비어있으면 `server/data/app.db` 로컬 파일로 자동 대체 |
| 사진 인식(OCR) | Google Gemini API (`@google/generative-ai`, 모델: `gemini-flash-latest`) |
| 배포 | Render (단일 웹 서비스가 API + 빌드된 정적 클라이언트를 함께 서빙) |
| PWA | `manifest.json` + 커스텀 서비스 워커 (`sw.js`) |

프론트/백 사이에는 상태 관리 라이브러리 없이 React의 `useState` 하나로 전체 앱 상태를 관리하고(`App.jsx`), 서버는 세션/인증 없이 매 요청마다 필요한 값(`personId` 등)을 URL/바디로 직접 받는 단순한 REST 구조예요.

## 데이터 모델

```
persons                    groups                    memberships
├─ id (PK)                 ├─ id (PK)                ├─ id (PK)
├─ device_key (UNIQUE)     ├─ code (UNIQUE)           ├─ person_id (FK → persons)
├─ display_name            ├─ name                    ├─ group_id (FK → groups)
├─ color_index             └─ created_at              └─ joined_at
├─ recovery_code (UNIQUE)                              UNIQUE(person_id, group_id)
└─ created_at

entries                                    reactions
├─ id (PK)                                 ├─ entry_id (FK → entries)
├─ person_id (FK → persons)                ├─ person_id (FK → persons)
├─ entry_date (YYYY-MM-DD)                 └─ created_at
├─ done_well_text / done_well_from_photo    PK(entry_id, person_id)
├─ endured_text / endured_from_photo
├─ word_to_me_text / word_to_me_from_photo
├─ updated_at
└─ UNIQUE(person_id, entry_date)
```

**핵심 설계 원칙 — 개인 정체성과 그룹 소속의 분리**

- **`persons`가 진짜 사용자**예요. 로그인/비밀번호 없이, 클라이언트가 최초 1회 생성해 `localStorage`에 영구 저장하는 `device_key`(UUID)로 식별돼요.
- **`groups`는 순수한 "공유 대상"**일 뿐이에요. 칭찬 일기(`entries`)는 `person_id`에만 속하고, 어떤 그룹에도 속하지 않아요.
- **`memberships`**는 "이 사람이 이 그룹에 속해있다"는 사실만 표현하는 조인 테이블이에요. 한 사람이 여러 그룹에 동시에 속할 수 있고, 그룹을 나가면(`memberships` 행 삭제) 그 그룹과의 "공유"만 끊길 뿐 `entries`는 전혀 영향받지 않아요.
- **`recovery_code`**는 다른 기기/브라우저에서 같은 `person`으로 복귀하기 위한 코드예요. 그룹 초대 코드보다 길고(12자) 넓은 문자 집합을 써요 — 이 코드를 아는 사람은 그 사람의 전체 일기 기록에 접근할 수 있기 때문이에요.
- **항목이 하나도 없는 날은 행 자체가 없어요.** 세 항목(`done_well`/`endured`/`word_to_me`)을 전부 지우면 `entries` 행이 통째로 삭제돼요(연결된 `reactions`도 함께 삭제). 그래서 스트릭·피드·보관함 어디서도 "빈 기록"을 따로 예외 처리할 필요 없이 "기록 없음"으로 자연스럽게 취급돼요.
- **스트릭**은 그날 세 항목 중 최소 1개라도 썼는지를 기준으로 계산해요(`server/lib/streak.js`). 완전히 채운 날은 `status: "done"`, 일부만 채운 날은 `"writing"`으로 구분해 표시하지만, 둘 다 스트릭에는 동일하게 반영돼요.

## API 개요

모든 엔드포인트는 `/api` 아래에 있고, 인증은 요청 바디/파라미터로 넘기는 `deviceKey` 또는 `personId`로 대신해요(별도 세션/토큰 없음).

- `POST /api/ocr` — 사진(base64) → 인식된 텍스트
- `POST /api/persons`, `GET/POST /api/recover*` — 사람 생성/계정 복구
- `POST /api/groups`, `POST /api/groups/:code/join`, `POST /api/groups/:code/leave` — 그룹 생성/참여/나가기
- `GET /api/persons/:id/groups` — 내가 속한 그룹 목록
- `GET /api/groups/:code/members`, `GET /api/groups/:code/feed` — 그룹 현황/피드
- `GET/PUT /api/persons/:id/entries[/:date]` — 개인 일기 조회/작성/수정/삭제 (그룹 무관)
- `GET /api/persons/:id/streak` — 스트릭 조회
- `POST /api/groups/:code/entries/:entryId/react` — 피드 게시물에 반응(하트) 토글
