# 📝 BACKEND FIELD NAMES REFERENCE

**Tài liệu chuẩn hoá tên trường dữ liệu giữa Frontend (.NET WinForm) và Backend (Node.js)**

---

## 🔐 1. USER / AUTHENTICATION

### Register Request

```json
{
  "userName": "string (required)",
  "email": "string (required)",
  "password": "string (required)"
}
```

### Login Request

```json
{
  "userName": "string (optional - nếu không dùng email)",
  "email": "string (optional - nếu không dùng userName)",
  "password": "string (required)"
}
```

### User Response

```json
{
  "_id": "string",
  "userName": "string",
  "email": "string"
}
```

**Lưu ý:** Backend hỗ trợ login bằng `userName` HOẶC `email` + `password`

---

## 📁 2. PROJECT

### Create/Update Project Request

```json
{
  "ProjectName": "string (required)",
  "ProjectDescription": "string (required)",
  "StartDate": "string (required - format: YYYY-MM-DD)",
  "EndDate": "string (optional - format: YYYY-MM-DD)",
  "Status": "string (optional - default: Planning)",
  "OwnerUserID": "string (required - chỉ khi tạo mới)"
}
```

### Project Response

```json
{
  "ProjectID": "string",
  "ProjectName": "string",
  "ProjectDescription": "string",
  "StartDate": "string",
  "EndDate": "string",
  "Status": "string",
  "OwnerUserID": "string"
}
```

### Valid Project Status Values

```
- "Planning" (default)
- "Active"
- "On Hold"
- "Completed"
- "Cancelled"
```

---

## ✅ 3. TASK

### Create/Update Task Request

```json
{
  "ProjectID": "string (required - chỉ khi tạo mới)",
  "TaskName": "string (required)",
  "TaskDescription": "string (required)",
  "DueDate": "string (required - format: YYYY-MM-DD)",
  "Priority": "string (optional - default: Medium)",
  "Status": "string (optional - default: Backlog)",
  "AssignedToUserID": "string (optional)"
}
```

### Task Response

```json
{
  "TaskID": "string",
  "ProjectID": "string",
  "TaskName": "string",
  "TaskDescription": "string",
  "DueDate": "string",
  "Priority": "string",
  "Status": "string",
  "AssignedToUserID": "string or null"
}
```

### Valid Task Status Values

```
- "Backlog" (default)
- "To Do"
- "In Progress"
- "In Review"
- "Testing"
- "Blocked"
- "Completed"
- "Cancelled"
```

### Valid Task Priority Values

```
- "Low"
- "Medium" (default)
- "High"
- "Urgent"
```

---

## 👥 4. PROJECT MEMBER

### Add Member Request

```json
{
  "userId": "string (required)",
  "role": "string (optional - default: member)"
}
```

**Lưu ý:** Backend hỗ trợ cả `userId` và `UserID` (camelCase và PascalCase)

### Project Member Response

```json
{
  "MemberID": "string",
  "ProjectID": "string",
  "UserID": "string",
  "UserName": "string",
  "Email": "string",
  "Role": "string",
  "JoinedAt": "datetime"
}
```

---

## 💬 5. COMMENT

### Add Comment Request

```json
{
  "content": "string (required)"
}
```

**Lưu ý:** Backend hỗ trợ cả `content` và `Content` (camelCase và PascalCase)

### Comment Response

```json
{
  "CommentID": "string",
  "Content": "string",
  "CreatedAt": "datetime",
  "UpdatedAt": "datetime",
  "CreatedByUserID": "string",
  "ProjectID": "string or null",
  "TaskID": "string or null",
  "UserDetails": {
    "UserID": "string",
    "Email": "string",
    "FullName": "string"
  }
}
```

---

## 🔔 6. NOTIFICATION

### Notification Response

```json
{
  "NotificationID": "string",
  "Type": "string",
  "Title": "string",
  "Message": "string",
  "IsRead": "boolean",
  "CreatedAt": "datetime",
  "RecipientUserID": "string",
  "RelatedEntityID": "string",
  "RelatedEntityType": "string",
  "ActionByUserID": "string",
  "ActionByUserName": "string"
}
```

