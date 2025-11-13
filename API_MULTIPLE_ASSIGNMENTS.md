# 🚀 API UPDATE - MULTIPLE USER ASSIGNMENT

**Updated:** November 13, 2025
**Feature:** Assign nhiều users vào 1 task

---

## 🎯 OVERVIEW

Backend đã được nâng cấp để hỗ trợ **assign nhiều users vào 1 task**. Tính năng này cho phép:

- ✅ Assign nhiều users vào cùng 1 task
- ✅ Xem danh sách tất cả users được assign
- ✅ Unassign từng user riêng lẻ
- ✅ Backward compatible với single assignment cũ

---

## 📋 NEW ENDPOINTS

### 1. Assign Multiple Users to Task

**POST** `/api/tasks/:id/assign-users`
**Auth:** Required (Owner or Member only)

**Request Body:**

```json
{
  "userIds": ["user123", "user456", "user789"]
}
```

**Response (200 OK):**

```json
{
  "message": "Assignment process completed",
  "successful": [
    {
      "AssignmentID": "assign001",
      "UserID": "user123",
      "UserName": "john_doe",
      "Email": "john@example.com"
    },
    {
      "AssignmentID": "assign002",
      "UserID": "user456",
      "UserName": "jane_doe",
      "Email": "jane@example.com"
    }
  ],
  "successCount": 2,
  "errors": [
    {
      "userId": "user789",
      "error": "User not found"
    }
  ],
  "errorCount": 1
}
```

**Features:**

- Assign nhiều users cùng lúc
- Tự động kiểm tra user tồn tại
- Tự động kiểm tra user là owner/member của project
- Không duplicate assignment
- Gửi notification cho từng user được assign
- Trả về cả success và error list

**Errors:**

- 400: userIds array is required
- 403: Không có quyền assign task
- Per-user errors: User not found, Already assigned, Must be member/owner

---

### 2. Get All Assigned Users

**GET** `/api/tasks/:id/assigned-users`
**Auth:** Required (Owner or Member only)

**Response (200 OK):**

```json
{
  "message": "Retrieved assigned users successfully",
  "taskId": "task5678",
  "count": 2,
  "data": [
    {
      "AssignmentID": "assign001",
      "UserID": "user123",
      "UserName": "john_doe",
      "Email": "john@example.com",
      "AssignedAt": "2025-11-13T10:30:00.000Z",
      "AssignedBy": "ownerUser123"
    },
    {
      "AssignmentID": "assign002",
      "UserID": "user456",
      "UserName": "jane_doe",
      "Email": "jane@example.com",
      "AssignedAt": "2025-11-13T10:35:00.000Z",
      "AssignedBy": "ownerUser123"
    }
  ]
}
```

**Features:**

- Xem tất cả users được assign vào task
- Bao gồm thời gian assign
- Bao gồm thông tin người assign

---

### 3. Unassign Specific User

**DELETE** `/api/tasks/:id/unassign-user/:userId`
**Auth:** Required (Owner or Member only)

**Response (200 OK):**

```json
{
  "message": "User unassigned from task successfully",
  "data": {
    "TaskID": "task5678",
    "UserID": "user123"
  }
}
```

**Features:**

- Unassign từng user riêng lẻ
- Không ảnh hưởng users khác
- Gửi notification cho user bị unassign

**Errors:**

- 404: User is not assigned to this task

---

### 4. Get My Assigned Tasks (New Version)

**GET** `/api/tasks/my-assigned-tasks`
**Auth:** Required

**Response (200 OK):**

```json
{
  "message": "Retrieved assigned tasks successfully",
  "count": 2,
  "data": [
    {
      "AssignmentID": "assign001",
      "TaskID": "task5678",
      "TaskName": "Design Homepage",
      "TaskDescription": "Create mockup for homepage",
      "DueDate": "2025-11-20",
      "Priority": "High",
      "Status": "In Progress",
      "AssignedAt": "2025-11-13T10:30:00.000Z",
      "ProjectDetails": {
        "ProjectID": "proj1234",
        "ProjectName": "Website Redesign",
        "Status": "Active"
      }
    }
  ]
}
```

**Features:**

- Lấy tất cả tasks được assign cho current user
- Sử dụng TaskAssignment collection mới
- Bao gồm thông tin project

---

## 🔄 UPDATED ENDPOINTS

### 1. GET `/api/tasks` - Enhanced Response

**Response NOW includes:**

