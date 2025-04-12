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
      console.log('산책 시작:', this.startTime);

      this.startWalk();
    } else {
      this.walkStratTime = new Date();
      console.log('산책 종료');
      console.log(`총 시간 : ${this.totalTime}초`);
      console.log(`총 거리 : ${this.totalDistance}km`);
      console.log(`총 걸음 수 : ${this.totalSteps}`);

      // 날짜 바뀌면 초기화
      if (this.walkStratTime.toISOString().split('T')[0] !== this.walkEndTime.toISOString().split('T')[0])
      {
        this.resetWalk();
      }

      this.stopWalk();
    }
  }

    startWalk() {
    this.timerInterval = setInterval(() => this.updateTime(), 1000);
    this.geoWatchId = navigator.geolocation.watchPosition(
      (position) => this.updateDistance(position),
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
  }

  resetWalk() {
    this.time = 0;
    this.distance = 0;
    this.steps = 0;
    this.lastPosition = null;
    this.lastStepTime = Date.now();
    console.log('매일 0시에 초기화되었습니다!');

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
    return `${hours}시 ${minutes}분 ${seconds}초`;
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
          // Fallback: 기본 위치 (서울 시청)
          this.initMap(37.5665, 126.9780);
        }
      );
    } else {
      alert('이 브라우저는 Geolocation을 지원하지 않습니다.');
      // Fallback: 기본 위치
      this.initMap(37.5665, 126.9780);
    }
  }
}