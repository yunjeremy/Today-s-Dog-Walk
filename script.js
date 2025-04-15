class WalkTracker {
  constructor() {
    this.time = 0;
    this.distance = 0; // meters
    this.steps = 0;
    this.timerInterval = null;
    this.geoWatchId = null;
    this.lastPosition = null;
    this.isWalking = false;

    this.lastStepTime = Date.now();
    this.threshold = 16; // 가속도 임계값

    this.walkStratTime = null;
    this.walkEndTime = null;

    this.kakaoMap = new KakaoMap('map');
    this.kakaoMap.loadCurrentLocation();

    this.init();
  }

  init() {
    document.getElementById('startWalkButton').addEventListener('click', () => this.toggleWalk());
    
// 🟢 리셋 버튼 이벤트 연결
document.getElementById('resetButton').addEventListener('click', () => this.resetWalk());

    // localStorage에서 기존 데이터 복원
    this.time = parseInt(localStorage.getItem('walkTime')) || 0;
    this.steps = parseInt(localStorage.getItem('walkSteps')) || 0;
    this.distance = parseFloat(localStorage.getItem('walkDistance')) || 0;
    this.updateDisplay();
  }

  toggleWalk() {
    this.isWalking = !this.isWalking;
    const button = document.getElementById('startWalkButton');
    button.textContent = this.isWalking ? '산책 그만' : '산책 시작';

    if (this.isWalking) {
      this.walkStratTime = new Date();
      this.walkStratTime = this.walkStratTime.toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'});

      console.log('산책 시작:', this.walkStratTime);
      localStorage.setItem('walkStartTime', this.walkStratTime);

      const walkStartTime = localStorage.getItem('walkStartTime');
      const walkEndTime = localStorage.getItem('walkEndTime');

      // 날짜 바뀌면 초기화
      console.log('walkStartTime : ', walkStartTime)
      if (walkEndTime !== null) 
      {
        console.log('pre walkEndTime : ', walkEndTime)
        if (new Date(walkStartTime).getDate !== new Date(walkEndTime).getDate)
        {
          this.resetWalk();
        }
      }

      this.startWalk();
    } else {
      this.walkEndTime = new Date();
      this.walkEndTime = this.walkEndTime.toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'}); 
      localStorage.setItem('walkEndTime', this.walkEndTime);
      console.log('산책 종료 : ', this.walkEndTime)
      console.log(`총 시간 : ${this.time}초`);
      console.log(`총 거리 : ${this.distance}km`);
      console.log(`총 걸음 수 : ${this.steps}`);

      this.stopWalk();
    }
  }

    startWalk() {
      // 버튼에 회전 효과 추가
      document.querySelector('#startWalkButton').classList.add('rotating');
      console.log(`산책 중`);
      this.timerInterval = setInterval(() => this.updateTime(), 1000);
      this.geoWatchId = navigator.geolocation.watchPosition(
      (position) => {
        console.log('위치:', position); 
        this.updateDistance(position);
        this.kakaoMap.updatePath(position); // KakaoMap 인스턴스 사용
      },
      (error) => console.error(error),
      { enableHighAccuracy: true }
    );

    
    // DeviceMotionEvent 권한 요청 및 이벤트 등록
    this.motionHandler = (event) => this.handleMotion(event);

    if (typeof DeviceMotionEvent !== 'undefined') {
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              window.addEventListener('devicemotion', this.motionHandler);
            } else {
              console.warn('🚫 Motion permission denied.');
            }
          })
          .catch(error => console.error('❌ Motion permission error:', error));
      } else {
        window.addEventListener('devicemotion', this.motionHandler);
      }
    } else {
      console.warn('⚠️ DeviceMotionEvent not supported.');
    }
  }

  stopWalk() {
    clearInterval(this.timerInterval);
    navigator.geolocation.clearWatch(this.geoWatchId);
    window.removeEventListener('devicemotion', this.motionHandler);

    // 버튼에서 회전 클래스 제거
    document.querySelector('#startWalkButton').classList.remove('rotating');
  }

  resetWalk() {
    this.time = 0;
    this.distance = 0;
    this.steps = 0;
    this.lastPosition = null;
    this.lastStepTime = Date.now();
    console.log('매일 0시에 초기화되었습니다!');

    kakaoMap.pathDrawer.resetPath(); // ✅ 경로 초기화

    localStorage.removeItem('walkTime');
    localStorage.removeItem('walkSteps');
    localStorage.removeItem('walkDistance');

    this.updateDisplay();
  }


  handleMotion(event) {
    if (!this.isWalking) return;

    const acceleration = event.accelerationIncludingGravity;
    const totalAcceleration = Math.sqrt(
      acceleration.x ** 2 +
      acceleration.y ** 2 +
      acceleration.z ** 2
    );

    const currentTime = Date.now();

    if (totalAcceleration > this.threshold && currentTime - this.lastStepTime > 300) {
      this.steps++;
      this.lastStepTime = currentTime;

      // 거리 업데이트 (1걸음 당 약 0.8m)
      //this.distance = this.steps * 0.8;

      // localStorage 저장
      localStorage.setItem('walkSteps', this.steps);
      localStorage.setItem('walkDistance', this.distance);

      this.updateDisplay();
    }
  }

  updateTime() {
    if (!this.isWalking) return;
    this.time++;
    localStorage.setItem('walkTime', this.time);

    this.updateDisplay();
  }

  updateDistance(position) {
    if (!this.lastPosition) {
      this.lastPosition = position.coords;
      return;
    }

    const current = position.coords;
    const distanceIncrement = this.calculateDistance(
      this.lastPosition.latitude,
      this.lastPosition.longitude,
      current.latitude,
      current.longitude
    );

    this.distance += distanceIncrement;
    this.lastPosition = current;

    this.updateDisplay();
  }

  updateDisplay() {
    document.getElementById('time').textContent = this.formatTime(this.time);
    document.getElementById('distance').textContent = this.formatDistance(this.distance);
    document.getElementById('steps').textContent = `${this.steps}`;
  }

  formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}시 ${minutes}분`;
  }

  formatDistance(meters) {
    const kilometers = meters / 1000;
    return `${kilometers.toFixed(1)}km`;
  }

  // Haversine 공식으로 두 좌표 간 거리 계산
  calculateDistance(lat1, lon1, lat2, lon2) {
    const toRad = (value) => value * Math.PI / 180;
    const R = 6371000; // 지구 반지름 (미터)

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // meters
  }
}

document.addEventListener('DOMContentLoaded', () => new WalkTracker());



class KakaoMap {
  constructor(mapContainerId) {
    this.mapContainer = document.getElementById(mapContainerId);
    this.map = null;
    this.marker = null;
    this.pathDrawer = null; // 추가
  }

  initMap(lat, lon) {
    const options = {
      center: new kakao.maps.LatLng(lat, lon),
      level: 3
    };

    this.map = new kakao.maps.Map(this.mapContainer, options);

    this.marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(lat, lon),
      map: this.map
    });

    this.pathDrawer = new PathDrawer(this.map); // 폴리라인 드로어 생성
  }

  updatePath(position) {
    if (this.pathDrawer) {
      this.pathDrawer.addPosition({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    }
  }

  loadCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          this.initMap(lat, lon);
        },
        error => {
          console.error('위치 정보를 가져올 수 없습니다.', error);
          this.initMap(37.5665, 126.9780);
        }
      );
    } else {
      alert('이 브라우저는 Geolocation을 지원하지 않습니다.');
      this.initMap(37.5665, 126.9780);
    }
  }
}


// Polyline
class PathDrawer {
  constructor(map) {
    this.map = map;
    this.linePath = [];
    this.polyline = new kakao.maps.Polyline({
      path: this.linePath,
      strokeWeight: 10,
      strokeColor: '#6da9de',
      strokeOpacity: 0.8,
      strokeStyle: 'solid'
    });
    this.polyline.setMap(this.map);
  }

  addPosition(position) {
    const latLng = new kakao.maps.LatLng(position.latitude, position.longitude);
    this.linePath.push(latLng);
    this.polyline.setPath(this.linePath);
  }

  resetPath() {
    this.linePath = [];
    this.polyline.setPath(this.linePath);
  }
}

