package com.cafe.management.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Memo {
	@Id @GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String writerName;
	private String writerLoginId;
	private String content;

	@Builder.Default
	private LocalDateTime regDate = LocalDateTime.now();
}
