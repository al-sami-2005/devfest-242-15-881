import { readFileSync } from 'fs';
import { parseRequirementsJson } from './src/core/validation/parser.ts';
import { getDerivedChecklist, getPackageReadiness } from './src/core/matching/selectors.ts';
import { assignFile, setExpiryDate } from './src/core/matching/engine.ts';

const jsonStr = readFileSync('../problem-pack/sample-pack/requirements.json', 'utf-8');
const tenderData = parseRequirementsJson(jsonStr).data;
const allDocuments = [
  { id: 'd1', status: 'success' },
  { id: 'd2', status: 'success' },
  { id: 'd3', status: 'success' },
  { id: 'd4', status: 'success' },
  { id: 'd5', status: 'success' },
  { id: 'd6', status: 'success' },
  { id: 'd7', status: 'success' },
  { id: 'd8', status: 'success' }
];

let state = { assignments: {} };
const validReqs = tenderData.requirements.map(r => r.id);
state = assignFile(state, 'R01', 'd1', allDocuments, validReqs).state;
state = setExpiryDate(state, 'R01', '2027-01-01');
state = assignFile(state, 'R02', 'd2', allDocuments, validReqs).state;
state = assignFile(state, 'R03', 'd3', allDocuments, validReqs).state;
state = assignFile(state, 'R04', 'd4', allDocuments, validReqs).state;
state = setExpiryDate(state, 'R04', '2027-01-01');
state = assignFile(state, 'R05', 'd5', allDocuments, validReqs).state;
state = assignFile(state, 'R08', 'd6', allDocuments, validReqs).state;
state = assignFile(state, 'R09', 'd7', allDocuments, validReqs).state;
state = assignFile(state, 'R10', 'd8', allDocuments, validReqs).state;

const checklist = getDerivedChecklist(tenderData, state, allDocuments, 'en');
console.log(getPackageReadiness(checklist));
