# RUNART KOREA · 뛰뚠뛰뚠 v6

전국 러닝 코스 + GPS 아트 + 크루 러닝 기록 플랫폼.

## v6 핵심
- OpenStreetMap + Leaflet 전국 코스 지도
- 코스 폴리라인 표시
- 지역 / 유형 / 거리 / 야간추천 / 신호 적은 코스 필터
- 현재 위치로 지도 이동
- 그리기 런(GPS ART) 전용 필터
- 코스 상세 페이지
- 로그인 사용자 즐겨찾기
- 1~5점 별점 및 후기
- 뛰뚠뛰뚠 크루 수행 기록
- 코스 제보 / GPX 업로드
- owner/admin 코스 승인·반려
- 실제 뛰뚠뛰뚠 로고 적용

## Supabase v6
이미 연결된 프로젝트에 다음이 준비되어 있습니다.
- runart_favorites
- runart_reviews
- runart_moderate_course(course_id, status) SECURITY INVOKER RPC\n- owner/admin 승인대기 SELECT/UPDATE RLS
- 기존 RUNART RLS 정책

## 로컬 실행
```bash
npm install
npm run dev
```

## v5에서 업데이트하는 경우
v6 ZIP을 별도 폴더에 풀어 실행하거나, 파일을 기존 Git 저장소에 덮어쓴 뒤:
```bash
npm install
npm run dev
```

## GitHub 반영 권장
로컬 동작 확인 후:
```bash
git status
git add app components package.json package-lock.json README.md
git commit -m "Upgrade RUNART KOREA to v6"
git push
```

`.env.local`, `.next`, `node_modules`는 커밋하지 마세요.

## Vercel
GitHub 저장소를 Vercel에 Import하고 아래 환경변수 2개를 등록:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
