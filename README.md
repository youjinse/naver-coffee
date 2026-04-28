# Naver Coffee Benefit Automation

매주 월요일 네이버페이 카페 이벤트 페이지에 접속해 `혜택 신청하기` 버튼을 누르고, 결과를 디스코드 웹훅으로 보냅니다.

## 준비

```bash
npm install
npm run install-browser
cp .env.example .env
```

`.env`에서 `DISCORD_WEBHOOK_URL`을 실제 디스코드 웹훅 URL로 바꿔 주세요.

## 최초 로그인 세션 저장

```bash
npm run setup-login
```

브라우저가 열리면 네이버에 직접 로그인하고, 이벤트 페이지가 로그인 상태로 보이는 것을 확인한 뒤 터미널에서 Enter를 누릅니다.

## 수동 실행

```bash
npm run apply
```

브라우저 화면을 보면서 디버깅하려면 다음 명령을 사용합니다.

```bash
npm run apply:headed
```

## 매주 월요일 자동 실행

macOS `launchd`에 매주 월요일 09:00 실행 작업을 등록합니다.

```bash
npm run launchd:install
```

로그는 `logs/launchd.out.log`, `logs/launchd.err.log`에 저장됩니다.

## 동작 방식

- `혜택 신청 완료` 문구가 보이면 이미 신청된 상태로 알립니다.
- `혜택 신청하기` 문구가 보이면 버튼을 클릭하고 완료 여부를 다시 확인합니다.
- 로그인 페이지나 로그인 문구가 감지되면 세션 만료로 판단하고 재로그인 알림을 보냅니다.
- 각 실행마다 `screenshots/`에 화면 캡처를 저장하고 디스코드 메시지에 첨부합니다.
