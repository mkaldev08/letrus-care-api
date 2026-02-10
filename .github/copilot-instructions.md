# Letrus Care API - Copilot Instructions

## Project Overview
This is a Node.js + Express + TypeScript REST API for managing literacy center operations, including students, enrollments, payments, attendance, and financial planning.

## Technology Stack
- **Runtime:** Node.js 20+
- **Language:** TypeScript 5.8+
- **Framework:** Express.js 4.x
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens) with cookie-based sessions
- **API Documentation:** Swagger/OpenAPI 3.0
- **Process Manager:** Nodemon (development)

## General Guidelines
- **Language Version:** Use TypeScript with strict type checking enabled
- **Module System:** Don't Use CommonJS (`require`/`module.exports`) - Use ES Modules (`import`/`export`)
- **Code Style:** Keep code simple, readable, and self-explanatory
- **Error Handling:** Always use `try/catch` blocks for asynchronous operations
- **Type Safety:** Leverage TypeScript's strict mode; avoid `any` types

## Naming Conventions
- **Variables/Functions/Methods:** Use `camelCase`
- **Constants:** Use `ALL_CAPS` for environment variables and true constants
- **Classes/Interfaces/Types:** Use `PascalCase` with `I` prefix for interfaces (e.g., `IStudent`)
- **Files:** Use `kebab-case` for file names (e.g., `student-controller.ts`)
- **Routes:** Use plural nouns in lowercase (e.g., `/students`, `/enrollments`)

## Project Architecture

### Folder Structure
```
src/
├── config/          # Configuration files (database, multer, etc.)
├── controllers/     # Request handlers (business logic)
├── middlewares/     # Express middlewares (auth, validation)
├── migrations/      # Database migration scripts
├── models/          # Mongoose schemas and models
├── routes/          # Express route definitions
└── utils/           # Utility functions and helpers
```

### Architectural Patterns

#### 1. MVC Pattern (Model-View-Controller)
- **Models:** Define data schemas using Mongoose with TypeScript interfaces
- **Controllers:** Handle business logic and respond to HTTP requests
- **Routes:** Define endpoints and map to controller functions

#### 2. Middleware Pattern
- Use `withAuth` middleware for protected routes
- Apply middlewares at route level, not globally unless necessary

#### 3. Repository Pattern (via Mongoose)
- Models encapsulate data access logic
- Use Mongoose methods for CRUD operations

## Code Patterns and Best Practices

### Models (Mongoose Schemas)
```typescript
// Always export both interface and model
export interface IStudent extends Document {
  name: { fullName: string; surname?: string };
  birthDate: Date;
  // ... other fields
  status: "active" | "inactive";
}

const studentSchema = new Schema<IStudent>({
  name: {
    fullName: { type: String, required: true },
    surname: { type: String },
  },
  // ... other fields
  status: { type: String, enum: ["active", "inactive"], default: "active" },
});

export const StudentModel = model<IStudent>("Student", studentSchema);
```

**Model Best Practices:**
- Always extend `Document` for interfaces
- Use TypeScript enums for string literal types
- Add text indexes for searchable fields
- Use `Schema.Types.ObjectId` for references
- Set sensible defaults

### Controllers
```typescript
export const getStudent = async (request: Request, response: Response) => {
  const { id } = request.params;
  try {
    const student = await StudentModel.findById(id);
    student
      ? response.status(200).json(student)
      : response.status(404).json(null);
  } catch (error) {
    response.status(500).json(error);
  }
};
```

**Controller Best Practices:**
- Export named functions (not default exports)
- Always wrap async operations in `try/catch`
- Use appropriate HTTP status codes:
  - 200: Success
  - 201: Created
  - 400: Bad Request
  - 404: Not Found
  - 500: Server Error
- Return `null` for 404 responses
- Extract request data early using destructuring
- Validate input before processing

### Routes
```typescript
export const studentRouter = Router();
studentRouter.post("/new", createStudent);
studentRouter.get("/all", getStudents);
studentRouter.get("/:id", getStudent);
studentRouter.put("/edit/:id", editStudent);
studentRouter.patch("/delete/:id", deleteStudent);
```

**Routing Best Practices:**
- Use semantic HTTP methods:
  - POST: Create
  - GET: Read
  - PUT: Full update
  - PATCH: Partial update
  - DELETE: Remove (or status change)
- Use descriptive path segments
- Place specific routes before parameterized routes
- Export router as named constant

### Authentication & Authorization
- Use JWT tokens stored in HTTP-only cookies
- Apply `withAuth` middleware to protected routes
- Store JWT secret in environment variables
- Always verify token and user existence

### Error Handling
```typescript
try {
  const result = await someAsyncOperation();
  response.status(200).json(result);
} catch (error) {
  // Log errors in development only
  if (process.env.NODE_ENV === "development") console.error(error);
  response.status(500).json(error);
}
```

**Error Handling Best Practices:**
- Use `try/catch` for all async operations
- Return appropriate error responses
- Log errors conditionally based on environment
- Don't expose sensitive error details in production

### Database Operations
- Use pagination for list endpoints:
  ```typescript
  .skip((pageNumber - 1) * limitNumber)
  .limit(limitNumber)
  ```
- Always sort results for consistency
- Use `.populate()` for referenced documents when needed
- Implement text search using `$text` operator with indexed fields

### Environment Variables
- Load using `dotenv` at application entry
- Access via `process.env.VARIABLE_NAME`
- Common variables:
  - `MONGO_URL`: Database connection string
  - `JWT_TOKEN`: Secret for JWT signing
  - `APP_URL`: Frontend URL for CORS
  - `queryLimit`: Default pagination limit

## Syntax and Structure
- **Asynchronous Code:** Always use `async/await`
- **Null vs Undefined:** Use `null` for explicit absence, `undefined` for optional parameters
- **Variable Declaration:** Use `const` by default, `let` when reassignment needed
- **Strings:** Use template literals for interpolation, otherwise no preference
- **Semicolons:** Always use semicolons
- **Type Annotations:** Always provide explicit types for function parameters and return types
- **Interfaces:** Use `interface` for object shapes, `type` for unions/intersections

## Anti-Patterns to Avoid
- ❌ Do not use `any` type without explicit justification
- ❌ Do not handle errors by only logging them - always send response
- ❌ Do not expose sensitive data in error messages
- ❌ Do not forget to validate user input
- ❌ Do not use console.log in production code (use conditionally)
- ❌ Do not create endpoints without authentication when required
- ❌ Do not use global middlewares unless absolutely necessary
- ❌ Do not forget to handle edge cases (null, undefined, empty arrays)

## Testing & Quality
- No test framework currently configured - manual testing required
- Test all CRUD operations via Swagger UI at `/api-docs`
- Verify authentication on protected routes
- Test pagination and search functionality

## Common Utilities
- **Code Generation:** Use `createCode()` from `utils/generate-code.ts` for entity codes
- **Date Handling:** Use `date-fns` library for date operations
- **File Uploads:** Use configured Multer middleware

## API Conventions
- Base path: Root level (no `/api` prefix)
- Authentication: Cookie-based with `token` key
- Content-Type: `application/json`
- CORS enabled for configured origin

## Migration Scripts
- Located in `src/migrations/`
- Run manually via npm scripts
- Always backup database before running migrations
- Document migration purpose and changes

## Documentation
- Use Swagger/JSDoc comments for API documentation
- Keep README.md updated with setup instructions
- Document environment variables
