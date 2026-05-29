// ═══════════════════════════════════════════════════════════
//  Sistema Canino · app.js
// ═══════════════════════════════════════════════════════════

const MAX_INTENTOS = 3;
let loginAttempts = 0;
let currentUser   = null;   // { id, rol, cliente_id }

// ── localStorage helpers ─────────────────────────────────
const USUARIOS_DEFAULT = [{ id: "admin", password: "1234", rol: "admin", cliente_id: null }];

function getUsuarios()  { return JSON.parse(localStorage.getItem("usuarios")  || JSON.stringify(USUARIOS_DEFAULT)); }
function getClientes()  { return JSON.parse(localStorage.getItem("clientes")  || "[]"); }
function getCaninos()   { return JSON.parse(localStorage.getItem("caninos")   || "[]"); }
function getCitas()     { return JSON.parse(localStorage.getItem("citas")     || "[]"); }
function setUsuarios(d) { localStorage.setItem("usuarios",  JSON.stringify(d)); }
function setClientes(d) { localStorage.setItem("clientes",  JSON.stringify(d)); }
function setCaninos(d)  { localStorage.setItem("caninos",   JSON.stringify(d)); }
function setCitas(d)    { localStorage.setItem("citas",     JSON.stringify(d)); }

// ── Generador de IDs ─────────────────────────────────────
function genId(prefix, arr) {
  const nums = arr.map(x => parseInt((x.id || "").slice(prefix.length))).filter(n => !isNaN(n));
  return prefix + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0");
}
function hoy() { return new Date().toISOString().split("T")[0]; }

// ── Flash messages ───────────────────────────────────────
function flash(msg, type = "success") {
  const c = document.getElementById("flash-container");
  if (!c) return;
  const d = document.createElement("div");
  d.className = "flash flash-" + type;
  d.textContent = msg;
  c.appendChild(d);
  setTimeout(() => d.remove(), 4000);
}

// ── Error dentro de modal ────────────────────────────────
function modalError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? "block" : "none";
}

// ════════════════════════════════════════════════════════
//  AUTO-REGISTRO
// ════════════════════════════════════════════════════════
function toggleRegistro(show) {
  document.getElementById("login-card").style.display    = show ? "none"  : "block";
  document.getElementById("registro-card").style.display = show ? "block" : "none";
  document.getElementById("registro-error").classList.remove("show");
}

function registrarse() {
  const campos = ["reg-nombre","reg-cedula","reg-telefono","reg-email","reg-direccion"];
  const vals   = campos.map(id => document.getElementById(id).value.trim());
  const usuId  = document.getElementById("reg-usuario").value.trim();
  const usuPass= document.getElementById("reg-password").value.trim();
  const errEl  = document.getElementById("registro-error");

  if (vals.some(v => !v) || !usuId || !usuPass) {
    errEl.textContent = "Todos los campos son obligatorios.";
    errEl.classList.add("show"); return;
  }
  const usuarios = getUsuarios();
  if (usuarios.find(u => u.id === usuId)) {
    errEl.textContent = "Ese nombre de usuario ya existe. Elige otro.";
    errEl.classList.add("show"); return;
  }

  const lista     = getClientes();
  const clienteId = genId("C", lista);
  lista.push({ id: clienteId, nombre: vals[0], cedula: vals[1],
    telefono: vals[2], email: vals[3], direccion: vals[4], fecha_registro: hoy() });
  usuarios.push({ id: usuId, password: usuPass, rol: "cliente", cliente_id: clienteId });
  setClientes(lista);
  setUsuarios(usuarios);

  // Auto-login
  currentUser = { id: usuId, rol: "cliente", cliente_id: clienteId };
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app-screen").classList.add("show");
  document.getElementById("current-user").textContent = usuId;
  configurarSidebar();
  showPage("mis-caninos");
  flash("Bienvenido/a " + vals[0] + ". Tu cuenta fue creada exitosamente.");
}

