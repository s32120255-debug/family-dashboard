# 우리집 대시보드

가족 구글 계정으로 로그인해서 쓰는 집 화면이에요. GitHub Pages에 올려 두고, 데이터는 Firebase(Firestore)에 저장해요.

- `index.html` 화면 전체
- `config.js` Firebase 웹 설정(공개돼도 되는 값)
- `seed.js` 처음 한 번만 넣는 시훈이 고정 일정
- `firestore.rules` 허용한 가족 계정만 읽고 쓰게 하는 규칙. Firebase 콘솔 → Firestore → 규칙 에 붙여 넣어요.

## 서윤 보드 (`seoyun/`)

서윤 개인 관리 화면이에요. 주소: `https://s32120255-debug.github.io/family-dashboard/seoyun/`
- 같은 Firebase를 쓰지만 데이터는 `seoyun/main/items` 에만 저장하고, 규칙으로 서윤 계정만 읽고 쓸 수 있어요.
- 금액은 가족 화면으로 절대 보내지 않아요. 「우리집으로 보내기」는 글자만 장보기·달력·엄마 도와주기에 보내요.
- 화면 미리 보기(저장 안 됨): 주소 끝에 `#demo`
