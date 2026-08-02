import { createClient } from '@supabase/supabase-js';

const url = 'https://vuakfkwueflopnozqsyc.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1YWtma3d1ZWZsb3Bub3pxc3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3NTYxMjUsImV4cCI6MjA1NjMzMjEyNX0.Mjfmfdj3gY_yLohv0Z4QPo_IKYvWfDlhCkoBUwv09Mc';

const supabase = createClient(url, key);

async function debugLayout() {
  const { data: persons } = await supabase.from('persons').select('*');
  const { data: marriages } = await supabase.from('marriages').select('*');

  // Exact logic from FamilyTreeGraph:
  const personMap = new Map();
  persons.forEach(p => personMap.set(p.id, { ...p, children: [], generation: 1 }));

  const husbandToWivesMap = new Map();
  const wifeToHusbandMap = new Map();

  marriages.forEach(m => {
    if (m.husband_id && m.wife_id) {
      if (!husbandToWivesMap.has(m.husband_id)) husbandToWivesMap.set(m.husband_id, []);
      const wifeObj = personMap.get(m.wife_id);
      if (wifeObj && !husbandToWivesMap.get(m.husband_id).some(w => w.id === m.wife_id)) {
        husbandToWivesMap.get(m.husband_id).push(wifeObj);
        wifeToHusbandMap.set(m.wife_id, m.husband_id);
      }
    }
  });

  persons.forEach(p => {
    if (p.father_id && personMap.has(p.father_id)) {
      personMap.get(p.father_id).children.push(p.id);
    }
    if (p.father_id && p.mother_id && personMap.has(p.father_id) && personMap.has(p.mother_id)) {
      const hId = p.father_id;
      const wObj = personMap.get(p.mother_id);
      if (!husbandToWivesMap.has(hId)) husbandToWivesMap.set(hId, []);
      if (!husbandToWivesMap.get(hId).some(w => w.id === wObj.id)) {
        husbandToWivesMap.get(hId).push(wObj);
        wifeToHusbandMap.set(wObj.id, hId);
      }
    }
  });

  const computeGeneration = (id, currentGen, visited = new Set()) => {
    if (visited.has(id)) return;
    visited.add(id);

    const node = personMap.get(id);
    if (!node) return;

    node.generation = Math.max(node.generation, currentGen);

    node.children.forEach(childId => {
      computeGeneration(childId, currentGen + 1, visited);
    });
  };

  const rootNodes = persons.filter(p => !p.father_id && p.gender === 'male');
  rootNodes.forEach(r => computeGeneration(r.id, 1));
  persons.filter(p => !p.father_id).forEach(r => computeGeneration(r.id, 1));

  console.log('--- Kişi Kuşakları ve Çocukları ---');
  personMap.forEach(p => {
    console.log(`${p.first_name} ${p.last_name} (${p.id}) -> Gen: ${p.generation}, Children:`, p.children);
  });

  // Check positions
  const isWifeAttachedToHusband = (personId) => wifeToHusbandMap.has(personId);

  const generationsMap = new Map();
  Array.from(personMap.values()).forEach(node => {
    if (isWifeAttachedToHusband(node.id)) return;
    const gen = node.generation || 1;
    if (!generationsMap.has(gen)) generationsMap.set(gen, []);
    generationsMap.get(gen).push(node);
  });

  const sortedGens = Array.from(generationsMap.keys()).sort((a, b) => a - b);
  const MAIN_NODE_WIDTH = 230;
  const GAP_X = 70;
  const GAP_Y = 230;
  const MAIN_NODE_HEIGHT = 110;

  const nodeCoordMap = new Map();

  sortedGens.forEach((gen, genIndex) => {
    const rowNodes = generationsMap.get(gen);
    const rowWidth = rowNodes.length * MAIN_NODE_WIDTH + (rowNodes.length - 1) * GAP_X;
    const startX = -rowWidth / 2;

    rowNodes.forEach((node, colIndex) => {
      const x = startX + colIndex * (MAIN_NODE_WIDTH + GAP_X);
      const y = genIndex * (MAIN_NODE_HEIGHT + GAP_Y) + 50;
      nodeCoordMap.set(node.id, { ...node, x, y, width: MAIN_NODE_WIDTH, height: MAIN_NODE_HEIGHT });
    });
  });

  console.log('\n--- Node Çizgileri ---');
  persons.forEach(node => {
    if (node.father_id && nodeCoordMap.has(node.father_id)) {
      const fatherNode = nodeCoordMap.get(node.father_id);
      const childNode = nodeCoordMap.get(node.id);
      console.log(`Çizgi: [${fatherNode.first_name} ${fatherNode.last_name} (x:${fatherNode.x})] ---> [${childNode.first_name} ${childNode.last_name} (x:${childNode.x})]`);
    }
  });
}

debugLayout();
