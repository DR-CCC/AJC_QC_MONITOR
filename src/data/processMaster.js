export const DIRECT_PROCESSES = [
  'Preparation',
  'Cutting',
  'Laser',
  'Webbing Cutting',
  'PRT+EMB',
  'COM+BT',
  'RIVET',
  'Packing',
];

export const QC_PROCESSES = [
  'STITCHING',
  'ASSEMBLY',
  'FINISHING',
  'INSPECTION',
];

export const PROCESS_OPTIONS = [...DIRECT_PROCESSES, ...QC_PROCESSES];
