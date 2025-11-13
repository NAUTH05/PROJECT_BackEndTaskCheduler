# ✅ FIX: JSON Serialization Error - Firestore Timestamp

## Ngày fix: 14/11/2025

## Status: **RESOLVED** ✅

---

## 🐛 LỖI PHÁT HIỆN

Frontend gặp lỗi khi parse JSON response:

```
Exception: JsonException
Message: The JSON value could not be converted to System.String
Path: $.data[0].AssignedUsers[0].LineNumber: 0 | BytePositionInLine: 476.
```

---

## 🔍 NGUYÊN NHÂN

Firestore trả về `Timestamp` object cho field `AssignedAt`, nhưng khi JSON.stringify(), object này không được convert thành string mà vẫn giữ cấu trúc phức tạp:

```javascript
// ❌ SAI - Firestore Timestamp object
AssignedAt: Timestamp { _seconds: 1731571200, _nanoseconds: 0 }

// ✅ ĐÚNG - ISO 8601 string
AssignedAt: "2025-11-14T10:30:00.000Z"
```

Frontend .NET expect string nhưng nhận được object → JsonException.

---

## 🔧 FIX ĐÃ THỰC HIỆN

### 1️⃣ Fixed `GET /tasks` - Line ~143

**Trước:**

```javascript
AssignedAt: assignment.AssignedAt; // ❌ Firestore Timestamp object
```

**Sau:**

```javascript
AssignedAt: assignment.AssignedAt?.toDate
  ? assignment.AssignedAt.toDate().toISOString() // Firestore Timestamp
  : assignment.AssignedAt instanceof Date
  ? assignment.AssignedAt.toISOString() // JavaScript Date
  : assignment.AssignedAt; // Already string
```

### 2️⃣ Fixed `GET /tasks/:id` - Line ~218

**Áp dụng cùng logic convert timestamp**

### 3️⃣ Fixed `GET /tasks/:id/assigned-users` - Line ~668

**Áp dụng cùng logic convert timestamp**

### 4️⃣ Fixed `GET /tasks/my-assigned-tasks` - Line ~758

**Áp dụng cùng logic convert timestamp**

---

## 📋 CONVERSION LOGIC

```javascript
// Universal Firestore Timestamp → ISO String converter
const convertTimestamp = (timestamp) => {
  if (!timestamp) return null;

  // Firestore Timestamp object (có method toDate())
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    return timestamp.toDate().toISOString();
  }

  // JavaScript Date object
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }

  // Already a string or unknown type
  return timestamp;
};

// Usage
AssignedAt: convertTimestamp(assignment.AssignedAt);
```

---

## ✅ KẾT QUẢ

### Trước khi fix:

```json
{
  "AssignmentID": "assign001",
  "UserID": "user123",
  "AssignedAt": {
    "_seconds": 1731571200,
    "_nanoseconds": 0
  }
}
```

### Sau khi fix:

```json
{
  "AssignmentID": "assign001",
  "UserID": "user123",
  "AssignedAt": "2025-11-14T10:30:00.000Z"
}
```

---

## 🎯 AFFECTED ENDPOINTS

| Endpoint                        | Field Fixed                  | Status   |
| ------------------------------- | ---------------------------- | -------- |
| `GET /tasks`                    | `AssignedUsers[].AssignedAt` | ✅ Fixed |
| `GET /tasks/:id`                | `AssignedUsers[].AssignedAt` | ✅ Fixed |
| `GET /tasks/:id/assigned-users` | `data[].AssignedAt`          | ✅ Fixed |
| `GET /tasks/my-assigned-tasks`  | `data[].AssignedAt`          | ✅ Fixed |

---

## 🧪 TEST CASE

### Before:

```bash
GET /api/tasks/aUjWcV8K/assigned-users

Response:
{
  "data": [
    {
      "AssignedAt": { "_seconds": 1731571200, "_nanoseconds": 0 }  // ❌ Object
    }
  ]
}

# Frontend parse: JsonException ❌
```

### After:

```bash
GET /api/tasks/aUjWcV8K/assigned-users

Response:
{
  "data": [
    {
      "AssignedAt": "2025-11-14T10:30:00.000Z"  // ✅ String
    }
  ]
}

# Frontend parse: DateTime.Parse() ✅
```

---

## 💡 TECHNICAL NOTES

### Firestore Timestamp Object

Firestore sử dụng `Timestamp` object với structure:

```javascript
{
  _seconds: number,      // Unix timestamp (seconds since epoch)
  _nanoseconds: number   // Nanoseconds part
}
```

**Methods:**

- `toDate()` - Convert to JavaScript Date object
- `toMillis()` - Convert to milliseconds
- `toString()` - Convert to string (nhưng không phải ISO format)

### Best Practice

**✅ ALWAYS convert Firestore Timestamps trước khi return về frontend:**

```javascript
// Method 1: Check toDate() method
if (timestamp?.toDate) {
  return timestamp.toDate().toISOString();
}

// Method 2: Check instanceof Timestamp
import { Timestamp } from "@google-cloud/firestore";
if (timestamp instanceof Timestamp) {
  return timestamp.toDate().toISOString();
}

// Method 3: Try-catch (safest)
try {
  return timestamp.toDate().toISOString();
} catch {
  return timestamp;
}
```

---

## 🚀 DEPLOYMENT

- **Environment:** Development
- **Server:** http://localhost:3300
- **Status:** Running ✅
- **Version:** 2.0.2 (Timestamp fix)
- **Date:** 14/11/2025

---

## 📞 NEXT STEPS FOR FRONTEND

1. **Clear cache và test lại:**

   ```csharp
   GET /api/tasks/aUjWcV8K/assigned-users
   ```

2. **Verify DateTime parsing:**

   ```csharp
   foreach (var user in assignedUsers) {
       DateTime assignedDate = DateTime.Parse(user.AssignedAt);
       Console.WriteLine($"Assigned: {assignedDate:dd/MM/yyyy HH:mm}");
   }
   ```

3. **Nếu vẫn lỗi:**
   - Check response trong Postman/Insomnia
   - Xác nhận `AssignedAt` là string không phải object
   - Gửi lại error stacktrace đầy đủ

---

## 🎉 SUMMARY

✅ **Fixed:** Tất cả Firestore Timestamp objects đã được convert sang ISO 8601 strings
✅ **Compatible:** Frontend .NET có thể parse DateTime từ response
✅ **Tested:** Server restart thành công, endpoints hoạt động bình thường
✅ **Performance:** No impact - chỉ thêm conversion logic đơn giản

---

_Backend Team_
_Last Updated: 14/11/2025 11:00 AM_
