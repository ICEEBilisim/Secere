import { createClient } from '@supabase/supabase-js';
import { INITIAL_FAMILIES, INITIAL_PERSONS, INITIAL_MARRIAGES } from './mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Yerel Depolama (LocalStorage) Yardımcıları
const LOCAL_STORAGE_KEY_PERSONS = 'secere_persons_v1';
const LOCAL_STORAGE_KEY_FAMILIES = 'secere_families_v1';
const LOCAL_STORAGE_KEY_MARRIAGES = 'secere_marriages_v1';

const getLocalStorageData = (key, defaultData) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    const parsed = JSON.parse(item);
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(defaultData) && defaultData.length > 0) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return parsed;
  } catch (err) {
    console.error(`LocalStorage okuma hatası (${key}):`, err);
    return defaultData;
  }
};

const setLocalStorageData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`LocalStorage yazma hatası (${key}):`, err);
  }
};

// ==========================================
// KULLANICI ÜYELİK & AUTH İŞLEMLERİ
// ==========================================

export const signUp = async ({ email, password }) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase henüz yapılandırılmamış. Lütfen .env dosyasını kontrol edin.');
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signIn = async ({ email, password }) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase henüz yapılandırılmamış. Lütfen .env dosyasını kontrol edin.');
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  if (!isSupabaseConfigured) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const onAuthStateChange = (callback) => {
  if (!isSupabaseConfigured) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null, event, session);
  });
};

// ==========================================
// KİŞİ İŞLEMLERİ (PERSONS)
// ==========================================

export const getPersons = async () => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .order('birth_year', { ascending: true, nullsFirst: false });
      if (error) {
        console.warn('Supabase getPersons hatası, yerel verilere dönülüyor:', error);
        return getLocalStorageData(LOCAL_STORAGE_KEY_PERSONS, INITIAL_PERSONS);
      }
      if (!data || data.length === 0) {
        console.warn('Supabase getPersons boş döndü, yerel örnek verilere dönülüyor');
        return getLocalStorageData(LOCAL_STORAGE_KEY_PERSONS, INITIAL_PERSONS);
      }
      return data;
    } catch (err) {
      console.warn('Supabase getPersons istisna, yerel verilere dönülüyor:', err);
      return getLocalStorageData(LOCAL_STORAGE_KEY_PERSONS, INITIAL_PERSONS);
    }
  } else {
    return getLocalStorageData(LOCAL_STORAGE_KEY_PERSONS, INITIAL_PERSONS);
  }
};

