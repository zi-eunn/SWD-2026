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
}
