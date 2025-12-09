# Hệ thống quản lý nội dung MC Hoàng Phúc

## Tổng quan

Hệ thống này cho phép bạn quản lý nội dung website một cách nhanh chóng và tự động cập nhật lên GitHub. Bạn có thể:

- ✅ Thay đổi tiêu đề, mô tả, thông tin liên hệ
- ✅ Thêm/xóa/sửa bài viết và kỹ năng
- ✅ Quản lý hình ảnh và video
- ✅ Tự động commit và push thay đổi lên GitHub
- ✅ Đồng bộ nội dung giữa các thiết bị

## Cách sử dụng

### 1. Đăng nhập Admin Panel

- Truy cập: `/admin/index.html`
- Username: `admin`
- Password: `hoangphuc2025`

### 2. Quản lý nội dung cơ bản

#### Thay đổi thông tin website:
1. Click vào "Quản lý nội dung"
2. Chỉnh sửa các thông tin:
   - Tiêu đề website
   - Mô tả
   - Quote
   - Số điện thoại, email
   - Link mạng xã hội
3. Click "Lưu thay đổi"

#### Quản lý media:
1. Click vào "Quản lý media"
2. Thêm media mới:
   - Chọn loại (ảnh/video)
   - Upload file
   - Điền tên và mô tả
   - Chọn danh mục
3. Quản lý media hiện có:
   - Xem danh sách
   - Xóa media không cần thiết

#### Quản lý kỹ năng:
1. Click vào "Quản lý kỹ năng"
2. Thêm kỹ năng mới:
   - Tên kỹ năng
   - Mô tả chi tiết
   - Icon (FontAwesome class)
   - Mức độ
3. Quản lý kỹ năng hiện có

### 3. Tích hợp GitHub

#### Cấu hình ban đầu:
1. Click vào nút "GitHub" trên header
2. Nhập thông tin:
   - Username GitHub
   - Tên repository
   - Branch (thường là `main`)
   - Personal Access Token

#### Cách lấy Personal Access Token:
1. Vào GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token
4. Chọn quyền: `repo` (full control of private repositories)
5. Copy token và lưu lại

#### Sử dụng GitHub Integration:
- **Commit & Push**: Tự động commit và push thay đổi lên GitHub
- **Pull Latest**: Kéo thay đổi mới nhất từ GitHub
- **Cấu hình lại**: Thay đổi thông tin kết nối

## Cấu trúc dữ liệu

### File `content.json`
```json
{
  "site": {
    "title": "MC Hoàng Phúc",
    "description": "Chuyên nghiệp, trẻ trung, tự tin",
    "phone": "0359 581 896",
    "email": "mchoangphuc2207@gmail.com"
  },
  "skills": [...],
  "media": {
    "images": [...],
    "videos": [...]
  }
}
```

### Thư mục `img/`
Chứa tất cả hình ảnh và video của website.

## Quy trình làm việc

### Khi có thay đổi nội dung:
1. Đăng nhập admin panel
2. Chỉnh sửa nội dung cần thiết
3. Lưu thay đổi
4. Click "Commit & Push" để cập nhật GitHub
5. Website sẽ tự động cập nhật

### Khi muốn đồng bộ từ GitHub:
1. Click "Pull Latest"
2. Hệ thống sẽ tải nội dung mới nhất
3. Các thay đổi sẽ được áp dụng ngay lập tức

## Lưu ý quan trọng

### Bảo mật:
- Không chia sẻ Personal Access Token
- Thay đổi mật khẩu admin thường xuyên
- Chỉ cho phép người tin cậy truy cập admin panel

### Backup:
- Hệ thống tự động backup vào localStorage
- Luôn commit thay đổi lên GitHub
- Có thể download file `content.json` để backup thủ công

### Troubleshooting:
- Nếu không thể kết nối GitHub: Kiểm tra token và quyền
- Nếu không thể upload file: Kiểm tra kích thước file và định dạng
- Nếu giao diện bị lỗi: Refresh trang và đăng nhập lại

## Hỗ trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra console browser (F12)
2. Xem log trong GitHub Integration
3. Kiểm tra kết nối internet
4. Liên hệ developer để được hỗ trợ

## Cập nhật

Hệ thống sẽ được cập nhật thường xuyên với các tính năng mới:
- ✅ Quản lý sự kiện
- ✅ Thống kê truy cập
- ✅ Tích hợp với các nền tảng khác
- ✅ Giao diện responsive tốt hơn 