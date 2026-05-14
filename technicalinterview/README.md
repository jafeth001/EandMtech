# TechnicalInterview Task Manager

A simple task management application with:
- Spring Boot backend with JWT authentication
- React/Vite frontend UI

## Run

Backend:
```bash
./mvnw spring-boot:run
```

Frontend:
```bash
cd task-ui
npm install
npm run dev
```

## Notes

- Login using a registered user account
- Supervisors can create tasks and assign employees
- Employees can view and update their assigned tasks
- JWT tokens are used for authentication and authorization