```json
{
  "message": "Lấy danh sách thành công",
  "count": 1,
  "data": [
    {
      "TaskID": "task5678",
      "ProjectID": "proj1234",
      "TaskName": "Design Homepage",
      "TaskDescription": "...",
      "DueDate": "2025-11-20",
      "Priority": "High",
      "Status": "In Progress",
      "AssignedToUserID": "user123",
      "AssignedUserDetails": {
        "UserID": "user123",
        "UserName": "john_doe",
        "Email": "john@example.com"
      },
      "AssignedUsers": [
        {
          "AssignmentID": "assign001",
          "UserID": "user123",
          "UserName": "john_doe",
          "Email": "john@example.com",
          "AssignedAt": "2025-11-13T10:30:00.000Z"
        },
        {
          "AssignmentID": "assign002",
          "UserID": "user456",
          "UserName": "jane_doe",
          "Email": "jane@example.com",
          "AssignedAt": "2025-11-13T10:35:00.000Z"
        }
      ],
      "AssignedUsersCount": 2
    }
  ]
}
```

**New Fields:**

- `AssignedUsers`: Array of all assigned users (NEW ✨)
- `AssignedUsersCount`: Total count of assigned users (NEW ✨)
- `AssignedToUserID`: Single user assignment (OLD - backward compatible)
- `AssignedUserDetails`: Single user details (OLD - backward compatible)

---

### 2. GET `/api/tasks/:id` - Enhanced Response

**Same enhancement as GET `/api/tasks`:**

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
    "Status": "In Progress",
    "AssignedToUserID": "user123",
    "AssignedUserDetails": { ... },
    "AssignedUsers": [ ... ],
    "AssignedUsersCount": 2
  }
}
```

---

## 📊 NEW DATA MODEL

### TaskAssignment Collection

```typescript
{
  AssignmentID: string,      // Primary key (auto-generated)
  TaskID: string,            // Foreign key to Tasks
  UserID: string,            // Foreign key to Users
  AssignedAt: DateTime,      // Timestamp when assigned
  AssignedBy: string         // UserID of person who assigned
}
```

**Firestore Collection:** `TaskAssignments`

---

## 🔧 DATABASE STRUCTURE

### Old Structure (Still Supported)

```
Tasks Collection:
- TaskID: "task5678"
- AssignedToUserID: "user123"  ← Single user only
```

### New Structure (Recommended)

```
Tasks Collection:
- TaskID: "task5678"
- AssignedToUserID: null  ← Deprecated, use TaskAssignments

TaskAssignments Collection:
- AssignmentID: "assign001"
  TaskID: "task5678"
  UserID: "user123"

- AssignmentID: "assign002"
  TaskID: "task5678"
  UserID: "user456"

- AssignmentID: "assign003"
  TaskID: "task5678"
  UserID: "user789"
```

---

## 💻 C# USAGE EXAMPLES

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

    // OLD - Backward compatible
    public string AssignedToUserID { get; set; }
    public AssignedUser AssignedUserDetails { get; set; }

    // NEW - Multiple assignments ✨
    public List<AssignedUser> AssignedUsers { get; set; }
    public int AssignedUsersCount { get; set; }
}

public class AssignedUser
{
    public string AssignmentID { get; set; }  // NEW ✨
    public string UserID { get; set; }
    public string UserName { get; set; }
    public string Email { get; set; }
    public DateTime? AssignedAt { get; set; }  // NEW ✨
}
```

### Assign Multiple Users

```csharp
public async Task<bool> AssignUsersToTaskAsync(string taskId, List<string> userIds)
{
    var requestData = new { userIds };
    var content = new StringContent(
        JsonConvert.SerializeObject(requestData),
        Encoding.UTF8,
        "application/json"
    );

    var response = await client.PostAsync(
        $"{baseUrl}/tasks/{taskId}/assign-users",
        content
    );

    if (response.IsSuccessStatusCode)
    {
        var json = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<AssignmentResponse>(json);

        // Show success and errors
        MessageBox.Show($"Assigned: {result.successCount}\nErrors: {result.errorCount}");
        return true;
    }
    return false;
}
```

### Display All Assigned Users

```csharp
// Get task with assigned users
var task = await GetTaskAsync(taskId);

// Display in ListBox or DataGridView
listBoxAssignedUsers.Items.Clear();
foreach (var user in task.AssignedUsers)
{
    listBoxAssignedUsers.Items.Add($"{user.UserName} ({user.Email})");
}

// Or show count
lblAssignedCount.Text = $"Assigned to {task.AssignedUsersCount} users";
```

### Get Assigned Users List

```csharp
public async Task<List<AssignedUser>> GetAssignedUsersAsync(string taskId)
{
    var response = await client.GetAsync(
        $"{baseUrl}/tasks/{taskId}/assigned-users"
    );

    if (response.IsSuccessStatusCode)
    {
        var json = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<AssignedUsersResponse>(json);
        return result.data;
    }
    return new List<AssignedUser>();
}
```

### Unassign Specific User

```csharp
public async Task<bool> UnassignUserAsync(string taskId, string userId)
{
    var response = await client.DeleteAsync(
        $"{baseUrl}/tasks/{taskId}/unassign-user/{userId}"
    );

    return response.IsSuccessStatusCode;
}
```

---

## 🎨 UI EXAMPLES

### Multi-Select User Assignment

