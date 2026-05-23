import { createContext, useContext } from 'react';

const T = {
  en: {
    appTitle: 'AJS QC Monitor',
    appBadge: 'Person C Prototype',
    floorAll: 'All Lines',
    floor1Label: 'Floor 1 · L1-L8',
    floor2Label: 'Floor 2 · L21-L29',
    dataFull: 'Full',
    dataSample: 'Sample',
    loading: 'Loading QC data...',
    critical: 'CRITICAL',
    warning: 'WARNING',
    lineTableTitle: 'Sewing Line Status',
    lineTableSub: 'L1-L8, L21-L29',
    colLine: 'Line',
    colFgqcSource: 'FGQC Source',
    colProduct: 'Product',
    colItem: 'Item',
    colInspected: 'Inspected',
    colDefective: 'Defective',
    colRate: 'Rate',
    noFgqcRecord: 'No entries yet',
    liveTag: 'LIVE',
    floor2Notice: 'No entries for Floor 2 lines (L21-L29) yet.',
    floor2NoticeHint: 'Use the entry form to log defects for Floor 2.',
    chartTitle: 'Defect Distribution',
    chartSafety: 'safety/regulation (DEF-39-43)',
    chartNormal: 'normal',
    alertsTab: 'Alerts',
    newEntryTab: '+ New Entry',
    noAlerts: 'No active alerts',
    alertOverflow: 'Showing top {shown} of {total} alerts. {hidden} more hidden.',
    liveEventsBanner: '{count} new event{s} submitted this session',
    filterAll: 'All',
    filterCritical: 'Critical',
    filterWarning: 'Warning',
    filterAllLines: 'All Lines',
    filterAllDefs: 'All DEFs',
    liveAlertNote: 'Live - this session',
    valLabel: 'val',
    thresholdLabel: 'thr',
    formTitle: 'QC Defect Entry',
    formLine: 'Line *',
    formProcess: 'Process *',
    formWorkerId: 'Worker ID *',
    formProductCode: 'Product Code *',
    formItemName: 'Item Name',
    formDefCode: 'DEF Code *',
    formDefCount: 'Defect Count *',
    formInspQty: 'Inspection Qty *',
    formNote: 'Note',
    formSelectLine: 'Select line',
    formSelectProcess: 'Select process',
    formSelectDef: 'Select defect',
    formSubmit: 'Submit Defect Event',
    summaryTitle: 'Summary',
    cardInspected: 'Total Inspected',
    cardUnitsTotal: 'units today',
    cardDefective: 'Total Defective',
    cardDefectRate: 'Defect Rate',
    cardOverall: 'overall',
    cardAlerts: 'Active Alerts',
    cardOpenIssues: 'open issues',
  },
};

export const LangContext = createContext('en');

export function useLang() {
  return useContext(LangContext);
}

export function useT() {
  const lang = useLang();
  const dict = T[lang] || T.en;

  return (key, vars) => {
    let value = dict[key] ?? T.en[key] ?? key;
    if (vars) {
      for (const [name, replacement] of Object.entries(vars)) {
        value = value.replaceAll(`{${name}}`, String(replacement));
      }
    }
    return value;
  };
}
