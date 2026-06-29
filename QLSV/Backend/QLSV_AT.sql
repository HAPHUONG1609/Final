-- =================================================================================
-- THIẾT LẬP MÔI TRƯỜNG & TẠO DATABASE
-- =================================================================================
USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'QLSV_AT')
BEGIN
    ALTER DATABASE QLSV_AT SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE QLSV_AT;
END
GO

CREATE DATABASE QLSV_AT;
GO

USE QLSV_AT;
GO

-- =================================================================================
-- TẠO CẤU TRÚC BẢNG (TABLE SCHEMA)
-- =================================================================================
-- Sua khoa 
-- Bảng KHOA
CREATE TABLE SNT (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Primes INT
);

CREATE TABLE KHOA (
  MAKHOA VARCHAR(10) PRIMARY KEY,
  TENKHOA NVARCHAR(100) NOT NULL,
  Primes TEXT,
  Ciphertext Text
);
GO

-- Bảng LOP
CREATE TABLE LOP (
  MALOP CHAR(10) PRIMARY KEY,
  TENLOP NVARCHAR(100) NOT NULL,
  MAKHOA VARCHAR(10) NOT NULL,
  CONSTRAINT FK_LOP_KHOA FOREIGN KEY (MAKHOA) REFERENCES KHOA(MAKHOA) ON DELETE CASCADE
);
GO

-- Bảng GIANG_VIEN
CREATE TABLE GIANG_VIEN (
  MaGV   CHAR(10) PRIMARY KEY,
  HoTen  NVARCHAR(100),
  MAKHOA VARCHAR(10) NOT NULL,
  Email  VARCHAR(100),
  PUBLIC_KEY VARCHAR(1000), 
  PIN_HASH VARCHAR(255),
  CONSTRAINT FK_GV_KHOA FOREIGN KEY (MAKHOA) REFERENCES KHOA(MAKHOA) ON DELETE CASCADE
);
GO


-- Bảng SINH_VIEN
CREATE TABLE SINH_VIEN (
  MaSV        CHAR(10) PRIMARY KEY,
  HoTen       NVARCHAR(100) NOT NULL,
  NgaySinh    DATE,
  NoiSinh     NVARCHAR(100),
  GioiTinh    NVARCHAR(5),
  MaLop       CHAR(10),
  Email       VARCHAR(100),
  KhoaHoc     CHAR(10),      
  BacDaoTao   NVARCHAR(50),   
  LoaiHinhDT  NVARCHAR(50),   
  NganhDT     NVARCHAR(100),
  ChuyenNganh NVARCHAR(100),
  Khoa NVARCHAR(10),
  TinhTrang   NVARCHAR(50) DEFAULT N'Đang học',
  PUBLIC_KEY  VARCHAR(1000),
  CONSTRAINT FK_SV_LOP FOREIGN KEY (MaLop) REFERENCES LOP(MaLop) ON DELETE SET NULL
);
GO

-- Bảng PING
CREATE TABLE PING (
  MASV CHAR(10) PRIMARY KEY,
  PIN_HASH VARCHAR(255), -- Đổi tên cột cho rõ nghĩa, lưu chuỗi hash của bcrypt
  CREATED_AT DATETIME DEFAULT GETDATE(),
  CONSTRAINT FK_PING_SV FOREIGN KEY (MASV) REFERENCES SINH_VIEN(MaSV) ON DELETE CASCADE
);
GO


-- Bảng TAIKHOAN
CREATE TABLE TAIKHOAN (
  USERNAME VARCHAR(50) PRIMARY KEY,
  PASSWORD_HASH VARCHAR(255) NOT NULL,
  ROLE VARCHAR(20) NOT NULL, -- ADMIN, GIANGVIEN, SINHVIEN
  Email VARCHAR(100),
  RELATED_ID VARCHAR(20) NULL
);
GO


-- Bảng HOC_PHAN
CREATE TABLE HOC_PHAN (
  MAHP CHAR(10),
  TenHP NVARCHAR(100) NOT NULL,
  SoTinChi INT,
  HocKy INT,
  NamHoc CHAR(9),
  MaLop CHAR(10),
  LichHoc NVARCHAR(50),
  GiangVien NVARCHAR(100),
  NgayBatDau DATE,
  NgayKetThuc DATE,
  PRIMARY KEY (MAHP, HocKy, NamHoc),
  CONSTRAINT chk_tc CHECK (SoTinChi > 0),
  CONSTRAINT chk_hk CHECK (HocKy BETWEEN 1 AND 3),
  CONSTRAINT FK_HP_LOP FOREIGN KEY (MaLop) REFERENCES LOP(MaLop) ON DELETE CASCADE
);
GO

-- Bảng THOI_KHOA_BIEU
CREATE TABLE THOI_KHOA_BIEU (
  ID INT IDENTITY(1,1) PRIMARY KEY,
  MASV CHAR(10) NOT NULL,
  MAHP CHAR(10) NOT NULL,
  TenHP NVARCHAR(100),
  MaLop CHAR(10),
  HOCKY INT,
  NamHoc CHAR(9),
  LichHoc NVARCHAR(50),
  CONSTRAINT FK_TKB_SV FOREIGN KEY (MASV) REFERENCES SINH_VIEN(MaSV) ON DELETE CASCADE, -- Cẩn thận trigger cycle
  CONSTRAINT FK_TKB_HP FOREIGN KEY (MAHP, HOCKY, NamHoc) REFERENCES HOC_PHAN(MAHP, HocKy, NamHoc) ON DELETE CASCADE
);
GO


