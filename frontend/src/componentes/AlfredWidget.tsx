import React, { useState } from 'react';
import AlfredVerificationModal from './AlfredVerificationModal';

export default function AlfredWidget() {
  const [email, setEmail] = useState('');
  const [messages, setMessages] = useState<{ from: 'user'|'alfred', text: string }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [backendBaseUrl] = useState('http://localhost:5173'); // ajustar si tu backend corre en otro puerto

  function pushAlfred(text: string) {
    setMessages(m => [...m, { from: 'alfred', text }]);
  }
  function pushUser(text: string) {
    setMessages(m => [...m, { from: 'user', text }]);
  }

  async function handleRequestPassword() {
    if (!email.trim()) return;
    pushUser(email);

    try {
      const res = await fetch(`${backendBaseUrl}/generate-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const body = await res.json();

      // Mostrar el reply del backend (mensaje amigable)
      if (body.reply) pushAlfred(body.reply);

      if (!res.ok) {
        // en caso de error no abrir modal
        return;
      }

      if (body.verificationRequired) {
        // abrir modal para que el usuario ingrese el código recibido por mail
        setModalOpen(true);
      } else {
        // contraseña generada inmediatamente (no institucional)
        const pwd = body.password;
        if (pwd) pushAlfred('Contraseña generada: ' + pwd);
      }
    } catch (err: any) {
      pushAlfred('Error de red intentando generar la contraseña.');
      console.error(err);
    }
  }

  function handleVerified(password: string | null, reply?: string) {
    if (reply) pushAlfred(reply);
    if (password) {
      pushAlfred('Contraseña generada: ' + password);
    } else {
      if (!reply) pushAlfred('Correo verificado. Intenta iniciar sesión.');
    }
  }

  return (
    <div style={{ width: 340, border: '1px solid #ccc', borderRadius: 8, padding: 12, background: '#fff' }}>
      <h4>Asistente Alfred</h4>
      <div style={{ height: 260, overflowY: 'auto', border: '1px solid #eee', padding: 8, marginBottom: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start', margin: '6px 0' }}>
            <div style={{
              maxWidth: '80%',
              display: 'inline-block',
              background: m.from === 'user' ? '#d1ecf1' : '#f1f1f1',
              padding: 8,
              borderRadius: 8
            }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{ flex: 1, padding: 8 }}
          placeholder="Correo institucional"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button onClick={handleRequestPassword}>Generar</button>
      </div>

      <AlfredVerificationModal
        email={email}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        backendBaseUrl={backendBaseUrl}
        onVerified={handleVerified}
      />
    </div>
  );
}