// ════════════════════════════════════════════════════════
//  LOGIN
// ════════════════════════════════════════════════════════
function updateAttemptsDots() {
  const bar  = document.getElementById("attempts-bar");
  const dots = bar.querySelectorAll(".attempt-dot");
  dots.forEach((d, i) => d.classList.toggle("used", i < loginAttempts));
  bar.style.display = loginAttempts > 0 ? "flex" : "none";
}

function doLogin() {
  const userId = document.getElementById("login-user").value.trim();
  const pass   = document.getElementById("login-pass").value.trim();
  const errEl  = document.getElementById("login-error");
  if (loginAttempts >= MAX_INTENTOS) return;

  const usuarios = getUsuarios();
  const user     = usuarios.find(u => u.id === userId);

  if (!user || user.password !== pass) {
    loginAttempts++;
    updateAttemptsDots();
    const restantes = MAX_INTENTOS - loginAttempts;
    if (restantes <= 0) {
      errEl.textContent = "Cuenta bloqueada. Demasiados intentos fallidos.";
      document.getElementById("login-user").disabled = true;
      document.getElementById("login-pass").disabled = true;
      document.getElementById("login-btn").disabled  = true;
    } else {
      errEl.textContent = !user
        ? "Usuario no encontrado. Intentos restantes: " + restantes
        : "Contrasena incorrecta. Intentos restantes: " + restantes;
    }
    errEl.classList.add("show");
    return;
  }

  currentUser = { id: user.id, rol: user.rol, cliente_id: user.cliente_id };
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app-screen").classList.add("show");
  document.getElementById("current-user").textContent = currentUser.id;
  errEl.classList.remove("show");
  configurarSidebar();
  showPage(currentUser.rol === "admin" ? "dashboard" : "mis-caninos");
}

function doLogout() {
  currentUser   = null;
  loginAttempts = 0;
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("app-screen").classList.remove("show");
  // Siempre volver al formulario de login, no al de registro
  toggleRegistro(false);
  ["login-user","login-pass"].forEach(id => {
    document.getElementById(id).value    = "";
    document.getElementById(id).disabled = false;
  });
  document.getElementById("login-btn").disabled = false;
  document.getElementById("login-error").classList.remove("show");
  updateAttemptsDots();
}

function configurarSidebar() {
  const isAdmin = currentUser.rol === "admin";
  document.getElementById("nav-admin").style.display   = isAdmin ? "block" : "none";
  document.getElementById("nav-cliente").style.display = isAdmin ? "none"  : "block";
  if (isAdmin) actualizarBadgeCitas();
}

function actualizarBadgeCitas() {
  const pendientes = getCitas().filter(c => c.estado === "pendiente").length;
  const badge = document.getElementById("badge-citas");
  if (badge) badge.style.display = pendientes > 0 ? "inline" : "none";
}

// ── Migración: corrige IDs duplicados en citas ya guardadas ──
function migrarIdsDuplicados() {
  const citas = getCitas();
  const vistos = {};
  let cambio = false;
  citas.forEach(c => {
    if (vistos[c.id]) {
      c.id = "CT" + Date.now() + Math.floor(Math.random() * 1000);
      cambio = true;
    } else {
      vistos[c.id] = true;
    }
  });
  if (cambio) setCitas(citas);
}

document.addEventListener("DOMContentLoaded", () => {
  migrarIdsDuplicados();   // repara duplicados al cargar
  ["login-user","login-pass"].forEach(id =>
    document.getElementById(id).addEventListener("keydown", e => {
      if (e.key === "Enter") doLogin();
    })
  );
  updateAttemptsDots();
});

// ════════════════════════════════════════════════════════
//  NAVEGACION
// ════════════════════════════════════════════════════════
function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
  const navEl = document.querySelector('[data-page="' + page + '"]');
  if (navEl) navEl.classList.add("active");
  const renders = {
    "dashboard":   renderDashboard,
    "clientes":    renderClientes,
    "caninos":     renderCaninos,
    "consultas":   renderConsultas,
    "citas-admin": renderCitasAdmin,
    "mis-caninos": renderMisCaninos,
    "mis-citas":   renderMisCitas,
    "mi-perfil":   renderMiPerfil,
  };
  if (renders[page]) renders[page]();
}

