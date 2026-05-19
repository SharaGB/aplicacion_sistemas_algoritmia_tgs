/* ============================================================
   SISTEMA CANINO — Lógica de la aplicación
   Teoría General de Sistemas · ITM · 2026
   ============================================================ */

// ─────────────────────────────────────────────────────────────
//  USUARIOS (credenciales hardcodeadas)
// ─────────────────────────────────────────────────────────────
const USUARIOS = [
  { id: "admin", password: "1234" }
];

const MAX_INTENTOS = 3;
let loginAttempts = 0;
let currentUser   = null;

// ─────────────────────────────────────────────────────────────
//  PERSISTENCIA — LocalStorage
// ─────────────────────────────────────────────────────────────
function getClientes() { return JSON.parse(localStorage.getItem('sc_clientes') || '[]'); }
function getCaninos()  { return JSON.parse(localStorage.getItem('sc_caninos')  || '[]'); }
function setClientes(d){ localStorage.setItem('sc_clientes', JSON.stringify(d)); }
function setCaninos(d) { localStorage.setItem('sc_caninos',  JSON.stringify(d)); }

// Genera IDs tipo C001, P002, etc.
function genId(prefix, arr) {
  return prefix + String(arr.length + 1).padStart(3, '0');
}

// Fecha de hoy en formato local
function today() {
  return new Date().toLocaleDateString('es-CO', { year:'numeric', month:'2-digit', day:'2-digit' });
}

// ─────────────────────────────────────────────────────────────
//  MÓDULO 1: INICIO DE SESIÓN
// ─────────────────────────────────────────────────────────────
function doLogin() {
  const id   = document.getElementById('login-id').value.trim();
  const pass = document.getElementById('login-pass').value.trim();
  const bar  = document.getElementById('attempts-bar');

  // Verificar que el ID exista
  const user = USUARIOS.find(u => u.id === id);
  if (!user) {
    bar.className = 'attempts-bar show';
    bar.textContent = '❌ ID de usuario no encontrado.';
    return;
  }

  // Verificar contraseña
  if (pass === user.password) {
    // Login exitoso
    currentUser  = id;
    loginAttempts = 0;
    bar.className = 'attempts-bar';
    document.getElementById('login-pass').value = '';
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('active');
    document.getElementById('user-display').textContent = id;
    document.getElementById('user-avatar').textContent  = id[0].toUpperCase();
    updateStats();
    renderConsultas();

  } else {
    // Contraseña incorrecta
    loginAttempts++;
    const restantes = MAX_INTENTOS - loginAttempts;
    bar.className   = 'attempts-bar show';

    if (restantes > 0) {
      bar.textContent = `⚠️ Contraseña incorrecta. Intentos restantes: ${restantes}`;
    } else {
      bar.textContent = '❌ Ha agotado los 3 intentos. Recargue la página para intentar de nuevo.';
      document.getElementById('login-id').disabled   = true;
      document.getElementById('login-pass').disabled = true;
    }
  }
}

function doLogout() {
  currentUser   = null;
  loginAttempts = 0;
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('login-screen').classList.add('active');
  document.getElementById('login-id').value    = '';
  document.getElementById('login-pass').value  = '';
  document.getElementById('login-id').disabled   = false;
  document.getElementById('login-pass').disabled = false;
  document.getElementById('attempts-bar').className = 'attempts-bar';
  showPage('dashboard');
}

// ─────────────────────────────────────────────────────────────
//  NAVEGACIÓN
// ─────────────────────────────────────────────────────────────
function showPage(page) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.getElementById('nav-'  + page).classList.add('active');

  if (page === 'clientes')  renderClientes();
  if (page === 'caninos')   renderCaninos();
  if (page === 'consultas') renderConsultas();
  if (page === 'dashboard') updateStats();
}

function switchTab(id, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(id).style.display = 'block';
  el.classList.add('active');
  renderConsultas();
}

// ─────────────────────────────────────────────────────────────
//  MODALES
// ─────────────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

function openModalCliente() {
  ['c-nombre','c-apellido','c-telefono','c-email','c-direccion']
    .forEach(f => document.getElementById(f).value = '');
  showAlert('alert-cliente', '', '');
  openModal('modal-cliente');
}

