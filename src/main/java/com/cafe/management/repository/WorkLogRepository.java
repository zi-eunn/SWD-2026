package com.cafe.management.repository;
import com.cafe.management.entity.WorkLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WorkLogRepository extends JpaRepository<WorkLog, Long>{
	// 오늘 전체 기록 조회
	List<WorkLog> findAllByOrderByStartTimeDesc();

	// 특정 멤버의 가장 최근 기록 1개 조회
	Optional<WorkLog> findTopByMemberLoginIdOrderByStartTimeDesc(String memberLoginId);
}
