package com.cafe.management.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Memo {
	@Id @GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String writerName;    // 작성자 이름 (표시용)
	private String writerLoginId; // 작성자 아이디 (권한 확인용)
	private String content;

	@Builder.Default
	private LocalDateTime regDate = LocalDateTime.now();
}
