import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config/api';

interface Usuario {
  id_usuario: number;
  nombre_completo: string;
  correo: string;
  rol: string;
  DNI: string;
  curso?: string;
  fecha_registro?: string;
  estado_acceso?: string;
}

interface AuditoriaItem {
  id: number;
  usuario_id?: number;
  correo?: string;
  evento: string;
  detalle?: string;
  ip?: string;
  fecha: string;
}

const ROL_COLORS: Record<string, { bg: string; color: string; border: string; label: string }> = {
  admin:   { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)', label: 'Admin' },
  profesor:{ bg: 'rgba(56,189,248,0.12)',  color: '#38bdf8', border: 'rgba(56,189,248,0.3)', label: 'Profesor' },
  alumno:  { bg: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: 'rgba(124,58,237,0.3)', label: 'Alumno' },
};

const ESTADO_COLORS: Record<string, { bg: string; color: string; border: string; label: string; icon: string }> = {
  ACTIVO:                   { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)', label: 'Activo', icon: 'bx-check-circle' },
  PENDIENTE_DE_ASIGNACION:  { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)', label: 'Pendiente', icon: 'bx-time-five' },
  SUSPENDIDO:               { bg: 'rgba(244,63,94,0.12)',  color: '#fb7185', border: 'rgba(244,63,94,0.3)',  label: 'Suspendido', icon: 'bx-block' },
};

