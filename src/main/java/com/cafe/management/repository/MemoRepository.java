package com.cafe.management.repository;
import com.cafe.management.entity.Memo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;

public interface MemoRepository extends JpaRepository<Memo, Long>{
	// 페이징 처리된 메모 조회 (최신순)
	Page<Memo> findAllByOrderByRegDateDesc(Pageable pageable);

	// 특정 날짜 이전 데이터 삭제
	void deleteAllByRegDateBefore(LocalDateTime dateTime);
}
