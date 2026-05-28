# Demo Quick Signup Experiment

발표용 빠른 입장 기능입니다. 기존 앱 파일은 건드리지 않고 이 폴더에만 초안을 분리해두었습니다.

## 동작

- 사용자는 닉네임만 입력합니다.
- 서버는 매번 새 데모 계정을 만듭니다.
- 생성 계정에는 `isDemo: true`가 붙습니다.
- 반려견은 자동으로 등록됩니다.
  - 이름: `초코`
  - 견종: `말티즈`
  - 나이: `3`
  - 크기: `small`

## 적용 방법

`apply-demo-mode.patch`를 적용하면 됩니다.

```bash
git apply demo-signup-experiment/apply-demo-mode.patch
```

그 다음 서버를 다시 켜면 회원가입 화면 상단에 `발표 데모 입장` 박스가 생깁니다.

## 되돌리기

패치 적용 전 상태로 되돌릴 때:

```bash
git apply -R demo-signup-experiment/apply-demo-mode.patch
```

## 발표 후 정리 아이디어

발표가 끝난 뒤에는 `server/data/users.json`에서 `isDemo: true` 계정만 삭제하면 됩니다. 필요하면 커뮤니티 글, 산책 기록, 매칭 요청도 `authorId`, `userId`, `ownerId` 등이 `demo-user-`로 시작하는 데이터를 같이 지우면 됩니다.
