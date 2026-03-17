package com.cafe.management.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Member {
	@Id @GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(unique = true) // 아이디 중복 방지
	private String loginId;

	private String password;
	private String name; // 실명 (예: 김지은)
}
