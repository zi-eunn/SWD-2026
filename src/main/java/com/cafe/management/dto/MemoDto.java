package com.cafe.management.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MemoDto {
	private Long id;
	private String writerName;
	private String content;
	private LocalDateTime reDate;
}
