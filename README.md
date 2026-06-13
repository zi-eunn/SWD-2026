# 카페 인력 및 근태 관리 시스템 (Cafe Management System)

## 1. 프로젝트 개요
본 프로젝트는 카페 매장의 알바생 출퇴근 기록, 전달사항(Memo) 관리, 그리고 관리자(ERP)의 시급 및 근태 통계 관리를 위한 웹 애플리케이션입니다.

## 2. 개발 및 실행 환경
* **Language:** Java 17 
* **Framework:** Spring Boot 3.x
* **Database:** H2 Database (File Mode - 로컬에 자동 저장됨)
* **IDE:** IntelliJ IDEA

## 3-1. 배포된 링크 실행 방법
링크 접속
- https://port-0-swd-2026-mqc1gebj08321fed.sel3.cloudtype.app/

테스트용으로 미리 만들어둔 계정. (계정 추가 가능)
사장(관리자) : ID: admin, Password: qwer1234
알바1 : ID: worker, Password: qwer1234

## 3-2. 실행 방법 (JAR 배포본 기준)

1. 첨부된 22212051_management-0.0.1-SNAPSHOT.jar 파일이 위치한 폴더를 엽니다.
2. 해당 폴더 경로에서 명령 프롬프트(Windows CMD) 또는 터미널(Mac)을 열고 아래 명령어를 입력합니다.
- java -jar 22212051_management-0.0.1-SNAPSHOT.jar
3. 터미널에 Tomcat started on port 8080 로그가 출력되며 서버가 구동되면, 웹 브라우저를 열고 아래 주소로 접속합니다.
- http://localhost:8080

## 3-3. 실행 방법 (IntelliJ IDEA 기준)

1. **프로젝트 열기:**
   - IntelliJ를 실행하고 `File > Open`을 클릭한 뒤, 압축을 해제한 본 프로젝트 폴더를 선택하여 엽니다.
2. **의존성 다운로드 대기:**
   - 프로젝트 하단 진행바에 Gradle(또는 Maven) 의존성 다운로드가 완료될 때까지 잠시 대기합니다.
3. **애플리케이션 실행:**
   - `src/main/java/com/.../Application.java` (메인 클래스)를 열고 `▶ Run` 버튼을 클릭하여 서버를 실행합니다.
4. **웹 브라우저 접속:**
   - 서버가 정상적으로 켜지면(Tomcat started on port 8080), 크롬 등 웹 브라우저를 열고 아래 주소로 접속합니다.
   - **http://localhost:8080**

## 4. 테스트용 계정 생성하기
*[관리자/사장님 계정]** (ERP 탭 접근 가능)
*[일반 알바생 계정]** (출퇴근 및 전달사항 작성 가능)

## 5. H2 데이터베이스 확인 방법
* 접속 URL: `http://localhost:8080/h2-console`
* JDBC URL: `jdbc:h2:file:./data/cafedb` (application.yml 설정에 맞게 수정해주세요)
* User Name: `sa` / Password: (비워둠)