-- Bảng DIEM
CREATE TABLE DIEM (
  MASV CHAR(10) NOT NULL,
  MAHP CHAR(10) NOT NULL,
  DIEM_MAHOA VARCHAR(500) NOT NULL,
  HOCKY INT NOT NULL,
  NamHoc CHAR(9) NOT NULL,
  CREATED_AT DATETIME DEFAULT GETDATE(),
  CREATED_BY VARCHAR(50),
  PRIMARY KEY (MASV, MAHP, HOCKY), -- Khóa chính kết hợp 2 cột
  CONSTRAINT FK_DIEM_HP FOREIGN KEY (MAHP, HOCKY, NamHoc) REFERENCES HOC_PHAN(MAHP, HocKy, NamHoc) ON DELETE CASCADE,
  CONSTRAINT FK_DIEM_SV FOREIGN KEY (MASV) REFERENCES SINH_VIEN(MaSV) ON DELETE CASCADE
);
GO

-- Bang Login_Log
CREATE TABLE LICH_SU_DANG_NHAP (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    USERNAME VARCHAR(50) NOT NULL,
    THOI_GIAN DATETIME DEFAULT GETDATE(),
    IP_ADDRESS VARCHAR(50),
    LOCATION NVARCHAR(100), 
    CONSTRAINT FK_LSDN_TAIKHOAN FOREIGN KEY (USERNAME) REFERENCES TAIKHOAN(USERNAME) ON DELETE CASCADE
);
GO

-- Bang Luu mssv | C 
CREATE TABLE DIEM_CRT (
    MASV CHAR(10) NOT NULL,
    MAHP CHAR(10) NOT NULL,

    C NVARCHAR(MAX) NOT NULL,

    START_INDEX INT NOT NULL,
    END_INDEX INT NOT NULL,

    CREATED_AT DATETIME NOT NULL DEFAULT GETDATE(),
    UPDATED_AT DATETIME NULL,

    PRIMARY KEY (MASV, MAHP),

    CONSTRAINT FK_DIEM_CRT_SV 
        FOREIGN KEY (MASV) REFERENCES SINH_VIEN(MaSV) 
        ON DELETE CASCADE
);
GO
-- =================================================================================
-- STORED PROCEDURES & FUNCTIONS
-- =================================================================================

-- --- QUẢN LÝ SINH VIÊN ---

-- Thêm Sinh Viên
CREATE PROCEDURE sp_ThemSinhVien
    @MaSV CHAR(10), @HoTen NVARCHAR(100), @NgaySinh DATE,
    @NoiSinh NVARCHAR(100), @GioiTinh NVARCHAR(5), @MaLop CHAR(10),
    @Email VARCHAR(100), @KhoaHoc CHAR(10), @BacDaoTao NVARCHAR(50),
    @LoaiHinhDT NVARCHAR(50), @NganhDT NVARCHAR(100), @Khoa NVARCHAR(10), @ChuyenNganh NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM SINH_VIEN WHERE MaSV = @MaSV)
    BEGIN
        THROW 51000, N'Mã sinh viên đã tồn tại!', 1;
    END
    ELSE
    BEGIN
        INSERT INTO SINH_VIEN (
            MaSV, HoTen, NgaySinh, NoiSinh, GioiTinh, MaLop, Email, 
            KhoaHoc, BacDaoTao, LoaiHinhDT, NganhDT, Khoa, ChuyenNganh, TinhTrang, PUBLIC_KEY
        ) VALUES (
            @MaSV, @HoTen, @NgaySinh, @NoiSinh, @GioiTinh, @MaLop, @Email, 
            @KhoaHoc, @BacDaoTao, @LoaiHinhDT, @NganhDT, @Khoa, @ChuyenNganh, N'Đang học',
            '98765432109876543210987654321098765432109876543210' -- Public Key hợp lệ để test
        );
        -- Tự động băm PIN "123456" bằng SHA-256
        INSERT INTO PING (MASV, PIN_HASH) VALUES (@MaSV, CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', '123456'), 2));
    END
END
GO

-- Sửa nơi sinh ----
CREATE PROCEDURE sp_SuaNoiSinh
	@MaSV CHAR(10),
    @NoiSinh NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM SINH_VIEN WHERE MaSV = @MaSV)
    BEGIN
        THROW 51000, N'Sinh viên không tồn tại!', 1;
    END
    ELSE
    BEGIN
        UPDATE SINH_VIEN SET 
            NoiSinh = @NoiSinh
        WHERE MaSV = @MaSV;
    END
END
GO


-- Sửa Sinh Viên
CREATE PROCEDURE sp_SuaSinhVien
    @MaSV CHAR(10), @HoTen NVARCHAR(100), @NgaySinh DATE,
    @NoiSinh NVARCHAR(100), @GioiTinh NVARCHAR(5), @MaLop CHAR(10),
    @Email VARCHAR(100), @KhoaHoc CHAR(10), @BacDaoTao NVARCHAR(50),
    @LoaiHinhDT NVARCHAR(50), @NganhDT NVARCHAR(100), @Khoa NVARCHAR(10), @ChuyenNganh NVARCHAR(100),
    @TinhTrang NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM SINH_VIEN WHERE MaSV = @MaSV)
    BEGIN
        THROW 51000, N'Sinh viên không tồn tại!', 1;
    END
    ELSE
    BEGIN
        UPDATE SINH_VIEN SET 
            HoTen = @HoTen, NgaySinh = @NgaySinh, NoiSinh = @NoiSinh, GioiTinh = @GioiTinh,
            MaLop = @MaLop, Email = @Email, KhoaHoc = @KhoaHoc, BacDaoTao = @BacDaoTao,
            LoaiHinhDT = @LoaiHinhDT, NganhDT = @NganhDT, ChuyenNganh = @ChuyenNganh, Khoa = @Khoa,
            TinhTrang = @TinhTrang
        WHERE MaSV = @MaSV;
    END
