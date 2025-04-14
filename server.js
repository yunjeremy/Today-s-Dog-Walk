// 필요한 패키지 로드
const express = require('express');
const mysql = require('mysql2');  // MySQL 연결을 위한 패키지
const app = express();
app.use(express.json());  // JSON 요청 본문을 처리

// MySQL 연결 설정
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',  // MySQL 사용자명
  password: '',  // 본인의 MySQL 비밀번호
  database: 'walk_members'  // 본인이 사용할 데이터베이스 이름
});

// MySQL 연결 확인
db.connect((err) => {
  if (err) {
    console.error('MySQL 연결 실패:', err);
  } else {
    console.log('MySQL 연결 성공');
  }
});

// POST 요청을 처리할 경로 - 사용자 정보 저장
app.post('/api/saveUser', (req, res) => {
  const user = req.body;
  console.log('서버에서 받은 사용자 정보:', user);

  // 사용자 정보를 데이터베이스에 저장하는 코드 (예시)
  const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
  db.execute(query, [user.username, user.password], (err, result) => {
    if (err) {
      console.error('사용자 정보 저장 실패:', err);
      return res.status(500).json({ message: '사용자 정보 저장 실패' });
    }
    res.json({ message: '사용자 정보 저장 완료', user });
  });
});

// POST 요청을 처리할 경로 - 로그인
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // 사용자가 입력한 username과 password를 MySQL에서 조회
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.execute(query, [username, password], (err, results) => {
    if (err) {
      console.error('로그인 실패:', err);
      return res.status(500).json({ message: '로그인 실패' });
    }

    if (results.length > 0) {
      // 로그인 성공
      res.status(200).json({ message: '로그인 성공' });
    } else {
      // 로그인 실패
      res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
    }
  });
});

// 서버 실행
app.listen(3000, () => {
  console.log('서버가 3000번 포트에서 실행 중입니다.');
});
