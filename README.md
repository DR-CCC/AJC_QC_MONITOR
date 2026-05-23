# AJS QC Monitor System — Person C 파트 인수인계 문서

> 작성자: Person C (본인)  
> 대상: 자명_B (통합 작업 담당)  
> 최종 업데이트: 2026-05-23

---

## 배포 URL

| 환경 | URL |
|------|-----|
| **Cloudflare (주)** | https://ajc-qc-monitor.56380226a.workers.dev/ |
| Vercel (부) | https://ajs-qc-monitor.vercel.app |

PWA 지원 — Android/iPad Chrome에서 "홈 화면에 추가" 시 앱처럼 설치 가능  
화면 방향: **가로(landscape)** 고정

---

## 이 파트가 하는 일

공장 생산라인의 **품질관리(QC) 실시간 모니터링** 태블릿 대시보드

- Floor 1 (L1~L8) / Floor 2 (L21~L29) 라인별 불량률 실시간 추적
- 불량 데이터를 현장에서 직접 입력 (New Entry)
- 임계값(WARNING/CRITICAL) 초과 시 자동 알림
- 2025 실제 FGQC 데이터 Demo Mode 지원
- CSV 내보내기

---

## 로컬 실행 방법

```bash
# 저장소 클론
git clone https://github.com/DR-CCC/AJC_QC_MONITOR.git
cd AJC_QC_MONITOR

# 패키지 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build
```

Node.js 18 이상 필요

---

## 프로젝트 구조

```
frontend/
├── public/
│   └── qc/
│       ├── defect_code_catalog.json      # DEF 코드 목록 (DEF-01 ~ DEF-43)
│       ├── sample_dashboard_payload.json # Demo Mode 대시보드 데이터
│       └── fgqc_alerts_payload.json      # Demo Mode 알림 데이터
├── src/
│   ├── App.jsx                           # 최상위 컴포넌트, 전체 상태 관리
│   ├── components/
│   │   ├── AlertPanel.jsx                # 우측 알림 패널
│   │   ├── DefectChart.jsx               # 불량 분포 차트 (Recharts)
│   │   ├── DefectInputForm.jsx           # 불량 데이터 입력 폼
│   │   ├── EntryList.jsx                 # 오늘 입력된 항목 목록
│   │   ├── LineStatusTable.jsx           # 라인별 현황 테이블
│   │   ├── SummaryCards.jsx              # 상단 요약 카드 4개
│   │   ├── DataCoveragePanel.jsx         # 데이터 커버리지 현황
│   │   ├── ExportButton.jsx              # CSV 내보내기
│   │   └── ThresholdSettings.jsx         # Alert 임계값 설정 (⚙ 버튼)
│   └── data/
│       ├── alertUtils.js                 # Alert 생성 로직
│       ├── customStorage.js              # 커스텀 DEF코드/공정 localStorage
│       ├── lineMaster.js                 # 라인 목록, 층 필터, 집계 함수
│       ├── liveRows.js                   # 입력 이벤트 → 라인별 집계 변환
│       ├── mockApi.js                    # Demo Mode JSON 로드
│       ├── storage.js                    # 일별 이벤트 localStorage
│       └── thresholdStorage.js           # Alert 임계값 localStorage
```

---

## 핵심 데이터 구조

### 입력 이벤트 (Event)

현장에서 입력하는 불량 기록 단위. localStorage에 날짜별로 저장됨.

```json
{
  "event_id": "evt_1716123456789_abc123",
  "created_at": "2025-05-20T09:32:00.000Z",
  "line": "L3",
  "process": "Sewing",
  "product_code": "PKD-R1",
  "item_name": "SLING 10L",
  "inspection_qty": 240,
  "defect_count": 18,
  "defect_code": "DEF-11",
  "note": "오전 집중 발생"
}
```

### 라인 집계 행 (LiveRow)

이벤트들을 라인별로 집계한 결과. 차트/테이블/알림에 사용됨.

```json
{
  "line": "L3",
  "product_code": "PKD-R1",
  "item_name": "SLING 10L",
  "inspection_qty": 480,
  "defective_qty": 32,
  "defect_rate": 0.0667,
  "defects": {
    "DEF-11": 20,
    "DEF-02": 12
  }
}
```

