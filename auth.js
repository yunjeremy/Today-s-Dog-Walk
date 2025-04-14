// auth.js

// 카카오 로그인 초기화
// Kakao.init('44322da032bafc078a9ac9bb9cae9777');
// console.log(Kakao.isInitialized());
// if (!Kakao.isInitialized()) {
//     Kakao.init('44322da032bafc078a9ac9bb9cae9777');
//     console.log(Kakao.isInitialized()); // true가 출력되어야 함
//   }

// 카카오 로그인 함수
function kakaoLogin() {
  Kakao.Auth.login({
    success: function (authObj) {
      // 로그인 성공 시 사용자 정보 요청
      Kakao.API.request({
        url: '/v2/user/me',
        success: function (res) {
          console.log(res); // 사용자 정보 콘솔 출력
          const nickname = res.properties.nickname; // 닉네임 가져오기
          const id = res.id;

          // 로그인 정보를 localStorage에 저장
          localStorage.setItem('userInfo', JSON.stringify({ id, nickname }));

          // 서비스 워커에 로그인 정보를 전달
          if (navigator.serviceWorker) {
            navigator.serviceWorker.ready.then(function (registration) {
              registration.active.postMessage({
                type: 'USER_LOGGED_IN',
                user: { id, nickname }
              });
            });
          }

          window.location.href = 'home.html'; // 로그인 후 이동
        },
        fail: function (error) {
          console.error(error);
        }
      });
    },
    fail: function (err) {
      console.error(err);
    }
  });
}

// 로그인 상태 확인
function checkLoginStatus() {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  if (userInfo) {
    return userInfo;
  }
  return null;
}

// 로그아웃 처리
function logout() {
  localStorage.removeItem('userInfo');
  window.location.href = 'login.html';  // 로그아웃 후 로그인 페이지로 리다이렉트
}
