import sql from 'mssql';

const config = {
  user: 'admin',                         // đổi nếu không dùng sa
  password: '123456',                 // mật khẩu SQL Server
  server: 'DESKTOP-EV3RM6E\\MSSQLSERVER01',
  database: 'QLSV_AT',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

let pool = null;

export async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect(config);
      console.log('✅ Connected to SQL Server');
    } catch (err) {
      console.error('❌ SQL Server connection failed:', err);
      throw err;
    }
  }
  return pool;
}

export { sql };