### Valid Notification Types

```
- "TASK_ASSIGNED"
- "TASK_UNASSIGNED"
- "PROJECT_SHARED"
- "COMMENT_ADDED"
- "TASK_STATUS_CHANGED"
```

---

## 🔍 7. QUERY PARAMETERS

### Search Users

```
GET /api/users/search?q={searchTerm}
hoặc
GET /api/users/search?query={searchTerm}
```

### Filter Projects

```
GET /api/projects?OwnerUserID={userId}&Status={status}
```

### Filter Tasks

```
GET /api/tasks?ProjectID={projectId}&AssignedToUserID={userId}&Status={status}&Priority={priority}
```

### Filter Notifications

```
GET /api/notifications?unreadOnly=true
```

### Delete Old Notifications

```
DELETE /api/notifications/cleanup/old?daysOld={days}
```

---

## 📊 BẢNG TỔNG HỢP FIELD NAMES

| Entity           | Field Name (Request) | Field Name (Response) | Type     | Required | Default  |
| ---------------- | -------------------- | --------------------- | -------- | -------- | -------- |
| **User**         |
|                  | userName             | userName              | string   | ✅       | -        |
|                  | email                | email                 | string   | ✅       | -        |
|                  | password             | (không trả về)        | string   | ✅       | -        |
|                  | -                    | \_id                  | string   | -        | auto     |
| **Project**      |
|                  | ProjectName          | ProjectName           | string   | ✅       | -        |
|                  | ProjectDescription   | ProjectDescription    | string   | ✅       | -        |
|                  | StartDate            | StartDate             | string   | ✅       | -        |
|                  | EndDate              | EndDate               | string   | ❌       | null     |
|                  | Status               | Status                | string   | ❌       | Planning |
|                  | OwnerUserID          | OwnerUserID           | string   | ✅       | -        |
|                  | -                    | ProjectID             | string   | -        | auto     |
| **Task**         |
|                  | TaskName             | TaskName              | string   | ✅       | -        |
|                  | TaskDescription      | TaskDescription       | string   | ✅       | -        |
|                  | DueDate              | DueDate               | string   | ✅       | -        |
|                  | Priority             | Priority              | string   | ❌       | Medium   |
|                  | Status               | Status                | string   | ❌       | Backlog  |
|                  | AssignedToUserID     | AssignedToUserID      | string   | ❌       | null     |
|                  | ProjectID            | ProjectID             | string   | ✅       | -        |
|                  | -                    | TaskID                | string   | -        | auto     |
| **Member**       |
|                  | userId / UserID      | UserID                | string   | ✅       | -        |
|                  | role                 | Role                  | string   | ❌       | member   |
|                  | -                    | MemberID              | string   | -        | auto     |
|                  | -                    | JoinedAt              | datetime | -        | auto     |
| **Comment**      |
|                  | content / Content    | Content               | string   | ✅       | -        |
|                  | -                    | CommentID             | string   | -        | auto     |
|                  | -                    | CreatedAt             | datetime | -        | auto     |
|                  | -                    | UpdatedAt             | datetime | -        | auto     |
|                  | -                    | CreatedByUserID       | string   | -        | auto     |
|                  | -                    | ProjectID             | string   | -        | auto     |
|                  | -                    | TaskID                | string   | -        | auto     |
| **Notification** |
|                  | (không có request)   | NotificationID        | string   | -        | auto     |
|                  |                      | Type                  | string   | -        | auto     |
|                  |                      | Title                 | string   | -        | auto     |
|                  |                      | Message               | string   | -        | auto     |
|                  |                      | IsRead                | boolean  | -        | false    |
|                  |                      | CreatedAt             | datetime | -        | auto     |
|                  |                      | RecipientUserID       | string   | -        | auto     |

---

## 🎯 CHUẨN HOÁ QUAN TRỌNG

### 1. Case Sensitivity (Phân biệt chữ hoa/thường)