END
GO

-- Xóa Sinh Viên
CREATE PROCEDURE sp_XoaSinhVien @MaSV CHAR(10)
AS
BEGIN
    DELETE FROM SINH_VIEN WHERE MaSV = @MaSV;
END
GO

-- --- LỚP ---

CREATE PROCEDURE sp_ThemLop @MaLop CHAR(10), @TenLop NVARCHAR(100), @MaKhoa VARCHAR(10)
AS
BEGIN
    INSERT INTO LOP (MALOP, TENLOP, MAKHOA) VALUES (@MaLop, @TenLop, @MaKhoa);
END
GO

CREATE PROCEDURE sp_SuaLop @MaLop CHAR(10), @TenLop NVARCHAR(100), @MaKhoa VARCHAR(10)
AS
BEGIN
    UPDATE LOP SET TENLOP = @TenLop, MAKHOA = @MaKhoa WHERE MALOP = @MaLop;
END
GO

CREATE PROCEDURE sp_XoaLop @MaLop CHAR(10)
AS
BEGIN
    DELETE FROM LOP WHERE MALOP = @MaLop;
END
GO

-- --- KHOA ---

CREATE PROCEDURE sp_ThemKhoa @MaKhoa VARCHAR(10), @TenKhoa NVARCHAR(100)
AS
BEGIN
    INSERT INTO KHOA (MAKHOA, TENKHOA) VALUES (@MaKhoa, @TenKhoa);
END
GO

CREATE PROCEDURE sp_SuaKhoa @MaKhoa VARCHAR(10), @TenKhoa NVARCHAR(100)
AS
BEGIN
    UPDATE KHOA SET TENKHOA = @TenKhoa WHERE MAKHOA = @MaKhoa;
END
GO

CREATE PROCEDURE sp_XoaKhoa @MaKhoa VARCHAR(10)
AS
BEGIN
    DELETE FROM KHOA WHERE MAKHOA = @MaKhoa;
END
GO

-- --- GiangVien ---

