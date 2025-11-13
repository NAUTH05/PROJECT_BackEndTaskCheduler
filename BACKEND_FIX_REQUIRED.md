# 🐛 BUG REPORT: Multi-User Task Assignment Not Working

## Ngày phát hiện: 14/11/2025

## Độ ưu tiên: **HIGH** ⚠️

## Module: Task Assignment - TaskAssignment Table

---

## 📋 TÓM TẮT VẤN ĐỀ

Frontend đã implement đầy đủ tính năng **assign nhiều users vào 1 task**, nhưng backend không lưu dữ liệu vào `TaskAssignment` table, khiến API endpoint `GET /tasks/:id/assigned-users` luôn trả về mảng rỗng.

---

## 🔍 CHI TIẾT LỖI

### Test Case đã thực hiện:

1. ✅ Tạo task "a" trong project "FrontEnd Design"
2. ✅ Gọi `PUT /tasks/aUyLvG8R/assign` với body: `{ "userId": "other" }`
3. ✅ API trả về success
4. ❌ Gọi `GET /tasks/aUyLvG8R/assigned-users` → Nhận về:

```json
{
  "message": "Retrieved assigned users successfully",
  "taskId": "aUyLvG8R",
  "count": 0,
  "data": []
}
```

### Kết quả mong đợi:

```json
{
  "message": "Retrieved assigned users successfully",
  "taskId": "aUyLvG8R",
  "count": 1,
  "data": [
    {
      "AssignmentID": "assign_xxxxx",
      "UserID": "other",
      "UserName": "other",
      "Email": "other@example.com",
      "AssignedAt": "2025-11-14T10:30:00.000Z"
    }
  ]
}
```

---

## 🔧 YÊU CẦU FIX

### 1️⃣ Sửa endpoint `PUT /tasks/:id/assign`

**File cần sửa:** `taskRoutes.js` hoặc `taskController.js`

**Logic hiện tại (dự đoán):**

```javascript
// ❌ CHỈ cập nhật Task document
const task = await Task.findById(taskId);
task.AssignedToUserID = userId;
await task.save();
```

**Logic cần có:**

```javascript
// ✅ Vừa cập nhật Task document VỪA tạo TaskAssignment record

// Bước 1: Cập nhật Task (giữ lại logic cũ nếu cần backward compatibility)
const task = await Task.findById(taskId);
task.AssignedToUserID = userId; // Optional: giữ lại cho single-user field
await task.save();

// Bước 2: Kiểm tra xem user đã được assign chưa
const existingAssignment = await TaskAssignment.findOne({
  TaskID: taskId,
  UserID: userId,
});

// Bước 3: Nếu chưa có thì tạo mới
if (!existingAssignment) {
  await TaskAssignment.create({
    AssignmentID: generateUniqueId(), // hoặc để MongoDB tự generate _id
    TaskID: taskId,
    UserID: userId,
    AssignedAt: new Date(),
  });
}
```

---

### 2️⃣ Verify endpoint `GET /tasks/:id/assigned-users`

**File:** `taskRoutes.js` hoặc `taskController.js`

**Logic cần có:**

```javascript
router.get("/tasks/:id/assigned-users", authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;

    // Bước 1: Lấy tất cả assignments của task
    const assignments = await TaskAssignment.find({ TaskID: taskId });

    // Bước 2: Populate thông tin user
    const assignedUsers = await Promise.all(
      assignments.map(async (assignment) => {
        const user = await User.findById(assignment.UserID);
        return {
          AssignmentID: assignment._id || assignment.AssignmentID,
          UserID: assignment.UserID,
          UserName: user?.UserName || "Unknown",
          Email: user?.Email || "",
          AssignedAt: assignment.AssignedAt,
        };
      })
    );

    // Bước 3: Trả về response
    return res.status(200).json({
      message: "Retrieved assigned users successfully",
      taskId: taskId,
      count: assignedUsers.length,
      data: assignedUsers,
    });
  } catch (error) {
    console.error("Error getting assigned users:", error);
    return res.status(500).json({
      message: "Failed to retrieve assigned users",
      error: error.message,
    });
  }
});
```

---

### 3️⃣ Verify endpoint `DELETE /tasks/:id/unassign-user/:userId`

**File:** `taskRoutes.js` hoặc `taskController.js`

**Logic cần có:**

```javascript
router.delete(
  "/tasks/:id/unassign-user/:userId",
  authenticateToken,
  async (req, res) => {
    try {
      const { id: taskId, userId } = req.params;

      // Bước 1: Xóa record trong TaskAssignment table
      const result = await TaskAssignment.deleteOne({
        TaskID: taskId,
        UserID: userId,
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          message: "Assignment not found",
        });
      }

      // Bước 2: Nếu là user cuối cùng, clear field AssignedToUserID trong Task
      const remainingAssignments = await TaskAssignment.countDocuments({
        TaskID: taskId,
      });
      if (remainingAssignments === 0) {
        await Task.findByIdAndUpdate(taskId, {
          $unset: { AssignedToUserID: "" },
        });
      }

      return res.status(200).json({
        message: "User unassigned successfully",
        taskId: taskId,
        userId: userId,
      });
    } catch (error) {
      console.error("Error unassigning user:", error);
      return res.status(500).json({
        message: "Failed to unassign user",
        error: error.message,
      });
    }
  }
);
```

