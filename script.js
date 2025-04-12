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
      this.startWalk();
    } else {
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

    if (totalAcceleration > this.threshold && currentTime - this.lastStepTime > 500) {
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
  constructor() {
    this.container = document.getElementById('map');
    this.options = {
      center: new kakao.maps.LatLng(33.450701, 126.570667),
      level: 3
    };
    this.map = new kakao.maps.Map(this.container, this.options);
  }

  // 중심 좌표 이동 메서드
  setCenter(latitude, longitude) {
    const newCenter = new kakao.maps.LatLng(latitude, longitude);
    this.map.setCenter(newCenter);
  }

  // 마커 추가 메서드 (옵션)
  addMarker(latitude, longitude) {
    const markerPosition = new kakao.maps.LatLng(latitude, longitude);
    const marker = new kakao.maps.Marker({
      position: markerPosition
    });
    marker.setMap(this.map);
  }

  // 선 긋기 메서드 (옵션: 산책 경로 표시용)
  drawPolyline(pathCoords) {
    const polyline = new kakao.maps.Polyline({
      path: pathCoords.map(coord => new kakao.maps.LatLng(coord.lat, coord.lng)),
      strokeWeight: 5,
      strokeColor: '#FF0000',
      strokeOpacity: 0.7,
      strokeStyle: 'solid'
    });
    polyline.setMap(this.map);
  }
}

// 사용 예시
const kakaoMap = new KakaoMap();

// 지도 중심 이동
// kakaoMap.setCenter(37.5665, 126.9780);

// 마커 추가
// kakaoMap.addMarker(37.5665, 126.9780);

// 선 그리기 예시
// const walkPath = [
//   { lat: 37.5665, lng: 126.9780 },
//   { lat: 37.5651, lng: 126.9895 }
// ];
// kakaoMap.drawPolyline(walkPath);