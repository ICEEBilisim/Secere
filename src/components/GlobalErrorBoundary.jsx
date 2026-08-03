import React from 'react';
import { AlertTriangle, RefreshCw, Copy, Database, Check } from 'lucide-react';
import { isSupabaseConfigured, resetToDemoData } from '../lib/supabase';

export default class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Global Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  componentDidMount() {
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleRejection);
  }

  handleGlobalError = (event) => {
    console.error('Unhandled Global Error:', event.error || event.message);
    if (!this.state.hasError) {
      this.setState({
        hasError: true,
        error: event.error || new Error(event.message || 'Bilinmeyen Sistem Hatası')
      });
    }
  };

  handleRejection = (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    if (!this.state.hasError) {
      const err = event.reason instanceof Error ? event.reason : new Error(String(event.reason || 'Promise Hatası'));
      this.setState({
        hasError: true,
        error: err
      });
    }
  };

  handleResetAndReload = () => {
    try {
      resetToDemoData();
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  handleCopyError = () => {
    const errorDetails = `
URL: ${window.location.href}
UserAgent: ${navigator.userAgent}
Supabase Configured: ${isSupabaseConfigured}
Error: ${this.state.error?.message || 'Bilinmeyen Hata'}
Stack: ${this.state.error?.stack || 'Stack yok'}
ComponentStack: ${this.state.errorInfo?.componentStack || 'yok'}
    `.trim();

    navigator.clipboard.writeText(errorDetails);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 3000);
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || String(this.state.error || 'Bilinmeyen çalışma zamanı hatası');

      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '750px',
            width: '100%',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: '#ef4444' }}>
              <AlertTriangle size={36} />
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                  Sistem Çalışma Zamanı Teşhis Ekranı (Runtime Diagnosis)
                </h1>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
                  Uygulama çalıştırılırken bir hata tespit edildi. Aşağıdaki detaylar canlı ortam hata takibi içindir.
                </p>
              </div>
            </div>

            {/* Hata Kartı */}
            <div style={{
              backgroundColor: '#090d16',
              border: '1px solid #ef4444',
              borderRadius: '0.6rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              color: '#fca5a5',
              maxHeight: '220px',
              overflowY: 'auto'
            }}>
              <strong>Hata Mesajı:</strong> {errorMsg}
              {this.state.error?.stack && (
                <div style={{ marginTop: '0.5rem', opacity: 0.8, fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                  {this.state.error.stack}
                </div>
              )}
            </div>

            {/* Durum Bilgileri */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
              backgroundColor: '#0f172a',
              padding: '1rem',
              borderRadius: '0.6rem',
              fontSize: '0.85rem'
            }}>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>SUPABASE YAPILANDIRMASI:</span>
                <strong style={{ color: isSupabaseConfigured ? '#10b981' : '#f59e0b' }}>
                  {isSupabaseConfigured ? '🟢 Yapılandırılmış (Aktif)' : '🟡 Yapılandırılmamış (Yerel Mod)'}
                </strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>SAYFA ADRESİ (URL):</span>
                <strong style={{ color: '#38bdf8', wordBreak: 'break-all', fontSize: '0.75rem' }}>
                  {window.location.pathname}
                </strong>
              </div>
            </div>

            {/* Aksiyon Butonları */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleResetAndReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.2rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={16} />
                Örnek Veri İle Sıfırla ve Yeniden Başlat
              </button>

              <button
                onClick={this.handleCopyError}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.2rem',
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {this.state.copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                {this.state.copied ? 'Hata Kopyalandı!' : 'Hata Detayını Kopyala'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
