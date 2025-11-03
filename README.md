# ClassPilot API Documentation

Base URL: `https://classpilot-chi.vercel.app`

All requests require authentication using a Bearer token in the Authorization header (except for register and login):

```
Authorization: Bearer <your_token>
```

## Table of Contents

- [Authentication](#authentication)
- [Students](#students)
- [Classes](#classes)
- [Grades](#grades)
- [Class Enrollments](#class-enrollments)
- [Error Codes](#error-codes)

---

## Authentication

### Register

Creates a new teacher account.

```http
POST /api/auth/register
```

**Request Body:**

```json
{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (201 Created):**

```json
{
  "token": "string (JWT token)",
  "user": {
    "_id": "string",
    "name": "string",
    "email": "string",
    "role": "Teacher",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid input data
- `409 Conflict`: Email already registered
- `500 Internal Server Error`: Server error

### Login

Authenticates a teacher and returns a JWT token.

```http
POST /api/auth/login
```

Request Body:

```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

Response:

```json
{
  "token": "string (JWT token)",
  "user": {
    "_id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Server error

### Get Current User

Returns the current authenticated user's information.

```http
GET /api/auth/me
```

Response:

```json
{
  "_id": "string",
  "name": "string",
  "email": "string",
  "role": "string",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing token
- `500 Internal Server Error`: Server error

---

## Students

### List Students

Returns all students created by the authenticated teacher.

```http
GET /api/students
```

Response:

```json
[
  {
    "_id": "string",
    "name": "string",
    "email": "string",
    "grade": "number",
    "age": "number (optional)",
    "gender": "string (optional)",
    "notes": "string (optional)",
    "parentEmail": "string (optional)",
    "parentPhone": "string (optional)",
    "teacherId": "string",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
]
```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing token
- `500 Internal Server Error`: Server error

### Create Student

Creates a new student associated with the authenticated teacher.

```http
POST /api/students
```

Request Body:

```json
{
  "name": "string (required)",
  "email": "string (required)",
  "grade": "number (optional, will be auto-calculated from age if age is provided)",
  "age": "number (optional)",
  "gender": "string (optional)",
  "notes": "string (optional)",
  "parentEmail": "string (optional)",
  "parentPhone": "string (optional)"
}
```

Response:

```json
{
  "_id": "string",
  "name": "string",
  "email": "string",
  "grade": "number (auto-calculated from age if age is provided)",
  "age": "number",
  "gender": "string",
  "notes": "string",
  "parentEmail": "string",
  "parentPhone": "string",
  "teacherId": "string",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing token
- `409 Conflict`: Email already exists
- `500 Internal Server Error`: Server error

### Get Student

Returns a specific student by ID (only if owned by the authenticated teacher).

```http
GET /api/students/{id}
```

Response:

```json
{
  "_id": "string",
  "name": "string",
  "email": "string",
  "grade": "number",
  "age": "number",
  "gender": "string",
  "notes": "string",
  "parentEmail": "string",
  "parentPhone": "string",
  "teacherId": "string",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Student not found or not owned by teacher
- `500 Internal Server Error`: Server error

### Update Student

Updates a specific student (only if owned by the authenticated teacher).

```http
PUT /api/students/{id}
```

Request Body:

```json
{
  "name": "string (optional)",
  "email": "string (optional)",
  "grade": "number (optional, will be auto-calculated from age if age is provided)",
  "age": "number (optional)",
  "gender": "string (optional)",
  "notes": "string (optional)",
  "parentEmail": "string (optional)",
  "parentPhone": "string (optional)"
}
```

Response:

```json
{
  "_id": "string",
  "name": "string",
  "email": "string",
  "grade": "number",
  "age": "number",
  "gender": "string",
  "notes": "string",
  "parentEmail": "string",
  "parentPhone": "string",
  "teacherId": "string",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Student not found or not owned by teacher
- `409 Conflict`: Email already exists
- `500 Internal Server Error`: Server error

### Delete Student

Deletes a specific student and all related grades and enrollments (only if owned by the authenticated teacher).

```http
DELETE /api/students/{id}
```

Response:

```json
{
  "success": true,
  "message": "Student deleted successfully"
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Student not found or not owned by teacher
- `500 Internal Server Error`: Server error

---

## Classes

### List Classes

Returns all classes created by the authenticated teacher.

```http
GET /api/classes
```

Response:

```json
[
  {
    "_id": "string",
    "name": "string",
    "description": "string",
    "subject": "string",
    "gradeLevel": "number",
    "schedule": "string",
    "capacity": "number",
    "teacherId": "string",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
]
```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing token
- `500 Internal Server Error`: Server error

### Create Class

Creates a new class associated with the authenticated teacher.

```http
POST /api/classes
```

Request Body:

```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "subject": "string (optional)",
  "grade_level": "number (optional)",
  "schedule": "string (optional)",
  "capacity": "number (optional)"
}
```

Response:

```json
{
  "_id": "string",
  "name": "string",
  "description": "string",
  "subject": "string",
  "gradeLevel": "number",
  "schedule": "string",
  "capacity": "number",
  "teacherId": "string",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing token
- `500 Internal Server Error`: Server error

### Get Class

Returns a specific class with enrolled students (only if owned by the authenticated teacher).

```http
GET /api/classes/{id}
```

Response:

```json
{
  "_id": "string",
  "name": "string",
  "description": "string",
  "subject": "string",
  "gradeLevel": "number",
  "schedule": "string",
  "capacity": "number",
  "teacherId": "string",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)",
  "students": [
    {
      "_id": "string",
      "name": "string",
      "email": "string",
      "grade": "number",
      "age": "number",
      "gender": "string",
      "notes": "string",
      "parentEmail": "string",
      "parentPhone": "string",
      "enrolledAt": "string (ISO date)"
    }
  ],
  "studentCount": "number"
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Class not found or not owned by teacher
- `500 Internal Server Error`: Server error

### Update Class

Updates a specific class (only if owned by the authenticated teacher).

```http
PUT /api/classes/{id}
```

Request Body:

```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "subject": "string (optional)",
  "grade_level": "number (optional)",
  "schedule": "string (optional)",
  "capacity": "number (optional)"
}
```

Response:

```json
{
  "_id": "string",
  "name": "string",
  "description": "string",
  "subject": "string",
  "gradeLevel": "number",
  "schedule": "string",
  "capacity": "number",
  "teacherId": "string",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)",
  "students": [
    {
      "_id": "string",
      "name": "string",
      "email": "string",
      "grade": "number",
      "age": "number",
      "gender": "string",
      "notes": "string",
      "parentEmail": "string",
      "parentPhone": "string",
      "enrolledAt": "string (ISO date)"
    }
  ],
  "studentCount": "number"
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Class not found or not owned by teacher
- `500 Internal Server Error`: Server error

### Delete Class

Deletes a specific class and all related grades and enrollments (only if owned by the authenticated teacher).

```http
DELETE /api/classes/{id}
```

Response:

```json
{
  "success": true,
  "message": "Class deleted successfully"
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Class not found or not owned by teacher
- `500 Internal Server Error`: Server error

---

## Class Enrollments

### List Students in Class

Returns all students enrolled in a specific class (only if owned by the authenticated teacher).

```http
GET /api/classes/{id}/students
```

Response:

```json
[
  {
    "_id": "string",
    "name": "string",
    "email": "string",
    "grade": "number",
    "age": "number",
    "gender": "string",
    "notes": "string",
    "parentEmail": "string",
    "parentPhone": "string",
    "teacherId": "string",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)",
    "enrolledAt": "string (ISO date)"
  }
]
```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Class not found or not owned by teacher
- `500 Internal Server Error`: Server error

### Enroll Students in Class

Enrolls multiple students in a specific class (only if owned by the authenticated teacher).

```http
POST /api/classes/{id}/students
```

Request Body:

```json
{
  "student_ids": ["string", "string"] (required, array of student IDs)
}
```

Response:

```json
{
  "enrollmentIds": ["string", "string"],
  "message": "Students enrolled successfully"
}
```

**Error Responses:**

- `400 Bad Request`: Capacity exceeded
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Students or class not owned by teacher
- `404 Not Found`: Class not found or not owned by teacher
- `500 Internal Server Error`: Server error

### Remove Student from Class

Removes a specific student from a class (only if owned by the authenticated teacher).

```http
DELETE /api/classes/{id}/students/{studentId}
```

Response:

```json
{
  "success": true,
  "message": "Student removed from class successfully"
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Student or class not owned by teacher
- `404 Not Found`: Student not enrolled or not owned by teacher
- `500 Internal Server Error`: Server error

---

## Grades

### Create Grade

Creates a new grade for a student in a specific class (only if owned by the authenticated teacher).

```http
POST /api/grades
```

Request Body:

```json
{
  "student_id": "string (required)",
  "class_id": "string (required)",
  "assignment": "string (required)",
  "score": "number (required)"
}
```

Response:

```json
{
  "_id": "string",
  "studentId": "string",
  "classId": "string",
  "assignment": "string",
  "score": "number",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)",
  "student": {
    "_id": "string",
    "name": "string",
    "email": "string",
    "grade": "number",
    "age": "number",
    "gender": "string",
    "notes": "string",
    "parentEmail": "string",
    "parentPhone": "string",
    "teacherId": "string",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  },
  "class": {
    "_id": "string",
    "name": "string",
    "description": "string",
    "subject": "string",
    "gradeLevel": "number",
    "schedule": "string",
    "capacity": "number",
    "teacherId": "string",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Student not enrolled
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Student or class not owned by teacher
- `500 Internal Server Error`: Server error

### Update Grade

Updates a specific grade (only if owned by the authenticated teacher).

```http
PUT /api/grades/{id}
```

Request Body:

```json
{
  "assignment": "string (optional)",
  "score": "number (optional)"
}
```

Response:

```json
{
  "_id": "string",
  "studentId": "string",
  "classId": "string",
  "assignment": "string",
  "score": "number",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)",
  "student": {
    "_id": "string",
    "name": "string",
    "email": "string",
    "grade": "number",
    "age": "number",
    "gender": "string",
    "notes": "string",
    "parentEmail": "string",
    "parentPhone": "string",
    "teacherId": "string",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  },
  "class": {
    "_id": "string",
    "name": "string",
    "description": "string",
    "subject": "string",
    "gradeLevel": "number",
    "schedule": "string",
    "capacity": "number",
    "teacherId": "string",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Grade not owned by teacher
- `404 Not Found`: Grade not found or not owned by teacher
- `500 Internal Server Error`: Server error

### Delete Grade

Deletes a specific grade (only if owned by the authenticated teacher).

```http
DELETE /api/grades/{id}
```

Response:

```json
{
  "success": true,
  "message": "Grade deleted successfully"
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Grade not owned by teacher
- `404 Not Found`: Grade not found or not owned by teacher
- `500 Internal Server Error`: Server error

---

## Error Codes

### HTTP Status Codes

| Code | Status                | Description                                              |
| ---- | --------------------- | -------------------------------------------------------- |
| 200  | OK                    | Request successful                                       |
| 201  | Created               | Resource created successfully                            |
| 400  | Bad Request           | Invalid input data or validation failed                  |
| 401  | Unauthorized          | Invalid or missing authentication token                  |
| 403  | Forbidden             | Insufficient permissions to access resource              |
| 404  | Not Found             | Resource not found or not owned by teacher               |
| 409  | Conflict              | Resource already exists (e.g., email already registered) |
| 500  | Internal Server Error | Unexpected server error                                  |

### Error Response Format

All error responses follow this format:

```json
{
  "error": "string (error type)",
  "message": "string (user-friendly error message)",
  "details": [
    {
      "field": "string (field name)",
      "message": "string (field-specific error)",
      "code": "string (error code)"
    }
  ],
  "received": "object (optional, received data for debugging)"
}
```

### Common Error Messages

| Error Type        | Message                                                   | Description                                |
| ----------------- | --------------------------------------------------------- | ------------------------------------------ |
| Validation failed | Please check the provided data and try again              | Input validation failed                    |
| Unauthorized      | Invalid or missing authentication token                   | Authentication required                    |
| Forbidden         | Student not found or not owned by teacher                 | Insufficient permissions                   |
| Not found         | Class not found or you don't have permission to access it | Resource not found or not owned            |
| Capacity exceeded | Adding these students would exceed class capacity         | Class capacity limit reached               |
| Enrollment error  | Student is not enrolled in this class                     | Student must be enrolled to receive grades |

---

## Authentication Flow

1. **Register**: Create a new teacher account
2. **Login**: Authenticate and receive JWT token
3. **Use Token**: Include token in Authorization header for all subsequent requests
4. **Token Expiry**: Re-authenticate when token expires

## Data Relationships

- **Teachers** can only manage their own **Students**, **Classes**, and **Grades**
- **Students** must be enrolled in a **Class** to receive **Grades**
- **Classes** have a **capacity** limit for student enrollments
- **Cascade Deletion**: Deleting a **Student** or **Class** automatically deletes related **Grades** and **Enrollments**

## Rate Limiting

Currently, no rate limiting is implemented. Please use the API responsibly.

## Support

For API support or questions, please contact the development team.