---

## 📊 DATABASE SCHEMA

### TaskAssignment Model (nếu chưa có)

**File:** `models/TaskAssignment.js`

```javascript
const mongoose = require("mongoose");

const taskAssignmentSchema = new mongoose.Schema(
  {
    AssignmentID: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      unique: true,
    },
    TaskID: {
      type: String,
      required: true,
      ref: "Task",
    },
    UserID: {
      type: String,
      required: true,
      ref: "User",
    },
    AssignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Composite index để đảm bảo 1 user chỉ được assign 1 lần vào 1 task
taskAssignmentSchema.index({ TaskID: 1, UserID: 1 }, { unique: true });

module.exports = mongoose.model("TaskAssignment", taskAssignmentSchema);
```

---

## 🧪 TEST CASES CẦN VERIFY

### Test 1: Assign user đầu tiên

```bash
# Request
PUT /api/tasks/task123/assign
Body: { "userId": "user001" }

# Expected result
- Task.AssignedToUserID = "user001" (nếu giữ backward compatibility)
- TaskAssignment table có 1 record mới với TaskID="task123", UserID="user001"

# Verify
GET /api/tasks/task123/assigned-users
Response: { count: 1, data: [{UserID: "user001", ...}] }
```

### Test 2: Assign thêm user thứ 2

```bash
# Request
PUT /api/tasks/task123/assign
Body: { "userId": "user002" }

# Expected result
- TaskAssignment table có thêm 1 record mới với TaskID="task123", UserID="user002"

# Verify
GET /api/tasks/task123/assigned-users
Response: { count: 2, data: [{UserID: "user001", ...}, {UserID: "user002", ...}] }
```

### Test 3: Assign duplicate (không được phép)

```bash
# Request
PUT /api/tasks/task123/assign
Body: { "userId": "user001" }

# Expected result
- Trả về lỗi hoặc ignore (không tạo duplicate record)
- TaskAssignment table vẫn chỉ có 2 records
```

### Test 4: Unassign user

```bash
# Request
DELETE /api/tasks/task123/unassign-user/user001

# Expected result
- TaskAssignment table còn 1 record với UserID="user002"

# Verify
GET /api/tasks/task123/assigned-users
Response: { count: 1, data: [{UserID: "user002", ...}] }
```

### Test 5: Unassign user cuối cùng

```bash
# Request
DELETE /api/tasks/task123/unassign-user/user002

# Expected result
- TaskAssignment table không còn record nào cho task123
- Task.AssignedToUserID = null (nếu giữ backward compatibility)

# Verify
GET /api/tasks/task123/assigned-users
Response: { count: 0, data: [] }
```

---

## 📝 CHECKLIST CHO BACKEND TEAM

- [ ] Tạo model `TaskAssignment` nếu chưa có
- [ ] Thêm composite index `(TaskID, UserID)` để tránh duplicate
- [ ] Sửa `PUT /tasks/:id/assign` để tạo record trong TaskAssignment
- [ ] Verify `GET /tasks/:id/assigned-users` query từ TaskAssignment table
- [ ] Verify `DELETE /tasks/:id/unassign-user/:userId` xóa từ TaskAssignment table
- [ ] Test tất cả 5 test cases ở trên
- [ ] Deploy lên staging/development environment
- [ ] Thông báo frontend team để test lại

---

## 🔗 REFERENCE

Chi tiết API Documentation: Xem file `API_DOCUMENTATION_COMPLETE.md`

- Section 5.9: Assign Multiple Users to Task
- Section 5.10: Get All Assigned Users for Task
- Section 5.11: Unassign Specific User from Task
- Section 8: TaskAssignment Model

---

## 📞 CONTACT

**Frontend Developer:** [Tên bạn]
**Date Reported:** 14/11/2025
**Status:** 🔴 BLOCKING - Frontend không thể test multi-user assignment feature

---

## 💡 LƯU Ý QUAN TRỌNG

### Backward Compatibility

Nếu có code cũ đang dùng field `Task.AssignedToUserID` (single user), có 2 option:

**Option A: Giữ cả 2 (Recommended)**

- Giữ `Task.AssignedToUserID` cho backward compatibility
- Thêm `TaskAssignment` table cho multi-user support
- Frontend sẽ ưu tiên dùng `TaskAssignment` nếu có data

**Option B: Migration hoàn toàn**

- Migrate tất cả `Task.AssignedToUserID` sang `TaskAssignment` table
- Deprecate field `AssignedToUserID`
- Cần phối hợp chặt chẽ giữa frontend và backend

**Khuyến nghị:** Chọn Option A để tránh breaking changes.

---

## ⏱️ TIMELINE MỤC TIÊU

- **Day 1-2:** Review và implement fix
- **Day 3:** Testing trên staging
- **Day 4:** Deploy lên production
- **Day 5:** Frontend verify và đóng ticket

---

_Last Updated: 14/11/2025_
_Frontend Version: Ready for multi-user assignment_
_Backend Version: Pending fix_
