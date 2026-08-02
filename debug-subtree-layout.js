import { createClient } from '@supabase/supabase-js';

const url = 'https://vuakfkwueflopnozqsyc.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1YWtma3d1ZWZsb3Bub3pxc3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3NTYxMjUsImV4cCI6MjA1NjMzMjEyNX0.Mjfmfdj3gY_yLohv0Z4QPo_IKYvWfDlhCkoBUwv09Mc';

const supabase = createClient(url, key);

async function debugSubtreeLayout() {
  const { data: persons } = await supabase.from('persons').select('*');
  const { data: marriages } = await supabase.from('marriages').select('*');

  const personMap = new Map();
  persons.forEach(p => personMap.set(p.id, { ...p, children: [], generation: 1, subtreeWidth: 0 }));

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
  });

  const MAIN_NODE_WIDTH = 240;
  const GAP_X = 80;

  // 1. Calculate Subtree Widths (Bottom-Up)
  const calcSubtreeWidth = (id, visited = new Set()) => {
    if (visited.has(id)) return MAIN_NODE_WIDTH;
    visited.add(id);

    const node = personMap.get(id);
    if (!node) return MAIN_NODE_WIDTH;

    // Filter children (excluding wives)
    const validChildren = node.children.filter(cId => !wifeToHusbandMap.has(cId));

    if (validChildren.length === 0) {
      node.subtreeWidth = MAIN_NODE_WIDTH;
    } else {
      let totalChildrenWidth = 0;
      validChildren.forEach((cId, idx) => {
        const w = calcSubtreeWidth(cId, visited);
        totalChildrenWidth += w;
        if (idx < validChildren.length - 1) totalChildrenWidth += GAP_X;
      });
      node.subtreeWidth = Math.max(MAIN_NODE_WIDTH, totalChildrenWidth);
    }
    return node.subtreeWidth;
  };

  const rootNodes = persons.filter(p => !p.father_id && !wifeToHusbandMap.has(p.id));
  rootNodes.forEach(r => calcSubtreeWidth(r.id));

  console.log('--- Subtree Genişlikleri ---');
  personMap.forEach(p => {
    console.log(`${p.first_name} ${p.last_name}: ${p.subtreeWidth}px (Çocuk Sayısı: ${p.children.length})`);
  });
}

debugSubtreeLayout();