// ════════════════════════════════════════════════════════
//  DASHBOARD (admin)
// ════════════════════════════════════════════════════════
function renderDashboard() {
  const clientes = getClientes();
  const caninos  = getCaninos();
  document.getElementById("stat-clientes").textContent = clientes.length;
  document.getElementById("stat-caninos").textContent  = caninos.length;
  document.getElementById("stat-razas").textContent    = new Set(caninos.map(c => c.raza)).size;
  document.getElementById("stat-ultimo").textContent   = clientes.length ? clientes[clientes.length-1].nombre : "—";
}

// ════════════════════════════════════════════════════════
//  CLIENTES (admin)
// ════════════════════════════════════════════════════════
function guardarCliente() {
  const campos = ["cli-nombre","cli-cedula","cli-telefono","cli-email","cli-direccion"];
  const vals   = campos.map(id => document.getElementById(id).value.trim());
  const usuId  = document.getElementById("cli-usuario").value.trim();
  const usuPass= document.getElementById("cli-password").value.trim();

  if (vals.some(v => !v) || !usuId || !usuPass) {
    modalError("modal-cliente-error", "Todos los campos son obligatorios."); return;
  }
  const usuarios = getUsuarios();
  if (usuarios.find(u => u.id === usuId)) {
    modalError("modal-cliente-error", "Ese usuario ya existe. Elige otro."); return;
  }

  const lista      = getClientes();
  const clienteId  = genId("C", lista);
  lista.push({ id: clienteId, nombre: vals[0], cedula: vals[1],
    telefono: vals[2], email: vals[3], direccion: vals[4], fecha_registro: hoy() });
  usuarios.push({ id: usuId, password: usuPass, rol: "cliente", cliente_id: clienteId });
  setClientes(lista);
  setUsuarios(usuarios);

  [...campos,"cli-usuario","cli-password"].forEach(id => document.getElementById(id).value = "");
  modalError("modal-cliente-error", "");
  closeModal("modal-cliente");
  flash("Cliente registrado. Usuario de acceso: " + usuId);
  renderClientes();
  renderDashboard();
}

function editarCliente(id) {
  const c = getClientes().find(c => c.id === id);
  if (!c) return;
  ["id","nombre","cedula","telefono","email","direccion"].forEach(f =>
    document.getElementById("edit-cli-" + f).value = c[f] || "");
  openModal("modal-editar-cliente");
}

function guardarEdicionCliente() {
  const id    = document.getElementById("edit-cli-id").value;
  const lista = getClientes();
  const idx   = lista.findIndex(c => c.id === id);
  if (idx === -1) return;
  ["nombre","cedula","telefono","email","direccion"].forEach(f => {
    const v = document.getElementById("edit-cli-" + f).value.trim();
    if (v) lista[idx][f] = v;
  });
  setClientes(lista);
  closeModal("modal-editar-cliente");
  flash("Cliente actualizado.");
  renderClientes();
}

function eliminarCliente(id) {
  if (!confirm("Eliminar cliente y sus caninos asociados?")) return;
  setClientes(getClientes().filter(c => c.id !== id));
  setCaninos(getCaninos().filter(c => c.cliente_id !== id));
  setUsuarios(getUsuarios().filter(u => u.cliente_id !== id));
  flash("Cliente eliminado.");
  renderClientes();
  renderDashboard();
}

function renderClientes(q) {
  q = (q !== undefined ? q : document.getElementById("search-clientes").value).toLowerCase();
  let lista = getClientes();
  if (q) lista = lista.filter(c =>
    c.nombre.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.telefono.toLowerCase().includes(q));
  const tbody = document.getElementById("tabla-clientes");
  tbody.innerHTML = !lista.length
    ? '<tr><td colspan="8" class="empty-row">No hay clientes registrados.</td></tr>'
    : lista.map(c =>
        '<tr>' +
        '<td><span class="badge badge-primary">' + c.id + '</span></td>' +
        '<td>' + c.nombre + '</td><td>' + c.cedula + '</td><td>' + c.telefono + '</td>' +
        '<td>' + c.email + '</td><td>' + c.direccion + '</td><td>' + c.fecha_registro + '</td>' +
        '<td style="display:flex;gap:.4rem">' +
          '<button class="btn btn-secondary btn-sm" onclick="editarCliente(\'' + c.id + '\')">Editar</button>' +
          '<button class="btn btn-danger btn-sm" onclick="eliminarCliente(\'' + c.id + '\')">Eliminar</button>' +
        '</td></tr>').join("");
}

