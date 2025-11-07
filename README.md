# Task Scheduler API với JWT Authentication

Backend API cho ứng dụng quản lý dự án và công việc, sử dụng Node.js, Express, Firebase Firestore và JWT Authentication.

## Tính năng chính

### Authentication (JWT)

- Đăng ký người dùng
- Đăng nhập với token
- Xác thực API endpoints

### User Management

- Tạo tài khoản
- Đăng nhập
- Quản lý thông tin người dùng

### Project Management

- Tạo, sửa, xóa project
- Lọc project theo owner hoặc status
- Quản lý thông tin project (tên, mô tả, ngày bắt đầu/kết thúc, trạng thái)

### Task Management

- Tạo, sửa, xóa task
- Gán task cho user
- Quản lý priority (High, Medium, Low)
- Quản lý status (To Do, In Progress, Done, Blocked)
- Lọc task theo project, user, status, priority

## Cài đặt và chạy

### 1. Clone hoặc download project

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình Firebase

- Đặt file service account JSON vào folder gốc
- Hoặc config trong file `.env`

### 4. Chạy server

```bash
node index.js
```

Server sẽ chạy tại: `http://localhost:3300`

## API Documentation

### Public APIs (Không cần token)

#### Register

```http
POST /api/register
Content-Type: application/json

{
  "userName": "testuser",
  "email": "test@email.com",
  "password": "123456"
}
```

#### Login

```http
POST /api/login
Content-Type: application/json

{
  "userName": "testuser",
  "password": "123456"
}
```

Response sẽ chứa `token` - lưu lại để dùng cho các API tiếp theo.

---

### Protected APIs (Cần token)

Tất cả các API dưới đây cần token trong header:

```http
Authorization: Bearer YOUR_TOKEN_HERE
```

#### Projects

- `GET /api/projects` - Lấy danh sách projects
- `GET /api/projects/:id` - Lấy thông tin 1 project
- `POST /api/projects` - Tạo project mới
- `PUT /api/projects/:id` - Cập nhật project
- `DELETE /api/projects/:id` - Xóa project

#### Tasks

- `GET /api/tasks` - Lấy danh sách tasks
- `GET /api/tasks/:id` - Lấy thông tin 1 task
- `POST /api/tasks` - Tạo task mới
- `PUT /api/tasks/:id` - Cập nhật task
- `DELETE /api/tasks/:id` - Xóa task

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: JWT (jsonwebtoken)
- **ID Generator**: nanoid
- **Environment**: dotenv

## Dependencies

```json
{
  "cors": "^2.8.5",
  "dotenv": "^17.2.3",
  "express": "^5.1.0",
  "firebase-admin": "^13.5.0",
  "jsonwebtoken": "^9.0.2",
  "nanoid": "^5.1.6"
}
```

## Environment Variables

File `.env`:

```env
PORT=3300
JWT_SECRET=my_secret_key_taskscheduler_2024_thuannguyen
JWT_EXPIRES_IN=7d
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
```

## Use Cases

### 1. User đăng ký và đăng nhập

```
User → Register → Get Token → Login → Access APIs
```

### 2. Tạo và quản lý Project

```
Login → Get Token → Create Project → Get Projects → Update → Delete
```

### 3. Tạo và gán Task

```
Login → Get Token → Create Task → Assign to User → Update Status → Complete
```

## Security Notes

1. **JWT Secret**: Đổi JWT_SECRET trong production
2. **HTTPS**: Dùng HTTPS trong production
3. **Token Storage**: Frontend nên lưu token an toàn
4. **Token Expiry**: Token hết hạn sau 7 ngày
5. **Password**: Nên hash password (bcrypt) trong production

## Testing

### Test với Postman

1. Register một user mới
2. Login và copy token
3. Thử các API với token
4. Thử API không có token → Expect 401
5. Thử token sai → Expect 403

### Test với WinForm Application

**Download sẵn tại**: [https://github.com/NAUTH05/PROJECT_TaskScheduler/releases](https://github.com/NAUTH05/PROJECT_TaskScheduler/releases)

1. Tải **Release version \_Local**
2. Giải nén và chạy file `.exe`
3. Test đầy đủ các tính năng:
   - Login/Register
   - Quản lý Projects
   - Quản lý Tasks
   - Gán công việc
4. Source code C# đầy đủ tại repository

## Support

Nếu gặp vấn đề:

- Check server đang chạy: `http://localhost:3300`
- Check Firebase connection
- Check token format: `Bearer <token>`
- Check .env file có đúng không

## Author

NguyenThuan_NAUTH - 23CT113