CREATE PROCEDURE sp_ThemGiangVien @MaGV CHAR(10), @HoTen NVARCHAR(100), @MaKhoa VARCHAR(10), @Email VARCHAR(100)
AS
BEGIN
    INSERT INTO GIANG_VIEN (MaGV, HoTen, MAKHOA, Email, PUBLIC_KEY, PIN_HASH) 
    VALUES (@MaGV, @HoTen, @MaKhoa, @Email, '98765432109876543210987654321098765432109876543210', CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', '123456'), 2));
END
GO

CREATE PROCEDURE sp_SuaGiangVien @MaGV CHAR(10), @HoTen NVARCHAR(100), @MaKhoa VARCHAR(10), @Email VARCHAR(100)
AS
BEGIN
    UPDATE GIANG_VIEN SET HoTen = @HoTen, MAKHOA = @MaKhoa, Email = @Email WHERE MaGV = @MaGV;
END
GO

CREATE PROCEDURE sp_XoaGiangVien @MaGV CHAR(10)
AS
BEGIN
    DELETE FROM GIANG_VIEN WHERE MaGV = @MaGV;
END
GO

-- --- QUẢN LÝ TÀI KHOẢN ---

CREATE PROCEDURE sp_ThemTaiKhoan 
    @User VARCHAR(50), 
    @PassRaw NVARCHAR(100), -- Mật khẩu thô
    @Role VARCHAR(20), 
    @Email VARCHAR(100), 
    @ID VARCHAR(20)
AS
BEGIN
    -- Hash SHA256 và chuyển sang Hex String
    DECLARE @HashVarBinary VARBINARY(64) = HASHBYTES('SHA2_256', @PassRaw);
    DECLARE @HashString VARCHAR(255) = CONVERT(VARCHAR(255), @HashVarBinary, 2);

    INSERT INTO TAIKHOAN (USERNAME, PASSWORD_HASH, ROLE, Email, RELATED_ID)
    VALUES (@User, @HashString, @Role, @Email, @ID);
END
GO

CREATE PROCEDURE sp_SuaTaiKhoan 
    @User VARCHAR(50), @PassRaw NVARCHAR(100), @Role VARCHAR(20), 
    @Email VARCHAR(100), @ID VARCHAR(20)
AS
BEGIN
    IF @PassRaw IS NULL OR @PassRaw = ''
    BEGIN
        UPDATE TAIKHOAN SET ROLE = @Role, Email = @Email, RELATED_ID = @ID WHERE USERNAME = @User;
    END
    ELSE
    BEGIN
        DECLARE @HashVarBinary VARBINARY(64) = HASHBYTES('SHA2_256', @PassRaw);
        DECLARE @HashString VARCHAR(255) = CONVERT(VARCHAR(255), @HashVarBinary, 2);
        
        UPDATE TAIKHOAN SET PASSWORD_HASH = @HashString, ROLE = @Role, Email = @Email, RELATED_ID = @ID WHERE USERNAME = @User;
    END
END
GO

CREATE PROCEDURE sp_XoaTaiKhoan @User VARCHAR(50)
AS
BEGIN
    DELETE FROM TAIKHOAN WHERE USERNAME = @User;
END
GO

CREATE PROCEDURE sp_DoiMatKhau @User VARCHAR(50), @NewPassRaw NVARCHAR(100)
AS
BEGIN
    DECLARE @HashVarBinary VARBINARY(64) = HASHBYTES('SHA2_256', @NewPassRaw);
    DECLARE @HashString VARCHAR(255) = CONVERT(VARCHAR(255), @HashVarBinary, 2);

    UPDATE TAIKHOAN SET PASSWORD_HASH = @HashString WHERE USERNAME = @User;
END
GO

CREATE PROCEDURE sp_KiemTraDangNhap
    @User VARCHAR(50),
    @PassRaw NVARCHAR(100)
AS
BEGIN
    DECLARE @InputHash VARBINARY(64) = HASHBYTES('SHA2_256', @PassRaw);
    DECLARE @InputString VARCHAR(255) = CONVERT(VARCHAR(255), @InputHash, 2);

    SELECT USERNAME, ROLE, RELATED_ID, Email 
    FROM TAIKHOAN 
    WHERE USERNAME = @User AND PASSWORD_HASH = @InputString;
END
GO

CREATE PROCEDURE sp_DoiMaPin @MaSV CHAR(10), @Pin VARCHAR(255)
AS
BEGIN
    UPDATE PING SET PIN_HASH = @Pin WHERE MASV = @MaSV;
END
GO

-- --- QUẢN LÝ HỌC PHẦN & TKB ---

CREATE PROCEDURE sp_ThemHocPhan
    @MaHP CHAR(10), @TenHP NVARCHAR(100), @STC INT, @HK INT,
    @NamHoc CHAR(9), @MaLop CHAR(10), @GV NVARCHAR(100), @LichHoc NVARCHAR(50)
AS
BEGIN
    IF EXISTS (SELECT 1 FROM HOC_PHAN WHERE MAHP = @MaHP and MaLop = @MaLop)
    BEGIN
        THROW 51000, N'Mã học phần đã tồn tại!', 1;
    END
    ELSE
    BEGIN
        INSERT INTO HOC_PHAN(MAHP,TenHP, SoTinChi, HocKy, NamHoc, MaLop, LichHoc, GiangVien) VALUES (@MaHP, @TenHP, @STC, @HK, @NamHoc, @MaLop, @LichHoc, @GV);
    END
END
GO

SELECT * from THOI_KHOA_BIEU
GO

CREATE PROCEDURE sp_DangKyHocPhan
    @MaSV CHAR(10), @MaHP CHAR(10), @TenHP NVARCHAR(100), @HOCKY INT, @NamHoc CHAR(9), @MaLop CHAR(10),
    @LichHoc NVARCHAR(50)
AS
BEGIN
    IF NOT EXISTS (SELECT 1 FROM SINH_VIEN WHERE MaSV = @MaSV)
        THROW 51000, N'Sinh viên không tồn tại!', 1;
    ELSE IF NOT EXISTS (SELECT 1 FROM HOC_PHAN WHERE MAHP = @MaHP and NamHoc = @NamHoc and HocKy = @HOCKY)
        THROW 51000, N'Học phần không tồn tại!', 1;
    ELSE IF EXISTS (SELECT 1 FROM THOI_KHOA_BIEU WHERE MASV = @MaSV AND MAHP = @MaHP and NamHoc = @NamHoc and HocKy = @HOCKY)
        THROW 51000, N'Sinh viên đã đăng ký môn học này rồi!', 1;
    ELSE
    BEGIN
        INSERT INTO THOI_KHOA_BIEU (MASV, MAHP, HOCKY, TenHP, NamHoc, MaLop, LichHoc) 
        VALUES (@MaSV, @MaHP, @HOCKY, @TenHP, @NamHoc, @MaLop, @LichHoc);
    END
END
GO



CREATE PROCEDURE sp_SuaHocPhan
    @MaHP CHAR(10), @TenHP NVARCHAR(100), @STC INT, @HK INT,
    @NamHoc CHAR(9), @MaLop CHAR(10), @LichHoc NVARCHAR(50)
AS
BEGIN
    UPDATE HOC_PHAN SET 
        TenHP = @TenHP, SoTinChi = @STC, HocKy = @HK, NamHoc = @NamHoc,
        MaLop = @MaLop, LichHoc = @LichHoc 
    WHERE MAHP = @MaHP;
END
GO

CREATE PROCEDURE sp_AdminXoaMonHoc @MaHP CHAR(10)
AS
BEGIN
    DELETE FROM HOC_PHAN WHERE MAHP = @MaHP;
END
GO

CREATE PROCEDURE sp_XoaHocPhan @MaHP CHAR(10)
AS
BEGIN
    EXEC sp_AdminXoaMonHoc @MaHP;
END
GO

CREATE PROCEDURE sp_XemDanhSachHocPhan
AS
BEGIN
    SELECT hp.*, l.TENLOP, k.TENKHOA
    FROM HOC_PHAN hp
    LEFT JOIN LOP l ON hp.MaLop = l.MALOP
    LEFT JOIN KHOA k ON l.MAKHOA = k.MAKHOA
    ORDER BY hp.NamHoc DESC, hp.HocKy, hp.TenHP;
END
GO

CREATE PROCEDURE sp_TimKiemHocPhan @TuKhoa NVARCHAR(100)
AS
BEGIN
    SELECT * FROM HOC_PHAN
    WHERE MAHP LIKE CONCAT('%', @TuKhoa, '%') 
       OR TenHP LIKE CONCAT('%', @TuKhoa, '%')
       OR MaLop LIKE CONCAT('%', @TuKhoa, '%');
END
GO

-- Kiểm tra Ping để lấy bảng điểm

CREATE PROCEDURE sp_LayBangDiem
    @MaSV CHAR(10) -- Đã bỏ tham số @PingCode
AS
BEGIN
    SET NOCOUNT ON;
    -- Không cần IF EXISTS kiểm tra PIN ở đây nữa, Node.js sẽ lo việc đó
    SELECT 
        hp.MAHP,
        hp.TenHP,
        hp.SoTinChi,
        hp.HocKy,
        hp.NamHoc,
        d.DIEM_MAHOA 
    FROM DIEM d
    JOIN HOC_PHAN hp ON d.MAHP = hp.MAHP and hp.HocKy = d.HOCKY and d.NamHoc = hp.NamHoc
    WHERE d.MASV = @MaSV;
END
GO


CREATE PROCEDURE sp_GetSinhVienByMSSV
    @MSSV NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
		MaSV,
		HoTen,
		NgaySinh,    
		NoiSinh,     
		GioiTinh,    
		MaLop,       
		Email,       
		KhoaHoc,           
		BacDaoTao,   
		LoaiHinhDT,    
		NganhDT,     
		ChuyenNganh, 
		Khoa,
		TinhTrang   
    FROM SINH_VIEN
    WHERE MaSV = @MSSV;
END;
GO


CREATE PROCEDURE sp_GetMalopMaKhoaByMSSV
    @MSSV NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT sv.MaLop AS sv, k.MAKHOA AS mk 
	FROM SINH_VIEN sv 
    JOIN KHOA k ON sv.Khoa = k.MAKHOA -- <--- Sửa sv.NganhDT thành sv.Khoa
    WHERE sv.MaSV = @MSSV
END;
GO

CREATE PROCEDURE sp_CapNhatPin 
    @MaSV CHAR(10), 
    @PinHash VARCHAR(255)
AS
BEGIN
    IF EXISTS (SELECT 1 FROM PING WHERE MASV = @MaSV)
        UPDATE PING SET PIN_HASH = @PinHash, CREATED_AT = GETDATE() WHERE MASV = @MaSV;
    ELSE
        INSERT INTO PING (MASV, PIN_HASH) VALUES (@MaSV, @PinHash);
END
GO

-- --- FUNCTIONS ---

CREATE FUNCTION fn_TongTinChiSinhVien (@MaSV CHAR(10))
RETURNS INT
AS
BEGIN
    DECLARE @TongTinChi INT;
    SELECT @TongTinChi = ISNULL(SUM(hp.SoTinChi), 0)
    FROM DIEM d JOIN HOC_PHAN hp ON d.MAHP = hp.MAHP
    WHERE d.MASV = @MaSV;
    RETURN @TongTinChi;
END
GO

---------Hàm băm mã ping --------
CREATE PROCEDURE dbo.HashAndSavePIN
    @id CHAR(9),
    @pin NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @hashed VARCHAR(64);

    -- Băm SHA-256
    SET @hashed = CONVERT(VARCHAR(64),
                          HASHBYTES('SHA2_256', @pin),
                          2);

    -- Cập nhật vào bảng
    UPDATE PING
    SET PIN_HASH = @hashed
    WHERE MASV = @id;
END
GO

----Kiểm tra PIN -----
CREATE PROCEDURE sp_VerifyPIN
    @MASV CHAR(9),
    @PIN NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM PING
        WHERE MASV = @MASV
        AND PIN_HASH = CONVERT(VARCHAR(64),
                               HASHBYTES('SHA2_256', @PIN),
                               2)
    )
        SELECT 1 AS IsValid;
    ELSE
        SELECT 0 AS IsValid;