export const savePerson = async (personData) => {
  if (isSupabaseConfigured) {
    const currentUser = (await supabase.auth.getUser())?.data?.user;
    if (personData.id && !personData.id.startsWith('temp-')) {
      const { data, error } = await supabase
        .from('persons')
        .update(personData)
        .eq('id', personData.id)
        .select();
      if (error) throw error;
      return data[0];
    } else {
      const cleanData = { ...personData };
      delete cleanData.id;
      if (currentUser?.id && !cleanData.user_id) {
        cleanData.user_id = currentUser.id;
      }
      const { data, error } = await supabase
        .from('persons')
        .insert([cleanData])
        .select();
      if (error) throw error;
      return data[0];
    }
  } else {
    const currentPersons = getLocalStorageData(LOCAL_STORAGE_KEY_PERSONS, INITIAL_PERSONS);
    let updatedPersons;
    let savedPerson;

    if (personData.id) {
      savedPerson = { ...personData, updated_at: new Date().toISOString() };
      updatedPersons = currentPersons.map((p) => (p.id === personData.id ? savedPerson : p));
    } else {
      savedPerson = {
        ...personData,
        id: `p-local-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      updatedPersons = [...currentPersons, savedPerson];
    }

    setLocalStorageData(LOCAL_STORAGE_KEY_PERSONS, updatedPersons);
    return savedPerson;
  }
};

export const deletePerson = async (personId) => {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('persons').delete().eq('id', personId);
    if (error) throw error;
  } else {
    const currentPersons = getLocalStorageData(LOCAL_STORAGE_KEY_PERSONS, INITIAL_PERSONS);
    const filtered = currentPersons.filter((p) => p.id !== personId);
    const cleaned = filtered.map(p => {
      let newP = { ...p };
      if (newP.father_id === personId) newP.father_id = null;
      if (newP.mother_id === personId) newP.mother_id = null;
      return newP;
    });
    setLocalStorageData(LOCAL_STORAGE_KEY_PERSONS, cleaned);
  }
};

// ==========================================
// EVLİLİK / EŞ İŞLEMLERİ (MARRIAGES)
// ==========================================

export const getMarriages = async () => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('marriages').select('*');
      if (error) {
        console.warn('Supabase getMarriages hatası, yerel verilere dönülüyor:', error);
        return getLocalStorageData(LOCAL_STORAGE_KEY_MARRIAGES, INITIAL_MARRIAGES);
      }
      return data || getLocalStorageData(LOCAL_STORAGE_KEY_MARRIAGES, INITIAL_MARRIAGES);
    } catch (err) {
      console.warn('Supabase getMarriages istisna, yerel verilere dönülüyor:', err);
      return getLocalStorageData(LOCAL_STORAGE_KEY_MARRIAGES, INITIAL_MARRIAGES);
    }
  } else {
    return getLocalStorageData(LOCAL_STORAGE_KEY_MARRIAGES, INITIAL_MARRIAGES);
  }
};

export const saveMarriage = async (husbandId, wifeId) => {
  if (isSupabaseConfigured) {
    const currentUser = (await supabase.auth.getUser())?.data?.user;
    const payload = { husband_id: husbandId, wife_id: wifeId };
    if (currentUser?.id) {
      payload.user_id = currentUser.id;
    }
    const { data, error } = await supabase
      .from('marriages')
      .insert([payload])
      .select();
    if (error) throw error;
    return data[0];
  } else {
    const current = getLocalStorageData(LOCAL_STORAGE_KEY_MARRIAGES, INITIAL_MARRIAGES);
    const newMarriage = {
      id: `m-local-${Date.now()}`,
      husband_id: husbandId,
      wife_id: wifeId,
      created_at: new Date().toISOString()
    };
    const updated = [...current, newMarriage];
    setLocalStorageData(LOCAL_STORAGE_KEY_MARRIAGES, updated);
    return newMarriage;
  }
};

export const deleteMarriage = async (husbandId, wifeId) => {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('marriages')
      .delete()
      .eq('husband_id', husbandId)
      .eq('wife_id', wifeId);
    if (error) throw error;
  } else {
    const current = getLocalStorageData(LOCAL_STORAGE_KEY_MARRIAGES, INITIAL_MARRIAGES);
    const filtered = current.filter(
      (m) => !(m.husband_id === husbandId && m.wife_id === wifeId)
    );
    setLocalStorageData(LOCAL_STORAGE_KEY_MARRIAGES, filtered);
  }
};

// ==========================================
// AİLE / SÜLALE İŞLEMLERİ (FAMILIES)
// ==========================================

export const getFamilies = async () => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('families').select('*').order('name');
      if (error) {
        console.warn('Supabase getFamilies hatası, yerel verilere dönülüyor:', error);
        return getLocalStorageData(LOCAL_STORAGE_KEY_FAMILIES, INITIAL_FAMILIES);
      }
      if (!data || data.length === 0) {
        return getLocalStorageData(LOCAL_STORAGE_KEY_FAMILIES, INITIAL_FAMILIES);
      }
      return data;
    } catch (err) {
      console.warn('Supabase getFamilies istisna, yerel verilere dönülüyor:', err);
      return getLocalStorageData(LOCAL_STORAGE_KEY_FAMILIES, INITIAL_FAMILIES);
    }
  } else {
    return getLocalStorageData(LOCAL_STORAGE_KEY_FAMILIES, INITIAL_FAMILIES);
  }
};

export const saveFamily = async (familyData) => {
  if (isSupabaseConfigured) {
    const currentUser = (await supabase.auth.getUser())?.data?.user;
    if (familyData.id && !familyData.id.startsWith('fam-local-')) {
      const { data, error } = await supabase
        .from('families')
        .update(familyData)
        .eq('id', familyData.id)
        .select();
      if (error) throw error;
      return data[0];
    } else {
      const clean = { ...familyData };
      delete clean.id;
      if (currentUser?.id && !clean.user_id) {
        clean.user_id = currentUser.id;
      }
      const { data, error } = await supabase.from('families').insert([clean]).select();
      if (error) throw error;
      return data[0];
    }
  } else {
    const current = getLocalStorageData(LOCAL_STORAGE_KEY_FAMILIES, INITIAL_FAMILIES);
    let saved;
    let updated;
    if (familyData.id) {
      saved = { ...familyData };
      updated = current.map(f => f.id === familyData.id ? saved : f);
    } else {
      saved = { ...familyData, id: `fam-local-${Date.now()}`, created_at: new Date().toISOString() };
      updated = [...current, saved];
    }
    setLocalStorageData(LOCAL_STORAGE_KEY_FAMILIES, updated);
    return saved;
  }
};

// Sıfırlama (Demo verilerine dönme)
export const resetToDemoData = () => {
  localStorage.setItem(LOCAL_STORAGE_KEY_PERSONS, JSON.stringify(INITIAL_PERSONS));
  localStorage.setItem(LOCAL_STORAGE_KEY_FAMILIES, JSON.stringify(INITIAL_FAMILIES));
  localStorage.setItem(LOCAL_STORAGE_KEY_MARRIAGES, JSON.stringify(INITIAL_MARRIAGES));
};
