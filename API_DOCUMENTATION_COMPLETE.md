# 📚 TASK SCHEDULER API - COMPLETE DOCUMENTATION

**Base URL:** `http://localhost:3300/api`
**Authentication:** Bearer Token (JWT)
**Version:** 2.0.0
**Total Endpoints:** 38 (34 original + 4 new multiple assignment endpoints)---

## 📋 TABLE OF CONTENTS

1. [Authentication APIs](#1-authentication-apis) (2 endpoints)
2. [User APIs](#2-user-apis) (2 endpoints)
3. [Project APIs](#3-project-apis) (5 endpoints)
4. [Project Member APIs](#4-project-member-apis) (5 endpoints)
5. [Task APIs](#5-task-apis) (12 endpoints - 8 original + 4 new multiple assignment)
6. [Comment APIs](#6-comment-apis) (6 endpoints)
7. [Notification APIs](#7-notification-apis) (6 endpoints)
8. [Data Models](#8-data-models)
9. [Status & Priority Values](#9-status--priority-values)
10. [Error Codes](#10-error-codes)
11. [Latest Updates](#11-latest-updates)

---

## 🆕 WHAT'S NEW IN v2.0.0

### ✨ Multiple User Assignment (NEW)

- Assign nhiều users vào 1 task
- Xem danh sách tất cả assigned users
- Unassign từng user riêng lẻ
- **4 new endpoints** cho multiple assignments

### ✨ Enhanced Comment Response

- Trả về `UserName` trong tất cả comment responses
- UserDetails bao gồm: `UserID`, `UserName`, `Email`, `FullName`

### ✨ Enhanced Task Response

- Task responses bao gồm cả `AssignedUsers` array
- Backward compatible với single assignment

---

## 1. AUTHENTICATION APIs

### 1.1. Register User

**POST** `/register`

**Request Body:**

```json
{
  "userName": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201 Created):**

```json
{
  "message": "Đăng ký thành công",
  "userId": "abc123",
  "data": {
    "_id": "abc123",
    "userName": "john_doe",
    "email": "john@example.com"
  }
}
```

**Errors:**

- 400: Thiếu thông tin / Email không hợp lệ
- 409: Tên đăng nhập hoặc email đã tồn tại

---

### 1.2. Login

**POST** `/login`

**Request Body:**

```json
{
  "userName": "john_doe",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "message": "Đăng nhập thành công",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "abc123",
    "userName": "john_doe",
    "email": "john@example.com"
  }
}
```

**Errors:**

- 400: Thiếu thông tin
- 404: User không tồn tại
- 401: Sai mật khẩu

---

## 2. USER APIs

### 2.1. Get All Users

**GET** `/users`
**Auth:** Required

**Response (200 OK):**

```json
{
  "message": "Retrieved all users",
  "count": 10,
  "data": [
    {
      "userId": "abc123",
      "userName": "john_doe",
      "email": "john@example.com"
    }
  ]
}
```

---

### 2.2. Search Users

**GET** `/users/search?q={query}`
**Auth:** Required

**Query Parameters:**

- `q` or `query`: Search term (email or username)

**Response (200 OK):**

```json
{
  "message": "Search completed",
  "count": 2,
  "data": [
    {
      "userId": "abc123",
      "userName": "john_doe",
      "email": "john@example.com"
    }
  ]
}
```

---

## 3. PROJECT APIs

### 3.1. Create Project

**POST** `/projects`
**Auth:** Required

**Request Body:**

```json
{
  "ProjectName": "Website Redesign",
  "ProjectDescription": "Redesign company website",
  "StartDate": "2025-11-01",
  "EndDate": "2025-12-31",
  "Status": "Planning",
  "OwnerUserID": "abc123"
}
```

**Valid Status Values:**

- Planning (default)
- Active
- On Hold
- Completed
- Cancelled

**Response (201 Created):**

```json
{
  "message": "Tạo project thành công",
  "projectId": "proj1234",
  "data": {
    "ProjectID": "proj1234",
    "ProjectName": "Website Redesign",
    "ProjectDescription": "Redesign company website",
    "StartDate": "2025-11-01",
    "EndDate": "2025-12-31",
    "Status": "Planning",
    "OwnerUserID": "abc123",
    "createdAt": "2025-11-13T...",
    "updatedAt": "2025-11-13T..."
  }
}
```

---

### 3.2. Get All Projects

**GET** `/projects?OwnerUserID={userId}&Status={status}`
**Auth:** Required

**Query Parameters:**

- `OwnerUserID` (optional): Filter by owner
- `Status` (optional): Filter by status

**Response (200 OK):**

```json
{
  "message": "Lấy danh sách thành công",
  "count": 5,
  "projectIds": ["proj1234", "proj5678"],
  "data": [
    {
      "ProjectID": "proj1234",
      "ProjectName": "Website Redesign",
      "ProjectDescription": "...",
      "StartDate": "2025-11-01",
      "EndDate": "2025-12-31",
      "Status": "Planning",
      "OwnerUserID": "abc123"
    }
  ]
}
```

---

### 3.3. Get Project by ID

**GET** `/projects/:id`
**Auth:** Required

**Response (200 OK):**

```json
{
  "message": "Lấy thông tin thành công",
  "projectId": "proj1234",
  "data": {
    "ProjectID": "proj1234",
    "ProjectName": "Website Redesign",
    "ProjectDescription": "...",
    "StartDate": "2025-11-01",
    "EndDate": "2025-12-31",
    "Status": "Planning",
    "OwnerUserID": "abc123"
  }
}
```

**Errors:**

- 404: Không tìm thấy project

---

### 3.4. Update Project

**PUT** `/projects/:id`
**Auth:** Required

**Request Body:**

```json
{
  "ProjectName": "Website Redesign v2",
  "Status": "Active",
  "EndDate": "2026-01-31"
}
```

**Response (200 OK):**

```json
{
  "message": "Cập nhật thành công",
  "projectId": "proj1234",
  "data": {
    "ProjectID": "proj1234",
    "ProjectName": "Website Redesign v2",
    "Status": "Active",
    "EndDate": "2026-01-31"
  }
}
```

---

### 3.5. Delete Project

**DELETE** `/projects/:id`
**Auth:** Required

**Response (200 OK):**

```json
{
  "message": "Xóa thành công",
  "projectId": "proj1234",
  "deleted": true,
  "data": {
    "ProjectID": "proj1234"
  }
}
```

---

## 4. PROJECT MEMBER APIs

### 4.1. Add Member to Project

**POST** `/projects/:id/members`
**Auth:** Required (Owner only)

**Request Body:**

```json
{
  "userId": "user456",
  "role": "member"
}
```

**Response (201 Created):**

```json
{
  "message": "Member added successfully",
  "member": {
    "MemberID": "mem12345",
    "ProjectID": "proj1234",
    "UserID": "user456",
    "UserName": "jane_doe",
    "Role": "member",
    "JoinedAt": "2025-11-13T..."
  }
}
```

**Errors:**

- 403: Chỉ owner mới có thể thêm thành viên
- 400: User đã là thành viên / Owner không thể được thêm làm member
- 404: User không tồn tại

---

### 4.2. Remove Member from Project

**DELETE** `/projects/:id/members/:userId`
**Auth:** Required (Owner only)

**Response (200 OK):**

```json
{
  "message": "Member removed successfully",
  "data": {
    "ProjectID": "proj1234",
    "UserID": "user456"
  }
}
```

---

### 4.3. Get Project Members

**GET** `/projects/:id/members`
**Auth:** Required (Owner or Member)

**Response (200 OK):**

```json
{
  "message": "Members retrieved successfully",
  "members": [
    {
      "MemberID": "mem12345",
      "ProjectID": "proj1234",
      "UserID": "user456",
      "Role": "member",
      "JoinedAt": "2025-11-13T...",
      "UserName": "jane_doe",
      "Email": "jane@example.com"
    }
  ],
  "total": 1
}
```

---

### 4.4. Get Shared Projects

**GET** `/projects/shared/list`
**Auth:** Required

**Response (200 OK):**

```json
{
  "message": "Shared projects retrieved successfully",
  "projects": [
    {
      "MemberID": "mem12345",
      "ProjectID": "proj1234",
      "UserID": "user456",
      "Role": "member",
      "JoinedAt": "2025-11-13T...",
      "ProjectName": "Website Redesign",
      "ProjectDescription": "...",
      "Status": "Planning",
      "OwnerUserID": "abc123"
    }
  ],
  "total": 1
}
```

---

### 4.5. Get Available Users for Project

**GET** `/projects/:id/available-users`
**Auth:** Required (Owner only)

**Response (200 OK):**

```json
{
  "message": "Available users retrieved successfully",
  "count": 5,
  "data": [
    {
      "userId": "user789",
      "userName": "alice_smith",
      "email": "alice@example.com"
    }
  ]
}
```

---

## 5. TASK APIs

### 5.1. Create Task

**POST** `/tasks`
**Auth:** Required

**Request Body:**

```json
{
  "ProjectID": "proj1234",
  "TaskName": "Design Homepage",
  "TaskDescription": "Create mockup for homepage",
  "DueDate": "2025-11-20",
  "Priority": "High",
  "Status": "Backlog",
  "AssignedToUserID": "user456"
}
```

**Valid Status Values:**

- Backlog (default)
- To Do
- In Progress
- In Review
- Testing
- Blocked
- Completed
- Cancelled

**Valid Priority Values:**

- Low
- Medium (default)
- High
- Urgent

**Response (201 Created):**

```json
{
  "message": "Tạo task thành công",
  "taskId": "task5678",
  "data": {
    "TaskID": "task5678",
    "ProjectID": "proj1234",
    "TaskName": "Design Homepage",
    "TaskDescription": "Create mockup for homepage",
    "DueDate": "2025-11-20",
    "Priority": "High",
    "Status": "Backlog",
    "AssignedToUserID": "user456",
    "AssignedUserDetails": {
      "UserID": "user456",
      "UserName": "jane_doe",
      "Email": "jane@example.com"
    },
    "createdAt": "2025-11-13T...",
    "updatedAt": "2025-11-13T..."
  }
}
```

---

### 5.2. Get All Tasks

**GET** `/tasks?ProjectID={projectId}&AssignedToUserID={userId}&Status={status}&Priority={priority}`
**Auth:** Required

**Query Parameters:**

- `ProjectID` (optional): Filter by project
- `AssignedToUserID` (optional): Filter by assigned user
- `Status` (optional): Filter by status
- `Priority` (optional): Filter by priority

**Response (200 OK):**

```json
{
  "message": "Lấy danh sách thành công",
  "count": 3,
  "taskIds": ["task5678", "task9012"],
  "data": [
    {
      "TaskID": "task5678",
      "ProjectID": "proj1234",
      "TaskName": "Design Homepage",
      "TaskDescription": "...",
      "DueDate": "2025-11-20",
      "Priority": "High",
      "Status": "Backlog",
      "AssignedToUserID": "user456",
      "AssignedUserDetails": {
        "UserID": "user456",
        "UserName": "jane_doe",
        "Email": "jane@example.com"
      },
      "AssignedUsers": [
        {
          "AssignmentID": "assign001",
          "UserID": "user456",
          "UserName": "jane_doe",
          "Email": "jane@example.com",
          "AssignedAt": "2025-11-13T10:30:00.000Z"
        },
        {
          "AssignmentID": "assign002",
          "UserID": "user789",
          "UserName": "alice_smith",
          "Email": "alice@example.com",
          "AssignedAt": "2025-11-13T10:35:00.000Z"
        }
      ],
      "AssignedUsersCount": 2
    }
  ]
}
```

---

### 5.3. Get Task by ID

**GET** `/tasks/:id`
**Auth:** Required

**Response (200 OK):**

```json
{
  "message": "Lấy thông tin thành công",
  "taskId": "task5678",
  "data": {
    "TaskID": "task5678",
    "ProjectID": "proj1234",
    "TaskName": "Design Homepage",
    "TaskDescription": "...",
    "DueDate": "2025-11-20",
    "Priority": "High",
    "Status": "Backlog",
    "AssignedToUserID": "user456",
    "AssignedUserDetails": {
      "UserID": "user456",
      "UserName": "jane_doe",
      "Email": "jane@example.com"
    },
    "AssignedUsers": [
      {
        "AssignmentID": "assign001",
        "UserID": "user456",
        "UserName": "jane_doe",
        "Email": "jane@example.com",
        "AssignedAt": "2025-11-13T10:30:00.000Z"
      }
    ],
    "AssignedUsersCount": 1
  }
}
```

---

### 5.4. Update Task

**PUT** `/tasks/:id`
**Auth:** Required

**Request Body:**

```json
{
  "TaskName": "Design Homepage v2",
  "Status": "In Progress",
  "Priority": "Urgent"
}
```

**Response (200 OK):**

```json
{
  "message": "Cập nhật thành công",
  "taskId": "task5678",
  "data": {
    "TaskID": "task5678",
    "TaskName": "Design Homepage v2",
    "Status": "In Progress",
    "Priority": "Urgent"
  }
}
```

---

### 5.5. Delete Task

**DELETE** `/tasks/:id`
**Auth:** Required

**Response (200 OK):**

```json
{
  "message": "Xóa thành công",
  "taskId": "task5678",
  "deleted": true,
  "data": {
    "TaskID": "task5678"
  }
}
```

---

### 5.6. Assign Task to User

**PUT** `/tasks/:id/assign`
**Auth:** Required (Owner or Member only)

**Request Body:**

```json
{
  "userId": "user456"
}
```

**Response (200 OK):**

```json
{
  "message": "Task assigned successfully",
  "data": {
    "TaskID": "task5678",
    "TaskName": "Design Homepage",
    "AssignedToUserID": "user456",
    "AssignedToUser": {
      "UserID": "user456",
      "Email": "jane@example.com",
      "FullName": "Jane Doe"
    }
  }
}
```

**Notifications Created:**

- 📋 New Task Assigned (sent to assigned user)

**Errors:**

- 403: Bạn không có quyền assign task
- 400: Chỉ assign cho owner/member của project

---

### 5.7. Unassign Task

**PUT** `/tasks/:id/unassign`
**Auth:** Required (Owner or Member only)

**Response (200 OK):**

```json
{
  "message": "Task unassigned successfully",
  "data": {
    "TaskID": "task5678",
    "TaskName": "Design Homepage",
    "AssignedToUserID": null
  }
}
```

**Notifications Created:**

- 🔄 Task Unassigned (sent to previously assigned user)

---

### 5.8. Get My Assigned Tasks

**GET** `/tasks/my-tasks`
**Auth:** Required

**Response (200 OK):**

```json
{
  "message": "Retrieved assigned tasks successfully",
  "count": 3,
  "data": [
    {
      "TaskID": "task5678",
      "TaskName": "Design Homepage",
      "TaskDescription": "...",
      "DueDate": "2025-11-20",
      "Priority": "High",
      "Status": "In Progress",
      "AssignedToUserID": "user456",
      "ProjectDetails": {
        "ProjectID": "proj1234",
        "ProjectName": "Website Redesign",
        "Status": "Active"
      }
    }
  ]
}
```

---

### 5.9. Assign Multiple Users to Task

**POST** `/tasks/:id/assign-users`
**Auth:** Required (Owner or Member only)

**Description:** Assign multiple users to a single task. Replaces old single-user assignment system with new TaskAssignment model.

**Request Body:**

```json
{
  "userIds": ["user456", "user789", "user101"]
}
```

**Response (200 OK):**

```json
{
  "message": "Users assigned successfully",
  "taskId": "task5678",
  "assignmentsCreated": 3,
  "data": {
    "TaskID": "task5678",
    "TaskName": "Design Homepage",
    "AssignedUsers": [
      {
        "AssignmentID": "assign001",
        "UserID": "user456",
        "UserName": "jane_doe",
        "Email": "jane@example.com",
        "AssignedAt": "2025-11-13T10:30:00.000Z"
      },
      {
        "AssignmentID": "assign002",
        "UserID": "user789",
        "UserName": "alice_smith",
        "Email": "alice@example.com",
        "AssignedAt": "2025-11-13T10:30:00.000Z"
      },
      {
        "AssignmentID": "assign003",
        "UserID": "user101",
        "UserName": "bob_jones",
        "Email": "bob@example.com",
        "AssignedAt": "2025-11-13T10:30:00.000Z"
      }
    ],
    "AssignedUsersCount": 3
  }
}
```

**Notifications Created:**

- 📋 New Task Assigned (sent to each newly assigned user)

**Errors:**

- 403: Bạn không có quyền assign task
- 400: userIds is required and must be a non-empty array
- 400: Chỉ assign cho owner/member của project

---

### 5.10. Get All Assigned Users for Task

**GET** `/tasks/:id/assigned-users`
**Auth:** Required

**Description:** Get list of all users currently assigned to a task.

**Response (200 OK):**

```json
{
  "message": "Retrieved assigned users successfully",
  "taskId": "task5678",
  "count": 2,
  "data": [
    {
      "AssignmentID": "assign001",
      "TaskID": "task5678",
      "UserID": "user456",
      "UserName": "jane_doe",
      "Email": "jane@example.com",
      "FullName": "Jane Doe",
      "AssignedAt": "2025-11-13T10:30:00.000Z",
      "AssignedBy": "abc123"
    },
    {
      "AssignmentID": "assign002",
      "TaskID": "task5678",
      "UserID": "user789",
      "UserName": "alice_smith",
      "Email": "alice@example.com",
      "FullName": "Alice Smith",
      "AssignedAt": "2025-11-13T10:35:00.000Z",
      "AssignedBy": "abc123"
    }
  ]
}
```

**Errors:**

- 404: Task không tồn tại

---

### 5.11. Unassign Specific User from Task

**DELETE** `/tasks/:id/unassign-user/:userId`
**Auth:** Required (Owner or Member only)

**Description:** Remove a specific user from task assignment while keeping other assigned users.

**Response (200 OK):**

```json
{
  "message": "User unassigned successfully",
  "data": {
    "TaskID": "task5678",
    "UserID": "user789",
    "RemainingAssignedUsers": 1
  }
}
```

**Notifications Created:**

- 🔄 Task Unassigned (sent to unassigned user)

**Errors:**

- 403: Bạn không có quyền unassign task
- 404: Assignment not found / User chưa được assign task này

---

### 5.12. Get Tasks Assigned to Current User (Multiple Assignment Version)

**GET** `/tasks/my-assigned-tasks`
**Auth:** Required

**Description:** Get all tasks where the current user is one of the assigned users (uses TaskAssignment model).

**Response (200 OK):**

```json
{
  "message": "Retrieved assigned tasks successfully",
  "count": 2,
  "data": [
    {
      "TaskID": "task5678",
      "ProjectID": "proj1234",
      "TaskName": "Design Homepage",
      "TaskDescription": "Create responsive design...",
      "DueDate": "2025-11-20",
      "Priority": "High",
      "Status": "In Progress",
      "CreatedBy": "abc123",
      "CreatedAt": "2025-11-13T08:00:00.000Z",
      "UpdatedAt": "2025-11-13T10:30:00.000Z",
      "AssignedToUserID": "user456",
      "AssignedUserDetails": {
        "UserID": "user456",
        "UserName": "jane_doe",
        "Email": "jane@example.com"
      },
      "AssignedUsers": [
        {
          "AssignmentID": "assign001",
          "UserID": "user456",
          "UserName": "jane_doe",
          "Email": "jane@example.com",
          "AssignedAt": "2025-11-13T10:30:00.000Z"
        },
        {
          "AssignmentID": "assign002",
          "UserID": "user789",
          "UserName": "alice_smith",
          "Email": "alice@example.com",
          "AssignedAt": "2025-11-13T10:35:00.000Z"
        }
      ],
      "AssignedUsersCount": 2,
      "ProjectDetails": {
        "ProjectID": "proj1234",
        "ProjectName": "Website Redesign",
        "Status": "Active"
      },
      "MyAssignmentDetails": {
        "AssignmentID": "assign001",
        "AssignedAt": "2025-11-13T10:30:00.000Z",
        "AssignedBy": "abc123"
      }
    }
  ]
}
```

**Notes:**

- Returns tasks where current user appears in TaskAssignment collection
- Includes full task details, all assigned users, and project context
- `MyAssignmentDetails` shows when and by whom current user was assigned

---

## 6. COMMENT APIs

### 6.1. Comment on Project

**POST** `/projects/:id/comments`
**Auth:** Required (Owner or Member only)

**Request Body:**

```json
{
  "content": "Great progress on this project!"
}
```

**Response (201 Created):**

```json
{
  "message": "Comment added successfully",
  "data": {
    "CommentID": "comm1234",
    "Content": "Great progress on this project!",
    "CreatedAt": "2025-11-13T...",
    "UpdatedAt": "2025-11-13T...",
    "CreatedByUserID": "abc123",
    "ProjectID": "proj1234",
    "UserDetails": {
      "UserID": "abc123",
      "UserName": "john_doe",
      "Email": "john@example.com",
      "FullName": "John Doe"
    }
  }
}
```

**Notifications Created:**

- 💬 New Comment on Project (sent to all project members)

---

### 6.2. Comment on Task

**POST** `/tasks/:id/comments`
**Auth:** Required (Owner or Member only)

**Request Body:**

```json
{
  "content": "Working on this task now!"
}
```

**Response (201 Created):**

```json
{
  "message": "Comment added successfully",
  "data": {
    "CommentID": "comm5678",
    "Content": "Working on this task now!",
    "CreatedAt": "2025-11-13T...",
    "UpdatedAt": "2025-11-13T...",
    "CreatedByUserID": "user456",
    "TaskID": "task5678",
    "UserDetails": {
      "UserID": "user456",
      "UserName": "jane_doe",
      "Email": "jane@example.com",
      "FullName": "Jane Doe"
    }
  }
}
```

---

### 6.3. Get Project Comments

**GET** `/projects/:id/comments`
**Auth:** Required (Owner or Member only)

**Response (200 OK):**

```json
{
  "message": "Comments retrieved successfully",
  "count": 2,
  "data": [
    {
      "CommentID": "comm1234",
      "Content": "Great progress on this project!",
      "CreatedAt": "2025-11-13T...",
      "UpdatedAt": "2025-11-13T...",
      "CreatedByUserID": "abc123",
      "ProjectID": "proj1234",
      "UserDetails": {
        "UserID": "abc123",
        "UserName": "john_doe",
        "Email": "john@example.com",
        "FullName": "John Doe"
      }
    }
  ]
}
```

---

### 6.4. Get Task Comments

**GET** `/tasks/:id/comments`
**Auth:** Required (Owner or Member only)

**Response (200 OK):**

```json
{
  "message": "Comments retrieved successfully",
  "count": 1,
  "data": [
    {
      "CommentID": "comm5678",
      "Content": "Working on this task now!",
      "CreatedAt": "2025-11-13T...",
      "UpdatedAt": "2025-11-13T...",
      "CreatedByUserID": "user456",
      "TaskID": "task5678",
      "UserDetails": {
        "UserID": "user456",
        "UserName": "jane_doe",
        "Email": "jane@example.com",
        "FullName": "Jane Doe"
      }
    }
  ]
}
```

---

### 6.5. Edit Comment

**PUT** `/comments/:id`
**Auth:** Required (Owner of comment only)

**Request Body:**

```json
{
  "content": "Updated: Great progress on this project!"
}
```

**Response (200 OK):**

```json
{
  "message": "Comment updated successfully",
  "data": {
    "CommentID": "comm1234",
    "Content": "Updated: Great progress on this project!",
    "CreatedAt": "2025-11-13T...",
    "UpdatedAt": "2025-11-13T...",
    "CreatedByUserID": "abc123",
    "ProjectID": "proj1234",
    "UserDetails": {
      "UserID": "abc123",
      "UserName": "john_doe",
      "Email": "john@example.com",
      "FullName": "John Doe"
    }
  }
}
```

**Errors:**

- 403: Bạn chỉ có thể edit comment của mình

---

### 6.6. Delete Comment

**DELETE** `/comments/:id`
**Auth:** Required (Owner of comment only)

**Response (200 OK):**

```json
{
  "message": "Comment deleted successfully",
  "data": {
    "CommentID": "comm1234"
  }
}
```

---

## 7. NOTIFICATION APIs

### 7.1. Get My Notifications

**GET** `/notifications?unreadOnly={true|false}`
**Auth:** Required

**Query Parameters:**

- `unreadOnly` (optional): "true" to get only unread notifications

**Response (200 OK):**

```json
{
  "message": "Notifications retrieved successfully",
  "count": 5,
  "data": [
    {
      "NotificationID": "notif123",
      "Type": "TASK_ASSIGNED",
      "Title": "📋 New Task Assigned",
      "Message": "John Doe assigned you the task \"Design Homepage\"",
      "IsRead": false,
      "CreatedAt": "2025-11-13T...",
      "RecipientUserID": "user456",
      "RelatedEntityID": "task5678",
      "RelatedEntityType": "task",
      "ActionByUserID": "abc123",
      "ActionByUserName": "John Doe"
    }
  ]
}
```

**Notification Types:**

- `TASK_ASSIGNED` - Task được assign cho bạn
- `TASK_UNASSIGNED` - Task bị unassign
- `PROJECT_SHARED` - Bạn được thêm vào project
- `COMMENT_ADDED` - Có comment mới
- `TASK_STATUS_CHANGED` - Status của task thay đổi

---

### 7.2. Count Unread Notifications

**GET** `/notifications/unread/count`
**Auth:** Required

**Response (200 OK):**

```json
{
  "message": "Unread count retrieved successfully",
  "unreadCount": 5
}
```

---

### 7.3. Mark Notification as Read

**PUT** `/notifications/:id/read`
**Auth:** Required (Owner of notification only)

**Response (200 OK):**

```json
{
  "message": "Notification marked as read",
  "data": {
    "NotificationID": "notif123",
    "IsRead": true,
    "ReadAt": "2025-11-13T..."
  }
}
```

**Errors:**

- 403: Bạn chỉ có thể đánh dấu notification của mình
- 400: Notification đã được đánh dấu read

---

### 7.4. Mark All Notifications as Read

**PUT** `/notifications/read-all`
**Auth:** Required

**Response (200 OK):**

```json
{
  "message": "All notifications marked as read",
  "markedCount": 5
}
```

---

### 7.5. Delete Notification

**DELETE** `/notifications/:id`
**Auth:** Required (Owner of notification only)

**Response (200 OK):**

```json
{
  "message": "Notification deleted successfully",
  "data": {
    "NotificationID": "notif123"
  }
}
```

---

### 7.6. Delete Old Notifications

**DELETE** `/notifications/cleanup/old?daysOld={days}`
**Auth:** Required

**Query Parameters:**

- `daysOld` (optional): Number of days (default: 30)

**Response (200 OK):**

```json
{
  "message": "Deleted notifications older than 30 days",
  "deletedCount": 10
}
```

---

## 8. DATA MODELS

### User Model

```csharp
public class User
{
    public string _id { get; set; }
    public string userName { get; set; }
    public string email { get; set; }
    public DateTime createdAt { get; set; }
}
```

### Project Model

```csharp
public class Project
{
    public string ProjectID { get; set; }
    public string ProjectName { get; set; }
    public string ProjectDescription { get; set; }
    public string StartDate { get; set; }
    public string EndDate { get; set; }
    public string Status { get; set; } // Planning, Active, On Hold, Completed, Cancelled
    public string OwnerUserID { get; set; }
}
```

### Task Model

```csharp
public class Task
{
    public string TaskID { get; set; }
    public string ProjectID { get; set; }
    public string TaskName { get; set; }
    public string TaskDescription { get; set; }
    public string DueDate { get; set; }
    public string Priority { get; set; } // Low, Medium, High, Urgent
    public string Status { get; set; } // Backlog, To Do, In Progress, In Review, Testing, Blocked, Completed, Cancelled
    public string AssignedToUserID { get; set; }

    // Enhanced in v2.0.0 - Multiple assignment support
    public List<AssignedUser> AssignedUsers { get; set; }
    public int AssignedUsersCount { get; set; }
}

public class AssignedUser
{
    public string AssignmentID { get; set; }
    public string UserID { get; set; }
    public string UserName { get; set; }
    public string Email { get; set; }
    public DateTime AssignedAt { get; set; }
}
```

### ProjectMember Model

```csharp
public class ProjectMember
{
    public string MemberID { get; set; }
    public string ProjectID { get; set; }
    public string UserID { get; set; }
    public string Role { get; set; } // member
    public DateTime JoinedAt { get; set; }
}
```

### TaskAssignment Model (NEW in v2.0.0)

```csharp
public class TaskAssignment
{
    public string AssignmentID { get; set; }
    public string TaskID { get; set; }
    public string UserID { get; set; }
    public DateTime AssignedAt { get; set; }
    public string AssignedBy { get; set; }
}
```

**Description:** Enables multiple users to be assigned to a single task. Replaces the old single-assignment system where only `AssignedToUserID` was used.

**Collection Name:** `TaskAssignments`

**Usage:**

- Create assignments using POST `/tasks/:id/assign-users`
- Query assignments using GET `/tasks/:id/assigned-users`
- Delete specific assignment using DELETE `/tasks/:id/unassign-user/:userId`
- All task GET endpoints now include `AssignedUsers` array populated from this collection

### Comment Model

```csharp
public class Comment
{
    public string CommentID { get; set; }
    public string Content { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string CreatedByUserID { get; set; }
    public string ProjectID { get; set; } // null if comment on task
    public string TaskID { get; set; } // null if comment on project

    // Enhanced in v2.0.0
    public UserDetails UserDetails { get; set; }
}

public class UserDetails
{
    public string UserID { get; set; }
    public string UserName { get; set; } // NEW in v2.0.0
    public string Email { get; set; }
    public string FullName { get; set; }
}
```

### Notification Model

```csharp
public class Notification
{
    public string NotificationID { get; set; }
    public string Type { get; set; } // TASK_ASSIGNED, PROJECT_SHARED, COMMENT_ADDED, etc.
    public string Title { get; set; }
    public string Message { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public string RecipientUserID { get; set; }
    public string RelatedEntityID { get; set; }
    public string RelatedEntityType { get; set; } // task, project, comment
    public string ActionByUserID { get; set; }
    public string ActionByUserName { get; set; }
}
```

---

## 9. STATUS & PRIORITY VALUES

### Project Statuses

```csharp
public enum ProjectStatus
{
    Planning,    // Default - Đang lên kế hoạch
    Active,      // Đang thực hiện
    OnHold,      // Tạm dừng
    Completed,   // Hoàn thành
    Cancelled    // Hủy bỏ
}
```

### Task Statuses

```csharp
public enum TaskStatus
{
    Backlog,     // Default - Danh sách chờ
    ToDo,        // Cần làm
    InProgress,  // Đang làm
    InReview,    // Đang review
    Testing,     // Đang test
    Blocked,     // Bị chặn
    Completed,   // Hoàn thành
    Cancelled    // Hủy bỏ
}
```

### Task Priorities

```csharp
public enum TaskPriority
{
    Low,         // Thấp
    Medium,      // Default - Trung bình
    High,        // Cao
    Urgent       // Khẩn cấp
}
```

---

## 10. ERROR CODES

### Common Errors

| Code | Message      | Description                            |
| ---- | ------------ | -------------------------------------- |
| 400  | Bad Request  | Thiếu thông tin / Dữ liệu không hợp lệ |
| 401  | Unauthorized | Token không hợp lệ / Chưa đăng nhập    |
| 403  | Forbidden    | Không có quyền thực hiện               |
| 404  | Not Found    | Không tìm thấy resource                |
| 409  | Conflict     | Dữ liệu đã tồn tại                     |
| 500  | Server Error | Lỗi server                             |

### Error Response Format

```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```

---

## 📱 C# HttpClient Example

### Setup Authentication

```csharp
private static HttpClient client = new HttpClient();
private static string baseUrl = "http://localhost:3300/api";
private static string token = "";

// Login and get token
public async Task<bool> LoginAsync(string userName, string password)
{
    var loginData = new { userName, password };
    var content = new StringContent(
        JsonConvert.SerializeObject(loginData),
        Encoding.UTF8,
        "application/json"
    );

    var response = await client.PostAsync($"{baseUrl}/login", content);
    if (response.IsSuccessStatusCode)
    {
        var result = JsonConvert.DeserializeObject<LoginResponse>(
            await response.Content.ReadAsStringAsync()
        );
        token = result.token;
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);
        return true;
    }
    return false;
}
```

### GET Request Example

```csharp
public async Task<List<Project>> GetProjectsAsync()
{
    var response = await client.GetAsync($"{baseUrl}/projects");
    if (response.IsSuccessStatusCode)
    {
        var json = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<ProjectsResponse>(json);
        return result.data;
    }
    return null;
}
```

### POST Request Example

```csharp
public async Task<Project> CreateProjectAsync(Project project)
{
    var content = new StringContent(
        JsonConvert.SerializeObject(project),
        Encoding.UTF8,
        "application/json"
    );

    var response = await client.PostAsync($"{baseUrl}/projects", content);
    if (response.IsSuccessStatusCode)
    {
        var json = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<CreateProjectResponse>(json);
        return result.data;
    }
    return null;
}
```

### PUT Request Example

```csharp
public async Task<bool> MarkNotificationReadAsync(string notificationId)
{
    var response = await client.PutAsync(
        $"{baseUrl}/notifications/{notificationId}/read",
        null
    );
    return response.IsSuccessStatusCode;
}
```

---

## 🎯 COMMON WORKFLOWS

### Workflow 1: Create Project and Add Members

```csharp
// 1. Create project
var project = await CreateProjectAsync(new Project {
    ProjectName = "New Project",
    ProjectDescription = "Description",
    StartDate = "2025-11-01",
    Status = "Planning",
    OwnerUserID = currentUserId
});

// 2. Get available users
var users = await GetAvailableUsersAsync(project.ProjectID);

// 3. Add members
foreach (var user in selectedUsers)
{
    await AddMemberAsync(project.ProjectID, user.userId);
}
```

### Workflow 2: Create Task and Assign Multiple Users

```csharp
// 1. Create task
var task = await CreateTaskAsync(new Task {
    ProjectID = projectId,
    TaskName = "New Task",
    TaskDescription = "Description",
    DueDate = "2025-11-20",
    Priority = "High",
    Status = "Backlog"
});

// 2. Assign multiple users (NEW in v2.0.0)
await AssignMultipleUsersAsync(task.TaskID, new string[] { userId1, userId2, userId3 });

// OR for single user (backward compatible)
await AssignTaskAsync(task.TaskID, userId);
```

### Workflow 3: Display Assigned Users in Task List

```csharp
// Get tasks with assigned users
var tasks = await GetTasksAsync(projectId);

foreach (var task in tasks)
{
    Console.WriteLine($"Task: {task.TaskName}");
    Console.WriteLine($"Assigned to {task.AssignedUsersCount} users:");

    foreach (var user in task.AssignedUsers)
    {
        Console.WriteLine($"  - {user.UserName} ({user.Email})");
    }
}
```

### Workflow 4: Get and Display Comments with Usernames

```csharp
// Get task comments (now includes UserName)
var comments = await GetTaskCommentsAsync(taskId);

foreach (var comment in comments)
{
    // Display comment with username
    lblUsername.Text = comment.UserDetails.UserName; // NEW in v2.0.0
    lblEmail.Text = comment.UserDetails.Email;
    lblFullName.Text = comment.UserDetails.FullName;
    lblContent.Text = comment.Content;
    lblTime.Text = comment.CreatedAt.ToString();
}
```

### Workflow 5: Get Notifications

```csharp
// 1. Get unread count (for badge)
var count = await GetUnreadCountAsync();
badgeLabel.Text = count.ToString();

// 2. Get all notifications
var notifications = await GetNotificationsAsync();
notificationListBox.DataSource = notifications;

// 3. Mark as read when clicked
await MarkAsReadAsync(notification.NotificationID);
```

---

## � APPENDIX: FIELD NAMING REFERENCE

### Backend Field Naming Convention

The backend uses **camelCase** for most fields but **PascalCase** for entity IDs and some model properties. Both formats are supported for backward compatibility.

### User Model Fields

| Backend Field | C# Property | Alternative | Type     |
| ------------- | ----------- | ----------- | -------- |
| `_id`         | `_id`       | `UserID`    | string   |
| `userName`    | `userName`  | `UserName`  | string   |
| `email`       | `email`     | `Email`     | string   |
| `fullName`    | `fullName`  | `FullName`  | string   |
| `createdAt`   | `createdAt` | `CreatedAt` | DateTime |

### Project Model Fields

| Backend Field        | C# Property          | Type   |
| -------------------- | -------------------- | ------ |
| `ProjectID`          | `ProjectID`          | string |
| `ProjectName`        | `ProjectName`        | string |
| `ProjectDescription` | `ProjectDescription` | string |
| `StartDate`          | `StartDate`          | string |
| `EndDate`            | `EndDate`            | string |
| `Status`             | `Status`             | string |
| `OwnerUserID`        | `OwnerUserID`        | string |

### Task Model Fields

| Backend Field        | C# Property          | Type               |
| -------------------- | -------------------- | ------------------ |
| `TaskID`             | `TaskID`             | string             |
| `ProjectID`          | `ProjectID`          | string             |
| `TaskName`           | `TaskName`           | string             |
| `TaskDescription`    | `TaskDescription`    | string             |
| `DueDate`            | `DueDate`            | string             |
| `Priority`           | `Priority`           | string             |
| `Status`             | `Status`             | string             |
| `AssignedToUserID`   | `AssignedToUserID`   | string             |
| `AssignedUsers`      | `AssignedUsers`      | List<AssignedUser> |
| `AssignedUsersCount` | `AssignedUsersCount` | int                |

### Comment Model Fields

| Backend Field     | C# Property       | Type     |
| ----------------- | ----------------- | -------- |
| `CommentID`       | `CommentID`       | string   |
| `Content`         | `Content`         | string   |
| `CreatedAt`       | `CreatedAt`       | DateTime |
| `UpdatedAt`       | `UpdatedAt`       | DateTime |
| `CreatedByUserID` | `CreatedByUserID` | string   |
| `ProjectID`       | `ProjectID`       | string?  |
| `TaskID`          | `TaskID`          | string?  |

### UserDetails Object (in Comments)

| Backend Field | C# Property | Type   |
| ------------- | ----------- | ------ |
| `UserID`      | `UserID`    | string |
| `UserName`    | `UserName`  | string |
| `Email`       | `Email`     | string |
| `FullName`    | `FullName`  | string |

### TaskAssignment Model Fields (NEW in v2.0.0)

| Backend Field  | C# Property    | Type     |
| -------------- | -------------- | -------- |
| `AssignmentID` | `AssignmentID` | string   |
| `TaskID`       | `TaskID`       | string   |
| `UserID`       | `UserID`       | string   |
| `AssignedAt`   | `AssignedAt`   | DateTime |
| `AssignedBy`   | `AssignedBy`   | string   |

### Important Notes

1. **User ID Handling:** Backend may return `_id` or `UserID` - handle both:

   ```csharp
   string userId = user._id ?? user.UserID;
   ```

2. **Username Handling:** Backend may return `userName` or `UserName` - handle both:

   ```csharp
   string username = user.userName ?? user.UserName;
   ```

3. **Dual Field Support:** Some responses include both formats for backward compatibility

4. **Request Bodies:** Use either camelCase or PascalCase - backend accepts both

### C# Model Examples with Dual Support

```csharp
public class User
{
    [JsonProperty("_id")]
    public string UserId { get; set; }

    [JsonProperty("userName")]
    public string UserName { get; set; }

    [JsonProperty("email")]
    public string Email { get; set; }

    [JsonProperty("fullName")]
    public string FullName { get; set; }
}
```

---

## �📞 SUPPORT

**Backend URL:** http://localhost:3300
**Total Endpoints:** 38
**Authentication:** JWT Bearer Token
**Token Expiration:** 7 days

**Contact:** NAUTH05@github.com

---

**Last Updated:** November 13, 2025
**Version:** 2.0.0
