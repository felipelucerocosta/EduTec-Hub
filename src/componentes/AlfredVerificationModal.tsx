import { useState } from 'react';

interface Props {
  email: string;
  open: boolean;
  onClose: () => void;
  backendBaseUrl?: string;
  onVerified: (password: string | null, reply?: string) => void;
}

export default function AlfredVerificationModal({ email, open, onClose, backendBaseUrl = 'http://localhost:5173', onVerified }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleVerify() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendBaseUrl}/verify-email-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.reply || body.error || 'Código inválido');
        onVerified(null, body.reply);
      } else {
        onVerified(body.password ?? null, body.reply);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Error de red');
      onVerified(null, 'Error de red al verificar el código.');
    } finally {
      setLoading(false);
      setCode('');
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)', zIndex: 2000
    }}>
      <div style={{ width: 360, background: '#fff', borderRadius: 8, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Verificación de correo</h3>
        <p style={{ fontSize: 13 }}>Enviamos un código a <strong>{email}</strong>. Pegalo aquí:</p>
        <input
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código (6 dígitos)"
          maxLength={10}
        />
        {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => { setCode(''); setError(null); onClose(); }} disabled={loading}>Cancelar</button>
          <button onClick={handleVerify} disabled={loading || code.trim().length === 0}>
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </div>
      </div>
    </div>
  );
}