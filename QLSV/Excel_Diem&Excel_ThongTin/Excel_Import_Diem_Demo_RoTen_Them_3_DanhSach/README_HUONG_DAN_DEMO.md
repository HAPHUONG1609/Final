# Bộ Excel nhập điểm demo theo giảng viên

Bộ này đã được tạo lại để dễ demo hơn.

## Nội dung chính

- Mỗi giảng viên có một thư mục riêng trong `Theo_GiangVien/`.
- Tên file đã đổi rõ hơn theo dạng:

```text
GV-<MaGV>_Lop-<MaLop>_HP-<MaHP>_<TenHocPhan>_2025-2026_HK2_CO_DIEM.xlsx
```

Ví dụ:

```text
GV-GV0101_Lop-CNTT02_HP-C25200703_Thuc_hanh_co_so_chuyen_nganh_CNTT_2025-2026_HK2_CO_DIEM.xlsx
```

## Cấu trúc Excel

Mỗi file có cột:

```text
MSSV | HoTen | GK | CK | TB
```

Trong đó:
- `GK`: điểm giữa kỳ, đã điền sẵn.
- `CK`: điểm cuối kỳ, đã điền sẵn.
- `TB`: công thức `ROUND(GK*0.4 + CK*0.6, 1)` và có sẵn giá trị để import demo.

## Cách dùng demo

1. Đăng nhập bằng tài khoản giảng viên.
2. Vào trang nhập điểm.
3. Chọn học phần đúng với mã `HP-...` trong tên file Excel.
4. Import file Excel tương ứng.
5. Hệ thống sẽ mã hóa điểm bằng CRT rồi lưu vào `DIEM_CRT`.

## Lưu ý

- Bộ file này dành cho năm học `2025-2026`, học kỳ `2`.
- Điểm trong file chỉ là điểm demo để quay video/test import.
- Điểm cũ HK1 và các năm trước vẫn nên dùng script `seedHistoricalEncryptedGrades_CRT.js`.
