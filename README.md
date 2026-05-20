# 🐾 Sistema Canino - Salud, Estética y Recreación

Aplicación web para la gestión de clientes y caninos de un centro de servicios para mascotas.
Desarrollada como parte de la actividad 06 de **Teoría General de Sistemas** - ITM.

---

## 🚀 Demo en línea

👉 [https://sharagb.github.io/aplicacion_sistemas_algoritmia_tgs/](https://sharagb.github.io/aplicacion_sistemas_algoritmia_tgs/)

---

## 📋 Descripción

Sistema web para gestionar el registro de caninos en un centro de salud, estética y recreación. Permite administrar clientes, mascotas y citas de forma sencilla desde el navegador, sin necesidad de instalación.

---

## 👥 Roles del sistema

| Rol | Acceso |
|-----|--------|
| **Admin** | CRUD completo de clientes y caninos, gestión de citas |
| **Cliente** | Ver sus caninos, agregar caninos propios, solicitar citas, actualizar perfil |

**Credenciales de administrador por defecto:**

- Usuario: `admin`
- Contraseña: `1234`

Los clientes pueden registrarse desde la pantalla de inicio o ser creados por el administrador.

---

## ✨ Funcionalidades

- Inicio de sesión con bloqueo tras 3 intentos fallidos
- Auto-registro de clientes
- Gestión de clientes y caninos (admin)
- Solicitud y gestión de citas (estética, salud, recreación)
- Confirmación/cancelación de citas por el administrador
- Vista personalizada según rol
- Datos persistidos en `localStorage` (formato JSON)

---

## 🛠️ Tecnologías

- HTML5, CSS3, JavaScript (sin frameworks)
- localStorage para persistencia de datos
- GitHub Pages para despliegue

---

## 📁 Estructura

```
├── index.html   ← estructura de la app
├── styles.css   ← estilos visuales
└── app.js       ← lógica de la aplicación
```

---

## 🔗 Uso local

1. Descarga o clona este repositorio
2. Abre el archivo `index.html` en tu navegador (doble clic)
3. No requiere instalación ni servidor

## ✍️ Autores

- **Keiner Cano Villa**
- **Shara García Betancur**
