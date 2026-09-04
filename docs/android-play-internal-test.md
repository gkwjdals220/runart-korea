# TTWITTUN Android · Google Play 내부 테스트 준비

## 현재 기준
- Application ID: `com.ttwittun.korea`
- App name: `TTWITTUN`
- Version: `1.0`
- versionCode: `1`
- minSdk: 23
- targetSdk / compileSdk: 35
- 위치 권한: `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`
- 네트워크: HTTPS only (`usesCleartextTraffic=false`)

## 로컬 동기화
```bash
git pull origin main
npm install
npm run mobile:sync
npm run mobile:android
```

Android Studio에서 Gradle Sync가 끝난 뒤 실제 기기 또는 에뮬레이터에서 기본 동작을 먼저 확인합니다.

## 내부 테스트 전 필수 확인
1. 앱 실행 및 홈 화면 로딩
2. 로그인 / 로그아웃
3. 코스 찾기 및 지도
4. 위치 권한 요청과 현재 위치 사용
5. 자유 러닝 / 코스 러닝 시작·일시정지·종료
6. 기록 저장 및 MY 히스토리
7. 대회 일정 링크와 공유 기능
8. 외부 링크 열기
9. 화면 회전/백 버튼/앱 재진입
10. Android 상태바와 하단 시스템 내비게이션 영역

## Release AAB 생성
Android Studio에서:

`Build` → `Generate Signed App Bundle or APK` → `Android App Bundle`

최초 배포라면 새 Upload Key를 생성합니다. `.jks` 또는 `.keystore` 파일은 저장소에 커밋하지 않습니다.

권장 보관:
- 키 파일: 개인 암호화 백업 위치
- alias / 비밀번호: 비밀번호 관리자
- Play Console App Signing 사용

생성된 `.aab` 파일도 Git 저장소에는 커밋하지 않습니다.

## Google Play Console
1. 새 앱 생성: TTWITTUN
2. 기본 언어: 한국어
3. 패키지명: `com.ttwittun.korea`
4. 내부 테스트 트랙 생성
5. Release AAB 업로드
6. 테스터 이메일 목록 또는 테스트 링크 구성
7. 데이터 보안 / 앱 액세스 / 콘텐츠 등급 / 광고 여부 등 필수 정책 항목 작성
8. 내부 테스트 출시

## 버전 규칙
첫 Android 업로드는 `versionCode 1`, `versionName 1.0`으로 시작합니다.
이후 업로드마다 `versionCode`는 반드시 증가시킵니다.

예:
- 1.0 (1)
- 1.0 (2)
- 1.0 (3)

## 위치 및 백그라운드 러닝 주의
현재 Manifest는 전경 위치 권한만 선언합니다. 이것은 일반적인 앱 사용 중 위치 기반 러닝에 필요한 기본 구성입니다.

Android에서 화면이 꺼지거나 앱이 백그라운드로 내려간 뒤에도 장시간 GPS 기록을 안정적으로 유지하려면 별도의 Android Foreground Service 구현과 지속 알림이 필요합니다. 이 기능을 구현하기 전에는 `ACCESS_BACKGROUND_LOCATION` 또는 foreground service location 관련 권한을 임의로 추가하지 않습니다. Google Play 정책 검토 대상이 될 수 있기 때문입니다.
