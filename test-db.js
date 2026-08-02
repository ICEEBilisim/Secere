import { createClient } from '@supabase/supabase-js';

const url = 'https://vuakfkwueflopnozqsyc.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1YWtma3d1ZWZsb3Bub3pxc3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3NTYxMjUsImV4cCI6MjA1NjMzMjEyNX0.Mjfmfdj3gY_yLohv0Z4QPo_IKYvWfDlhCkoBUwv09Mc';

const supabase = createClient(url, key);

async function listAll() {
  const { data: persons } = await supabase.from('persons').select('*');
  console.log('--- DB Kişiler Listesi ---');
  persons.forEach(p => {
    console.log(`ID: ${p.id} | ${p.first_name} ${p.last_name} | Cinsiyet: ${p.gender} | D.Yılı: ${p.birth_year} | BabaID: ${p.father_id} | AnneID: ${p.mother_id}`);
  });
}

listAll();