END
GO


------- lấy thời khóa biểu -----------
IF OBJECT_ID('sp_LayThoiKhoaBieu', 'P') IS NOT NULL 
    DROP PROCEDURE sp_LayThoiKhoaBieu;
GO

CREATE PROCEDURE sp_LayThoiKhoaBieu
	@NamHoc CHAR(9),
    @MASV NVARCHAR(20),
    @HocKy INT 
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        tkb.MAHP,
        tkb.TenHP,
        tkb.MaLop,
        tkb.LichHoc,
		hp.SoTinChi
    FROM THOI_KHOA_BIEU tkb join HOC_PHAN hp on hp.MAHP = tkb.MAHP
    WHERE tkb.MASV = @MASV
        AND tkb.HocKy = @HocKy and tkb.NamHoc = @NamHoc
    ORDER BY tkb.LichHoc
END
GO
------ Lấy sinh viên theo mã môn học, năm học, học kì ------------
IF OBJECT_ID('sp_LaySinhVienTheoHocPhan', 'P') IS NOT NULL 
    DROP PROCEDURE sp_LaySinhVienTheoHocPhan;
GO 

CREATE PROCEDURE sp_LaySinhVienTheoHocPhan
	@NamHoc CHAR(9),
    @HocKy INT,
	@MaHP CHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT
		tkb.MaSV
    FROM THOI_KHOA_BIEU tkb where tkb.NamHoc = @NamHoc and tkb.HOCKY = @HocKy and tkb.MAHP = @MaHP
    ORDER BY tkb.MaSV
END
GO

