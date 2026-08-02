// Varsayılan Demo Aile ve Kişi Verileri (Supabase olmadan yerel test için)

export const INITIAL_FAMILIES = [
  {
    id: 'fam-1',
    name: 'Karasu Sülalesi',
    description: 'Bursa kökenli tarihi aile soy bağı. Soy erkek hat üzerinden devam etmektedir.',
    created_at: new Date('2024-01-01').toISOString()
  },
  {
    id: 'fam-2',
    name: 'Yılmaz Ailesi',
    description: 'Karadeniz kökenli geniş aile grubu.',
    created_at: new Date('2024-02-10').toISOString()
  }
];

export const INITIAL_PERSONS = [
  // 1. Kuşak (Büyük Dede ve Nene)
  {
    id: 'p-101',
    first_name: 'Ahmet Efendi',
    last_name: 'Karasu',
    gender: 'male',
    birth_year: 1918,
    death_year: 1995,
    is_deceased: true,
    father_id: null,
    mother_id: null,
    family_id: 'fam-1',
    bio: 'Sülalenin bilinen en kıdemli atasıl kurucusu. Kurtuluş savaşı dönemi Bursa eşrafından.',
    birth_place: 'Bursa',
    occupation: 'Tüccar'
  },
  {
    id: 'p-102',
    first_name: 'Emine Hanım',
    last_name: 'Karasu',
    gender: 'female',
    birth_year: 1922,
    death_year: 2005,
    is_deceased: true,
    father_id: null,
    mother_id: null,
    family_id: 'fam-1',
    bio: 'Ahmet Efendi\'nin eşi.',
    birth_place: 'İznik',
    occupation: 'Ev Hanımı'
  },

  // 2. Kuşak (Evlatlar)
  {
    id: 'p-201',
    first_name: 'Mehmet Ali',
    last_name: 'Karasu',
    gender: 'male',
    birth_year: 1945,
    death_year: null,
    is_deceased: false,
    father_id: 'p-101',
    mother_id: 'p-102',
    family_id: 'fam-1',
    bio: 'Ahmet Efendi\'nin büyük oğlu. Emekli Öğretmen.',
    birth_place: 'Bursa',
    occupation: 'Eğitimci'
  },
  {
    id: 'p-202',
    first_name: 'Ayşe',
    last_name: 'Karasu (Yılmaz)',
    gender: 'female',
    birth_year: 1948,
    death_year: 2020,
    is_deceased: true,
    father_id: 'p-101',
    mother_id: 'p-102',
    family_id: 'fam-1',
    bio: 'Ahmet Efendi\'nin kızı.',
    birth_place: 'Bursa',
    occupation: 'Terzi'
  },
  {
    id: 'p-203',
    first_name: 'Mustafa',
    last_name: 'Karasu',
    gender: 'male',
    birth_year: 1952,
    death_year: null,
    is_deceased: false,
    father_id: 'p-101',
    mother_id: 'p-102',
    family_id: 'fam-1',
    bio: 'Ahmet Efendi\'nin küçük oğlu. Ziraat Mühendisi.',
    birth_place: 'Bursa',
    occupation: 'Mühendis'
  },
  {
    id: 'p-204',
    first_name: 'Gönül',
    last_name: 'Karasu',
    gender: 'female',
    birth_year: 1949,
    death_year: null,
    is_deceased: false,
    father_id: null,
    mother_id: null,
    family_id: 'fam-1',
    bio: 'Mehmet Ali\'nin eşi.',
    birth_place: 'İstanbul',
    occupation: 'Mimar'
  },
  {
    id: 'p-205',
    first_name: 'Hatice',
    last_name: 'Karasu',
    gender: 'female',
    birth_year: 1955,
    death_year: null,
    is_deceased: false,
    father_id: null,
    mother_id: null,
    family_id: 'fam-1',
    bio: 'Mustafa\'nın eşi.',
    birth_place: 'Eskişehir',
    occupation: 'Eczacı'
  },

  // 3. Kuşak (Torunlar)
  {
    id: 'p-301',
    first_name: 'Hasan',
    last_name: 'Karasu',
    gender: 'male',
    birth_year: 1975,
    death_year: null,
    is_deceased: false,
    father_id: 'p-201',
    mother_id: 'p-204',
    family_id: 'fam-1',
    bio: 'Mehmet Ali\'nin oğlu. Yazılım Geliştirici.',
    birth_place: 'Bursa',
    occupation: 'Mühendis'
  },
  {
    id: 'p-302',
    first_name: 'Zeynep',
    last_name: 'Karasu',
    gender: 'female',
    birth_year: 1978,
    death_year: null,
    is_deceased: false,
    father_id: 'p-201',
    mother_id: 'p-204',
    family_id: 'fam-1',
    bio: 'Mehmet Ali\'nin kızı. Doktor.',
    birth_place: 'Bursa',
    occupation: 'Tıp Doktoru'
  },
  {
    id: 'p-303',
    first_name: 'Burak',
    last_name: 'Karasu',
    gender: 'male',
    birth_year: 1982,
    death_year: null,
    is_deceased: false,
    father_id: 'p-203',
    mother_id: 'p-205',
    family_id: 'fam-1',
    bio: 'Mustafa\'nın oğlu. Ekonomist.',
    birth_place: 'Ankara',
    occupation: 'Finansal Analist'
  },
  {
    id: 'p-304',
    first_name: 'Selin',
    last_name: 'Karasu',
    gender: 'female',
    birth_year: 1980,
    death_year: null,
    is_deceased: false,
    father_id: null,
    mother_id: null,
    family_id: 'fam-1',
    bio: 'Hasan\'ın eşi.',
    birth_place: 'İzmir',
    occupation: 'Avukat'
  },

  // 4. Kuşak (Torun Çocukları)
  {
    id: 'p-401',
    first_name: 'Mert',
    last_name: 'Karasu',
    gender: 'male',
    birth_year: 2005,
    death_year: null,
    is_deceased: false,
    father_id: 'p-301',
    mother_id: 'p-304',
    family_id: 'fam-1',
    bio: 'Hasan\'ın oğlu. Üniversite Öğrencisi.',
    birth_place: 'İstanbul',
    occupation: 'Öğrenci'
  },
  {
    id: 'p-402',
    first_name: 'Defne',
    last_name: 'Karasu',
    gender: 'female',
    birth_year: 2010,
    death_year: null,
    is_deceased: false,
    father_id: 'p-301',
    mother_id: 'p-304',
    family_id: 'fam-1',
    bio: 'Hasan\'ın kızı. Lise Öğrencisi.',
    birth_place: 'İstanbul',
    occupation: 'Öğrenci'
  },
  {
    id: 'p-403',
    first_name: 'Kerem',
    last_name: 'Karasu',
    gender: 'male',
    birth_year: 2015,
    death_year: null,
    is_deceased: false,
    father_id: 'p-303',
    mother_id: null,
    family_id: 'fam-1',
    bio: 'Burak\'ın oğlu. İlkokul Öğrencisi.',
    birth_place: 'Ankara',
    occupation: 'Öğrenci'
  }
];

export const INITIAL_MARRIAGES = [
  { id: 'm-1', husband_id: 'p-101', wife_id: 'p-102' },
  { id: 'm-2', husband_id: 'p-201', wife_id: 'p-204' },
  { id: 'm-3', husband_id: 'p-203', wife_id: 'p-205' },
  { id: 'm-4', husband_id: 'p-301', wife_id: 'p-304' }
];
