-- Kiểm tra danh sách học phần năm 2025-2026 HK2 theo giảng viên
SELECT
    LTRIM(RTRIM(MaGV)) AS MaGV,
    MAX(GiangVien) AS GiangVien,
    LTRIM(RTRIM(MaLop)) AS MaLop,
    LTRIM(RTRIM(MaHP)) AS MaHP,
    TenHP,
    LTRIM(RTRIM(NamHoc)) AS NamHoc,
    HocKy,
    COUNT(*) OVER (PARTITION BY LTRIM(RTRIM(MaGV))) AS SoHocPhanCuaGV
FROM HOC_PHAN
WHERE LTRIM(RTRIM(NamHoc)) = '2025-2026'
  AND HocKy = 2
ORDER BY MaGV, MaLop, MaHP;

-- Kiểm tra học phần có bị trùng lỗi không
SELECT
    LTRIM(RTRIM(MaGV)) AS MaGV,
    LTRIM(RTRIM(TenHP)) AS TenHP,
    LTRIM(RTRIM(MaLop)) AS MaLop,
    LTRIM(RTRIM(NamHoc)) AS NamHoc,
    HocKy,
    COUNT(*) AS SoLanTrung
FROM HOC_PHAN
WHERE LTRIM(RTRIM(NamHoc)) = '2025-2026'
  AND HocKy = 2
GROUP BY
    LTRIM(RTRIM(MaGV)),
    LTRIM(RTRIM(TenHP)),
    LTRIM(RTRIM(MaLop)),
    LTRIM(RTRIM(NamHoc)),
    HocKy
HAVING COUNT(*) > 1
ORDER BY SoLanTrung DESC, MaGV, TenHP;