-- SP Ghi nhận đăng nhập
CREATE PROCEDURE sp_GhiLogDangNhap
    @User VARCHAR(50),
    @IP VARCHAR(50),
    @Location NVARCHAR(100)
AS
BEGIN
    INSERT INTO LICH_SU_DANG_NHAP (USERNAME, IP_ADDRESS, LOCATION)
    VALUES (@User, @IP, @Location);
END
GO

-- SP Lấy lịch sử đăng nhập (Lấy 5 lần gần nhất để hiển thị ra Dashboard)
CREATE PROCEDURE sp_LayLichSuDangNhap
    @User VARCHAR(50)
AS
BEGIN
    SELECT TOP 5 
        THOI_GIAN, 
        IP_ADDRESS, 
        LOCATION 
    FROM LICH_SU_DANG_NHAP
    WHERE USERNAME = @User
    ORDER BY THOI_GIAN DESC;
END
GO


---------- Lấy danh sách học phần ------------




-- =================================================================================
-- DỮ LIỆU MẪU 
-- =================================================================================

-- KHOA
INSERT INTO KHOA (MAKHOA, TENKHOA) VALUES
('TTH', N'Khoa Toán – Tin học'),
('CNTT', N'Khoa Công nghệ Thông tin'),
('VL', N'Khoa Vật lý'),
('HH', N'Khoa Hóa học'),
('DC', N'Khoa Địa chất'),
('SH', N'Khoa Sinh học'),
('CNSH', N'Khoa Công nghệ Sinh học'),
('KHMT', N'Khoa Khoa học Môi trường'),
('HDH', N'Khoa Hải dương học'),
('KHVL', N'Khoa Khoa học Vật liệu'),
('DTVT', N'Khoa Điện tử – Viễn thông');
GO

-- LỚP 
INSERT INTO LOP (MALOP, TENLOP, MAKHOA) VALUES
('L01_CNTT', N'Kỹ thuật phần mềm K45', 'CNTT'),
('L02_CNTT', N'Hệ thống thông tin K45', 'CNTT'),
('L03_TTH',  N'Toán ứng dụng K46', 'TTH'),
('L04_VL',   N'Vật lý hạt nhân K44', 'VL'),
('L05_HH',   N'Hóa dược K45', 'HH'),
('L06_SH',   N'Công nghệ sinh học K47', 'SH'),
('L07_DTVT', N'Viễn thông K45', 'DTVT'),
('L08_KHMT', N'Khoa học môi trường K46', 'KHMT'),
('L09_HDH',  N'Hải dương học K45', 'HDH'),
('L10_KHVL', N'Khoa học vật liệu K44', 'KHVL');
GO

