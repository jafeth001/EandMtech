package com.taskmanagement.technicalinterview;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@ComponentScan("com.taskmanagement.technicalinterview")
@SpringBootApplication
@OpenAPIDefinition
public class TechnicalinterviewApplication {

	public static void main(String[] args) {
		SpringApplication.run(TechnicalinterviewApplication.class, args);
	}

}
