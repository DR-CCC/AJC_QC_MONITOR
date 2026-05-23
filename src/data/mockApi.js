const ENDPOINTS = {
  sample: '/qc/sample_dashboard_payload.json',
  full: '/qc/fgqc_alerts_payload.json',
  catalog: '/qc/defect_code_catalog.json',
};

export async function fetchDashboardPayload(mode) {
  const response = await fetch(ENDPOINTS[mode] || ENDPOINTS.full);
  if (!response.ok) {
    throw new Error(`Failed to load ${mode} dashboard payload`);
  }
  return response.json();
}

export async function fetchDefectCatalog() {
  const response = await fetch(ENDPOINTS.catalog);
  if (!response.ok) {
    throw new Error('Failed to load defect code catalog');
  }
  return response.json();
}
