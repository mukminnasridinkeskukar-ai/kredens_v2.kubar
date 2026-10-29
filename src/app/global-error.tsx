'use client'

/**
 * Error boundary tingkat akar (menggantikan <html> dan <body>).
 * Aktif ketika kesalahan terjadi di luar cakupan error.tsx biasa, misalnya
 * pada layout akar. Wajib merender dokumen HTML lengkap sendiri.
 */
export default function ErrorGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#f8fafc',
          color: '#0f172a',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            padding: 32,
            borderRadius: 16,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 16px',
              borderRadius: 999,
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            !
          </div>
          <h1 style={{ fontSize: 18, margin: '0 0 8px' }}>
            Aplikasi Mengalami Gangguan
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: '#475569', margin: 0 }}>
            Silakan muat ulang halaman. Bila gangguan berlanjut, keluar dan masuk
            kembali ke akun Anda, atau hubungi pengelola aplikasi.
          </p>
          {error?.digest && (
            <p
              style={{
                marginTop: 12,
                padding: '8px 12px',
                borderRadius: 8,
                background: '#f1f5f9',
                fontFamily: 'monospace',
                fontSize: 12,
                color: '#64748b',
              }}
            >
              Kode galat: {error.digest}
            </p>
          )}
          <p
            style={{
              marginTop: 12,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px dashed #cbd5e1',
              fontSize: 12,
              lineHeight: 1.6,
              color: '#475569',
              textAlign: 'left',
            }}
          >
            <strong>Petunjuk pengelola:</strong> buka{' '}
            <a href="/api/setup" style={{ color: '#009035', fontWeight: 600 }}>
              /api/setup
            </a>{' '}
            untuk memeriksa database. Bila tertulis <code>ok: false</code>, buka{' '}
            <a href="/api/setup?force=1" style={{ color: '#009035', fontWeight: 600 }}>
              /api/setup?force=1
            </a>{' '}
            sekali sampai <code>ok: true</code>, lalu masuk kembali.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 20,
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: '#009035',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  )
}
