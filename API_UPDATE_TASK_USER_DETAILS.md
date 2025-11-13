# 🔄 API UPDATE - TASK WITH USER DETAILS

**Updated:** November 13, 2025

---

## ✅ WHAT'S NEW

Backend đã được cập nhật để **tự động trả về thông tin user được assign task** trong tất cả các Task API endpoints.

---

## 📋 UPDATED ENDPOINTS

### 1. Create Task - POST `/api/tasks`

**Response mới:**

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

### 2. Get All Tasks - GET `/api/tasks`

**Response mới:**

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
      }
    }
  ]
}
```

---

### 3. Get Task by ID - GET `/api/tasks/:id`

**Response mới:**

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
    }
  }
}
```

---

### 4. Update Task - PUT `/api/tasks/:id`

**Response mới:**

```json
{
  "message": "Cập nhật thành công",
  "taskId": "task5678",
  "data": {
    "TaskID": "task5678",
    "ProjectID": "proj1234",
    "TaskName": "Design Homepage v2",
    "TaskDescription": "...",
    "DueDate": "2025-11-20",
    "Priority": "Urgent",
    "Status": "In Progress",
    "AssignedToUserID": "user456",
    "AssignedUserDetails": {
      "UserID": "user456",
      "UserName": "jane_doe",
      "Email": "jane@example.com"
    }
  }
}
```

---

## 🔍 ASSIGNED USER DETAILS STRUCTURE

```typescript
AssignedUserDetails: {
  UserID: string,      // ID của user được assign
  UserName: string,    // Username để hiển thị
  Email: string        // Email của user
} | null               // null nếu task chưa được assign
```

---

## 💡 KEY FEATURES

### 1. Automatic Population

- Backend **tự động lấy thông tin user** khi task có `AssignedToUserID`
- Không cần gọi thêm API `/users/:id` để lấy thông tin user

### 2. Null Safety

- Nếu task **chưa được assign** → `AssignedUserDetails = null`
- Nếu task **đã assign** → `AssignedUserDetails` chứa đầy đủ thông tin

### 3. Consistent Response

- **Tất cả Task endpoints** đều trả về `AssignedUserDetails`
- Format response **nhất quán** giữa các endpoints

---

## 📱 C# USAGE EXAMPLE

### Updated Task Model

```csharp
public class Task
{
    public string TaskID { get; set; }
    public string ProjectID { get; set; }
    public string TaskName { get; set; }
    public string TaskDescription { get; set; }
    public string DueDate { get; set; }
    public string Priority { get; set; }
    public string Status { get; set; }
    public string AssignedToUserID { get; set; }
    public AssignedUser AssignedUserDetails { get; set; }  // ✨ NEW
}

public class AssignedUser
{
    public string UserID { get; set; }
    public string UserName { get; set; }
    public string Email { get; set; }
}
```

### Display Assigned User

```csharp
// Get task from API
var task = await GetTaskAsync(taskId);

// Display assigned user
if (task.AssignedUserDetails != null)
{
    lblAssignedTo.Text = task.AssignedUserDetails.UserName;
    lblAssignedEmail.Text = task.AssignedUserDetails.Email;
}
else
{
    lblAssignedTo.Text = "Unassigned";
}
```

### Display Task List with Assigned Users

```csharp
// Get all tasks
var tasks = await GetTasksAsync();

// Bind to DataGridView
foreach (var task in tasks)
{
    dataGridView.Rows.Add(
        task.TaskName,
        task.Status,
        task.Priority,
        task.AssignedUserDetails?.UserName ?? "Unassigned",  // ✨ Direct access
        task.DueDate
    );
}
```

---

## ⚠️ BREAKING CHANGES

### Before (Old Response)

```json
{
  "data": {
    "TaskID": "task5678",
    "AssignedToUserID": "user456"
    // ❌ Không có thông tin user
  }
}
```

### After (New Response)

```json
{
  "data": {
    "TaskID": "task5678",
    "AssignedToUserID": "user456",
    "AssignedUserDetails": {
      "UserID": "user456",
      "UserName": "jane_doe",
      "Email": "jane@example.com"
    }
    // ✅ Có đầy đủ thông tin user
  }
}
```

---

## 🎯 BENEFITS

### 1. Giảm số lượng API calls

**Before:**

```csharp
// Cần 2 API calls
var task = await GetTaskAsync(taskId);           // Call 1
var user = await GetUserAsync(task.AssignedToUserID);  // Call 2
lblAssignedTo.Text = user.UserName;
```

**After:**

```csharp
// Chỉ cần 1 API call
var task = await GetTaskAsync(taskId);           // Call 1 only
lblAssignedTo.Text = task.AssignedUserDetails?.UserName;
```

### 2. Performance Improvement

- ⚡ **50% faster** - Giảm một nửa số requests
- 🚀 **Better UX** - Dữ liệu hiển thị nhanh hơn
- 💾 **Less bandwidth** - Ít request hơn

### 3. Simpler Frontend Code

- Không cần quản lý nhiều API calls
- Không cần cache user data
- Code ngắn gọn và dễ maintain

---

## 🔧 MIGRATION GUIDE

### Step 1: Update C# Models

Thêm property `AssignedUserDetails` vào Task model:

```csharp
public AssignedUser AssignedUserDetails { get; set; }
```

### Step 2: Update UI Code

Thay đổi code hiển thị từ:

```csharp
// Old
lblAssignedTo.Text = await GetUserName(task.AssignedToUserID);
```

Thành:

```csharp
// New
lblAssignedTo.Text = task.AssignedUserDetails?.UserName ?? "Unassigned";
```

### Step 3: Remove Redundant User API Calls

Xóa các function không cần thiết:

```csharp
// ❌ DELETE - Không cần nữa
private async Task<string> GetUserName(string userId)
{
    var user = await GetUserAsync(userId);
    return user?.UserName ?? "Unknown";
}
```

---

## 📊 FIELD REFERENCE

| Field Name                   | Type   | Nullable | Description                           |
| ---------------------------- | ------ | -------- | ------------------------------------- |
| AssignedToUserID             | string | ✅ Yes   | ID của user được assign (có thể null) |
| AssignedUserDetails          | object | ✅ Yes   | Chi tiết user được assign             |
| AssignedUserDetails.UserID   | string | ❌ No    | ID của user                           |
| AssignedUserDetails.UserName | string | ❌ No    | Username của user                     |
| AssignedUserDetails.Email    | string | ❌ No    | Email của user                        |

---

## ✅ COMPATIBILITY

- ✅ **Backward compatible** - Vẫn có field `AssignedToUserID`
- ✅ **Null-safe** - `AssignedUserDetails` có thể null
- ✅ **Type-safe** - Format nhất quán giữa các endpoints

---

**Server Status:** ✅ Running on http://localhost:3300
**Last Updated:** November 13, 2025
**Version:** 1.1.0