// ════════════════════════════════════════════════════════
//  CANINOS (admin)
// ════════════════════════════════════════════════════════
function abrirModalCanino() {
  const sel = document.getElementById("can-cliente");
  sel.innerHTML = '<option value="">— Seleccionar cliente —</option>' +
    getClientes().map(c => '<option value="' + c.id + '">' + c.id + ' — ' + c.nombre + '</option>').join("");
  openModal("modal-canino");
}

function guardarCanino() {
  const clienteId = document.getElementById("can-cliente").value.trim();
  if (!getClientes().find(c => c.id === clienteId)) { flash("El cliente no existe.", "danger"); return; }
  const campos = ["can-nombre","can-raza","can-edad","can-peso","can-color"];
  const vals   = campos.map(id => document.getElementById(id).value.trim());
  if (vals.some(v => !v)) { flash("Los campos * son obligatorios.", "danger"); return; }
  const lista = getCaninos();
  lista.push({ id: genId("P", lista), nombre: vals[0], raza: vals[1], edad: vals[2],
    peso: vals[3], color: vals[4],
    observaciones: document.getElementById("can-obs").value.trim(),
    cliente_id: clienteId, fecha_registro: hoy() });
  setCaninos(lista);
  [...campos,"can-cliente","can-obs"].forEach(id => document.getElementById(id).value = "");
  closeModal("modal-canino");
  flash("Canino registrado.");
  renderCaninos();
  renderDashboard();
}

function editarCanino(id) {
  const c = getCaninos().find(c => c.id === id);
  if (!c) return;
  ["id","nombre","raza","edad","peso","color"].forEach(f =>
    document.getElementById("edit-can-" + f).value = c[f] || "");
  document.getElementById("edit-can-obs").value = c.observaciones || "";
  openModal("modal-editar-canino");
}

function guardarEdicionCanino() {
  const id    = document.getElementById("edit-can-id").value;
  const lista = getCaninos();
  const idx   = lista.findIndex(c => c.id === id);
  if (idx === -1) return;
  ["nombre","raza","edad","peso","color"].forEach(f => {
    const v = document.getElementById("edit-can-" + f).value.trim();
    if (v) lista[idx][f] = v;
  });
  lista[idx].observaciones = document.getElementById("edit-can-obs").value.trim();
  setCaninos(lista);
  closeModal("modal-editar-canino");
  flash("Canino actualizado.");
  renderCaninos();
}

function eliminarCanino(id) {
  if (!confirm("Eliminar este canino?")) return;
  setCaninos(getCaninos().filter(c => c.id !== id));
  flash("Canino eliminado.");
  renderCaninos();
  renderDashboard();
}

function renderCaninos(q) {
  q = (q !== undefined ? q : document.getElementById("search-caninos").value).toLowerCase();
  const cmap = Object.fromEntries(getClientes().map(c => [c.id, c.nombre]));
  let lista = getCaninos();
  if (q) lista = lista.filter(c =>
    c.nombre.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.raza.toLowerCase().includes(q));
  const tbody = document.getElementById("tabla-caninos");
  tbody.innerHTML = !lista.length
    ? '<tr><td colspan="10" class="empty-row">No hay caninos registrados.</td></tr>'
    : lista.map(c =>
        '<tr>' +
        '<td><span class="badge badge-success">' + c.id + '</span></td>' +
        '<td>' + c.nombre + '</td><td>' + c.raza + '</td><td>' + c.edad + '</td>' +
        '<td>' + c.peso + ' kg</td><td>' + c.color + '</td><td>' + (c.observaciones||"—") + '</td>' +
        '<td><span class="badge badge-primary">' + c.cliente_id + '</span> ' + (cmap[c.cliente_id]||"—") + '</td>' +
        '<td>' + c.fecha_registro + '</td>' +
        '<td style="display:flex;gap:.4rem">' +
          '<button class="btn btn-secondary btn-sm" onclick="editarCanino(\'' + c.id + '\')">Editar</button>' +
          '<button class="btn btn-danger btn-sm" onclick="eliminarCanino(\'' + c.id + '\')">Eliminar</button>' +
        '</td></tr>').join("");
}

