// 서비스 워커 설치 단계
self.addEventListener('install', function(event) {
  console.log('Service Worker 설치 중...');
  
  // 리소스를 캐시하는 코드
  event.waitUntil(
    caches.open('my-cache-v1').then(function(cache) {
      console.log('캐시 저장 중...');
      
      const resourcesToCache = [
        '/',
        '/index.html',
        '/styles.css',
        '/script.js',
        '/map.html'
      ];

      // 각 리소스를 캐시 저장
      return Promise.all(
        resourcesToCache.map(function(url) {
          return fetch(url).then(function(response) {
            if (!response.ok) {
              throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
            }
            return cache.put(url, response);
          });
        })
      );
    }).catch(function(error) {
      console.error('캐시 저장 중 오류 발생:', error);
    })
  );
});

// 서비스 워커 활성화 단계
self.addEventListener('activate', function(event) {
  console.log('Service Worker 활성화');

  const cacheWhitelist = ['my-cache-v1']; // 사용할 캐시 목록
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log(`캐시 삭제: ${cacheName}`);
            return caches.delete(cacheName);  // 더 이상 사용되지 않는 캐시 삭제
          }
        })
      );
    })
  );
});

// fetch 이벤트: 네트워크 우선 처리
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).then((response) => {
      const responseClone = response.clone();  // 캐시 저장을 위한 복제본
      caches.open('my-cache').then((cache) => {
        cache.put(event.request, responseClone);  // 응답을 캐시에 저장
      });

      return response;  // 원본 응답 반환
    })
  );
});

// 메시지 처리: 클라이언트로부터 로그인 정보 받기
self.addEventListener('message', function(event) {
  if (event.data.type === 'USER_LOGGED_IN') {
    const user = event.data.user;  // 클라이언트로부터 받은 사용자 정보
    console.log('로그인한 사용자:', user);

    // 로그인 정보를 서버에 전송 (POST 요청)
    fetch('/api/saveUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user)  // 사용자 정보 서버로 전송
    })
    .then(response => response.json())
    .then(data => {
      console.log('서버 응답:', data);
    })
    .catch(error => {
      console.error('서버 통신 오류:', error);
    });

    // 사용자 정보를 캐시에도 저장 (필요시)
    caches.open('user-info-cache').then(function(cache) {
      cache.put('/user-info', new Response(JSON.stringify(user)));
    });
  }
});
