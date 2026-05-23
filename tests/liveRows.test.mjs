import assert from 'node:assert/strict';
import { eventsToLiveRows } from '../src/data/liveRows.js';
import { buildExpectedLineRows } from '../src/data/lineMaster.js';

const events = [
  {
    created_at: '2026-05-21T10:00:00.000Z',
    line: 'L21',
    product_code: 'PKD-R1',
    item_name: 'SLING 10L',
    defect_code: 'DEF-11',
    defect_count: 2,
    inspection_qty: 50,
  },
  {
    created_at: '2026-05-21T10:01:00.000Z',
    line: 'L21',
    product_code: 'PKD-R1',
    item_name: 'SLING 10L',
    defect_code: 'DEF-12',
    defect_count: 1,
    inspection_qty: 25,
  },
];

const liveRows = eventsToLiveRows(events);
assert.equal(liveRows.length, 1);
assert.deepEqual(liveRows[0], {
  date: '2026-05-21',
  line: 'L21',
  brand: '',
  product_code: 'PKD-R1',
  item_name: 'SLING 10L',
  color: '',
  inspection_qty: 75,
  defective_qty: 3,
  defect_rate: 0.04,
  defects: {
    'DEF-11': 2,
    'DEF-12': 1,
  },
});

const displayRows = buildExpectedLineRows([], liveRows);
const l21 = displayRows.find(row => row.line === 'L21');
assert.equal(l21.hasLiveData, true);
assert.equal(l21.hasFgqcRecord, false);
assert.equal(l21.inspection_qty, 75);
assert.equal(l21.defective_qty, 3);
