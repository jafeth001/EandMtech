package com.taskmanagement.technicalinterview.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("TaskFlow — Task Management API")
                        .description("""
                                Collaborative task management system supporting multiple user roles, \
                                task assignment, progress tracking, and file uploads.
                                
                                **Roles:**
                                - `SUPERVISOR` — creates tasks, assigns employees, confirms completion
                                - `EMPLOYEE` — views assigned tasks, updates progress, marks resolved
                                
                                **Task Workflow:** `CREATED → ASSIGNED → IN_PROGRESS → RESOLVED → DONE`
                                
                                **Authentication:** Use `/api/auth/login` to obtain a JWT token, \
                                then click **Authorize** and enter: `Bearer <your_token>`
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("TaskFlow Support")
                                .email("support@taskflow.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("http://www.apache.org/licenses/LICENSE-2.0.html")))
                // ── JWT Bearer security scheme ──────────────────────────────
                .addSecurityItem(new SecurityRequirement()
                        .addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Paste your JWT token here (without the 'Bearer ' prefix)")));
    }
}