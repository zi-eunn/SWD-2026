package com.cafe.management.dto;

import lombok.Data;

@Data
public class JoinDto {
	private String name;
	private String loginId;
	private String password;
	private String role; //admin 또는 user 값을 받음
}
