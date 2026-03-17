package com.cafe.management.service;
import com.cafe.management.dto.JoinDto;
import com.cafe.management.entity.Member;
import com.cafe.management.entity.Memo;
import com.cafe.management.entity.WorkLog;
import com.cafe.management.repository.MemberRepository;
import com.cafe.management.repository.MemoRepository;
import com.cafe.management.repository.WorkLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CafeService {
	private final MemberRepository memberRepository;
	private final WorkLogRepository workLogRepository;
	private final MemoRepository memoRepository;

	// --- 회원가입 & 로그인 ---
	@Transactional
	public void join(JoinDto dto) {
		if (memberRepository.findByLoginId(dto.getLoginId()).isPresent()) {
			throw new IllegalArgumentException("이미 존재하는 아이디입니다.");
		}
		//사용자가 선택한 role 값이 없으면 USER로 기본 설정
		String userRole = (dto.getRole() != null) ? dto.getRole() : "USER";

		Member member = Member.builder()
			.name(dto.getName())
			.loginId(dto.getLoginId())
			.password(dto.getPassword())
			.role(userRole) //선택한 역할 저장
			.active(true) //가입 즉시 활성화
			.build();
		memberRepository.save(member);
	}

	public Member login(String loginId, String password) {
		Member member = memberRepository.findByLoginId(loginId)
			.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));
		//ERP에서 비활성화 된 경우
		if(!member.isActive()) {
			throw new IllegalArgumentException("퇴사 처리되어 접속이 제한된 계정입니다.");
		}
		if (!member.getPassword().equals(password)) {
			throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
		}
		return member;
	}

	// --- 근무 기록 ---
	public List<WorkLog> getTodayLogs() {
		return workLogRepository.findAllByOrderByStartTimeDesc();
	}

	// --- 근무 기록 ---
	@Transactional
	public void startWork(Member member) {
		// 1. 가장 최근 기록을 가져와서 확인
		workLogRepository.findTopByMemberLoginIdOrderByStartTimeDesc(member.getLoginId())
			.ifPresent(lastLog -> {
				// 최근 기록의 퇴근 시간이 비어있으면 (=아직 일하는 중이면)
				if (lastLog.getEndTime() == null) {
					throw new IllegalArgumentException("이미 출근 처리가 되어있습니다.");
				}
			});

		// 2. 문제 없으면 출근 기록 생성
		WorkLog log = WorkLog.builder()
			.memberName(member.getName())
			.memberLoginId(member.getLoginId())
			.startTime(LocalDateTime.now())
			.build();
		workLogRepository.save(log);
	}

	@Transactional
	public void endWork(Long logId) {
		WorkLog log = workLogRepository.findById(logId)
			.orElseThrow(() -> new IllegalArgumentException("기록 없음"));
		log.setEndTime(LocalDateTime.now());
	}

	// --- 메모 ---
	public Page<Memo> getMemos(Pageable pageable) {
		return memoRepository.findAllByOrderByRegDateDesc(pageable);
	}

	@Transactional
	public void saveMemo(Member member, String content) {
		Memo memo = Memo.builder()
			.writerName(member.getName())
			.writerLoginId(member.getLoginId())
			.content(content)
			.build();
		memoRepository.save(memo);
	}

	@Transactional
	public void updateMemo(Long id, String loginId, String content) {
		Memo memo = memoRepository.findById(id).orElseThrow();
		if (!memo.getWriterLoginId().equals(loginId)) {
			throw new IllegalArgumentException("본인이 작성한 글만 수정 가능합니다.");
		}
		memo.setContent(content);
	}

	@Transactional
	public void deleteMemo(Long id, String loginId) {
		Memo memo = memoRepository.findById(id).orElseThrow();
		if (!memo.getWriterLoginId().equals(loginId)) {
			throw new IllegalArgumentException("본인이 작성한 글만 삭제 가능합니다.");
		}
		memoRepository.deleteById(id);
	}
}
