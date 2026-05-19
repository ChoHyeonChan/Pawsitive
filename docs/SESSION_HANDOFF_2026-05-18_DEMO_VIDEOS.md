# Pawsitive 세션 인수인계 메모 - 2026-05-18

이 파일은 대화가 길어져 새 세션을 열 때 바로 이어서 작업하기 위한 기록입니다.

## 현재 목표

캡스톤 발표용 Pawsitive 시연 영상을 광고처럼 세련되게 구성하고, PPT에 넣을 4개 Demo 영상을 완성하는 중입니다.

사용자는 시연 영상이 단순 화면 녹화처럼 보이는 것을 원하지 않고, 왼쪽에는 사용자 고민을 보여주는 캐릭터/말풍선, 오른쪽에는 노트북 또는 모바일 프레임 안에서 실제 서비스 화면이 진행되는 형태를 원합니다.

## 최신 사용자 요청

가장 마지막 요청은 다음 내용입니다.

- Canva에서 가져온 캐릭터로 현재 왼쪽 모션그래픽 캐릭터만 바꿀 수 있는지 질문함.
- 아직 적용하지 말라고 했음.

따라서 새 세션에서는 사용자가 Canva 캐릭터 이미지를 주기 전까지 영상/코드에 적용하지 않아야 합니다.

권장 답변 방향:

- 투명 배경 PNG로 내보내면 교체 가능하다고 안내.
- 이미지 권장 조건: 투명 PNG, 1000px 이상, 배경 없는 캐릭터, 좌측 말풍선과 어울리는 톤.
- 파일을 받으면 `tools/create-ad-style-demo-videos.cjs`의 왼쪽 캐릭터 SVG 부분만 이미지로 바꾸고 4개 영상을 재렌더링하면 됨.

## 현재 생성된 최종 데모 영상

위치:

`C:\Users\cndqj\OneDrive\바탕 화면\Pawsitive4\outputs\ad-style-demo-videos-20260517`

파일:

- `01_breeds_ai_recommendation_ad_style.mp4`
  - 약 1분 17초
  - 품종 정보 + AI 맞춤 견종 추천
- `02_ai_matching_score_ad_style.mp4`
  - 약 56초
  - 산책 매칭 + AI 적합도 점수 계산
- `03_payment_walk_gps_ad_style.mp4`
  - 약 1분 3초
  - 결제 + 요청자/도우미 양방향 산책 진행 + GPS
- `04_walk_health_ai_expert_ad_style.mp4`
  - 약 2분 19초
  - 산책 기록 공유 + 건강 분석 + AI 상담 + 전문가 매칭

## 현재 영상에 반영된 주요 수정사항

### Demo 01

- 강아지/Pawsitive 로딩 장면이 영상에 보이지 않도록 처리함.
- 품종 백과사전 카드에서 이미지가 비거나 맞지 않는 문제가 생기지 않도록 로컬 이미지로 고정함.
- 골든 리트리버, 시바 이누, 푸들 등 앞쪽 품종 카드와 상세 페이지를 자연스럽게 훑도록 구성함.
- AI 맞춤 추천은 모든 조건 카드를 선택하고 세부사항까지 입력한 뒤 결과로 넘어가도록 수정함.
- AI 추천 결과 1위, 2위, 3위 카드가 보이도록 구성함.

### Demo 02

- 왼쪽 사용자 고민 문구가 한 글자만 줄에 떨어지지 않도록 두 줄 구성을 정리함.
- 도우미 이름과 얼굴 성별 불일치 문제를 수정함.
  - 민준워커: 남자 사진
  - 지호 도우미: 남자 사진
  - 서윤 도우미: 여자 사진
- AI 적합도 계산 버튼 클릭 후 결과 리스트와 점수 계산 기준 설명을 보여줌.

### Demo 03

- 결제 흐름에서 Toss Payments 화면이 반드시 보이도록 fake Toss Payments 오버레이를 구성함.
- 결제 후 요청자/도우미 화면이 자연스럽게 모바일 두 화면으로 나뉘도록 구성함.
- 요청자와 도우미 라벨을 영상 안에서 구분되게 표시함.
- GPS 산책 진행, 복귀, 산책 완료, 리뷰 흐름까지 보이도록 구성함.
- 예전처럼 회색 빈 모바일 화면이 먼저 뜨는 문제를 줄이기 위해 모바일 영상 시작 부분을 잘라냄.

### Demo 04

- 산책 기록 공유 후 커뮤니티 피드에 산책 동선과 기록이 보이도록 구성함.
- 여러 사용자가 산책 기록을 공유한 듯한 피드 구성을 보여줌.
- 커뮤니티 지도 카드가 상단 탭을 덮어버리는 문제를 CSS로 수정함.
- 건강 분석 탭으로 이동할 때 임의 점프가 아니라 메뉴 드로어를 눌러 이동하는 연출로 구성함.
- 건강 분석 화면은 활동점수뿐 아니라 이번 주 산책, 거리, 시간, 칼로리 수치가 0부터 올라가는 장면이 보이도록 구성함.
- 건강 분석 데이터가 AI 상담 탭으로 전달된 것을 강조하는 카드와 말풍선 효과를 넣음.
- AI 상담은 짧은 임의 답변으로 끊기지 않고 실제 답변 내용이 이어져 보이도록 구성함.
- 마지막에 전문가 매칭 리스트까지 이어지도록 수정함.

## 주요 수정 파일

현재 작업 디렉터리:

`C:\Users\cndqj\OneDrive\바탕 화면\Pawsitive4`

수정/생성된 주요 파일:

