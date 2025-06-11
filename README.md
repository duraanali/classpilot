# ClassPilot API Documentation

Base URL: `https://classpilot-chi.vercel.app`

All requests require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <your_token>
```

## Authentication

### Register

```http
POST /api/auth/register
```

Request Body:

```json
{
  "name": "string",
  "email": "string",
  "password": "string",
}
```

Response:

```json
{
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string"
  }
}
```

### Login

```http
POST /api/auth/login
```

Request Body:

```json
{
  "email": "string",
  "password": "string"
}
```

Response:

```json
{
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string"
  }
}
```

### Get Current User

```http
GET /api/auth/me
```

Response:

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "string"
}
```

## Students

### List Students

```http
GET /api/students
```

Response:

```json
[
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "grade": "number",
    "age": "number",
    "gender": "string",
    "notes": "string",
    "parentEmail": "string",
    "parentPhone": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

### Create Student

```http
POST /api/students
```

Request Body:

```json
{
  "name": "string",
  "email": "string",
  "grade": "number",
  "age": "number",
  "gender": "string",
  "notes": "string",
  "parentEmail": "string",
  "parentPhone": "string"
}
```

Response:

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "grade": "number",
  "age": "number",
  "gender": "string",
  "notes": "string",
  "parentEmail": "string",
  "parentPhone": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Get Student

```http
GET /api/students/{id}
```

Response:

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "grade": "number",
  "age": "number",
  "gender": "string",
  "notes": "string",
  "parentEmail": "string",
  "parentPhone": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Update Student

```http
PUT /api/students/{id}
```

Request Body:

```json
{
  "name": "string",
  "email": "string",
  "grade": "number",
  "age": "number",
  "gender": "string",
  "notes": "string",
  "parentEmail": "string",
  "parentPhone": "string"
}
```

Response:

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "grade": "number",
  "age": "number",
  "gender": "string",
  "notes": "string",
  "parentEmail": "string",
  "parentPhone": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Delete Student

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

## Classes

### List Classes

```http
GET /api/classes
```

Response:

```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "subject": "string",
    "gradeLevel": "number",
    "schedule": "string",
    "capacity": "number",
    "teacherId": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

### Create Class

```http
POST /api/classes
```

Request Body:

```json
{
  "name": "string",
  "description": "string",
  "subject": "string",
  "gradeLevel": "number",
  "schedule": "string",
  "capacity": "number"
}
```

Response:

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "subject": "string",
  "gradeLevel": "number",
  "schedule": "string",
  "capacity": "number",
  "teacherId": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Get Class

```http
GET /api/classes/{id}
```

Response:

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "subject": "string",
  "gradeLevel": "number",
  "schedule": "string",
  "capacity": "number",
  "teacherId": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Update Class

```http
PUT /api/classes/{id}
```

Request Body:

```json
{
  "name": "string",
  "description": "string",
  "subject": "string",
  "gradeLevel": "number",
  "schedule": "string",
  "capacity": "number"
}
```

Response:

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "subject": "string",
  "gradeLevel": "number",
  "schedule": "string",
  "capacity": "number",
  "teacherId": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Delete Class

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

## Class Students

### List Students in Class

```http
GET /api/classes/{id}/students
```

Response:

```json
[
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "grade": "number",
    "age": "number",
    "gender": "string",
    "notes": "string",
    "parentEmail": "string",
    "parentPhone": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

### Assign Students to Class

```http
POST /api/classes/{id}/students
```

Request Body:

```json
{
  "studentIds": ["string"]
}
```

Response:

```json
{
  "success": true,
  "message": "Students assigned successfully"
}
```

### Remove Student from Class

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

## Grades

### Create Grade

```http
POST /api/grades
```

Request Body:

```json
{
  "student_id": "string",
  "class_id": "string",
  "assignment": "string",
  "score": "number"
}
```

Response:

```json
{
  "id": "string",
  "studentId": "string",
  "classId": "string",
  "assignment": "string",
  "score": "number",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Get Grade

```http
GET /api/grades/{id}
```

Response:

```json
{
  "id": "string",
  "studentId": "string",
  "classId": "string",
  "assignment": "string",
  "score": "number",
  "createdAt": "string",
  "updatedAt": "string",
  "student": {
    "id": "string",
    "name": "string",
    "email": "string"
  },
  "class": {
    "id": "string",
    "name": "string",
    "subject": "string"
  }
}
```

### Update Grade

```http
PUT /api/grades/{id}
```

Request Body:

```json
{
  "assignment": "string",
  "score": "number"
}
```

Response:

```json
{
  "id": "string",
  "studentId": "string",
  "classId": "string",
  "assignment": "string",
  "score": "number",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Delete Grade

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

### List Grades for Class

```http
GET /api/classes/{id}/grades
```

Response:

```json
[
  {
    "id": "string",
    "studentId": "string",
    "classId": "string",
    "assignment": "string",
    "score": "number",
    "createdAt": "string",
    "updatedAt": "string",
    "student": {
      "id": "string",
      "name": "string",
      "email": "string"
    }
  }
]
```

### List Grades for Student

```http
GET /api/students/{id}/grades
```

Response:

```json
[
  {
    "id": "string",
    "studentId": "string",
    "classId": "string",
    "assignment": "string",
    "score": "number",
    "createdAt": "string",
    "updatedAt": "string",
    "class": {
      "id": "string",
      "name": "string",
      "subject": "string"
    }
  }
]
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "Invalid input",
  "details": [
    {
      "code": "string",
      "path": ["string"],
      "message": "string"
    }
  ],
  "received": {}
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage. The current limits are:

- 100 requests per minute per IP address
- 1000 requests per hour per IP address

When rate limited, you'll receive a 429 Too Many Requests response:

```json
{
  "error": "Too many requests",
  "retryAfter": "number"
}
```

## Best Practices

1. Always include the Authorization header with a valid Bearer token
2. Handle rate limiting by implementing exponential backoff
3. Validate request bodies before sending
4. Handle all possible error responses
5. Use appropriate HTTP methods for each operation
6. Keep your authentication token secure
7. Implement proper error handling in your client applications
