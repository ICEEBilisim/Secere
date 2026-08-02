import React, { useState } from 'react';
import { X, FolderPlus, Save, AlertCircle } from 'lucide-react';

export default function FamilyModal({
  isOpen,
  onClose,
  onSave,
  persons = []
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rootPersonId, setRootPersonId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Lütfen sülale / aile adını giriniz.');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      root_person_id: rootPersonId || null
    });

    setName('');
    setDescription('');
    setRootPersonId('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="glass-panel" 
        onClick={(e) => e.stopPropagation()} 
        style={{ width: '100%', maxWidth: '500px', padding: '1.8rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FolderPlus size={22} color="#fbbf24" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
              Yeni Sülale / Aile Ekle
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
          <div className="form-group">
            <label className="form-label">Sülale / Aile Adı *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Örn: Yılmaz Sülalesi, Karasu Ailesi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kurucu Ata (Kök Kişi)</label>
            <select
              className="form-select"
              value={rootPersonId}
              onChange={(e) => setRootPersonId(e.target.value)}
            >
              <option value="">(Henüz Belirlenmedi)</option>
              {persons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} ({p.birth_year || '?'})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tarihçe & Açıklama</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Sülalenin kökeni, tarihi ve hakkında genel bilgiler..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              İptal
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              Sülaleyi Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
