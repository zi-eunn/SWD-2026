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
	private String name;

	private String role; // 가입 시 선택한 역할

	@Builder.Default
	private boolean active = true;
	private Integer hourlyWage;
	private String position;
	private String regularShift;
}
