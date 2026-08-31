# TTWITTUN

대한민국 러닝 코스 탐색 + GPS 러닝 + 개인 기록 + 크루 러닝 플랫폼.

## 핵심 기능
- OpenStreetMap + Leaflet 전국 코스 지도
- 코스 폴리라인 및 출발/도착 표시
- 지역 / 유형 / 거리 / 야간추천 / 신호 적은 코스 필터
- 현재 위치와 코스 출발점 안내
- 화장실 / 주차 / RUN + EAT
- 자유 러닝과 코스 러닝
- 실시간 거리 / 시간 / 현재 페이스 / 평균 페이스
- 최고 페이스 / 1km 자동랩 / 스플릿
- GPS 임시 저장 / 중단 후 이어달리기 복구
- MY 개인 러닝 대시보드
- GPS ART / 테마런
- 즐겨찾기 / 후기 / 크루 러닝 기록 / 대회 관리

## 기술 구성
- Next.js 15
- Supabase
- Vercel
- Leaflet / OpenStreetMap
- Capacitor 모바일 앱 준비

내부 데이터베이스의 기존 `runart_*` 테이블명은 서비스 호환성과 데이터 마이그레이션 안정성을 위해 유지합니다. 사용자에게 노출되는 공식 서비스명과 모바일 앱 이름은 **TTWITTUN**입니다.

## 로컬 실행
```bash
npm install
npm run dev
```

## Vercel 환경 변수
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

## 모바일 앱
Capacitor 앱 이름: `TTWITTUN`
앱 ID: `com.ttwittun.korea`

현재 웹 운영 주소는 기존 배포 호환을 위해 `runart-korea.vercel.app`을 유지하며, 정식 도메인은 TTWITTUN 브랜드 기준으로 별도 전환할 수 있습니다.
