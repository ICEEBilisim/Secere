import React from 'react';
import { 
  X, 
  UserCheck, 
  Crown, 
  Heart, 
  GitCommit, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Edit, 
  Trash2, 
  PlusCircle, 
  FileText,
  UserPlus,
  Unlink
} from 'lucide-react';

export default function PersonDetailsDrawer({
  person,
  allPersons = [],
  marriages = [],
  onClose,
  onEdit,
  onDelete,
  onAddChild,
  onOpenAddSpouse,
  onDeleteMarriage,
  onSelectRelatedPerson
}) {
  if (!person) return null;

  const isMale = person.gender === 'male';

  // Ebeveynler
  const father = allPersons.find((p) => p.id === person.father_id);
  const mother = allPersons.find((p) => p.id === person.mother_id);

  // Eşler (Marriages tablosu + Çocukların anne/baba bağı üzerinden)
  const spouses = [];
  const spouseIds = new Set();

  if (isMale) {
    // Erkeğin Hanımları / Eşleri
    marriages.forEach((m) => {
      if (m.husband_id === person.id) {
        const wifeObj = allPersons.find((p) => p.id === m.wife_id);
        if (wifeObj && !spouseIds.has(wifeObj.id)) {
          spouseIds.add(wifeObj.id);
          spouses.push({ ...wifeObj, marriageId: m.id });
        }
      }
    });

    // Çocukların annelerinden eş çıkarımı
    allPersons.forEach((child) => {
      if (child.father_id === person.id && child.mother_id) {
        const wifeObj = allPersons.find((p) => p.id === child.mother_id);
        if (wifeObj && !spouseIds.has(wifeObj.id)) {
          spouseIds.add(wifeObj.id);
          spouses.push({ ...wifeObj, marriageId: null });
        }
      }
    });
  } else {
    // Kadının Kocası / Eşleri
    marriages.forEach((m) => {
      if (m.wife_id === person.id) {
        const husbandObj = allPersons.find((p) => p.id === m.husband_id);
        if (husbandObj && !spouseIds.has(husbandObj.id)) {
          spouseIds.add(husbandObj.id);
          spouses.push({ ...husbandObj, marriageId: m.id });
        }
      }
    });

    allPersons.forEach((child) => {
      if (child.mother_id === person.id && child.father_id) {
        const husbandObj = allPersons.find((p) => p.id === child.father_id);
        if (husbandObj && !spouseIds.has(husbandObj.id)) {
          spouseIds.add(husbandObj.id);
          spouses.push({ ...husbandObj, marriageId: null });
        }
      }
    });
  }

  // Çocuklar (Babası veya Annesi bu kişi olanlar)
  const children = allPersons.filter(
    (p) => p.father_id === person.id || p.mother_id === person.id
  );

  // Kardeşler
  const siblings = allPersons.filter(
    (p) =>
      p.id !== person.id &&
      ((person.father_id && p.father_id === person.father_id) ||
        (person.mother_id && p.mother_id === person.mother_id))
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '430px',
        maxWidth: '90vw',
        zIndex: 90,
        background: 'rgba(11, 15, 25, 0.96)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid var(--glass-border)',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideLeft 0.25s cubic-bezier(0.2, 0, 0, 1)'
      }}
    >
      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`badge ${isMale ? 'badge-male' : 'badge-female'}`}>
            {isMale ? 'ERKEK SOY' : 'KADIN'}
          </span>
          {person.is_deceased && <span className="badge badge-deceased">VEFAT</span>}
        </div>

        <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem' }}>
          <X size={18} />
        </button>
      </div>

      {/* Body Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        
        {/* Profil Kartı */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: isMale 
              ? 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(16,185,129,0.3) 100%)' 
              : 'linear-gradient(135deg, rgba(236,72,153,0.2) 0%, rgba(168,85,247,0.3) 100%)',
            border: isMale ? '2px solid #06b6d4' : '2px solid #ec4899',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            color: '#ffffff',
            boxShadow: isMale ? '0 0 20px rgba(6,182,212,0.3)' : '0 0 20px rgba(236,72,153,0.3)'
          }}>
            <UserCheck size={32} />
          </div>

          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
              {person.first_name} {person.last_name}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={14} />
              {person.birth_year ? `Doğum: ${person.birth_year}` : 'Doğum Tarihi Bilinmiyor'}
              {person.is_deceased && ` - Vefat: ${person.death_year || '?'}`}
            </p>
          </div>
        </div>

        {/* Detay Bilgiler Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem' }}>
          {person.birth_place && (
            <div style={{ padding: '0.6rem 0.8rem', borderRadius: '0.6rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Doğum Yeri</span>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                <MapPin size={13} color="#38bdf8" /> {person.birth_place}
              </p>
            </div>
          )}

          {person.occupation && (
            <div style={{ padding: '0.6rem 0.8rem', borderRadius: '0.6rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Meslek</span>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                <Briefcase size={13} color="#fbbf24" /> {person.occupation}
              </p>
            </div>
          )}
        </div>

        {/* EŞLERİ / HANIMLARI BÖLÜMÜ (ÖNCELİKLİ & BİRDEN FAZLA EŞ DESTEĞİ) */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '0.85rem', background: 'rgba(236, 72, 153, 0.06)', border: '1px solid rgba(236, 72, 153, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f472b6', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Heart size={16} fill="#ec4899" color="#ec4899" />
              {isMale ? `Hanımları / Eşleri (${spouses.length})` : `Kocası / Eşi (${spouses.length})`}
            </h3>

            {isMale && (
              <button
                className="btn btn-sm"
                onClick={() => onOpenAddSpouse(person)}
                style={{ padding: '0.25rem 0.55rem', fontSize: '0.7rem', background: 'rgba(236, 72, 153, 0.2)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.4)' }}
              >
                <PlusCircle size={12} /> + Eş Ekle
              </button>
            )}
          </div>

          {spouses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {spouses.map((spouse) => (
                <div
                  key={spouse.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.6rem',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(236, 72, 153, 0.2)'
                  }}
                >
                  <button
                    onClick={() => onSelectRelatedPerson(spouse)}
                    style={{ background: 'none', border: 'none', color: '#f472b6', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Heart size={13} fill="#ec4899" color="#ec4899" />
                    <span>{spouse.first_name} {spouse.last_name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                      ({spouse.birth_year ? `d. ${spouse.birth_year}` : '?'})
                    </span>
                  </button>

                  <button
                    onClick={() => onDeleteMarriage(isMale ? person.id : spouse.id, isMale ? spouse.id : person.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                    title="Eş Bağlantısını Kaldır"
                  >
                    <Unlink size={14} color="#f87171" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {isMale ? 'Kayıtlı eş bulunmamaktadır. "+ Eş Ekle" butonuna basarak hanım ekleyebilirsiniz.' : 'Kayıtlı eş bulunmamaktadır.'}
            </p>
          )}
        </div>

        {/* Ebeveynler (Anne & Baba) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Crown size={15} /> ANNE & BABA BAĞLANTILARI
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', borderRadius: '0.6rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Baba (Erkek Soyu):</span>
              {father ? (
                <button
                  onClick={() => onSelectRelatedPerson(father)}
                  style={{ background: 'none', border: 'none', color: '#06b6d4', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Crown size={13} /> {father.first_name} {father.last_name}
                </button>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Belirtilmedi / Kök Ata</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', borderRadius: '0.6rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Anne:</span>
              {mother ? (
                <button
                  onClick={() => onSelectRelatedPerson(mother)}
                  style={{ background: 'none', border: 'none', color: '#ec4899', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Heart size={13} /> {mother.first_name} {mother.last_name}
                </button>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Belirtilmedi</span>
              )}
            </div>
          </div>

          {/* Çocuklar */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Çocukları ({children.length})
              </span>
              <button 
                onClick={() => onAddChild(person)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: '#38bdf8' }}
              >
                + Çocuk Ekle
              </button>
            </div>

            {children.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onSelectRelatedPerson(child)}
                    style={{
                      padding: '0.4rem 0.7rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem',
                      background: child.gender === 'male' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(236, 72, 153, 0.12)',
                      border: child.gender === 'male' ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(236, 72, 153, 0.3)',
                      color: child.gender === 'male' ? '#38bdf8' : '#f472b6',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <GitCommit size={13} />
                    {child.first_name} ({child.birth_year || '?'})
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Kayıtlı çocuk yok.</p>
            )}
          </div>

          {/* Kardeşler */}
          {siblings.length > 0 && (
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                Kardeşleri ({siblings.length})
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {siblings.map((sib) => (
                  <button
                    key={sib.id}
                    onClick={() => onSelectRelatedPerson(sib)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    {sib.first_name} {sib.last_name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Biyografi / Notlar */}
        {person.bio && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '0.75rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FileText size={13} /> Biyografi & Notlar
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {person.bio}
            </p>
          </div>
        )}

      </div>

      {/* Footer / Action Buttons */}
      <div style={{ padding: '1.2rem 1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.8rem', background: 'rgba(15, 23, 42, 0.9)' }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => onEdit(person)}>
          <Edit size={15} />
          Düzenle
        </button>

        <button className="btn btn-danger" onClick={() => onDelete(person.id)} title="Kişiyi Sil">
          <Trash2 size={15} />
        </button>
      </div>

    </div>
  );
}
