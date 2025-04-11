// 기능과 동작 담당 (기능 / 로직 역할)
// 사용자의 인터랙션(클릭, 이동 등)에 반응하는 로직이 들어 있습니다.
// 주요 기능:
// 산책 시작 버튼 클릭 시 타이머 시작
// 지도에서 현재 위치 추적 및 이동 경로 표시
// 걸음 수 증가 로직
// 이동 거리 계산
// Step Progress Bar 의 단계 업데이트
// 요약하면, 웹사이트가 살아 움직이도록 하는 "두뇌" 같은 역할을 합니다.

class WalkTracker {
    constructor() {
      this.time = 0;
      this.distance = 0; // meters
      this.steps = 0;
      this.timerInterval = null;
      this.geoWatchId = null;
      this.lastPosition = null;
      this.isWalking = false;
  
      this.init();
    }
  
    init() {
      document.getElementById('startWalkButton').addEventListener('click', () => this.toggleWalk());
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
    }
  
    stopWalk() {
      clearInterval(this.timerInterval);
      clearInterval(this.stepSimulator);
      navigator.geolocation.clearWatch(this.geoWatchId);
    }
  
    updateTime() {
      if (!this.isWalking) return;
      this.time++;
      this.updateDisplay();
    }
  
    updateDistance(position) {
      if (!this.lastPosition) {
        this.lastPosition = position.coords;
        return;
      }
  
      const current = position.coords;
      const distanceIncrement = this.calculateDistance(this.lastPosition.latitude, this.lastPosition.longitude, current.latitude, current.longitude);
      this.distance += distanceIncrement;
      this.lastPosition = current;
  
      this.updateDisplay();
    }
  
    updateSteps(newSteps) {
      this.steps += newSteps;
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
      return `${hours} 시 ${minutes} 분 ${seconds} 초`;
    }
  
    formatDistance(meters) {
      const kilometers = meters / 1000;
      return `${kilometers.toFixed(1)}km`;
    }
  
    // 두 좌표 간 거리 (Haversine 공식)
    calculateDistance(lat1, lon1, lat2, lon2) {
      const toRad = (value) => value * Math.PI / 180;
      const R = 6371000; // 지구 반지름(m)
  
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
  
      const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) ** 2;
  
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // meters
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => new WalkTracker());
  