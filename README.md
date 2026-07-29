# 칭찬 일기 (compliment-diary)

## 실행 방법

```bash
npm run install:all   # 최초 1회
npm run dev           # client(5173) + server(5175) 동시 실행
```

브라우저에서 http://localhost:5173 접속.

## 사진 인식(OCR) 기능 켜기

노트 사진 속 손글씨를 인식하려면 Google Gemini API 키가 필요해요.

1. https://aistudio.google.com/apikey 에서 API 키를 발급받으세요.
2. `server/.env.example`을 복사해 `server/.env`를 만들고 키를 넣어주세요.

```bash
cp server/.env.example server/.env
# server/.env 파일을 열어 GEMINI_API_KEY=AIza... 형태로 채워주세요
```

3. 서버를 재시작하면 사진 촬영/앨범 선택 시 실제로 손글씨를 인식해요.
   키가 없으면 사진 인식 화면에 안내 메시지가 뜨고, 나머지 기능(작성/친구 현황/피드/보관함)은 그대로 사용할 수 있어요.

## 그룹 & 로그인

- 로그인은 "이름 + 그룹 코드"만으로 이뤄지는 가벼운 방식이에요(비밀번호 없음). 브라우저(정확히는 이 사이트 origin)마다 로그인 세션을 localStorage에 저장하므로, 같은 브라우저의 다른 탭에서는 세션이 공유돼요 — 다른 사람으로 테스트하려면 다른 브라우저/시크릿창을 쓰거나 `localStorage.clear()` 후 다시 참여하세요.
- "일단 혼자 써볼게요"를 누르면 이름만으로 나만의 그룹이 자동 생성돼요. 나중에 프로필의 초대 코드로 친구를 부를 수 있어요.
- 친구 현황/피드는 실시간 갱신이 아니라 **탭을 전환할 때마다** 서버에서 새로 불러와요.

## 데이터 저장

- 그룹/멤버/칭찬 일기/리액션은 DB에 저장돼요. `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN`이 비어있으면(로컬 개발 기본값) `server/data/app.db`라는 로컬 SQLite 파일을 자동으로 씁니다. 배포 환경에서는 실제 Turso(libSQL) 원격 DB를 가리키도록 두 값을 채워야 해요 — 그래야 서버가 재시작/재배포돼도 데이터가 사라지지 않아요.
- 브라우저에는 로그인 세션(그룹 코드/이름 등)만 저장되고, 칭찬 일기 내용은 항상 서버 DB가 기준이에요.

## 배포 (Render + Turso, 둘 다 무료·카드 불필요)

이 앱은 `node:sqlite` 대신 [Turso](https://turso.tech)(SQLite 호환, libSQL)를 DB로 쓰도록 되어 있어요. Render 무료 웹서비스는 로컬 디스크가 재배포/재시작 때마다 초기화되기 때문에, 데이터를 서버 밖(Turso)에 두는 구조예요.

1. **Turso DB 만들기**
   ```bash
   brew install tursodatabase/tap/turso
   turso auth login          # 브라우저가 열리면 GitHub/Google로 로그인(계정 없으면 여기서 생성)
   turso db create compliment-diary
   turso db show compliment-diary --url          # → TURSO_DATABASE_URL
   turso db tokens create compliment-diary        # → TURSO_AUTH_TOKEN
   ```
2. **GitHub에 코드 올리기** (public 저장소 기준)
   ```bash
   gh repo create compliment-diary --public --source=. --remote=origin --push
   ```
3. **Render에서 배포**
   - [render.com](https://render.com) 가입 (GitHub 계정으로, 카드 불필요)
   - 대시보드에서 **New +** → **Blueprint** → 방금 만든 저장소 선택 → 저장소 루트의 `render.yaml`을 자동 인식
   - `GEMINI_API_KEY`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` 값을 입력하는 칸이 뜨면 위에서 발급받은 값을 붙여넣기
   - **Apply**를 누르면 빌드 후 `https://compliment-diary-xxxx.onrender.com` 같은 주소가 생성돼요

**참고**
- 무료 웹서비스는 15분 동안 요청이 없으면 잠들고, 다음 접속 시 30~60초 정도 느리게 깨어나요(데이터는 Turso에 있으므로 사라지지 않아요).
- `render.yaml`의 세 환경변수는 `sync: false`로 선언되어 있어 저장소에는 값이 절대 커밋되지 않고, Render 대시보드에서만 입력/보관돼요.
