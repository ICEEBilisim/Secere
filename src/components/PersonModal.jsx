import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, AlertCircle, Calendar, Shield } from 'lucide-react';

export default function PersonModal({
  isOpen,
  onClose,
  onSave,
  editingPerson = null,
  initialParent = null, // Çocuk ekleme işleminde otomatik ebeveyn atama
  persons = [],
  families = [],
  marriages = []
}) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: 'male',
    birth_year: '',
    death_year: '',
    is_deceased: false,
    father_id: '',
    mother_id: '',
    family_id: '',
    bio: '',
    birth_place: '',
    occupation: ''
  });

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingPerson) {
      setFormData({
        first_name: editingPerson.first_name || '',
        last_name: editingPerson.last_name || '',
        gender: editingPerson.gender || 'male',
        birth_year: editingPerson.birth_year || '',
        death_year: editingPerson.death_year || '',
        is_deceased: Boolean(editingPerson.is_deceased),
        father_id: editingPerson.father_id || '',
        mother_id: editingPerson.mother_id || '',
        family_id: editingPerson.family_id || (families[0]?.id || ''),
        bio: editingPerson.bio || '',
        birth_place: editingPerson.birth_place || '',
        occupation: editingPerson.occupation || ''
      });
    } else if (initialParent) {
      // Çocuk ekleniyorsa
      const isFather = initialParent.gender === 'male';
      setFormData({
        first_name: '',
        last_name: initialParent.last_name || '',
        gender: 'male',
        birth_year: '',
        death_year: '',
        is_deceased: false,
        father_id: isFather ? initialParent.id : (initialParent.father_id || ''),
        mother_id: !isFather ? initialParent.id : '',
        family_id: initialParent.family_id || (families[0]?.id || ''),
        bio: '',
        birth_place: initialParent.birth_place || '',
        occupation: ''
      });
    } else {
      // Temiz Form
      setFormData({
        first_name: '',
        last_name: families[0] ? families[0].name.split(' ')[0] : 'Karasu',
        gender: 'male',
        birth_year: '',
        death_year: '',
        is_deceased: false,
        father_id: '',
        mother_id: '',
        family_id: families[0]?.id || '',
        bio: '',
        birth_place: '',
        occupation: ''
      });
    }
    setErrorMsg('');
  }, [editingPerson, initialParent, families, isOpen]);

  if (!isOpen) return null;

  // Erkek ve Kadın Aday Ebeveyn Listeleri
  const potentialFathers = persons.filter(
    (p) => p.gender === 'male' && (!editingPerson || p.id !== editingPerson.id)
  );
  const potentialMothers = persons.filter(
    (p) => p.gender === 'female' && (!editingPerson || p.id !== editingPerson.id)
  );

  // Babası seçilmişse babanın karılarını (eşlerini) tespit et
  const fatherWifeIds = new Set();
  if (formData.father_id) {
    // 1. Evlilik kayıtlarından babanın eşleri
    marriages.forEach((m) => {
      if (m.husband_id === formData.father_id && m.wife_id) {
        fatherWifeIds.add(m.wife_id);
      }
    });
    // 2. Çocuk kayıtlarından bu babadan çocuğu olan anneler
    persons.forEach((p) => {
      if (p.father_id === formData.father_id && p.mother_id) {
        fatherWifeIds.add(p.mother_id);
      }
    });
  }

  const fatherWives = potentialMothers.filter((m) => fatherWifeIds.has(m.id));
  const otherMothers = potentialMothers.filter((m) => !fatherWifeIds.has(m.id));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setErrorMsg('Lütfen ad ve soyad alanlarını doldurunuz.');
      return;
    }

    const payload = {
      ...formData,
      birth_year: formData.birth_year ? parseInt(formData.birth_year, 10) : null,
      death_year: formData.death_year && formData.is_deceased ? parseInt(formData.death_year, 10) : null,
      father_id: formData.father_id || null,
      mother_id: formData.mother_id || null,
      family_id: formData.family_id || null,
      id: editingPerson?.id
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="glass-panel" 
        onClick={(e) => e.stopPropagation()} 
        style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', padding: '1.8rem' }}
      >
        {/* Modal Başlık */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserPlus size={22} color="#06b6d4" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
              {editingPerson ? 'Kişi Bilgilerini Düzenle' : initialParent ? `${initialParent.first_name} Kişisine Çocuk Ekle` : 'Yeni Kişi Ekle'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.6rem', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Ad & Soyad */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Ad *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Örn: Ahmet"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Soyad *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Örn: Karasu"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Cinsiyet & Sülale */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Cinsiyet</label>
              <select
                className="form-select"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="male">Erkek (Patrilinear Soy Çizgisi)</option>
                <option value="female">Kadın</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Bağlı Olduğu Sülale / Aile</label>
              <select
                className="form-select"
                value={formData.family_id}
                onChange={(e) => setFormData({ ...formData, family_id: e.target.value })}
              >
                <option value="">(Aile Seçilmedi)</option>
                {families.map((fam) => (
                  <option key={fam.id} value={fam.id}>
                    {fam.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Baba ve Anne Bağlantıları (Secere İlişkisi) */}
          <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--glass-border)', marginBottom: '1.2rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#38bdf8', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={15} /> SOY & EBEVEYN BAĞLANTILARI
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#06b6d4' }}>Baba (Erkek Soyu)</label>
                <select
                  className="form-select"
                  value={formData.father_id}
                  onChange={(e) => {
                    const newFatherId = e.target.value;
                    let newMotherId = formData.mother_id;
                    if (newFatherId) {
                      const wives = [];
                      marriages.forEach((m) => {
                        if (m.husband_id === newFatherId && m.wife_id) wives.push(m.wife_id);
                      });
                      persons.forEach((p) => {
                        if (p.father_id === newFatherId && p.mother_id && !wives.includes(p.mother_id)) wives.push(p.mother_id);
                      });
                      if (wives.length === 1 && !formData.mother_id) {
                        newMotherId = wives[0];
                      }
                    }
                    setFormData({ ...formData, father_id: newFatherId, mother_id: newMotherId });
                  }}
                >
                  <option value="">(Baba Bilinmiyor / Kök Ata)</option>
                  {potentialFathers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.first_name} {f.last_name} ({f.birth_year || '?'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#ec4899' }}>
                  Anne {fatherWives.length > 0 && <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>(Babanın {fatherWives.length} Eşi Öncelikli)</span>}
                </label>
                <select
                  className="form-select"
                  value={formData.mother_id}
                  onChange={(e) => setFormData({ ...formData, mother_id: e.target.value })}
                >
                  <option value="">(Anne Bilinmiyor)</option>
                  {fatherWives.length > 0 ? (
                    <>
                      <optgroup label="⭐ Babanın Eşleri (Öncelikli)">
                        {fatherWives.map((m) => (
                          <option key={m.id} value={m.id}>
                            ⭐ {m.first_name} {m.last_name} ({m.birth_year || '?'})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Diğer Kadınlar">
                        {otherMothers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.first_name} {m.last_name} ({m.birth_year || '?'})
                          </option>
                        ))}
                      </optgroup>
                    </>
                  ) : (
                    potentialMothers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.first_name} {m.last_name} ({m.birth_year || '?'})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Tarihler & Vefat Durumu */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Doğum Yılı</label>
              <input
                type="number"
                className="form-input"
                placeholder="Örn: 1985"
                value={formData.birth_year}
                onChange={(e) => setFormData({ ...formData, birth_year: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Durum</label>
              <select
                className="form-select"
                value={formData.is_deceased ? 'deceased' : 'alive'}
                onChange={(e) => setFormData({ ...formData, is_deceased: e.target.value === 'deceased' })}
              >
                <option value="alive">Hayatta</option>
                <option value="deceased">Vefat Etmiş</option>
              </select>
            </div>

            {formData.is_deceased && (
              <div className="form-group">
                <label className="form-label">Ölüm Yılı</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Örn: 2020"
                  value={formData.death_year}
                  onChange={(e) => setFormData({ ...formData, death_year: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* Doğum Yeri & Meslek */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Doğum Yeri</label>
              <input
                type="text"
                className="form-input"
                placeholder="Örn: Bursa"
                value={formData.birth_place}
                onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Meslek</label>
              <input
                type="text"
                className="form-input"
                placeholder="Örn: Mühendis"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              />
            </div>
          </div>

          {/* Biyografi / Notlar */}
          <div className="form-group">
            <label className="form-label">Biyografi / Notlar</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Kişi hakkında ek tarihsel veya biyografik bilgiler..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          {/* Butonlar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              İptal
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
