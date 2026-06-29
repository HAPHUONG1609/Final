const sql = require("mssql");
const pool = require("../db");

async function saveDiemCRT(mssv, C) {
  const query = `
    IF EXISTS (SELECT 1 FROM DIEM_CRT WHERE MASV = @mssv)
    BEGIN
        UPDATE DIEM_CRT
        SET C = @C
        WHERE MASV = @mssv
    END
    ELSE
    BEGIN
        INSERT INTO DIEM_CRT (MASV, C)
        VALUES (@mssv, @C)
    END
  `;

  const request = pool.request();
  request.input("mssv", sql.Char(10), mssv);
  request.input("C", sql.NVarChar(sql.MAX), C);

  return request.query(query);
}

module.exports = {
  saveDiemCRT,
};