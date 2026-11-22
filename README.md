# 우리집 대시보드

가족 구글 계정으로 로그인해서 쓰는 집 화면이에요. GitHub Pages에 올려 두고, 데이터는 Firebase(Firestore)에 저장해요.

- `index.html` 화면 전체
- `config.js` Firebase 웹 설정(공개돼도 되는 값)
- `seed.js` 처음 한 번만 넣는 시훈이 고정 일정
- `firestore.rules` 허용한 가족 계정만 읽고 쓰게 하는 규칙. Firebase 콘솔 → Firestore → 규칙 에 붙여 넣어요.
