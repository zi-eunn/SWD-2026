package com.cafe.management.repository;
import com.cafe.management.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member,Long> {
	Optional<Member> findByLoginId(String loginId);
}
