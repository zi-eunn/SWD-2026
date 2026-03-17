package com.cafe.management.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkLog {
	@Id @GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String memberName;     // 근무자 이름
	private String memberLoginId;  // 근무자 아이디 (식별용)
	private LocalDateTime startTime;
	private LocalDateTime endTime;
}
