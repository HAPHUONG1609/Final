- Xóa db chạy lại QLSV_AT.sql
- Chú ý sửa lại instance trong file Backend\server.js phù hợp với sql ở dòng số 11


mở 3 cửa sổ terminal
1. cd QLSV\java-crypto-service
- Chạy .\mvnw.cmd spring-boot:run
2. cd QLSV\Backend
- npm install 
- node scripts/seedHistoricalEncryptedGrades_CRT.js 
- npm start
3. cd QLSV\Frontend 
- npm install
- npm run dev