- `tools/capture-polished-demo-videos.cjs`
  - 실제 서비스 화면을 Playwright로 녹화하는 스크립트
  - Demo 1~4의 원본 캡처 흐름 담당
- `tools/create-ad-style-demo-videos.cjs`
  - 원본 캡처 영상을 광고 스타일 프레임으로 합성하는 스크립트
  - 왼쪽 캐릭터, 말풍선, 노트북 프레임, 하단 진행바 담당
- `js/services/gpsTrackingService.js`
  - mock GPS 산책 시간이 5분부터 시작하지 않고 0분부터 시작하도록 수정
- `css/styles-modern.css`
  - 커뮤니티 산책지도 카드가 탭을 덮는 문제 수정
- `images/demo-breeds/`
  - Demo 1 품종 카드/추천 결과에 사용할 로컬 견종 이미지 폴더

현재 git 상태에서 확인된 변경:

- `css/styles-modern.css` 수정됨
- `js/services/gpsTrackingService.js` 수정됨
- `server/data/walkers.json` 수정됨
- `images/demo-breeds/` 새로 추가됨
- `tools/` 새로 추가됨
- `ngrok-3000.err.log`, `ngrok-3000.out.log` 로그 파일 있음

## 영상 재생성 명령

원본 서비스 화면 캡처:

```powershell
node .\tools\capture-polished-demo-videos.cjs 1 2 3 4
```

광고 스타일 영상 렌더링:

```powershell
node .\tools\create-ad-style-demo-videos.cjs 01 02 03 04
```

특정 Demo만 다시 렌더링:

```powershell
node .\tools\create-ad-style-demo-videos.cjs 01
node .\tools\create-ad-style-demo-videos.cjs 02
node .\tools\create-ad-style-demo-videos.cjs 03
node .\tools\create-ad-style-demo-videos.cjs 04
```

## Canva 캐릭터 교체 시 작업 포인트

현재 캐릭터는 `tools/create-ad-style-demo-videos.cjs` 안의 HTML 템플릿에 SVG로 들어가 있습니다.

대략 위치:

```html
<div class="character-wrap" aria-hidden="true">
  <div class="orb"></div>
  <svg class="character" ...>
    ...
  </svg>
</div>
```

Canva에서 캐릭터 이미지를 받으면 다음 방식이 자연스럽습니다.

1. 투명 배경 PNG를 프로젝트에 넣기
   - 예: `images/demo-character/canva-character.png`
2. `create-ad-style-demo-videos.cjs`에서 해당 이미지를 base64 data URI로 읽기
3. 기존 SVG 부분을 `<img class="character character-img" ...>`로 교체
4. CSS에 `object-fit: contain` 적용
5. 광고 스타일 영상만 재렌더링
   - 원본 서비스 캡처는 다시 찍을 필요 없음

주의:

- 사용자가 아직 적용하지 말라고 했으므로 지금은 변경하지 말 것.
- 캐릭터만 바꾸면 `capture-polished-demo-videos.cjs`는 건드릴 필요 없음.

## 사용자 취향 및 작업 원칙

- 발표용 영상이므로 급하게 휙휙 넘어가는 느낌을 싫어함.
- 버튼 없이 갑자기 화면이 바뀌는 연출을 싫어함.
  - 가능하면 메뉴 드로어 클릭, 버튼 클릭, 탭 클릭 등 실제 이동 경로를 보여줘야 함.
- 스크롤은 부드럽게, 페이지 내용을 한 번 훑는 느낌을 선호함.
- GPS 마커는 길을 따라 자연스럽게 움직여야 하며, 건물 사이로 날아다니는 느낌은 피해야 함.
- 마커에는 작아졌다 커지는 정도의 부드러운 모션을 선호함.
- UI가 싸보이거나 AI가 만든 티가 나는 것을 매우 싫어함.
- 발표 영상은 실제 서비스가 유기적으로 연결된다는 점을 강조해야 함.
  - 품종 정보
  - 맞춤 견종 추천
  - 산책 매칭
  - 결제/산책 진행/GPS
  - 산책 기록
  - 커뮤니티 공유
  - 건강 분석
  - AI 상담
  - 전문가 매칭

## PPT/발표 흐름에서 중요한 메시지

서비스는 단일 기능이 아니라 다음 흐름으로 연결됩니다.

1. 사용자가 품종 정보를 확인한다.
2. AI 맞춤 견종 추천으로 자신의 환경에 맞는 견종을 찾는다.
3. 산책이 필요하면 AI 점수 기반으로 적합한 도우미를 추천받는다.
4. 결제 후 산책 진행 상황과 GPS를 실시간으로 확인한다.
5. 산책이 끝나면 기록이 저장된다.
6. 산책 기록은 커뮤니티에 공유할 수 있다.
7. 누적된 산책 기록은 건강 분석으로 이어진다.
8. 건강 분석 데이터는 AI 상담에 전달된다.
9. 필요하면 전문가 매칭으로 연결된다.

## 보안 메모

대화 중 ngrok 관련 토큰/API 키가 노출된 적이 있습니다.

새 세션에서 이 값을 마크다운이나 답변에 다시 적지 말 것.
필요하면 사용자가 직접 재입력하게 하거나, 재발급을 권장하는 것이 안전합니다.

## 다음 세션에서 바로 확인할 것

1. 사용자가 Canva 캐릭터 이미지를 줬는지 확인
2. 이미지가 있으면 캐릭터만 교체할지, 말풍선/색감까지 같이 조정할지 확인
3. 적용 요청이 있으면 `tools/create-ad-style-demo-videos.cjs`만 수정
4. 4개 광고 스타일 영상 재렌더링
5. 결과 영상 경로를 사용자에게 다시 안내

