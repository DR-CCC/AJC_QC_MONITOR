import { createContext, useContext } from 'react';

const T = {
  ko: {
    appTitle: 'AJS QC 모니터',
    appBadge: '실시간 입력',
    appBadgeDemo: '데모 모드',
    floorAll: '전체 라인',
    floor1Label: '1층 · L1~L8',
    floor2Label: '2층 · L21~L29',
    dataFull: '전체',
    dataSample: '샘플',
    loading: '데이터 불러오는 중...',
    critical: '위험',
    warning: '경고',
    lineTableTitle: '봉제 라인 현황',
    lineTableSub: 'L1~L8, L21~L29',
    colLine: '라인',
    colFgqcSource: '출처',
    colProduct: '제품코드',
    colItem: '품명',
    colInspected: '검사수량',
    colDefective: '불량수',
    colRate: '불량률',
    noFgqcRecord: '미입력',
    liveTag: 'LIVE',
    floor2Notice: '2층 라인 (L21~L29) 입력 데이터가 없습니다.',
    floor2NoticeHint: '불량 입력 폼에서 2층 라인 데이터를 입력해 주세요.',
    chartTitle: '불량 유형 분포',
    chartSafety: '안전/규정 위반 (DEF-39~43)',
    chartNormal: '일반',
    alertsTab: '알림',
    newEntryTab: '불량 입력',
    noAlerts: '활성 알림 없음',
    alertOverflow: '총 {total}건 중 {shown}건 표시 중 ({hidden}건 숨김)',
    liveEventsBanner: '이번 세션 {count}건 입력됨',
    filterAll: '전체',
    filterCritical: '위험',
    filterWarning: '경고',
    filterAllLines: '전체 라인',
    filterAllDefs: '전체 코드',
    liveAlertNote: '실시간 — 현재 세션',
    valLabel: '현재값',
    thresholdLabel: '기준값',
    formTitle: 'QC 불량 입력',
    formLine: '라인 *',
    formProcess: '공정 *',
    formWorkerId: '작업자 ID *',
    formProductCode: '제품코드 *',
    formItemName: '품명',
    formDefCode: '불량코드 *',
    formDefCount: '불량수 *',
    formInspQty: '검사수량 *',
    formNote: '비고',
    formSelectLine: '라인 선택',
    formSelectProcess: '공정 선택',
    formSelectDef: '불량 선택',
    formSubmit: '불량 등록',
    summaryTitle: '오늘 현황',
    cardInspected: '총 검사수량',
    cardUnitsTotal: '개 (오늘)',
    cardDefective: '총 불량수',
    cardDefectRate: '불량률',
    cardOverall: '전체 평균',
    cardAlerts: '활성 알림',
    cardOpenIssues: '건 처리 필요',
  },
};

T.en = T.ko;

export const LangContext = createContext('ko');

export function useLang() {
  return useContext(LangContext);
}

export function useT() {
  const lang = useLang();
  const dict = T[lang] || T.ko;

  return (key, vars) => {
    let value = dict[key] ?? T.ko[key] ?? key;
    if (vars) {
      for (const [name, replacement] of Object.entries(vars)) {
        value = value.replaceAll(`{${name}}`, String(replacement));
      }
    }
    return value;
  };
}