### Alert 객체

```json
{
  "alert_id": "live-L3-defect_rate",
  "severity": "critical",
  "line": "L3",
  "metric": "defect_rate",
  "current_value": 0.0667,
  "threshold": 0.08,
  "message": "L3 live defect rate 6.67% exceeded critical threshold 8.00%.",
  "isLive": true
}
```

---

## localStorage 키 목록

| 키 | 내용 | 형식 |
|----|------|------|
| `qc_events_YYYY-MM-DD` | 날짜별 입력 이벤트 배열 | `Event[]` |
| `qc_custom_defcodes` | 사용자 추가 DEF 코드 | `{code, name, category}[]` |
| `qc_custom_processes` | 사용자 추가 공정명 | `string[]` |
| `qc_thresholds` | Alert 임계값 설정 | `{warningRate: 0.05, criticalRate: 0.08}` |

---

## Alert 임계값 기본값

| 단계 | 기본값 | 비고 |
|------|--------|------|
| WARNING | ≥ 5% | 사용자 변경 가능 (⚙ 버튼) |
| CRITICAL | ≥ 8% | 사용자 변경 가능 |
| 안전 불량 (Safety DEF) | 1건 이상 | DEF-39~43, 항상 CRITICAL |
| 동일 불량 반복 | ≥ 5건 | WARNING |

---

## DEF 코드 카탈로그 요약

`public/qc/defect_code_catalog.json` 참조. 총 43개 기본 코드.

| 범위 | 카테고리 |
|------|---------|
| DEF-01~10 | Stitching (봉제) |
| DEF-11~20 | Material (소재) |
| DEF-21~30 | Assembly (조립) |
| DEF-31~38 | Finishing (마감) |
| DEF-39~43 | Safety (안전) — Critical 고정 |

---

## 라인 구성

```
Floor 1 (1층): L1, L2, L3, L4, L5, L6, L7, L8
Floor 2 (2층): L21, L22, L23, L24, L25, L26, L27, L28, L29
```

`src/data/lineMaster.js`의 `FLOOR2_LINES` Set으로 관리.

---

## 자명_B 통합 시 참고사항

### B 파트와 연결 포인트

| C 파트 데이터 | B 파트 활용 가능 용도 |
|--------------|----------------------|
| `liveRows[].defect_rate` | 생산 라인 불량률 표시 |
| `liveRows[].inspection_qty` | 검사 수량 → 생산량과 교차 분석 |
| `alerts[]` | 통합 알림 패널에 QC 알림 포함 |
| `extraEvents[]` | 불량 상세 내역 |

### API 연동 준비 상태

현재 `src/data/mockApi.js`에서 JSON 파일을 직접 fetch.  
백엔드(A 파트) API가 생기면 해당 파일의 URL만 교체하면 됩니다:

```js
// mockApi.js — 현재
const res = await fetch('/qc/sample_dashboard_payload.json');

// 백엔드 연결 시 변경 예시
const res = await fetch('https://api.ajs.com/v1/dashboard');
```

### Demo Mode 데이터 출처

`public/qc/` 폴더의 JSON 파일들은 실제 2025년 1~8월 FGQC 엑셀 데이터를  
Python 스크립트(`scripts/build_qc_outputs.py`)로 파싱하여 생성한 것.  
원본 데이터: `data/Endline - FG 2025/` 폴더의 월별 xlsx 파일.

---

## 기술 스택

| 항목 | 버전/라이브러리 |
|------|----------------|
| Framework | React 18 + Vite 8 |
| 차트 | Recharts |
| PWA | vite-plugin-pwa + Workbox |
| 아이콘 생성 | @resvg/resvg-js |
| 스타일 | 순수 CSS (index.css) |
| 상태관리 | React useState/useMemo (외부 라이브러리 없음) |
| 데이터 저장 | localStorage (백엔드 없음) |

---

## GitHub

https://github.com/DR-CCC/AJC_QC_MONITOR

```bash
git clone https://github.com/DR-CCC/AJC_QC_MONITOR.git
```