const EVENTO_COLORS: Record<string, { bg: string; color: string }> = {
  LOGIN_EXITOSO:          { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
  LOGIN_ADMIN_EXITOSO:    { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  AUTO_REGISTRO_FLEXIBLE: { bg: 'rgba(56,189,248,0.15)', color: '#38bdf8' },
  CREDENCIAL_FLEXIBLE:    { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  CAMBIO_ESTADO:          { bg: 'rgba(124,58,237,0.15)', color: '#a78bfa' },
  CREACION_USUARIO:       { bg: 'rgba(56,189,248,0.15)', color: '#38bdf8' },
  REGISTRO_ALUMNO:        { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
};

const AdminUsuarios: React.FC = () => {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pendientes, setPendientes] = useState<Usuario[]>([]);
  const [auditoria, setAuditoria] = useState<AuditoriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPendientes, setLoadingPendientes] = useState(true);
  const [loadingAuditoria, setLoadingAuditoria] = useState(false);

  const [activeTab, setActiveTab] = useState<'todos' | 'alumno' | 'profesor' | 'admin'>(
    (searchParams.get('rol') as any) || 'todos'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<'TODOS' | 'ACTIVO' | 'PENDIENTE_DE_ASIGNACION' | 'SUSPENDIDO'>('TODOS');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState<Usuario | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Usuario | null>(null);
  const [showAuditoriaModal, setShowAuditoriaModal] = useState(false);
  const [changingEstado, setChangingEstado] = useState<number | null>(null);

  // Forms
  const [form, setForm] = useState({
    nombre_completo: '',
    correo: '',
    contrasena: '',
    rol: 'alumno',
    DNI: '',
    curso: '',
    materia: '',
    estado_acceso: 'ACTIVO'
  });
  const [editForm, setEditForm] = useState({
    nombre_completo: '',
    correo: '',
    rol: 'alumno',
    DNI: '',
    curso: '',
    estado_acceso: 'ACTIVO',
    contrasena: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const rolParam = activeTab === 'todos' ? '' : `?rol=${activeTab}`;
      const res = await fetch(`${API_URL}/admin/usuarios${rolParam}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsuarios(Array.isArray(data) ? data : []);
      }
    } catch {
      showToast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, showToast]);

  const fetchPendientes = useCallback(async () => {
    setLoadingPendientes(true);
    try {
      const res = await fetch(`${API_URL}/admin/alumnos/pendientes`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPendientes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching pendientes', err);
    } finally {
      setLoadingPendientes(false);
    }
  }, []);

  const fetchAuditoria = async () => {
    setLoadingAuditoria(true);
    try {
      const res = await fetch(`${API_URL}/admin/auditoria?limit=50`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAuditoria(Array.isArray(data) ? data : []);
      }
    } catch {
      showToast('Error al cargar auditoría', 'error');
    } finally {
      setLoadingAuditoria(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  useEffect(() => {
    fetchPendientes();
  }, [fetchPendientes]);

  const handleTabChange = (tab: 'todos' | 'alumno' | 'profesor' | 'admin') => {
    setActiveTab(tab);
    if (tab === 'todos') {
      searchParams.delete('rol');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ rol: tab });
    }
  };

  const handleCambiarEstado = async (id: number, estado: string) => {
    setChangingEstado(id);
    try {
      const res = await fetch(`${API_URL}/admin/usuarios/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ estado_acceso: estado }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || 'Estado actualizado', 'success');
        fetchUsuarios();
        fetchPendientes();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al cambiar estado', 'error');
      }
    } catch {
      showToast('Error de conexión con el servidor', 'error');
    } finally {
      setChangingEstado(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`${API_URL}/admin/usuarios/${confirmDelete.id_usuario}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        showToast('Usuario eliminado correctamente', 'success');
        setConfirmDelete(null);
        fetchUsuarios();
        fetchPendientes();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al eliminar usuario', 'error');
      }
    } catch {
      showToast('Error de conexión al eliminar', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast('Usuario creado exitosamente', 'success');
        setShowCreateModal(false);
        setForm({
          nombre_completo: '',
          correo: '',
          contrasena: '',
          rol: 'alumno',
          DNI: '',
          curso: '',
          materia: '',
          estado_acceso: 'ACTIVO'
        });
        fetchUsuarios();
        fetchPendientes();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al crear usuario', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (u: Usuario) => {
    setEditUser(u);
    setEditForm({
      nombre_completo: u.nombre_completo,
      correo: u.correo,
      rol: u.rol,
      DNI: u.DNI,
      curso: u.curso || '',
      estado_acceso: u.estado_acceso || 'ACTIVO',
      contrasena: ''
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/usuarios/${editUser.id_usuario}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        showToast('Usuario actualizado exitosamente', 'success');
        setEditUser(null);
        fetchUsuarios();
        fetchPendientes();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al actualizar usuario', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Filtered users list
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter(u => {
      const matchSearch =
        u.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.correo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.DNI.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.curso && u.curso.toLowerCase().includes(searchQuery.toLowerCase()));

      const estado = u.estado_acceso || 'PENDIENTE_DE_ASIGNACION';
      const matchEstado = filterEstado === 'TODOS' || estado === filterEstado;

      return matchSearch && matchEstado;
    });
  }, [usuarios, searchQuery, filterEstado]);

  const tabs: { key: typeof activeTab; label: string; icon: string }[] = [
    { key: 'todos',    label: 'Todos',      icon: 'bx-list-ul' },
    { key: 'alumno',   label: 'Alumnos',    icon: 'bx-group' },
    { key: 'profesor', label: 'Profesores', icon: 'bx-chalkboard' },
    { key: 'admin',    label: 'Admins',     icon: 'bx-shield-quarter' },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem', borderRadius: '10px',
    background: 'rgba(30,41,59,0.9)', color: '#f8fafc',
    border: '1px solid rgba(255,255,255,0.12)', fontSize: '0.9rem',
    boxSizing: 'border-box', outline: 'none'
  };

  const btnStyle = (color: string): React.CSSProperties => ({
    padding: '0.35rem 0.75rem', borderRadius: '8px', border: `1px solid ${color}30`,
    background: `${color}15`, color, cursor: 'pointer', fontSize: '0.78rem',
    fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
    transition: 'all 0.15s ease',
  });

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* ── SECCIÓN: ALUMNOS PENDIENTES ───────────────────────────────────── */}
        {(loadingPendientes || pendientes.length > 0) && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(124,58,237,0.05))',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: '20px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(245,158,11,0.15)',
              display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="bx bx-time-five" style={{ fontSize: '1.3rem', color: '#fbbf24' }}></i>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Alumnos Pendientes de Asignación
                    <span style={{
                      background: 'rgba(245,158,11,0.2)', color: '#fbbf24',
                      borderRadius: '999px', padding: '0.1rem 0.6rem',
                      fontSize: '0.75rem', fontWeight: 800,
                    }}>
                      {pendientes.length}
                    </span>
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                    Estos alumnos completaron su registro. Sus clases permanecerán ocultas hasta que los actives.
                  </p>
                </div>
              </div>
            </div>

            {loadingPendientes ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '1.5rem' }}></i>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textAlign: 'left' }}>Alumno</th>
                      <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textAlign: 'left' }}>DNI</th>
                      <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textAlign: 'left' }}>Curso</th>
                      <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textAlign: 'left' }}>Registrado</th>
                      <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textAlign: 'left' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendientes.map(p => (
                      <tr key={p.id_usuario} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>{p.nombre_completo}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.correo}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.82rem' }}>{p.DNI}</td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                          {p.curso ? (
                            <span style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {p.curso}
                            </span>
                          ) : (
                            <span style={{ color: '#475569', fontStyle: 'italic', fontSize: '0.8rem' }}>Sin asignar</span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#64748b', fontSize: '0.78rem' }}>
                          {p.fecha_registro ? new Date(p.fecha_registro).toLocaleDateString('es-AR') : '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              id={`activar-${p.id_usuario}`}
                              onClick={() => handleCambiarEstado(p.id_usuario, 'ACTIVO')}
                              disabled={changingEstado === p.id_usuario}
                              style={{
                                ...btnStyle('#34d399'),
                                opacity: changingEstado === p.id_usuario ? 0.6 : 1,
                              }}
                            >
                              {changingEstado === p.id_usuario
                                ? <i className="bx bx-loader-alt bx-spin"></i>
                                : <i className="bx bx-check-circle"></i>
                              }
                              Activar
                            </button>
                            <button
                              id={`suspender-${p.id_usuario}`}
                              onClick={() => handleCambiarEstado(p.id_usuario, 'SUSPENDIDO')}
                              disabled={changingEstado === p.id_usuario}
                              style={{ ...btnStyle('#fb7185'), opacity: changingEstado === p.id_usuario ? 0.6 : 1 }}
                            >
                              <i className="bx bx-block"></i> Suspender
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── SECCIÓN: TODOS LOS USUARIOS ───────────────────────────────────── */}
        {/* Header con Botones de Acción */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <i className="bx bx-group" style={{ color: '#7c3aed' }}></i> Gestión de Usuarios
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '0.3rem' }}>
              {filteredUsuarios.length} de {usuarios.length} usuarios · Control de accesos, roles y visibilidad
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                fetchAuditoria();
                setShowAuditoriaModal(true);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.7rem 1.1rem', borderRadius: '12px',
                background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#94a3b8', fontWeight: 600, fontSize: '0.88rem',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              <i className="bx bx-shield" style={{ fontSize: '1.1rem', color: '#fbbf24' }}></i> Auditoría de Accesos
            </button>
            <button
              id="btn-nuevo-usuario"
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.7rem 1.25rem', borderRadius: '12px',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.88rem',
                cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
              }}
            >
              <i className="bx bx-user-plus" style={{ fontSize: '1.1rem' }}></i> Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div style={{
          display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center',
          justifyContent: 'space-between', background: 'rgba(15,23,42,0.6)',
          padding: '0.75rem 1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                style={{
                  padding: '0.45rem 0.9rem', borderRadius: '10px', border: 'none',
                  background: activeTab === tab.key ? 'rgba(124,58,237,0.25)' : 'transparent',
                  color: activeTab === tab.key ? '#f8fafc' : '#94a3b8',
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  fontSize: '0.85rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                <i className={`bx ${tab.icon}`}></i> {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Status Filter */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '240px' }}>
              <i className="bx bx-search" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}></i>
              <input
                type="text"
                placeholder="Buscar por nombre, correo..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  ...inputStyle,
                  paddingLeft: '2.25rem',
                  paddingTop: '0.45rem',
                  paddingBottom: '0.45rem',
                  fontSize: '0.82rem',
                }}
              />
            </div>
            <select
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value as any)}
              style={{
                ...inputStyle,
                width: 'auto',
                paddingTop: '0.45rem',
                paddingBottom: '0.45rem',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <option value="TODOS">Todos los estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="PENDIENTE_DE_ASIGNACION">Pendientes</option>
              <option value="SUSPENDIDO">Suspendidos</option>
            </select>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div style={{ background: 'rgba(15,23,42,0.7)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '1.5rem' }}></i>
            </div>
          ) : filteredUsuarios.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
              <i className="bx bx-user-x" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}></i>
              No se encontraron usuarios con los filtros seleccionados
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>Usuario</th>
                    <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>DNI</th>
                    <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>Rol</th>
                    <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>Estado de Acceso</th>
                    <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>Curso</th>
                    <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsuarios.map(u => {
                    const rc = ROL_COLORS[u.rol] || ROL_COLORS.alumno;
                    const estado = u.estado_acceso || 'PENDIENTE_DE_ASIGNACION';
                    const ec = ESTADO_COLORS[estado] || ESTADO_COLORS.PENDIENTE_DE_ASIGNACION;
                    const isSelf = authUser?.id === u.id_usuario;

                    return (
                      <tr key={u.id_usuario} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '34px', height: '34px', borderRadius: '50%',
                              background: rc.bg, border: `1px solid ${rc.border}`,
                              color: rc.color, fontWeight: 700, fontSize: '0.85rem',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {u.nombre_completo.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
                                {u.nombre_completo} {isSelf && <span style={{ fontSize: '0.7rem', color: '#fbbf24', marginLeft: '0.3rem' }}>(Tú)</span>}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{u.correo}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.82rem' }}>{u.DNI}</td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{
                            padding: '0.2rem 0.7rem', borderRadius: '999px',
                            background: rc.bg, color: rc.color,
                            border: `1px solid ${rc.border}`,
                            fontSize: '0.75rem', fontWeight: 700,
                          }}>{rc.label}</span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem', borderRadius: '999px',
                            background: ec.bg, color: ec.color,
                            border: `1px solid ${ec.border}`,
                            fontSize: '0.72rem', fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                          }}>
                            <i className={`bx ${ec.icon}`}></i> {ec.label}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                          {u.curso ? (
                            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                              {u.curso}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {/* Toggle Estado */}
                            {estado !== 'ACTIVO' && (
                              <button
                                onClick={() => handleCambiarEstado(u.id_usuario, 'ACTIVO')}
                                disabled={changingEstado === u.id_usuario}
                                style={{ ...btnStyle('#34d399'), opacity: changingEstado === u.id_usuario ? 0.6 : 1 }}
                                title="Activar usuario y revelar clases"
                              >
                                <i className="bx bx-check-circle"></i> Activar
                              </button>
                            )}
                            {estado === 'ACTIVO' && u.rol !== 'admin' && (
                              <button
                                onClick={() => handleCambiarEstado(u.id_usuario, 'SUSPENDIDO')}
                                disabled={changingEstado === u.id_usuario}
                                style={{ ...btnStyle('#fb7185'), opacity: changingEstado === u.id_usuario ? 0.6 : 1 }}
                                title="Suspender acceso al usuario"
                              >
                                <i className="bx bx-block"></i> Suspender
                              </button>
                            )}

                            {/* Editar */}
                            <button
                              onClick={() => openEditModal(u)}
                              style={btnStyle('#38bdf8')}
                              title="Editar datos del usuario"
                            >
                              <i className="bx bx-edit"></i>
                            </button>

                            {/* Eliminar */}
                            {!isSelf && (
                              <button
                                onClick={() => setConfirmDelete(u)}
                                style={btnStyle('#fb7185')}
                                title="Eliminar usuario"
                              >
                                <i className="bx bx-trash"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: CREAR USUARIO ────────────────────────────────────────────── */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem',
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
            width: '100%', maxWidth: '540px', padding: '1.75rem',
            display: 'flex', flexDirection: 'column', gap: '1.25rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#f8fafc', margin: 0, fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="bx bx-user-plus" style={{ color: '#7c3aed' }}></i> Crear Nuevo Usuario
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Nombre Completo *</label>
                  <input required style={inputStyle} value={form.nombre_completo} onChange={e => setForm(f => ({ ...f, nombre_completo: e.target.value }))} placeholder="Ej: Juan Pérez" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>DNI *</label>
                  <input required style={inputStyle} value={form.DNI} onChange={e => setForm(f => ({ ...f, DNI: e.target.value }))} placeholder="12345678" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Correo Institucional *</label>
                <input required type="email" style={inputStyle} value={form.correo} onChange={e => setForm(f => ({ ...f, correo: e.target.value }))} placeholder="usuario@tecnica29de6.edu.ar" />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Contraseña Inicial *</label>
                <input required type="password" style={inputStyle} value={form.contrasena} onChange={e => setForm(f => ({ ...f, contrasena: e.target.value }))} placeholder="Mínimo 6 caracteres" minLength={6} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Rol *</label>
                  <select style={inputStyle} value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
                    <option value="alumno">Alumno</option>
                    <option value="profesor">Profesor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Estado de Acceso</label>
                  <select style={inputStyle} value={form.estado_acceso} onChange={e => setForm(f => ({ ...f, estado_acceso: e.target.value }))}>
                    <option value="ACTIVO">Activo (Inmediato)</option>
                    <option value="PENDIENTE_DE_ASIGNACION">Pendiente de asignación</option>
                  </select>
                </div>
              </div>

              {form.rol === 'alumno' && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Curso / Comisión</label>
                  <input style={inputStyle} value={form.curso} onChange={e => setForm(f => ({ ...f, curso: e.target.value }))} placeholder="Ej: 3ro 1ra Informática" />
                </div>
              )}

              {form.rol === 'profesor' && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Materia Principal</label>
                  <input style={inputStyle} value={form.materia} onChange={e => setForm(f => ({ ...f, materia: e.target.value }))} placeholder="Ej: Redes y Telecomunicaciones" />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{
                  padding: '0.65rem 1.2rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)',
                  color: '#94a3b8', border: 'none', cursor: 'pointer', fontWeight: 600,
                }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{
                  padding: '0.65rem 1.4rem', borderRadius: '10px',
                  background: saving ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  border: 'none', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  {saving ? <><i className="bx bx-loader-alt bx-spin"></i> Creando...</> : <><i className="bx bx-check"></i> Crear Usuario</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR USUARIO ────────────────────────────────────────────── */}
      {editUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem',
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '20px',
            width: '100%', maxWidth: '540px', padding: '1.75rem',
            display: 'flex', flexDirection: 'column', gap: '1.25rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#f8fafc', margin: 0, fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="bx bx-edit" style={{ color: '#38bdf8' }}></i> Editar Usuario
              </h3>
              <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Nombre Completo *</label>
                  <input required style={inputStyle} value={editForm.nombre_completo} onChange={e => setEditForm(f => ({ ...f, nombre_completo: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>DNI *</label>
                  <input required style={inputStyle} value={editForm.DNI} onChange={e => setEditForm(f => ({ ...f, DNI: e.target.value }))} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Correo Electrónico *</label>
                <input required type="email" style={inputStyle} value={editForm.correo} onChange={e => setEditForm(f => ({ ...f, correo: e.target.value }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Rol</label>
                  <select style={inputStyle} value={editForm.rol} onChange={e => setEditForm(f => ({ ...f, rol: e.target.value }))}>
                    <option value="alumno">Alumno</option>
                    <option value="profesor">Profesor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Estado de Acceso</label>
                  <select style={inputStyle} value={editForm.estado_acceso} onChange={e => setEditForm(f => ({ ...f, estado_acceso: e.target.value }))}>
                    <option value="ACTIVO">Activo</option>
                    <option value="PENDIENTE_DE_ASIGNACION">Pendiente</option>
                    <option value="SUSPENDIDO">Suspendido</option>
                  </select>
                </div>
              </div>

              {editForm.rol === 'alumno' && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Curso / Comisión</label>
                  <input style={inputStyle} value={editForm.curso} onChange={e => setEditForm(f => ({ ...f, curso: e.target.value }))} placeholder="Ej: 3ro A" />
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Cambiar Contraseña <span style={{ color: '#64748b', fontWeight: 400 }}>(Dejar en blanco para mantener actual)</span>
                </label>
                <input type="password" style={inputStyle} value={editForm.contrasena} onChange={e => setEditForm(f => ({ ...f, contrasena: e.target.value }))} placeholder="Nueva contraseña opcional" minLength={6} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditUser(null)} style={{
                  padding: '0.65rem 1.2rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)',
                  color: '#94a3b8', border: 'none', cursor: 'pointer', fontWeight: 600,
                }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{
                  padding: '0.65rem 1.4rem', borderRadius: '10px',
                  background: saving ? 'rgba(56,189,248,0.4)' : 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  border: 'none', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  {saving ? <><i className="bx bx-loader-alt bx-spin"></i> Guardando...</> : <><i className="bx bx-save"></i> Guardar Cambios</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: AUDITORÍA DE ACCESOS ──────────────────────────────────────── */}
      {showAuditoriaModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem',
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
            width: '100%', maxWidth: '820px', maxHeight: '85vh', padding: '1.75rem',
            display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#f8fafc', margin: 0, fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="bx bx-shield-quarter" style={{ color: '#fbbf24' }}></i> Registro de Auditoría de Accesos
              </h3>
              <button onClick={() => setShowAuditoriaModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
              Eventos de autenticación, ingresos institucionales automáticos, cambios de estado y registros de seguridad recientes.
            </p>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
              {loadingAuditoria ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '1.5rem' }}></i>
                </div>
              ) : auditoria.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                  No hay eventos de auditoría registrados aún.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <th style={{ padding: '0.65rem 1rem', color: '#94a3b8' }}>Evento</th>
                      <th style={{ padding: '0.65rem 1rem', color: '#94a3b8' }}>Usuario / Correo</th>
                      <th style={{ padding: '0.65rem 1rem', color: '#94a3b8' }}>Detalle</th>
                      <th style={{ padding: '0.65rem 1rem', color: '#94a3b8' }}>Fecha y Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditoria.map(ev => {
                      const evStyle = EVENTO_COLORS[ev.evento] || { bg: 'rgba(255,255,255,0.05)', color: '#94a3b8' };
                      return (
                        <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '0.65rem 1rem' }}>
                            <span style={{
                              padding: '0.15rem 0.55rem', borderRadius: '999px',
                              background: evStyle.bg, color: evStyle.color,
                              fontWeight: 700, fontSize: '0.72rem'
                            }}>
                              {ev.evento}
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem 1rem', color: '#f8fafc', fontWeight: 600 }}>
                            {ev.correo || `ID #${ev.usuario_id || '—'}`}
                          </td>
                          <td style={{ padding: '0.65rem 1rem', color: '#94a3b8' }}>
                            {ev.detalle || '—'}
                          </td>
                          <td style={{ padding: '0.65rem 1rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {ev.fecha ? new Date(ev.fecha).toLocaleString('es-AR') : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAuditoriaModal(false)}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.08)', color: '#f8fafc',
                  border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRMAR ELIMINACIÓN ─────────────────────────────────────── */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem',
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '20px',
            width: '100%', maxWidth: '420px', padding: '1.75rem',
            display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem' }}>⚠️</div>
            <div>
              <h3 style={{ color: '#f8fafc', margin: '0 0 0.5rem', fontWeight: 800 }}>Eliminar Usuario</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
                ¿Estás seguro de eliminar a <strong style={{ color: '#f8fafc' }}>{confirmDelete.nombre_completo}</strong>?<br />
                Esta acción eliminará sus datos y accesos permanentemente.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} style={{
                padding: '0.65rem 1.2rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)',
                color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 600,
              }}>Cancelar</button>
              <button onClick={handleDelete} style={{
                padding: '0.65rem 1.2rem', borderRadius: '10px',
                background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer',
              }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsuarios;
