# RUNART KOREA · 뛰뚠뛰뚠 v5

## 이번 버전
- 임시 🦆 아이콘 제거
- 사용자가 이전에 제공한 실제 뛰뚠뛰뚠 로고 이미지 적용
- Supabase 로그인/회원가입
- 크루 최초 생성
- 공용 수행 기록 작성
- 인증사진 Storage 업로드
- 누적거리/완주 코스/GPS 아트 수집 현황
- 사용자 코스 제보
- GPX 파일 업로드
- 코스 승인 대기 목록(운영자)
- 기존 RUNART RLS 구조 유지

## 실행
```bash
npm install
npm run dev
```
http://localhost:3000

## 환경변수
`.env.local`
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

publishable key만 프론트에서 사용합니다. service_role/secret key는 절대 넣지 마세요.

## 현재 주의점
`runart-media` Storage 정책은 `<crew_id>/...` 경로에 최적화되어 있습니다.
수행 인증사진은 이 규칙대로 업로드됩니다.
사용자 코스 제보 GPX는 현재 `submissions/...` 경로이므로 Storage RLS 정책상 업로드가 거절될 수 있습니다.
v5 UI는 이 경우 코스 제보 자체는 정상 저장하고 GPX만 생략합니다.
다음 버전에서 제보 전용 bucket 또는 별도 RLS를 추가하는 것이 안전합니다.

## 배포
GitHub 저장소 → Vercel Import Project → 위 환경변수 2개 등록.
