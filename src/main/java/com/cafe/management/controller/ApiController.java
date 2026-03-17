package com.cafe.management.controller;

import com.cafe.management.dto.JoinDto;
import com.cafe.management.entity.Member;
import com.cafe.management.entity.Memo;
import com.cafe.management.entity.WorkLog;
import com.cafe.management.service.CafeService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ApiController {
	private final CafeService cafeService;

	// 1. 회원가입
	@PostMapping("/join")
	public ResponseEntity<String> join(@RequestBody JoinDto dto) {
		try {
			cafeService.join(dto);
			return ResponseEntity.ok("회원가입 성공");
		} catch (IllegalArgumentException e) {
			// 1. 서비스에서 우리가 직접 "중복입니다"라고 잡은 경우
			return ResponseEntity.badRequest().body("이미 존재하는 아이디입니다.");
		} catch (Exception e) {
			// 2. 버튼 연타 등으로 DB에서 "Unique index" 에러가 터진 경우 (아까 그 영어 에러)
			// 무조건 이 메시지로 통일해서 보여줌
			return ResponseEntity.badRequest().body("이미 존재하는 아이디입니다.");
		}
	}

	// 2. 로그인
	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody Map<String, String> body, HttpSession session) {
		try {
			Member member = cafeService.login(body.get("loginId"), body.get("password"));
			session.setAttribute("loginMember", member); // 세션 저장
			return ResponseEntity.ok(member);
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		}
	}

	// 3. 로그아웃
	@PostMapping("/logout")
	public void logout(HttpSession session) {
		session.invalidate();
	}

	// 4. 출근
	@PostMapping("/work/start")
	public ResponseEntity<String> startWork(HttpSession session) {
		Member member = (Member) session.getAttribute("loginMember");
		if (member == null) return ResponseEntity.status(401).body("로그인이 필요합니다.");

		try {
			cafeService.startWork(member);
			return ResponseEntity.ok("출근 완료");
		} catch (IllegalArgumentException e) {
			// "이미 출근 처리가 되어있습니다." 메시지를 보냄
			return ResponseEntity.badRequest().body(e.getMessage());
		}
	}

	// 5. 퇴근
	@PostMapping("/work/end/{id}")
	public void endWork(@PathVariable Long id) {
		cafeService.endWork(id);
	}

	// 6. 메모 작성
	@PostMapping("/memos")
	public void writeMemo(@RequestBody Map<String, String> body, HttpSession session) {
		Member member = (Member) session.getAttribute("loginMember");
		if (member != null) cafeService.saveMemo(member, body.get("content"));
	}

	// 7. 메모 수정/삭제 (권한 체크는 Service에서)
	@PutMapping("/memos/{id}")
	public ResponseEntity<?> updateMemo(@PathVariable Long id, @RequestBody Map<String, String> body, HttpSession session) {
		Member member = (Member) session.getAttribute("loginMember");
		try {
			cafeService.updateMemo(id, member.getLoginId(), body.get("content"));
			return ResponseEntity.ok().build();
		} catch (Exception e) {
			return ResponseEntity.badRequest().body("권한이 없습니다.");
		}
	}

	@DeleteMapping("/memos/{id}")
	public ResponseEntity<?> deleteMemo(@PathVariable Long id, HttpSession session) {
		Member member = (Member) session.getAttribute("loginMember");
		try {
			cafeService.deleteMemo(id, member.getLoginId());
			return ResponseEntity.ok().build();
		} catch (Exception e) {
			return ResponseEntity.badRequest().body("권한이 없습니다.");
		}
	}

	// 근무 기록 조회
	@GetMapping("/work")
	public List<WorkLog> getWorkLogs() {
		return cafeService.getTodayLogs();
	}

	// 메모 목록 (페이징)
	@GetMapping("/memos")
	public Page<Memo> getMemos(Pageable pageable) {
		return cafeService.getMemos(pageable);
	}

	// ERP 월별 근무 기록 조회 - 사장님 전용
	@GetMapping("/admin/work/monthly")
	public List<WorkLog> getMonthlyLogs(@RequestParam int year, @RequestParam int month) {
		// Repository 대신 Service를 호출하도록 수정!
		return cafeService.getMonthlyLogs(year, month);
	}

	// ERP 누락된 출퇴근 시간 입력
	@PostMapping("/admin/work/insert/{id}")
	public ResponseEntity<String> insertTime(@PathVariable Long id, @RequestBody Map<String, String> body) {
		try {
			LocalDateTime start = body.get("startTime") != null ? LocalDateTime.parse(body.get("startTime")) : null;
			LocalDateTime end = body.get("endTime") != null ? LocalDateTime.parse(body.get("endTime")) : null;

			cafeService.insertMissedTime(id, start, end);

			return ResponseEntity.ok("기록 보완 완료");
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		}
	}

	// ERP 전체 알바생(멤버) 목록 조회
	@GetMapping("/admin/members")
	public ResponseEntity<List<Member>> getAllMembers() {
		// 원래는 Service를 거치는 게 좋지만, 단순 조회이므로 빠른 구현을 위해 Repository 직접 호출
		// (주의: 파일 위쪽에 private final MemberRepository memberRepository; 가 선언되어 있어야 합니다. 없다면 CafeService에 만들어서 호출하세요!)
		return ResponseEntity.ok(cafeService.getAllMembers());
	}

	// ERP 알바생 정보 수정 및 활성/비활성화 관리
	@PutMapping("/admin/members/{id}")
	public ResponseEntity<?> updateMember(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		try {
			// 1. 시급(wage) 데이터 안전하게 변환 (빈 문자열이거나 null일 경우 처리)
			Object wageObj = body.get("wage");
			Integer wage = null;
			if (wageObj != null && !wageObj.toString().trim().isEmpty()) {
				wage = Integer.valueOf(wageObj.toString());
			}

			// 2. 계정 활성 상태(active) 변환
			Boolean active = true;
			if (body.get("active") != null) {
				active = Boolean.valueOf(body.get("active").toString());
			}

			// 3. 서비스 호출하여 DB 업데이트
			// 여기서 CafeService가 "사장님은 안 됩니다"라고 에러를 던지면 catch 블록으로 이동합니다.
			cafeService.updateMemberInfo(
				id,
				wage,
				(String) body.get("position"),
				(String) body.get("shift"),
				active
			);

			return ResponseEntity.ok("수정 성공");

		} catch (IllegalArgumentException e) {
			// ★ CafeService에서 던진 "사장님 계정은 비활성화할 수 없습니다." 메시지를 그대로 클라이언트에 전달
			return ResponseEntity.badRequest().body(e.getLocalizedMessage());

		} catch (Exception e) {
			// 기타 예상치 못한 서버 에러 처리
			e.printStackTrace();
			return ResponseEntity.status(500).body("서비 내부 오류가 발생했습니다: " + e.getMessage());
		}
	}
}