function openModalCanino() {
  // Cargar clientes en el select
  const sel = document.getElementById('p-cliente');
  sel.innerHTML = '<option value="">— Seleccione un cliente —</option>';
  getClientes().forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = `${c.id} · ${c.nombre} ${c.apellido}`;
    sel.appendChild(o);
  });
  ['p-nombre','p-raza','p-edad','p-peso','p-color','p-obs']
    .forEach(f => document.getElementById(f).value = '');
  showAlert('alert-canino', '', '');
  openModal('modal-canino');
}

// Cerrar modal al hacer clic fuera
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('show');
  });
});

// ─────────────────────────────────────────────────────────────
//  MÓDULO 2: REGISTRAR CLIENTE
// ─────────────────────────────────────────────────────────────
function guardarCliente() {
  const nombre   = document.getElementById('c-nombre').value.trim();
  const apellido = document.getElementById('c-apellido').value.trim();

  if (!nombre || !apellido) {
    showAlert('alert-cliente', 'error', '⚠️ El nombre y apellido son obligatorios.');
    return;
  }

  const clientes = getClientes();
  const cliente  = {
    id:             genId('C', clientes),
    nombre,
    apellido,
    telefono:       document.getElementById('c-telefono').value.trim(),
    email:          document.getElementById('c-email').value.trim(),
    direccion:      document.getElementById('c-direccion').value.trim(),
    fecha_registro: today()
  };

  clientes.push(cliente);
  setClientes(clientes);

  showAlert('alert-cliente', 'success', `✅ Cliente registrado con ID: ${cliente.id}`);
  setTimeout(() => { closeModal('modal-cliente'); renderClientes(); updateStats(); }, 1200);
}

function renderClientes() {
  const q = (document.getElementById('search-cliente')?.value || '').toLowerCase();
  const clientes = getClientes().filter(c =>
    c.nombre.toLowerCase().includes(q) ||
    c.apellido.toLowerCase().includes(q) ||
    c.id.toLowerCase().includes(q)
  );

  const wrap = document.getElementById('tabla-clientes');
  if (!wrap) return;

  if (!clientes.length) {
    wrap.innerHTML = `<div class="empty-state">
      <div class="empty-icon">👤</div>
      <p>No hay clientes registrados</p>
    </div>`;
    return;
  }

  wrap.innerHTML = `<table>
    <thead><tr>
      <th>ID</th><th>Nombre</th><th>Teléfono</th>
      <th>Email</th><th>Dirección</th><th>Registro</th><th></th>
    </tr></thead>
    <tbody>
      ${clientes.map(c => `
        <tr>
          <td><span class="badge badge-purple">${c.id}</span></td>
          <td><strong>${c.nombre} ${c.apellido}</strong></td>
          <td>${c.telefono || '—'}</td>
          <td>${c.email    || '—'}</td>
          <td>${c.direccion|| '—'}</td>
          <td>${c.fecha_registro}</td>
          <td>
            <button class="btn btn-outline"
              style="padding:5px 12px;font-size:12px"
              onclick="verCaninosDeCliente('${c.id}')">
              🐶 Ver caninos
            </button>
          </td>
        </tr>`).join('')}
    </tbody>
  </table>`;
}

// Atajo para ver los caninos de un cliente desde la tabla
function verCaninosDeCliente(cid) {
  showPage('consultas');
  document.getElementById('cons-cliente-id').value = cid;
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === 2));
  document.querySelectorAll('.tab-content').forEach((t, i) => t.style.display = i === 2 ? 'block' : 'none');
  buscarCaninoPorCliente();
}

// ─────────────────────────────────────────────────────────────
//  MÓDULO 3: REGISTRAR CANINO
// ─────────────────────────────────────────────────────────────
function guardarCanino() {
  const clienteId = document.getElementById('p-cliente').value;
  const nombre    = document.getElementById('p-nombre').value.trim();

  if (!clienteId) { showAlert('alert-canino', 'error', '⚠️ Seleccione un cliente propietario.'); return; }
  if (!nombre)    { showAlert('alert-canino', 'error', '⚠️ El nombre del canino es obligatorio.'); return; }

  const caninos = getCaninos();
  const canino  = {
    id:             genId('P', caninos),
    nombre,
    raza:           document.getElementById('p-raza').value.trim(),
    edad:           document.getElementById('p-edad').value.trim(),
    peso:           document.getElementById('p-peso').value.trim(),
    color:          document.getElementById('p-color').value.trim(),
    servicio:       document.getElementById('p-servicio').value,
    observaciones:  document.getElementById('p-obs').value.trim(),
    cliente_id:     clienteId,
    fecha_registro: today()
  };

  caninos.push(canino);
  setCaninos(caninos);

  showAlert('alert-canino', 'success', `✅ Canino '${nombre}' registrado con ID: ${canino.id}`);
  setTimeout(() => { closeModal('modal-canino'); renderCaninos(); updateStats(); }, 1200);
}

