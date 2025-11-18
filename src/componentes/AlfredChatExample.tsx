import { useState } from 'react';
import AlfredVerificationModal from './AlfredVerificationModal';

export default function AlfredChatExample() {
  const [email, setEmail] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [backendBaseUrl] = useState('http://localhost:5173'); // ajustar al puerto del backend
  const [lastGeneratedPassword, setLastGeneratedPassword] = useState<string | null>(null);

  async function requestGeneratePassword() {
    // Llamar a /generate-password
    const res = await fetch(`${backendBaseUrl}/generate-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const body = await res.json();
    if (!res.ok) {
      alert(body.error || 'Error');
      return;
    }
    if (body.verificationRequired) {
      // abrir modal para ingresar código
      setModalOpen(true);
    } else {
      // si no requiere verificación, el backend puede devolver la contraseña
      setLastGeneratedPassword(body.password ?? null);
      alert('Contraseña generada: ' + (body.password ?? '(oculta)'));
    }
  }

  function handleVerified(password: string | null) {
    if (password) {
      setLastGeneratedPassword(password);
      alert('Contraseña generada: ' + password);
    } else {
      // verificado pero backend no devolvió contraseña (según implementación)
      alert('Correo verificado. Revise su cuenta o inicie sesión.');
    }
  }

  return (
    <div>
      <input placeholder="Correo institucional" value={email} onChange={e => setEmail(e.target.value)} />
      <button onClick={requestGeneratePassword}>Generar contraseña</button>

      <AlfredVerificationModal
        email={email}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onVerified={handleVerified}
        backendBaseUrl={backendBaseUrl}
      />

      {lastGeneratedPassword && <div>Última contraseña generada: {lastGeneratedPassword}</div>}
    </div>
  );
}