import React, { useState } from 'react';
import { Database, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { isSupabaseConfigured, lastDatabaseError, resetToDemoData } from '../lib/supabase';

export default function DiagnosticBanner({ personsCount, familiesCount, onRefresh }) {
  const [isOpen, setIsOpen] = useState(false);

  const hasError = Boolean(lastDatabaseError);

  return (
    <div style={{
      backgroundColor: hasError ? 'rgba(239, 68, 68, 0.12)' : isSupabaseConfigured ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
      borderBottom: `1px solid ${hasError ? 'rgba(239, 68, 68, 0.3)' : isSupabaseConfigured ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
      color: 'var(--text-primary)',
      padding: '0.4rem 1.5rem',
      fontSize: '0.8rem',
      transition: 'all 0.2s ease'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        {/* Sol Taraf: Durum İkonu ve Kısa Özet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {hasError ? (
            <AlertTriangle size={16} color="#ef4444" />
          ) : isSupabaseConfigured ? (
            <CheckCircle size={16} color="#10b981" />
          ) : (
            <Info size={16} color="#f59e0b" />
          )}

          <span style={{ fontWeight: 600 }}>
            {hasError
              ? 'Veritabanı Uyarısı:'
              : isSupabaseConfigured
              ? 'Supabase Bağlantısı:'
              : 'Veri Modu:'}
          </span>

          <span style={{ color: hasError ? '#fca5a5' : isSupabaseConfigured ? '#6ee7b7' : '#fcd34d' }}>
            {hasError
              ? lastDatabaseError
              : isSupabaseConfigured
              ? 'Supabase veritabanına bağlı (Canlı Veri)'
              : 'Supabase anahtarları verilmemiş (Yerel Örnek Veri Modu Aktif)'}
          </span>
        </div>

        {/* Sağ Taraf: Detay Aç / Kapat Butonu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Teşhis Detayları {isOpen ? 'Gizle' : 'Göster'}
          </button>
        </div>
      </div>

      {/* Açılır Teşhis Paneli */}
      {isOpen && (
        <div style={{
          maxWidth: '1400px',
          margin: '0.5rem auto 0 auto',
          padding: '0.75rem',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '0.5rem',
          border: '1px solid var(--glass-border)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '0.75rem',
          fontSize: '0.75rem'
        }}>
          <div>
            <strong style={{ color: 'var(--text-muted)', display: 'block' }}>SUPABASE YAPILANDIRMASI:</strong>
            <span>{isSupabaseConfigured ? 'VITE_SUPABASE_URL Tanımlı' : 'VITE_SUPABASE_URL Tanımsız (GitHub Secret yok)'}</span>
          </div>

          <div>
            <strong style={{ color: 'var(--text-muted)', display: 'block' }}>YÜKLENEN VERİ SAYILARI:</strong>
            <span>{personsCount} Birey, {familiesCount} Sülale</span>
          </div>

          <div>
            <strong style={{ color: 'var(--text-muted)', display: 'block' }}>SAYFA ADRESİ (URL):</strong>
            <span style={{ wordBreak: 'break-all' }}>{window.location.href}</span>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                resetToDemoData();
                onRefresh();
              }}
              style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem' }}
            >
              <RefreshCw size={12} />
              Örnek Veri İle Sıfırla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