// ════════════════════════════════════════════════════════
//  CONSULTAS (admin)
// ════════════════════════════════════════════════════════
function renderConsultas() { switchTab("tab-clientes"); }

function switchTab(tabId) {
  document.querySelectorAll("#page-consultas .tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll("#page-consultas .tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelector('#page-consultas [data-tab="' + tabId + '"]').classList.add("active");
  document.getElementById(tabId).classList.add("active");
  if (tabId === "tab-clientes") renderTabClientes();
  if (tabId === "tab-caninos")  renderTabCaninos();
}

function renderTabClientes() {
  const lista = getClientes();
  document.getElementById("cons-tabla-clientes").innerHTML = !lista.length
    ? '<tr><td colspan="7" class="empty-row">No hay clientes.</td></tr>'
    : lista.map(c =>
        '<tr><td><span class="badge badge-primary">' + c.id + '</span></td>' +
        '<td>' + c.nombre + '</td><td>' + c.cedula + '</td><td>' + c.telefono + '</td>' +
        '<td>' + c.email + '</td><td>' + c.direccion + '</td><td>' + c.fecha_registro + '</td></tr>').join("");
}

function renderTabCaninos() {
  const cmap  = Object.fromEntries(getClientes().map(c => [c.id, c.nombre]));
  const lista = getCaninos();
  document.getElementById("cons-tabla-caninos").innerHTML = !lista.length
    ? '<tr><td colspan="8" class="empty-row">No hay caninos.</td></tr>'
    : lista.map(c =>
        '<tr><td><span class="badge badge-success">' + c.id + '</span></td>' +
        '<td>' + c.nombre + '</td><td>' + c.raza + '</td><td>' + c.edad + '</td>' +
        '<td>' + c.peso + ' kg</td><td>' + c.color + '</td><td>' + (c.observaciones||"—") + '</td>' +
        '<td><span class="badge badge-primary">' + c.cliente_id + '</span> ' + (cmap[c.cliente_id]||"—") + '</td></tr>').join("");
}

function buscarCaninoPorId() {
  const q    = document.getElementById("cons-buscar-canino-id").value.trim().toLowerCase();
  const cmap = Object.fromEntries(getClientes().map(c => [c.id, c.nombre]));
  const res  = q ? getCaninos().filter(c => c.id.toLowerCase() === q) : [];
  document.getElementById("cons-canino-info").textContent =
    q ? (res.length ? '1 canino encontrado para ID "' + q.toUpperCase() + '"' : 'No se encontró ningún canino con ID "' + q.toUpperCase() + '"') : "";
  document.getElementById("cons-tabla-por-canino").innerHTML = !q
    ? '<tr><td colspan="9" class="empty-row">Ingresa el ID del canino.</td></tr>'
    : !res.length
    ? '<tr><td colspan="9" class="empty-row">Sin resultados.</td></tr>'
    : res.map(c =>
        '<tr><td><span class="badge badge-success">' + c.id + '</span></td>' +
        '<td>' + c.nombre + '</td><td>' + c.raza + '</td><td>' + c.edad + '</td>' +
        '<td>' + c.peso + ' kg</td><td>' + c.color + '</td><td>' + (c.observaciones||"—") + '</td>' +
        '<td><span class="badge badge-primary">' + c.cliente_id + '</span></td>' +
        '<td>' + (cmap[c.cliente_id]||"—") + '</td></tr>').join("");
}

function buscarCitasPorTipo() {
  const tipo  = document.getElementById("cons-tipo-servicio").value;
  const cmap  = Object.fromEntries(getClientes().map(c => [c.id, c.nombre]));
  const camap = Object.fromEntries(getCaninos().map(c => [c.id, c.nombre]));
  const todas = getCitas();
  const res   = tipo ? todas.filter(c => c.tipo === tipo) : todas;
  document.getElementById("cons-tipo-info").textContent =
    tipo ? res.length + ' cita(s) de tipo "' + tipo + '"' : res.length + " cita(s) en total";
  const tbody = document.getElementById("cons-tabla-por-tipo");
  if (!res.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No hay citas' + (tipo ? ' de tipo ' + tipo : '') + '.</td></tr>'; return;
  }
  tbody.innerHTML = res.map(c => {
    const estadoClass = c.estado === "pendiente" ? "badge-warn" : c.estado === "confirmada" ? "badge-success" : "badge-danger";
    return '<tr>' +
      '<td><span class="badge badge-primary">' + c.id + '</span></td>' +
      '<td>' + (cmap[c.cliente_id]||c.cliente_id) + '</td>' +
      '<td>' + (camap[c.canino_id]||c.canino_id) + '</td>' +
      '<td><span class="tipo-badge tipo-' + c.tipo.toLowerCase() + '">' + c.tipo + '</span></td>' +
      '<td>' + c.fecha + '</td>' +
      '<td>' + (c.nota||"—") + '</td>' +
      '<td><span class="badge ' + estadoClass + '">' + c.estado + '</span></td></tr>';
  }).join("");
}

function buscarCaninoPorCliente() {
  const q    = document.getElementById("cons-buscar-cliente").value.trim().toLowerCase();
  const cmap = Object.fromEntries(getClientes().map(c => [c.id, c.nombre]));
  const res  = getCaninos().filter(c =>
    c.cliente_id.toLowerCase().includes(q) || (cmap[c.cliente_id]||"").toLowerCase().includes(q));
  document.getElementById("cons-resultado-info").textContent =
    q ? res.length + ' canino(s) para "' + q + '"' : "";
  document.getElementById("cons-tabla-por-cliente").innerHTML = !res.length
    ? '<tr><td colspan="9" class="empty-row">' + (q ? "Sin resultados." : "Ingresa un ID o nombre.") + '</td></tr>'
    : res.map(c =>
        '<tr><td><span class="badge badge-success">' + c.id + '</span></td>' +
        '<td>' + c.nombre + '</td><td>' + c.raza + '</td><td>' + c.edad + '</td>' +
        '<td>' + c.peso + ' kg</td><td>' + c.color + '</td><td>' + (c.observaciones||"—") + '</td>' +
        '<td><span class="badge badge-primary">' + c.cliente_id + '</span></td>' +
        '<td>' + (cmap[c.cliente_id]||"—") + '</td></tr>').join("");
}

// ════════════════════════════════════════════════════════
//  MIS CANINOS (cliente)
// ════════════════════════════════════════════════════════
function renderMisCaninos() {
  const mis = getCaninos().filter(c => c.cliente_id === currentUser.cliente_id);
  document.getElementById("tabla-mis-caninos").innerHTML = !mis.length
    ? '<tr><td colspan="7" class="empty-row">No tienes caninos registrados aun.</td></tr>'
    : mis.map(c =>
        '<tr><td><span class="badge badge-success">' + c.id + '</span></td>' +
        '<td>' + c.nombre + '</td><td>' + c.raza + '</td><td>' + c.edad + '</td>' +
        '<td>' + c.peso + ' kg</td><td>' + c.color + '</td><td>' + (c.observaciones||"—") + '</td></tr>').join("");
}

// ════════════════════════════════════════════════════════
//  MI PERFIL (cliente)
// ════════════════════════════════════════════════════════
function renderMiPerfil() {
  const c = getClientes().find(c => c.id === currentUser.cliente_id);
  if (!c) return;
  ["nombre","cedula","telefono","email","direccion"].forEach(f =>
    document.getElementById("perfil-" + f).value = c[f] || "");
}

function guardarMiPerfil() {
  const lista = getClientes();
  const idx   = lista.findIndex(c => c.id === currentUser.cliente_id);
  if (idx === -1) return;
  ["nombre","cedula","telefono","email","direccion"].forEach(f => {
    const v = document.getElementById("perfil-" + f).value.trim();
    if (v) lista[idx][f] = v;
  });
  setClientes(lista);
  flash("Tus datos han sido actualizados.");
}

function guardarNuevaPassword() {
  const actual   = document.getElementById("perfil-pass-actual").value.trim();
  const nueva    = document.getElementById("perfil-pass-nueva").value.trim();
  const confirma = document.getElementById("perfil-pass-confirm").value.trim();
  const usuarios = getUsuarios();
  const idx      = usuarios.findIndex(u => u.id === currentUser.id);
  if (idx === -1) return;
  if (usuarios[idx].password !== actual) { flash("Contrasena actual incorrecta.", "danger"); return; }
  if (!nueva)             { flash("La nueva contrasena no puede estar vacia.", "danger"); return; }
  if (nueva !== confirma) { flash("Las contrasenas no coinciden.", "danger"); return; }
  usuarios[idx].password = nueva;
  setUsuarios(usuarios);
  ["perfil-pass-actual","perfil-pass-nueva","perfil-pass-confirm"].forEach(id =>
    document.getElementById(id).value = "");
  flash("Contrasena actualizada.");
}

// ════════════════════════════════════════════════════════
//  MI CANINO - agregar propio (cliente)
// ════════════════════════════════════════════════════════
function guardarMiCanino() {
  const campos = ["mican-nombre","mican-raza","mican-edad","mican-peso","mican-color"];
  const vals   = campos.map(id => document.getElementById(id).value.trim());
  if (vals.some(v => !v)) {
    modalError("modal-mican-error", "Los campos marcados * son obligatorios."); return;
  }
  const lista = getCaninos();
  lista.push({
    id:            genId("P", lista),
    nombre:        vals[0],
    raza:          vals[1],
    edad:          vals[2],
    peso:          vals[3],
    color:         vals[4],
    observaciones: document.getElementById("mican-obs").value.trim(),
    cliente_id:    currentUser.cliente_id,
    fecha_registro: hoy(),
  });
  setCaninos(lista);
  campos.forEach(id => document.getElementById(id).value = "");
  document.getElementById("mican-obs").value = "";
  modalError("modal-mican-error", "");
  closeModal("modal-mi-canino");
  flash("Canino registrado correctamente.");
  renderMisCaninos();
}

// ════════════════════════════════════════════════════════
//  CITAS - ADMIN
// ════════════════════════════════════════════════════════
function renderCitasAdmin() {
  switchTabCitas("tab-citas-pend");
  actualizarBadgeCitas();
}

function switchTabCitas(tabId) {
  document.querySelectorAll("#page-citas-admin .tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll("#page-citas-admin .tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelector('[data-tab="' + tabId + '"]').classList.add("active");
  document.getElementById(tabId).classList.add("active");
  const todas = getCitas();
  const cmap  = Object.fromEntries(getClientes().map(c => [c.id, c.nombre]));
  const camap = Object.fromEntries(getCaninos().map(c => [c.id, c.nombre]));
  const lista = tabId === "tab-citas-pend"
    ? todas.filter(c => c.estado === "pendiente")
    : todas;
  const tbodyId = tabId === "tab-citas-pend" ? "tabla-citas-pend" : "tabla-citas-todas";
  renderTablaCitas(tbodyId, lista, cmap, camap);
}

function renderTablaCitas(tbodyId, lista, cmap, camap) {
  const tbody = document.getElementById(tbodyId);
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">No hay citas.</td></tr>'; return;
  }
  tbody.innerHTML = lista.map(c => {
    const estadoClass = c.estado === "pendiente" ? "badge-warn" : c.estado === "confirmada" ? "badge-success" : "badge-danger";
    return '<tr>' +
      '<td><span class="badge badge-primary">' + c.id + '</span></td>' +
      '<td>' + (cmap[c.cliente_id]||c.cliente_id) + '</td>' +
      '<td>' + (camap[c.canino_id]||c.canino_id) + '</td>' +
      '<td><span class="tipo-badge tipo-' + c.tipo.toLowerCase() + '">' + c.tipo + '</span></td>' +
      '<td>' + c.fecha + '</td>' +
      '<td>' + (c.nota||"—") + '</td>' +
      '<td><span class="badge ' + estadoClass + '">' + c.estado + '</span></td>' +
      '<td style="display:flex;gap:.35rem">' +
        (c.estado === "pendiente"
          ? '<button class="btn btn-primary btn-sm" onclick="cambiarEstadoCita(\'' + c.id + '\',\'confirmada\')">Confirmar</button>' +
            '<button class="btn btn-danger btn-sm"  onclick="cambiarEstadoCita(\'' + c.id + '\',\'cancelada\')">Cancelar</button>'
          : '<span style="color:var(--text-muted);font-size:.8rem">' + c.estado + '</span>') +
      '</td></tr>';
  }).join("");
}

function cambiarEstadoCita(id, nuevoEstado) {
  const lista = getCitas();
  const idx   = lista.findIndex(c => c.id === id);
  if (idx === -1) return;
  lista[idx].estado = nuevoEstado;
  setCitas(lista);
  flash("Cita " + nuevoEstado + ".");
  renderCitasAdmin();
}

// ════════════════════════════════════════════════════════
//  CITAS - CLIENTE
// ════════════════════════════════════════════════════════
function abrirModalCita() {
  const sel = document.getElementById("cita-canino");
  const mis = getCaninos().filter(c => c.cliente_id === currentUser.cliente_id);
  sel.innerHTML = '<option value="">— Seleccionar canino —</option>' +
    mis.map(c => '<option value="' + c.id + '">' + c.nombre + '</option>').join("");
  openModal("modal-nueva-cita");
}

function guardarCita() {
  const caninoId = document.getElementById("cita-canino").value;
  const tipo     = document.getElementById("cita-tipo").value;
  const fecha    = document.getElementById("cita-fecha").value;
  const nota     = document.getElementById("cita-nota").value.trim();

  if (!caninoId || !tipo || !fecha) {
    modalError("modal-cita-error", "Canino, tipo y fecha son obligatorios."); return;
  }
  const lista = getCitas();
  lista.push({ id: "CT" + Date.now(), cliente_id: currentUser.cliente_id,
    canino_id: caninoId, tipo, fecha, nota, estado: "pendiente", creada: hoy() });
  setCitas(lista);
  ["cita-canino","cita-tipo","cita-fecha","cita-nota"].forEach(id =>
    document.getElementById(id).value = "");
  modalError("modal-cita-error", "");
  closeModal("modal-nueva-cita");
  flash("Solicitud de cita enviada. El admin la revisara pronto.");
  renderMisCitas();
}

function renderMisCitas() {
  const camap = Object.fromEntries(getCaninos().map(c => [c.id, c.nombre]));
  const mis   = getCitas().filter(c => c.cliente_id === currentUser.cliente_id);
  const tbody = document.getElementById("tabla-mis-citas");
  if (!mis.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No tienes citas solicitadas.</td></tr>'; return;
  }
  tbody.innerHTML = mis.map(c => {
    const estadoClass = c.estado === "pendiente" ? "badge-warn" : c.estado === "confirmada" ? "badge-success" : "badge-danger";
    return '<tr>' +
      '<td><span class="badge badge-primary">' + c.id + '</span></td>' +
      '<td>' + (camap[c.canino_id]||c.canino_id) + '</td>' +
      '<td><span class="tipo-badge tipo-' + c.tipo.toLowerCase() + '">' + c.tipo + '</span></td>' +
      '<td>' + c.fecha + '</td>' +
      '<td>' + (c.nota||"—") + '</td>' +
      '<td><span class="badge ' + estadoClass + '">' + c.estado + '</span></td></tr>';
  }).join("");
}

// ════════════════════════════════════════════════════════
//  MODALES
// ════════════════════════════════════════════════════════
function openModal(id)  { document.getElementById(id).classList.add("show"); }
function closeModal(id) { document.getElementById(id).classList.remove("show"); }
document.addEventListener("click", e => {
  if (e.target.classList.contains("modal-overlay")) e.target.classList.remove("show");
});
