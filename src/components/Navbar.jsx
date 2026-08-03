import React, { useState, useRef, useEffect } from 'react';
import { 
  GitFork, 
  Users, 
  UserPlus, 
  FolderPlus, 
  Search, 
  Database, 
  Sparkles,
  RefreshCw,
  ChevronDown,
  CheckSquare,
  Square,
  Check,
  Filter,
  Palette,
  LogIn,
  LogOut,
  UserCheck,
  User
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export default function Navbar({
  activeView,
  setActiveView,
  searchQuery,
  setSearchQuery,
  selectedFamilyIds = [],
  setSelectedFamilyIds,
  families = [],
  persons = [],
  currentTheme = 'offwhite',
  setCurrentTheme,
  onOpenAddPerson,
  onOpenAddFamily,
  onResetDemoData,
  personCount,
  user,
  onOpenAuth,
  onSignOut
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const themeDropdownRef = useRef(null);

  // Dışarı tıklamayı algılayıp menüleri kapatma
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target)) {
        setIsThemeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sülale kişi sayısını hesapla
  const getFamilyMemberCount = (familyId) => {
    return persons.filter((p) => p.family_id === familyId).length;
  };

  const toggleFamilySelection = (familyId) => {
    if (selectedFamilyIds.includes(familyId)) {
      setSelectedFamilyIds(selectedFamilyIds.filter((id) => id !== familyId));
    } else {
      setSelectedFamilyIds([...selectedFamilyIds, familyId]);
    }
  };

  const handleSelectAll = () => {
    setSelectedFamilyIds([]);
  };

  // Buton Metni
  const getButtonText = () => {
    if (!selectedFamilyIds || selectedFamilyIds.length === 0) {
      return 'Tüm Sülaleler';
    }
    if (selectedFamilyIds.length === 1) {
      const fam = families.find((f) => f.id === selectedFamilyIds[0]);
      return fam ? fam.name : '1 Sülale Seçili';
    }
    return `${selectedFamilyIds.length} Sülale Seçili`;
  };

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        
        {/* Logo / Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #0284c7 0%, #d97706 100%)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(2, 132, 199, 0.3)'
          }}>
            <GitFork size={22} color="#ffffff" style={{ transform: 'rotate(180deg)' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ŞECERE <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(2, 132, 199, 0.15)', color: 'var(--accent-male)', fontFamily: 'var(--font-sans)', fontWeight: 700 }}>PRO</span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Soy Bağı & Aile Ağacı Yazılımı
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid var(--glass-border)' }}>
          <button
            className={`btn btn-sm ${activeView === 'tree' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveView('tree')}
            style={{ border: 'none' }}
          >
            <GitFork size={15} style={{ transform: 'rotate(180deg)' }} />
            Görsel Soy Ağacı
          </button>
          <button
            className={`btn btn-sm ${activeView === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveView('list')}
            style={{ border: 'none' }}
          >
            <Users size={15} />
            Kişi Listesi ({personCount})
          </button>
        </div>

        {/* Search & Family Multi-Select Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 320px', maxWidth: '480px' }}>
          
          {/* Multi-Select Sülale Popover */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                padding: '0.5rem 0.75rem',
                background: selectedFamilyIds.length > 0 ? 'rgba(2, 132, 199, 0.15)' : 'var(--input-bg)',
                borderColor: selectedFamilyIds.length > 0 ? 'var(--accent-male)' : 'var(--glass-border)',
                color: selectedFamilyIds.length > 0 ? 'var(--accent-male)' : 'var(--text-primary)',
                minWidth: '170px',
                justify: 'space-between'
              }}
            >
              <Filter size={14} />
              <span style={{ flex: 1, textAlign: 'left', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {getButtonText()}
              </span>
              <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>

            {/* Dropdown Popover Menü */}
            {isDropdownOpen && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  width: '260px',
                  padding: '0.75rem',
                  zIndex: 100,
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
                  animation: 'fadeIn 0.15s ease-out'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Sülale Filtresi
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-male)', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Tümünü Göster
                  </button>
                </div>

                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {families.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>Tanımlı sülale bulunmuyor.</p>
                  ) : (
                    families.map((fam) => {
                      const isExplicitlyChecked = selectedFamilyIds.includes(fam.id);
                      const count = getFamilyMemberCount(fam.id);

                      return (
                        <label
                          key={fam.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.55rem',
                            padding: '0.45rem 0.6rem',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            background: isExplicitlyChecked ? 'rgba(2, 132, 199, 0.15)' : 'rgba(0, 0, 0, 0.03)',
                            border: `1px solid ${isExplicitlyChecked ? 'var(--accent-male)' : 'transparent'}`,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isExplicitlyChecked}
                            onChange={() => toggleFamilySelection(fam.id)}
                            style={{ accentColor: '#0284c7', cursor: 'pointer', width: '15px', height: '15px' }}
                          />
                          <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: isExplicitlyChecked ? 700 : 500, color: 'var(--text-primary)' }}>
                            {fam.name}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--input-bg)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            {count}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>

                {selectedFamilyIds.length > 0 && (
                  <div style={{ marginTop: '0.6rem', paddingTop: '0.4rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedFamilyIds([])}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer' }}
                    >
                      Filtreyi Temizle
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="İsim veya soyisim ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.1rem', fontSize: '0.825rem', padding: '0.45rem 0.7rem 0.45rem 2.1rem' }}
            />
          </div>
        </div>

        {/* Action Buttons & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          
          {/* Skin / Tema Seçici Popover */}
          <div ref={themeDropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
              title="Tema / Skin Seçin"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.75rem' }}
            >
              <Palette size={15} color={currentTheme === 'offwhite' ? '#d97706' : currentTheme === 'wood' ? '#f59e0b' : '#38bdf8'} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {currentTheme === 'offwhite' && 'Kirli Beyaz'}
                {currentTheme === 'wood' && 'Ahşap / Kereste'}
                {currentTheme === 'dark' && 'Koyu Gece'}
                {currentTheme === 'emerald' && 'Zümrüt / Doğa'}
              </span>
              <ChevronDown size={13} style={{ transform: isThemeDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {isThemeDropdownOpen && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: '200px',
                  padding: '0.5rem',
                  zIndex: 100,
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
                  animation: 'fadeIn 0.15s ease-out'
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', padding: '0.3rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                  Skin / Tema Seçimi
                </div>
                {[
                  { id: 'offwhite', label: 'Kirli Beyaz (Varsayılan)', bg: '#f4f0e8', border: '#d97706' },
                  { id: 'wood', label: 'Ahşap / Kereste', bg: '#351d13', border: '#f59e0b' },
                  { id: 'dark', label: 'Koyu Gece', bg: '#0b0f19', border: '#06b6d4' },
                  { id: 'emerald', label: 'Zümrüt / Doğa', bg: '#0c1a17', border: '#10b981' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      if (setCurrentTheme) setCurrentTheme(t.id);
                      setIsThemeDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.45rem 0.6rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${currentTheme === t.id ? t.border : 'transparent'}`,
                      background: currentTheme === t.id ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: currentTheme === t.id ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      marginBottom: '0.2rem'
                    }}
                  >
                    <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: t.bg, border: `2px solid ${t.border}`, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DB Indicator */}
          <div 
            title={isSupabaseConfigured ? "Supabase Veritabanı Bağlı" : "Yerel Demo Depolama Çalışıyor"}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              fontSize: '0.7rem', 
              padding: '0.35rem 0.65rem', 
              borderRadius: '9999px',
              background: isSupabaseConfigured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isSupabaseConfigured ? '#10b981' : '#d97706',
              border: `1px solid ${isSupabaseConfigured ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
            }}
          >
            <Database size={13} />
            <span>{isSupabaseConfigured ? 'Supabase DB' : 'Demo DB'}</span>
          </div>

          {!isSupabaseConfigured && (
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={onResetDemoData}
              title="Demo verilerini varsayılana sıfırla"
            >
              <RefreshCw size={13} />
              Sıfırla
            </button>
          )}

          <button className="btn btn-secondary btn-sm" onClick={onOpenAddFamily}>
            <FolderPlus size={15} />
            + Sülale
          </button>

          <button className="btn btn-primary btn-sm" onClick={onOpenAddPerson}>
            <UserPlus size={15} />
            + Kişi Ekle
          </button>

          {/* SAĞ ÜST KÖŞEYE SABİTLENMİŞ KULLANICI GİRİŞİ VE BİLGİ ALANI */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginLeft: '0.4rem',
            paddingLeft: '0.6rem',
            borderLeft: '1px solid var(--glass-border)'
          }}>
            {user ? (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.18) 0%, rgba(6, 182, 212, 0.15) 100%)',
                  border: '1px solid var(--accent-male)',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'var(--accent-male)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  color: '#ffffff',
                  flexShrink: 0
                }}>
                  <UserCheck size={14} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, maxWidth: '165px' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--accent-male)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Oturum Açık
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={user.email}>
                    {user.email}
                  </span>
                </div>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={onSignOut}
                  title="Oturumu Kapat"
                  style={{ marginLeft: '0.2rem', padding: '0.3rem 0.5rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)' }}
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={onOpenAuth}
                style={{
                  padding: '0.5rem 0.95rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                  whiteSpace: 'nowrap'
                }}
              >
                <LogIn size={15} />
                Giriş Yap / Kayıt Ol
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