- **PascalCase:** `ProjectName`, `TaskID`, `OwnerUserID`
- **camelCase:** `userName`, `email`, `password`
- **Đặc biệt:** `_id` (underscore + lowercase)

### 2. Dual Support (Backend hỗ trợ cả 2 cách viết)

- `userId` ↔ `UserID`
- `content` ↔ `Content`
- `query` ↔ `q`

### 3. Auto-generated Fields (Backend tự tạo, không gửi lên)

- `ProjectID`, `TaskID`, `CommentID`, `NotificationID`, `MemberID`
- `_id` (User ID)
- `CreatedAt`, `UpdatedAt`, `JoinedAt`
- `IsRead` (Notification)

### 4. Nullable Fields (Có thể null)

- `EndDate` (Project)
- `AssignedToUserID` (Task)
- `ProjectID` hoặc `TaskID` (Comment - chỉ 1 trong 2)

### 5. Required Fields (Bắt buộc)

- **Register:** `userName`, `email`, `password`
- **Login:** `password` + (`userName` HOẶC `email`)
- **Project:** `ProjectName`, `ProjectDescription`, `StartDate`, `OwnerUserID`
- **Task:** `ProjectID`, `TaskName`, `TaskDescription`, `DueDate`
- **Member:** `userId`
- **Comment:** `content`

---

## 📝 EXAMPLES FOR FRONTEND

### C# Class Examples

```csharp
// User
public class UserRequest
{
    public string userName { get; set; }
    public string email { get; set; }
    public string password { get; set; }
}

// Project
public class ProjectRequest
{
    public string ProjectName { get; set; }
    public string ProjectDescription { get; set; }
    public string StartDate { get; set; }
    public string EndDate { get; set; }
    public string Status { get; set; }
    public string OwnerUserID { get; set; }
}

// Task
public class TaskRequest
{
    public string ProjectID { get; set; }
    public string TaskName { get; set; }
    public string TaskDescription { get; set; }
    public string DueDate { get; set; }
    public string Priority { get; set; }
    public string Status { get; set; }
    public string AssignedToUserID { get; set; }
}

// Comment
public class CommentRequest
{
    public string content { get; set; }
}

// Add Member
public class AddMemberRequest
{
    public string userId { get; set; }
}

// Assign Task
public class AssignTaskRequest
{
    public string userId { get; set; }
}
```

---

## ⚠️ COMMON MISTAKES TO AVOID

❌ **Sai:**

```json
{
  "projectName": "...", // lowercase 'p'
  "taskid": "...", // lowercase 'id'
  "owneruserid": "..." // không có camelCase
}
```

✅ **Đúng:**

```json
{
  "ProjectName": "...", // PascalCase
  "TaskID": "...", // PascalCase với ID viết hoa
  "OwnerUserID": "..." // PascalCase
}
```

❌ **Sai:**

```json
{
  "UserName": "...", // User thì dùng camelCase
  "Email": "...", // Email thì dùng lowercase
  "Password": "..." // Password thì dùng lowercase
}
```

✅ **Đúng:**

```json
{
  "userName": "...", // camelCase
  "email": "...", // lowercase
  "password": "..." // lowercase
}
```

---

## 🔄 FIELD MAPPING (Frontend ↔ Backend)

Nếu Frontend .NET sử dụng PascalCase cho tất cả:

| .NET Frontend | Node.js Backend | Status                 |
| ------------- | --------------- | ---------------------- |
| UserName      | userName        | ✅ Map required        |
| Email         | email           | ✅ Map required        |
| Password      | password        | ✅ Map required        |
| ProjectName   | ProjectName     | ✅ Same                |
| TaskID        | TaskID          | ✅ Same                |
| UserId        | userId          | ⚠️ Backend hỗ trợ cả 2 |
| Content       | content         | ⚠️ Backend hỗ trợ cả 2 |

---

**Last Updated:** November 13, 2025
**Version:** 1.0.0
**Purpose:** Chuẩn hoá field names giữa Frontend (.NET WinForm) và Backend (Node.js)
