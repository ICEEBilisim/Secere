import React from 'react';
import { UserCheck, Crown, Heart, Edit, Trash2, PlusCircle, Search, Filter } from 'lucide-react';

export default function PersonListView({
  persons = [],
  families = [],
  searchQuery = '',
  selectedFamilyIds = [],
  onSelectPerson,
  onEditPerson,
  onDeletePerson,
  onAddChild
}) {
  // Filtreleme
  const filteredPersons = persons.filter((person) => {
    // Sülale Filtresi
    if (selectedFamilyIds && selectedFamilyIds.length > 0) {
      if (!person.family_id || !selectedFamilyIds.includes(person.family_id)) {
        return false;
      }
    }
    // Arama Metni
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const fullName = `${person.first_name} ${person.last_name}`.toLowerCase();
      const birthPlace = (person.birth_place || '').toLowerCase();
      const occupation = (person.occupation || '').toLowerCase();
      return fullName.includes(q) || birthPlace.includes(q) || occupation.includes(q);
    }
    return true;
  });

  const personMap = new Map();
  persons.forEach((p) => personMap.set(p.id, p));

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      {/* İstatistik & Bilgi Çubuğu */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Kayıtlı Soy Bireyleri</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
            ({filteredPersons.length} kişi gösteriliyor)
          </span>
        </h2>
      </div>

      {/* Kişiler Grid Liste */}
      {filteredPersons.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
          {filteredPersons.map((person) => {
            const isMale = person.gender === 'male';
            const father = personMap.get(person.father_id);
            const mother = personMap.get(person.mother_id);
            const family = families.find((f) => f.id === person.family_id);

            return (
              <div
                key={person.id}
                className="glass-panel"
                style={{
                  padding: '1.2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  border: isMale ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid rgba(236, 72, 153, 0.25)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onClick={() => onSelectPerson(person)}
              >
                {/* Üst Kısım: Avatar & İsim */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: isMale 
                        ? 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(16,185,129,0.3) 100%)'
                        : 'linear-gradient(135deg, rgba(236,72,153,0.2) 0%, rgba(168,85,247,0.3) 100%)',
                      border: isMale ? '1px solid #06b6d4' : '1px solid #ec4899',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      color: '#ffffff',
                      flexShrink: 0
                    }}
                  >
                    <UserCheck size={24} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                      <span className={`badge ${isMale ? 'badge-male' : 'badge-female'}`}>
                        {isMale ? 'ERKEK SOY' : 'KADIN'}
                      </span>
                      {person.is_deceased && <span className="badge badge-deceased">VEFAT</span>}
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {person.first_name} {person.last_name}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {person.birth_year ? `d. ${person.birth_year}` : 'Doğum tarihi bilinmiyor'}
                      {person.is_deceased && ` - ö. ${person.death_year || '?'}`}
                    </p>
                  </div>
                </div>

                {/* Sülale & Ebeveyn Bilgileri */}
                <div style={{ padding: '0.6rem 0.8rem', borderRadius: '0.6rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--glass-border)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {family && (
                    <div style={{ color: '#fbbf24', fontWeight: 600 }}>
                      Sülale: {family.name}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Baba: {father ? `${father.first_name} ${father.last_name}` : 'Kök Ata / Belirtilmedi'}</span>
                  </div>

                  {mother && (
                    <div style={{ color: 'var(--text-secondary)' }}>
                      Anne: {mother.first_name} {mother.last_name}
                    </div>
                  )}
                </div>

                {/* Alt Kısım: Aksiyonlar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onAddChild(person)}
                    style={{ fontSize: '0.7rem', color: '#38bdf8' }}
                  >
                    <PlusCircle size={13} /> +Çocuk
                  </button>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onEditPerson(person)}
                      title="Kişiyi Düzenle"
                    >
                      <Edit size={13} />
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onDeletePerson(person.id)}
                      title="Kişiyi Sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Search size={36} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '0.4rem' }}>Kayıt Bulunamadı</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Arama veya filtre kriterlerinize uyan kişi bulunmuyor.
          </p>
        </div>
      )}

    </div>
  );
}