```csharp
// CheckedListBox for selecting multiple users
private async void btnAssignUsers_Click(object sender, EventArgs e)
{
    var selectedUserIds = new List<string>();

    foreach (var item in checkedListBoxUsers.CheckedItems)
    {
        var user = item as User;
        selectedUserIds.Add(user.UserId);
    }

    if (selectedUserIds.Count == 0)
    {
        MessageBox.Show("Please select at least one user");
        return;
    }

    await AssignUsersToTaskAsync(currentTaskId, selectedUserIds);
    await RefreshAssignedUsers();
}
```

### Display Assigned Users with Remove Option

```csharp
private async void LoadAssignedUsers(string taskId)
{
    var users = await GetAssignedUsersAsync(taskId);

    // Clear existing
    flowLayoutPanelUsers.Controls.Clear();

    // Add each user with remove button
    foreach (var user in users)
    {
        var panel = new Panel { Width = 300, Height = 40 };

        var lblUser = new Label
        {
            Text = $"{user.UserName} ({user.Email})",
            Location = new Point(5, 10),
            Width = 200
        };

        var btnRemove = new Button
        {
            Text = "Remove",
            Location = new Point(210, 5),
            Width = 80,
            Tag = user.UserID
        };
        btnRemove.Click += async (s, e) =>
        {
            var userId = (string)((Button)s).Tag;
            await UnassignUserAsync(taskId, userId);
            await LoadAssignedUsers(taskId);
        };

        panel.Controls.Add(lblUser);
        panel.Controls.Add(btnRemove);
        flowLayoutPanelUsers.Controls.Add(panel);
    }
}
```

---

## ⚖️ BACKWARD COMPATIBILITY

### Old Code (Still Works)

```csharp
// Old single assignment API still works
await AssignTaskAsync(taskId, userId);  // PUT /tasks/:id/assign

// Old response still includes single user
var task = await GetTaskAsync(taskId);
lblAssignedTo.Text = task.AssignedUserDetails?.UserName;
```

### New Code (Recommended)

```csharp
// New multiple assignment API
await AssignUsersToTaskAsync(taskId, new[] { userId1, userId2, userId3 });

// New response includes all users
var task = await GetTaskAsync(taskId);
lblAssignedCount.Text = $"{task.AssignedUsersCount} users assigned";
```

---

## 🚀 MIGRATION GUIDE

### Step 1: Update Models

Add new properties to Task model:

```csharp
public List<AssignedUser> AssignedUsers { get; set; }
public int AssignedUsersCount { get; set; }
```

Add AssignmentID to AssignedUser:

```csharp
public string AssignmentID { get; set; }
public DateTime? AssignedAt { get; set; }
```

### Step 2: Update UI

Replace single user display with list:

```csharp
// OLD
lblAssignedTo.Text = task.AssignedUserDetails?.UserName ?? "Unassigned";

// NEW
if (task.AssignedUsersCount > 0)
{
    lblAssignedTo.Text = string.Join(", ",
        task.AssignedUsers.Select(u => u.UserName));
}
else
{
    lblAssignedTo.Text = "Unassigned";
}
```

### Step 3: Add Multi-Select UI

Add CheckedListBox or multi-select ComboBox for user selection.

### Step 4: Use New APIs

Replace single assignment calls with multiple assignment:

```csharp
// OLD
await AssignTaskAsync(taskId, userId);

// NEW
await AssignUsersToTaskAsync(taskId, new[] { userId });
```

---

## 📝 API ENDPOINTS SUMMARY

| Method | Endpoint                           | Description                                              |
| ------ | ---------------------------------- | -------------------------------------------------------- |
| POST   | `/tasks/:id/assign-users`          | Assign nhiều users (NEW ✨)                              |
| GET    | `/tasks/:id/assigned-users`        | Lấy danh sách assigned users (NEW ✨)                    |
| DELETE | `/tasks/:id/unassign-user/:userId` | Unassign user cụ thể (NEW ✨)                            |
| GET    | `/tasks/my-assigned-tasks`         | Tasks của current user - new version (NEW ✨)            |
| PUT    | `/tasks/:id/assign`                | Assign single user (OLD - still works)                   |
| PUT    | `/tasks/:id/unassign`              | Unassign single user (OLD - still works)                 |
| GET    | `/tasks/my-tasks`                  | Tasks của current user - old version (OLD - still works) |

---

## ✅ FEATURES

- ✅ Assign nhiều users vào 1 task
- ✅ Unassign từng user riêng lẻ
- ✅ View tất cả assigned users
- ✅ Tự động notification cho mỗi assignment
- ✅ Validation: User phải là owner/member của project
- ✅ Prevent duplicate assignments
- ✅ Backward compatible với single assignment
- ✅ GET tasks response includes both old and new format
- ✅ History tracking (AssignedAt, AssignedBy)

---

**Server Status:** ✅ Running on http://localhost:3300
**Last Updated:** November 13, 2025
**Version:** 2.0.0
