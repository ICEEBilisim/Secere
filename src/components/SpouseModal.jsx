import React, { useState } from 'react';
import { X, Heart, PlusCircle, Save, AlertCircle, UserPlus } from 'lucide-react';

export default function SpouseModal({
  isOpen,
  onClose,
  husbandPerson,
  allPersons = [],
  onAddExistingSpouse,
  onCreateAndAddSpouse
}) {
  const [activeTab, setActiveTab] = useState('existing'); // 'existing' | 'new'
  const [selectedWifeId, setSelectedWifeId] = useState('');
  
  // Yeni Kadın Kişi Formu
  const [newWifeName, setNewWifeName] = useState('');
  const [newWifeLastName, setNewWifeLastName] = useState('');
  const [newWifeBirthYear, setNewWifeBirthYear] = useState('');
  const [newWifeIsDeceased, setNewWifeIsDeceased] = useState(false);
  const [newWifeDeathYear, setNewWifeDeathYear] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !husbandPerson) return null;

  // Mevcut kadınlar (Eş adayları)
  const candidateWives = allPersons.filter((p) => p.gender === 'female' && p.id !== husbandPerson.id);

  const handleAddExisting = (e) => {
    e.preventDefault();
    if (!selectedWifeId) {
      setErrorMsg('Lütfen listeden bir eş adayı seçiniz.');
      return;
    }
    onAddExistingSpouse(husbandPerson.id, selectedWifeId);
    onClose();
  };

  const handleCreateNew = (e) => {
    e.preventDefault();
    if (!newWifeName.trim() || !newWifeLastName.trim()) {
      setErrorMsg('Lütfen ad ve soyad alanlarını doldurunuz.');
      return;
    }

    const newWifePayload = {
      first_name: newWifeName.trim(),
      last_name: newWifeLastName.trim(),
      gender: 'female',
      birth_year: newWifeBirthYear ? parseInt(newWifeBirthYear, 10) : null,
      death_year: newWifeDeathYear && newWifeIsDeceased ? parseInt(newWifeDeathYear, 10) : null,
      is_deceased: newWifeIsDeceased,
      family_id: husbandPerson.family_id || null
    };

    onCreateAndAddSpouse(husbandPerson.id, newWifePayload);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="glass-panel" 
        onClick={(e) => e.stopPropagation()} 
        style={{ width: '100%', maxWidth: '520px', padding: '1.8rem' }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Heart size={22} color="#ec4899" fill="#ec4899" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
              {husbandPerson.first_name} {husbandPerson.last_name} Kişisine Eş Ekle
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

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'rgba(15,23,42,0.8)', padding: '0.25rem', borderRadius: '0.6rem', marginBottom: '1.2rem', border: '1px solid var(--glass-border)' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'existing' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, border: 'none', justifyContent: 'center' }}
            onClick={() => setActiveTab('existing')}
          >
            Mevcut Kişilerden Seç
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'new' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, border: 'none', justifyContent: 'center' }}
            onClick={() => setActiveTab('new')}
          >
            <UserPlus size={14} /> Yeni Eş Oluştur
          </button>
        </div>

        {/* Tab 1: Mevcut Kadınlardan Seç */}
        {activeTab === 'existing' && (
          <form onSubmit={handleAddExisting}>
            <div className="form-group">
              <label className="form-label">Eş Olarak Eklenecek Kadın</label>
              <select
                className="form-select"
                value={selectedWifeId}
                onChange={(e) => setSelectedWifeId(e.target.value)}
                required
              >
                <option value="">-- Kadın Seçiniz --</option>
                {candidateWives.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.first_name} {w.last_name} ({w.birth_year ? `d. ${w.birth_year}` : 'Doğum y. bilinmiyor'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>İptal</button>
              <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)' }}>
                <Heart size={16} /> Eş Olarak Bağla
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Sıfırdan Yeni Eş Oluştur */}
        {activeTab === 'new' && (
          <form onSubmit={handleCreateNew}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Ad *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Örn: Ayşe"
                  value={newWifeName}
                  onChange={(e) => setNewWifeName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Soyad *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Örn: Karasu"
                  value={newWifeLastName}
                  onChange={(e) => setNewWifeLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Doğum Yılı</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Örn: 1950"
                  value={newWifeBirthYear}
                  onChange={(e) => setNewWifeBirthYear(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hayatta mı?</label>
                <select
                  className="form-select"
                  value={newWifeIsDeceased ? 'deceased' : 'alive'}
                  onChange={(e) => setNewWifeIsDeceased(e.target.value === 'deceased')}
                >
                  <option value="alive">Hayatta</option>
                  <option value="deceased">Vefat Etmiş</option>
                </select>
              </div>
            </div>

            {newWifeIsDeceased && (
              <div className="form-group">
                <label className="form-label">Ölüm Yılı</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Örn: 2020"
                  value={newWifeDeathYear}
                  onChange={(e) => setNewWifeDeathYear(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>İptal</button>
              <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)' }}>
                <Save size={16} /> Oluştur & Eş Olarak Ekle
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
