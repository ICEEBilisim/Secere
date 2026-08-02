-- =========================================================
-- ŞECERE (SOY BAĞI & AİLE AĞACI) SUPABASE VERİTABANI ŞEMASI
-- =========================================================

-- 1. Aileler / Sülaleler Tablosu (Families)
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    root_person_id UUID, -- Kök ata (ileri aşamada bağlanacak)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Kişiler Tablosu (Persons)
CREATE TABLE IF NOT EXISTS public.persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    birth_date DATE,
    birth_year INT, -- Tam tarih bilinmiyorsa sadece doğum yılı
    death_date DATE,
    death_year INT,
    is_deceased BOOLEAN DEFAULT FALSE,
    father_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
    mother_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
    family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
    bio TEXT,
    avatar_url TEXT,
    occupation VARCHAR(150),
    birth_place VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aile tablosundaki root_person_id için ikincil Foreign Key ekleme
ALTER TABLE public.families 
ADD CONSTRAINT fk_root_person 
FOREIGN KEY (root_person_id) REFERENCES public.persons(id) ON DELETE SET NULL;

-- 3. Evlilikler / Eş Bağlantıları Tablosu (Marriages)
CREATE TABLE IF NOT EXISTS public.marriages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    husband_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
    wife_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
    marriage_date DATE,
    divorce_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hızlı Sorgulama İçin İndeksler
CREATE INDEX IF NOT EXISTS idx_persons_father ON public.persons(father_id);
CREATE INDEX IF NOT EXISTS idx_persons_mother ON public.persons(mother_id);
CREATE INDEX IF NOT EXISTS idx_persons_family ON public.persons(family_id);
CREATE INDEX IF NOT EXISTS idx_persons_gender ON public.persons(gender);

-- User ID Kolonları (Kullanıcı Bazlı Veri Yönetimi)
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.marriages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Row Level Security (RLS)
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marriages ENABLE ROW LEVEL SECURITY;

-- Families RLS
DROP POLICY IF EXISTS "Allow public read families" ON public.families;
DROP POLICY IF EXISTS "Allow public insert families" ON public.families;
DROP POLICY IF EXISTS "Allow public update families" ON public.families;
DROP POLICY IF EXISTS "Allow public delete families" ON public.families;

CREATE POLICY "Allow read families" ON public.families FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Allow insert families" ON public.families FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update families" ON public.families FOR UPDATE USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Allow delete families" ON public.families FOR DELETE USING (user_id IS NULL OR auth.uid() = user_id);

-- Persons RLS
DROP POLICY IF EXISTS "Allow public read persons" ON public.persons;
DROP POLICY IF EXISTS "Allow public insert persons" ON public.persons;
DROP POLICY IF EXISTS "Allow public update persons" ON public.persons;
DROP POLICY IF EXISTS "Allow public delete persons" ON public.persons;

CREATE POLICY "Allow read persons" ON public.persons FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Allow insert persons" ON public.persons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update persons" ON public.persons FOR UPDATE USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Allow delete persons" ON public.persons FOR DELETE USING (user_id IS NULL OR auth.uid() = user_id);

-- Marriages RLS
DROP POLICY IF EXISTS "Allow public read marriages" ON public.marriages;
DROP POLICY IF EXISTS "Allow public insert marriages" ON public.marriages;
DROP POLICY IF EXISTS "Allow public update marriages" ON public.marriages;
DROP POLICY IF EXISTS "Allow public delete marriages" ON public.marriages;

CREATE POLICY "Allow read marriages" ON public.marriages FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Allow insert marriages" ON public.marriages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update marriages" ON public.marriages FOR UPDATE USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Allow delete marriages" ON public.marriages FOR DELETE USING (user_id IS NULL OR auth.uid() = user_id);


-- =========================================================
-- ÖRNEK SEED VERİSİ (DEMO SOY AĞACI)
-- =========================================================

-- Örnek Aile Oluşturma
INSERT INTO public.families (id, name, description)
VALUES ('a1b2c3d4-0000-0000-0000-000000000001', 'Karasu Sülalesi', 'Osmanlı döneminden günümüze uzanan tarihi aile soy bağı.')
ON CONFLICT DO NOTHING;

-- 1. Kuşak (Dede)
INSERT INTO public.persons (id, first_name, last_name, gender, birth_year, death_year, is_deceased, family_id, bio, birth_place)
VALUES 
('10000000-0000-0000-0000-000000000001', 'Ahmet', 'Karasu', 'male', 1918, 1995, TRUE, 'a1b2c3d4-0000-0000-0000-000000000001', 'Sülalenin bilinen en kıdemli ata büyüğü.', 'Bursa'),
('10000000-0000-0000-0000-000000000002', 'Emine', 'Karasu', 'female', 1922, 2005, TRUE, 'a1b2c3d4-0000-0000-0000-000000000001', 'Ahmet Efendi''nin eşi.', 'İznik')
ON CONFLICT DO NOTHING;

-- 2. Kuşak (Oğul ve Kızlar)
INSERT INTO public.persons (id, first_name, last_name, gender, birth_year, death_year, is_deceased, father_id, mother_id, family_id, birth_place)
VALUES 
('20000000-0000-0000-0000-000000000001', 'Mehmet', 'Karasu', 'male', 1945, NULL, FALSE, '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'Bursa'),
('20000000-0000-0000-0000-000000000002', 'Fatma', 'Karasu', 'female', 1948, 2018, TRUE, '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'Bursa'),
('20000000-0000-0000-0000-000000000003', 'Ayşe', 'Karasu', 'female', 1950, NULL, FALSE, NULL, NULL, 'a1b2c3d4-0000-0000-0000-000000000001', 'İstanbul') -- Mehmet'in Eşi
ON CONFLICT DO NOTHING;

-- 3. Kuşak (Torunlar)
INSERT INTO public.persons (id, first_name, last_name, gender, birth_year, is_deceased, father_id, mother_id, family_id, birth_place)
VALUES 
('30000000-0000-0000-0000-000000000001', 'Mustafa', 'Karasu', 'male', 1975, FALSE, '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'Bursa'),
('30000000-0000-0000-0000-000000000002', 'Ali', 'Karasu', 'male', 1978, FALSE, '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'Bursa'),
('30000000-0000-0000-0000-000000000003', 'Zeynep', 'Karasu', 'female', 1982, FALSE, '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'Bursa')
ON CONFLICT DO NOTHING;

-- 4. Kuşak (Torun Çocukları)
INSERT INTO public.persons (id, first_name, last_name, gender, birth_year, is_deceased, father_id, mother_id, family_id, birth_place)
VALUES 
('40000000-0000-0000-0000-000000000001', 'Ömer', 'Karasu', 'male', 2005, FALSE, '30000000-0000-0000-0000-000000000001', NULL, 'a1b2c3d4-0000-0000-0000-000000000001', 'Bursa'),
('40000000-0000-0000-0000-000000000002', 'Elif', 'Karasu', 'female', 2009, FALSE, '30000000-0000-0000-0000-000000000001', NULL, 'a1b2c3d4-0000-0000-0000-000000000001', 'Bursa'),
('40000000-0000-0000-0000-000000000003', 'Yusuf', 'Karasu', 'male', 2012, FALSE, '30000000-0000-0000-0000-000000000002', NULL, 'a1b2c3d4-0000-0000-0000-000000000001', 'İstanbul')
ON CONFLICT DO NOTHING;

-- Evlilik Bağlantıları
INSERT INTO public.marriages (husband_id, wife_id)
VALUES 
('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;
