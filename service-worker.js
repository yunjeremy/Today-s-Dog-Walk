self.addEventListener('install', function(event) {
  console.log('Service Worker 설치 중...');
  
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

      // 각 리소스를 추가하는 과정에서 오류 발생 시 처리
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

// Service Worker 활성화 이벤트
self.addEventListener('activate', function(event) {
  console.log('Service Worker activated.');
  
  // 이전 버전의 캐시 삭제 (버전 관리)
  const cacheWhitelist = ['my-cache-v1']; // 사용할 캐시 목록
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log(`캐시 삭제: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch 이벤트 - 캐시 우선 전략
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).then((response) => {
      // Response를 clone 해서 사용
      const responseClone = response.clone();

      // 캐시 저장
      caches.open('my-cache').then((cache) => {
        cache.put(event.request, responseClone);
      });

      return response; // 원본 응답 반환
    })
  );
});