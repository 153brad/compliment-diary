# Deployment

## 배포된 앱

**https://compliment-diary.onrender.com**

- Render 무료 웹 서비스 1개가 API 서버와 빌드된 클라이언트(정적 파일)를 함께 서빙해요.
- 무료 플랜은 15분 동안 요청이 없으면 잠들고, 다음 접속 시 30~60초 정도 느리게 깨어나요. 데이터는 아래 DB에 별도로 저장되므로 서버가 잠들거나 재배포돼도 사라지지 않아요.

## 필요한 환경변수

값은 절대 이 저장소에 커밋하지 않고, Render 대시보드(또는 로컬의 `server/.env`, gitignore됨)에만 입력해요.

| 변수명 | 용도 |
|---|---|
| `GEMINI_API_KEY` | 사진 손글씨 인식(OCR)에 쓰는 Google Gemini API 키. [Google AI Studio](https://aistudio.google.com/apikey)에서 발급 |
| `TURSO_DATABASE_URL` | 프로덕션 DB(Turso/libSQL) 접속 URL |
| `TURSO_AUTH_TOKEN` | 프로덕션 DB 인증 토큰 |
| `PORT` / `SERVER_PORT` | (선택) 서버가 열 포트. Render는 `PORT`를 자동으로 주입하므로 보통 직접 설정할 필요 없음 |

`TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN`을 비워두면 로컬 SQLite 파일(`server/data/app.db`)로 자동 대체되지만, **배포 환경에서는 반드시 채워야** 재배포/재시작 후에도 데이터가 유지돼요(Render의 로컬 디스크는 배포마다 초기화됨).

## Render 배포 방법

1. **Turso DB 준비** (최초 1회)
   ```bash
   brew install tursodatabase/tap/turso
   turso auth login                              # GitHub/Google로 로그인
   turso db create compliment-diary
   turso db show compliment-diary --url          # → TURSO_DATABASE_URL 값
   turso db tokens create compliment-diary        # → TURSO_AUTH_TOKEN 값
   ```

2. **GitHub에 코드 푸시** (이미 되어 있다면 생략)
   ```bash
   gh repo create compliment-diary --public --source=. --remote=origin --push
   ```

3. **Render에서 Blueprint로 배포**
   - [render.com](https://render.com) 가입 (GitHub 계정으로, 카드 불필요)
   - 대시보드 → **New +** → **Blueprint** → 저장소 선택 → 루트의 `render.yaml`을 자동 인식
   - `GEMINI_API_KEY`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` 입력란에 위에서 발급받은 값을 붙여넣기
   - **Apply** → 빌드 완료 후 `https://<서비스명>.onrender.com` 주소가 생성됨

4. **이후 배포**: `main` 브랜치에 푸시하면 Render가 자동으로 재빌드/재배포해요(Blueprint의 기본 auto-deploy 동작).

## 빌드/시작 명령 (참고 — `render.yaml`에 이미 설정됨)

```yaml
buildCommand: "npm install --prefix server && npm install --include=dev --prefix client && npm run build --prefix client"
startCommand: "npm start --prefix server"
```

- `--include=dev`가 필요한 이유: Render가 빌드 환경에 `NODE_ENV=production`을 자동으로 설정하기 때문에, 이 플래그 없이는 `npm install`이 devDependencies(빌드 도구 `vite` 포함)를 건너뛰어 빌드가 실패해요.
- 서버(`server/index.js`)는 API 라우트 처리 후, 빌드된 `client/dist`를 정적 파일로 서빙하고 나머지 경로는 SPA용 `index.html`로 폴백해요.

## 참고: env var 값 직접 다루기 (Turso CLI)

DB 내용을 직접 조회/정리해야 할 때:
```bash
turso db shell compliment-diary "SELECT * FROM persons;"
```
테스트 데이터를 지울 때는 외래 키 제약 때문에 `reactions → entries → memberships → groups → persons` 순서로 지워야 해요.