function renderCaninos() {
  const q        = (document.getElementById('search-canino')?.value || '').toLowerCase();
  const clientes = getClientes();
  const caninos  = getCaninos().filter(p => {
    const dueno = clientes.find(c => c.id === p.cliente_id);
    const nombreDueno = dueno ? `${dueno.nombre} ${dueno.apellido}` : '';
    return p.nombre.toLowerCase().includes(q) ||
           (p.raza || '').toLowerCase().includes(q) ||
           nombreDueno.toLowerCase().includes(q) ||
           p.id.toLowerCase().includes(q);
  });

  const wrap = document.getElementById('tabla-caninos');
  if (!wrap) return;

  if (!caninos.length) {
    wrap.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🐶</div>
      <p>No hay caninos registrados</p>
    </div>`;
    return;
  }

  wrap.innerHTML = `<table>
    <thead><tr>
      <th>ID</th><th>Nombre</th><th>Raza</th><th>Edad</th>
      <th>Peso</th><th>Color</th><th>Servicio</th><th>Propietario</th><th></th>
    </tr></thead>
    <tbody>
      ${caninos.map(p => {
        const c = clientes.find(x => x.id === p.cliente_id);
        return `<tr>
          <td><span class="badge badge-green">${p.id}</span></td>
          <td><strong>${p.nombre}</strong></td>
          <td>${p.raza  || '—'}</td>
          <td>${p.edad  ? p.edad + ' años' : '—'}</td>
          <td>${p.peso  ? p.peso + ' kg'   : '—'}</td>
          <td>${p.color || '—'}</td>
          <td>${p.servicio || '—'}</td>
          <td>${c ? c.nombre + ' ' + c.apellido : p.cliente_id}</td>
          <td>
            <button class="btn btn-outline"
              style="padding:5px 12px;font-size:12px"
              onclick='verDetalleCanino(${JSON.stringify(p)})'>
              👁 Ver
            </button>
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>`;
}

function verDetalleCanino(p) {
  const clientes = getClientes();
  const c = clientes.find(x => x.id === p.cliente_id);
  document.getElementById('detalle-titulo').textContent = `🐶 ${p.nombre} (${p.id})`;
  document.getElementById('detalle-body').innerHTML = `
    <div class="ficha-item"><label>Raza</label><p>${p.raza  || '—'}</p></div>
    <div class="ficha-item"><label>Edad</label><p>${p.edad  ? p.edad + ' años' : '—'}</p></div>
    <div class="ficha-item"><label>Peso</label><p>${p.peso  ? p.peso + ' kg'   : '—'}</p></div>
    <div class="ficha-item"><label>Color</label><p>${p.color || '—'}</p></div>
    <div class="ficha-item"><label>Servicio</label><p>${p.servicio || '—'}</p></div>
    <div class="ficha-item"><label>Fecha de registro</label><p>${p.fecha_registro}</p></div>
    <div class="ficha-item full">
      <label>Propietario</label>
      <p>${c ? c.nombre + ' ' + c.apellido + ' (' + c.id + ') · ' + c.telefono : p.cliente_id}</p>
    </div>
    <div class="ficha-item full">
      <label>Observaciones</label>
      <p>${p.observaciones || 'Ninguna'}</p>
    </div>
  `;
  openModal('modal-detalle');
}

// ─────────────────────────────────────────────────────────────
//  MÓDULO 4: CONSULTAS
// ─────────────────────────────────────────────────────────────
function renderConsultas() {
  const clientes = getClientes();
  const caninos  = getCaninos();

  // Pestaña 1: todos los clientes
  const tc = document.getElementById('cons-tabla-clientes');
  if (tc) {
    if (!clientes.length) {
      tc.innerHTML = `<div class="empty-state"><div class="empty-icon">👤</div><p>No hay clientes registrados</p></div>`;
    } else {
      tc.innerHTML = `<table>
        <thead><tr>
          <th>ID</th><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Dirección</th><th>Registro</th>
        </tr></thead>
        <tbody>
          ${clientes.map(c => `<tr>
            <td><span class="badge badge-purple">${c.id}</span></td>
            <td><strong>${c.nombre} ${c.apellido}</strong></td>
            <td>${c.telefono  || '—'}</td>
            <td>${c.email     || '—'}</td>
            <td>${c.direccion || '—'}</td>
            <td>${c.fecha_registro}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    }
  }

  // Pestaña 2: todos los caninos
  const tp = document.getElementById('cons-tabla-caninos');
  if (tp) {
    if (!caninos.length) {
      tp.innerHTML = `<div class="empty-state"><div class="empty-icon">🐶</div><p>No hay caninos registrados</p></div>`;
    } else {
      tp.innerHTML = `<table>
        <thead><tr>
          <th>ID</th><th>Nombre</th><th>Raza</th><th>Edad</th><th>Peso</th><th>Servicio</th><th>Propietario</th>
        </tr></thead>
        <tbody>
          ${caninos.map(p => {
            const c = clientes.find(x => x.id === p.cliente_id);
            return `<tr>
              <td><span class="badge badge-green">${p.id}</span></td>
              <td><strong>${p.nombre}</strong></td>
              <td>${p.raza || '—'}</td>
              <td>${p.edad ? p.edad + ' años' : '—'}</td>
              <td>${p.peso ? p.peso + ' kg'   : '—'}</td>
              <td>${p.servicio || '—'}</td>
              <td>${c ? c.nombre + ' ' + c.apellido : p.cliente_id}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
    }
  }
}

// Pestaña 3: caninos por cliente (búsqueda)
function buscarCaninoPorCliente() {
  const q        = document.getElementById('cons-cliente-id').value.trim().toLowerCase();
  const clientes = getClientes();
  const caninos  = getCaninos();
  const wrap     = document.getElementById('cons-tabla-por-cliente');
  if (!q) { wrap.innerHTML = ''; return; }

  const matches = clientes.filter(c =>
    c.id.toLowerCase() === q ||
    c.nombre.toLowerCase().includes(q) ||
    c.apellido.toLowerCase().includes(q) ||
    `${c.nombre} ${c.apellido}`.toLowerCase().includes(q)
  );

  if (!matches.length) {
    wrap.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>No se encontró ningún cliente con ese criterio</p>
    </div>`;
    return;
  }

  let html = '';
  matches.forEach(c => {
    const caninosCliente = caninos.filter(p => p.cliente_id === c.id);
    html += `<div style="margin-bottom:24px">
      <p style="font-size:13px;font-weight:700;color:var(--gray-600);margin-bottom:10px">
        👤 ${c.nombre} ${c.apellido}
        <span class="badge badge-purple">${c.id}</span>
        · ${c.telefono || ''}
      </p>`;

    if (!caninosCliente.length) {
      html += `<p style="font-size:13px;color:var(--gray-400);padding:10px">
        Este cliente no tiene caninos registrados.
      </p>`;
    } else {
      html += `<table>
        <thead><tr>
          <th>ID</th><th>Nombre</th><th>Raza</th><th>Edad</th><th>Peso</th><th>Servicio</th>
        </tr></thead>
        <tbody>
          ${caninosCliente.map(p => `<tr>
            <td><span class="badge badge-green">${p.id}</span></td>
            <td><strong>${p.nombre}</strong></td>
            <td>${p.raza || '—'}</td>
            <td>${p.edad ? p.edad + ' años' : '—'}</td>
            <td>${p.peso ? p.peso + ' kg'   : '—'}</td>
            <td>${p.servicio || '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    }
    html += '</div>';
  });

  wrap.innerHTML = html;
}

// ─────────────────────────────────────────────────────────────
//  UTILIDADES GENERALES
// ─────────────────────────────────────────────────────────────
function updateStats() {
  document.getElementById('stat-clientes').textContent = getClientes().length;
  document.getElementById('stat-caninos').textContent  = getCaninos().length;
  document.getElementById('stat-fecha').textContent    =
    new Date().toLocaleDateString('es-CO', { day:'2-digit', month:'short' });
}

function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  el.className = `alert ${type === 'success' ? 'alert-success' : type === 'error' ? 'alert-error' : ''} ${msg ? 'show' : ''}`;
  el.textContent = msg;
}

// ─────────────────────────────────────────────────────────────
//  INICIALIZACIÓN
// ─────────────────────────────────────────────────────────────
updateStats();