-- GIẢNG VIÊN 
INSERT INTO GIANG_VIEN (MaGV, HoTen, MAKHOA, Email, PUBLIC_KEY, PIN_HASH) VALUES
('GV001', N'TS. Nguyễn Văn An', 'CNTT', 'an.nguyen@edu.vn', '98765432109876543210987654321098765432109876543210', CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', '123456'), 2)),
('GV002', N'ThS. Trần Thị Bích', 'CNTT', 'bich.tran@edu.vn', '98765432109876543210987654321098765432109876543210', CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', '123456'), 2)),
('GV003', N'PGS. Lê Văn Cường', 'TTH', 'cuong.le@edu.vn', '98765432109876543210987654321098765432109876543210', CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', '123456'), 2)),
('GV004', N'TS. Phạm Minh Dung', 'VL', 'dung.pham@edu.vn', '98765432109876543210987654321098765432109876543210', CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', '123456'), 2)),
('GV005', N'ThS. Hoàng Văn Em', 'HH', 'em.hoang@edu.vn', '98765432109876543210987654321098765432109876543210', CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', '123456'), 2)),
('GV006', N'TS. Ngô Thị F', 'SH', 'f.ngo@edu.vn', '98765432109876543210987654321098765432109876543210', CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', '123456'), 2)),
('GV007', N'ThS. Đặng Văn G', 'DTVT', 'g.dang@edu.vn', '98765432109876543210987654321098765432109876543210', CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', '123456'), 2)),
('GV008', N'TS. Bùi Thị H', 'KHMT', 'h.bui@edu.vn', '98765432109876543210987654321098765432109876543210', CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', '123456'), 2)),
('GV009', N'GS. Lý Văn I', 'HDH', 'i.ly@edu.vn', '98765432109876543210987654321098765432109876543210', CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', '123456'), 2)),
('GV010', N'TS. K', 'KHVL', 'k@edu.vn', '98765432109876543210987654321098765432109876543210', CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', '123456'), 2));
GO

SELECT* from KHOA 

-- SINH VIÊN
EXEC sp_ThemSinhVien 'SV001', N'Nguyễn Thanh Tùng', '2004-01-15', N'Hà Nội', N'Nam', 'L01_CNTT', 'sv001@st.edu.vn', '2022-2026', N'Đại học', N'Chính quy', N'Công nghệ thông tin', 'CNTT', N'Kỹ thuật phần mềm';
EXEC sp_ThemSinhVien 'SV002', N'Trần Thị Mai', '2004-03-20', N'TP.HCM', N'Nữ', 'L01_CNTT', 'sv002@st.edu.vn', '2022-2026', N'Đại học', N'Chính quy', N'Công nghệ thông tin', 'CNTT', N'Kỹ thuật phần mềm';
EXEC sp_ThemSinhVien 'SV003', N'Lê Văn Long', '2004-05-10', N'Đà Nẵng', N'Nam', 'L02_CNTT', 'sv003@st.edu.vn', '2022-2026', N'Đại học', N'Chính quy', N'Công nghệ thông tin', N'CNTT', N'Hệ thống thông tin';
EXEC sp_ThemSinhVien 'SV004', N'Phạm Thị Hương', '2003-11-05', N'Cần Thơ', N'Nữ', 'L03_TTH', 'sv004@st.edu.vn', '2021-2025', N'Đại học', N'Chính quy', N'Toán - Tin', N'TTH', N'Toán ứng dụng';
EXEC sp_ThemSinhVien 'SV005', N'Hoàng Văn Nam', '2004-08-22', N'Hải Phòng', N'Nam', 'L04_VL', 'sv005@st.edu.vn', '2022-2026', N'Đại học', N'Chính quy', N'Vật lý', N'VL', N'Vật lý hạt nhân';
EXEC sp_ThemSinhVien 'SV006', N'Ngô Thị Tuyết', '2004-12-30', N'Nghệ An', N'Nữ', 'L05_HH', 'sv006@st.edu.vn', '2022-2026', N'Đại học', N'Chính quy', N'Hóa học', N'HH', N'Hóa dược';
EXEC sp_ThemSinhVien 'SV007', N'Đặng Văn Hùng', '2003-02-14', N'Nam Định', N'Nam', 'L06_SH', 'sv007@st.edu.vn', '2021-2025', N'Đại học', N'Chất lượng cao', N'Sinh học', N'CNSH', N'Công nghệ sinh học';
EXEC sp_ThemSinhVien 'SV008', N'Bùi Thị Lan', '2004-09-09', N'Thanh Hóa', N'Nữ', 'L07_DTVT', 'sv008@st.edu.vn', '2022-2026', N'Đại học', N'Chính quy', N'Điện tử - VIễn thông', N'DTVT', N'Viễn thông';
EXEC sp_ThemSinhVien 'SV009', N'Lý Văn Kiệt', '2004-07-27', N'Bình Dương', N'Nam', 'L08_KHMT', 'sv009@st.edu.vn', '2022-2026', N'Đại học', N'Chính quy', N'Môi trường', N'KHMT' ,N'Khoa học môi trường';
EXEC sp_ThemSinhVien 'SV010', N'Vũ Thị Yến', '2004-04-18', N'Đồng Nai', N'Nữ', 'L01_CNTT', 'sv010@st.edu.vn', '2022-2026', N'Đại học', N'Chính quy', N'Công nghệ thông tin', N'CNTT', N'Kỹ thuật phần mềm';
GO

-- TÀI KHOẢN
EXEC sp_ThemTaiKhoan 'admin', '123456', 'ADMIN', 'admin@sys.edu.vn', NULL;

EXEC sp_ThemTaiKhoan 'gv001', '123456', 'GIANGVIEN', 'an.nguyen@edu.vn', 'GV001';
EXEC sp_ThemTaiKhoan 'gv002', '123456', 'GIANGVIEN', 'bich.tran@edu.vn', 'GV002';

EXEC sp_ThemTaiKhoan 'sv001', '123456', 'SINHVIEN', 'sv001@st.edu.vn', 'SV001';
EXEC sp_ThemTaiKhoan 'sv002', '123456', 'SINHVIEN', 'sv002@st.edu.vn', 'SV002';
EXEC sp_ThemTaiKhoan 'sv003', '123456', 'SINHVIEN', 'sv003@st.edu.vn', 'SV003';
EXEC sp_ThemTaiKhoan 'sv004', '123456', 'SINHVIEN', 'sv004@st.edu.vn', 'SV004';
EXEC sp_ThemTaiKhoan 'sv005', '123456', 'SINHVIEN', 'sv005@st.edu.vn', 'SV005';
EXEC sp_ThemTaiKhoan 'sv006', '123456', 'SINHVIEN', 'sv006@st.edu.vn', 'SV006';
EXEC sp_ThemTaiKhoan 'sv007', '123456', 'SINHVIEN', 'sv007@st.edu.vn', 'SV007';
EXEC sp_ThemTaiKhoan 'sv008', '123456', 'SINHVIEN', 'sv008@st.edu.vn', 'SV008';
EXEC sp_ThemTaiKhoan 'sv009', '123456', 'SINHVIEN', 'sv009@st.edu.vn', 'SV009';
EXEC sp_ThemTaiKhoan 'sv010', '123456', 'SINHVIEN', 'sv010@st.edu.vn', 'SV010';
GO

-- HỌC PHẦN 
INSERT INTO HOC_PHAN (MAHP, TenHP, SoTinChi, HocKy, NamHoc, MaLop, LichHoc, GIANGVIEN) VALUES
('HP001', N'Cấu trúc dữ liệu và giải thuật', 4, 1, '2023-2024', 'L01_CNTT', 'T4(1-4)-P.cs2:D211', N'TS. Ngô Thị Vân'),
('HP002', N'Cơ sở dữ liệu', 4, 1, '2023-2024', 'L01_CNTT', 'T4(1-4)-P.cs2:D211', N'TS. Ngô Thị Vân'),
('HP003', N'Lập trình Web', 3, 2, '2023-2024', 'L02_CNTT', 'T4(1-4)-P.cs2:D211', N'TS. Ngô Thị Vân'),
('HP004', N'Giải tích 1', 3, 1, '2023-2024', 'L03_TTH', 'T4(1-4)-P.cs2:D211', N'TS. Ngô Thị Vân'),
('HP005', N'Vật lý đại cương 1', 3, 1, '2023-2024', 'L04_VL', 'T4(1-4)-P.cs2:D211', N'TS. Ngô Thị Vân'),
('HP006', N'Hóa vô cơ', 3, 1, '2023-2024', 'L05_HH', 'T4(1-4)-P.cs2:D211', N'TS. Ngô Thị Vân'),
('HP007', N'Sinh học tế bào', 3, 1, '2023-2024', 'L06_SH', 'T4(1-4)-P.cs2:D211', N'TS. Ngô Thị Vân'),
('HP008', N'Mạch điện tử', 3, 1, '2023-2024', 'L07_DTVT', 'T4(1-4)-P.cs2:D211', N'TS. Ngô Thị Vân'),
('HP009', N'Đại cương về môi trường', 2, 1, '2023-2024', 'L08_KHMT', 'T4(1-4)-P.cs2:D211', N'TS. Ngô Thị Vân'),
('HP010', N'Nhập môn Khoa học Vật liệu', 2, 1, '2023-2024', 'L10_KHVL', 'T4(1-4)-P.cs2:D211', N'TS. Ngô Thị Vân');
GO


INSERT INTO HOC_PHAN (MAHP, TenHP, SoTinChi, HocKy, NamHoc, MaLop, LichHoc, GIANGVIEN) VALUES
('HP012', N'Nhập môn cơ sở vật liệu', 4, 2, '2025-2026', 'L01_CNTT', 'T4(1-4)-P.cs2:D211', N'TS. Ngô Thị Vân');

SELECT * from HOC_PHAN 

-- THỜI KHÓA BIỂU
EXEC sp_DangKyHocPhan 'SV001', 'HP001', N'Cấu trúc dữ liệu và giải thuật', 1, '2023-2024', 'L01_CNTT','T4(1-4)-P.cs2:D211';
EXEC sp_DangKyHocPhan 'SV001', 'HP002', N'Cơ sở dữ liệu', 1, '2023-2024', 'L01_CNTT','T4(1-4)-P.cs2:D211';
EXEC sp_DangKyHocPhan 'SV002', 'HP001', N'Cấu trúc dữ liệu và giải thuật', 1, '2023-2024', 'C301', 'T4(1-4)-P.cs2:D211';
EXEC sp_DangKyHocPhan 'SV002', 'HP002', N'Cơ sở dữ liệu', 1, '2023-2024', 'C302', 'T4(1-4)-P.cs2:D211';
EXEC sp_DangKyHocPhan 'SV003', 'HP003', N'Lập trình Web', 2, '2023-2024', 'LAB3', 'T4(1-4)-P.cs2:D211';
EXEC sp_DangKyHocPhan 'SV004', 'HP004', N'Giải tích 1', 1, '2023-2024', 'B101', 'T4(1-4)-P.cs2:D211';
EXEC sp_DangKyHocPhan 'SV005', 'HP005', N'Vật lý đại cương 1', 1, '2023-2024', 'A205', 'T4(1-4)-P.cs2:D211';
EXEC sp_DangKyHocPhan 'SV006', 'HP006', N'Hóa vô cơ', 1, '2023-2024', 'LAB_HOA', 'T4(1-4)-P.cs2:D211';
EXEC sp_DangKyHocPhan 'SV007', 'HP007', N'Sinh học tế bào', 1, '2023-2024', 'B202', 'T4(1-4)-P.cs2:D211';
EXEC sp_DangKyHocPhan 'SV008', 'HP008', N'Mạch điện tử', 1, '2023-2024', 'C404', 'T4(1-4)-P.cs2:D211';
EXEC sp_DangKyHocPhan 'SV001', 'HP012', N'Nhập môn cơ sở vật liệu', 2, '2025-2026', 'C404', 'T4(1-4)-P.cs2:D211';

GO



CREATE TABLE SNT_IMPORT (
    Prime INT
);

-- Tạo bảng SNT_IMPORT 
BULK INSERT SNT_IMPORT
FROM 'D:\HCMUS\TotNghiep\QLSV\primes.txt'
WITH (
    DATAFILETYPE = 'char',
    ROWTERMINATOR = '0x0D0A'
);

-- Import SNT vào bảng SNT 
INSERT INTO SNT(Primes)
SELECT Prime
FROM SNT_IMPORT;





EXEC sp_GetSinhVienByMSSV @MSSV = 'sv001'

SELECT *
FROM TAIKHOAN;

SELECT* 
From SINH_VIEN;

SELECT*
FROM KHOA

SELECT* from TAIKHOAN

SELECT* from THOI_KHOA_BIEU where MaSV = 'SV002'

SELECT* from HOC_PHAN 

SELECT* from DIEM 
SELECT* from PING

EXEC sp_VerifyPIN 'SV001', 'SV001'

EXEC dbo.HashAndSavePIN 
     @id = 'SV001',
     @pin = 'SV001';

Select* from LOP 

EXEC sp_LaySinhVienTheoHocPhan '2023-2024', '1', 'HP001'

SELECT DISTINCT HocKy
    FROM HOC_PHAN where NamHoc = '2025-2026'
    ORDER BY HocKy

SELECT MaHP, TenHP
    FROM HOC_PHAN
    WHERE NamHoc = '2025-2026' AND HocKy = '2'

EXEC sp_LaySinhVienTheoHocPhan '2025-2026', 2 , 'HP012'


Select* from KHOA 

SELECT* from DIEM 

Select* from HOC_PHAN 

