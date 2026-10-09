import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const API_URL = 'https://script.google.com/macros/s/AKfycbyTrcuZkPZkG39EAn-j51r-oMgb5EQCkHWvpYDdsX7quStSALjUN6jbSFV2U8jz8pfX/exec';

async function obtenerTokenUsuario() {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
}

const firebaseConfig = {
    apiKey: "AIzaSyDSNvI2PkCVkr-J3yjXy2T8rkbjujj-9AY",
    authDomain: "gymapp-4d679.firebaseapp.com",
    projectId: "gymapp-4d679",
    storageBucket: "gymapp-4d679.firebasestorage.app",
    messagingSenderId: "424474817559",
    appId: "1:424474817559:web:1966b067d1151d5cfe5852",
    measurementId: "G-ZX5Y7N9HMN"  
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error al configurar la persistencia de sesión:", error);
  });
const googleProvider = new GoogleAuthProvider();

let historialUsuario = [];
let rutinaUsuarioActual = null;

// Mapa de días
const mapaColumnas = {
  'lunes': { grupo: 'lunes', ejercicios: 'Ejercicios_lun' },
  'martes': { grupo: 'martes', ejercicios: 'Ejercicios_mar' },
  'miercoles': { grupo: 'miércoles', ejercicios: 'Ejercicios_mie' },
  'jueves': { grupo: 'jueves', ejercicios: 'Ejercicios_jue' },
  'viernes': { grupo: 'viernes', ejercicios: 'Ejercicios_vie' },
  'sabado': { grupo: 'sábado', ejercicios: 'Ejercicios_sab' }
};

// Autenticación
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    alert("Error de autenticación: " + err.message);
  }
});

document.getElementById('google-login-btn').addEventListener('click', async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    alert("Error al iniciar sesión con Google: " + err.message);
  }
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

// Control de Pestañas Navegación
const tabMedidas = document.getElementById('tab-btn-medidas');
const tabRutina = document.getElementById('tab-btn-rutina');
const tabInfo = document.getElementById('tab-btn-info');

const secMedidas = document.getElementById('sec-medidas');
const secRutina = document.getElementById('sec-rutina');
const secInfo = document.getElementById('sec-info');

function cambiarTab(tabActiva, seccionActiva) {
  [tabMedidas, tabRutina, tabInfo].forEach(t => t.classList.remove('active'));
  [secMedidas, secRutina, secInfo].forEach(s => s.classList.add('hidden'));

  tabActiva.classList.add('active');
  seccionActiva.classList.remove('hidden');
}

tabMedidas.addEventListener('click', () => cambiarTab(tabMedidas, secMedidas));
tabRutina.addEventListener('click', () => cambiarTab(tabRutina, secRutina));
tabInfo.addEventListener('click', () => cambiarTab(tabInfo, secInfo));

// Cargar Medidas
async function cargarMedidas() {
  try {
    const token = await obtenerTokenUsuario();
    if (!token) return;

    const res = await fetch(`${API_URL}?sheet=usuarios&token=${encodeURIComponent(token)}`);
    const data = await res.json();

    // Validamos que sea un arreglo
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("No se encontraron medidas o el token no fue validado.");
      return;
    }

    if (Array.isArray(data) && data.length > 0) {
        historialUsuario = data;
        // Guardamos una copia en el navegador para cuando no haya internet
        localStorage.setItem('topofit_medidas', JSON.stringify(data));
      }
    } catch (err) {
      console.warn("Sin conexión a internet. Cargando medidas locales...", err);
      // Si falla por falta de internet, buscamos en el almacenamiento local
      const datosGuardados = localStorage.getItem('topofit_medidas');
      if (datosGuardados) {
        historialUsuario = JSON.parse(datosGuardados);
      }
    }

    historialUsuario.sort((a, b) => new Date(b['Fecha Medicion'] || b['Fecha Medicion Peso']) - new Date(a['Fecha Medicion'] || a['Fecha Medicion Peso']));

    document.getElementById('user-greeting').textContent = `¡Hola, ${historialUsuario[0]['Nombres']}!`;

    const selectFecha = document.getElementById('fecha-select');
    selectFecha.innerHTML = '';

    historialUsuario.forEach((medicion, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      
      // Obtenemos la fecha cruda de la celda
      const fechaBruta = medicion['Fecha Medicion'] || medicion['Fecha Medicion Peso'];
      
      if (fechaBruta) {
        // Convertimos el texto a un objeto Date (reemplazando guiones por barras ayuda a evitar problemas de zona horaria)
        const fechaObj = new Date(fechaBruta.replace(/-/g, '\/'));
        
        if (!isNaN(fechaObj)) {
          // Formateamos: Ej. "12 oct. 2026"
          opt.textContent = fechaObj.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
        } else {
          // Si por alguna razón el formato no se deja parsear, mostramos el original sin la hora si tuviera
          opt.textContent = fechaBruta.split('T')[0];
        }
      } else {
        opt.textContent = `Medición ${idx + 1}`;
      }

      selectFecha.appendChild(opt);
    });

    renderizarMedicion(historialUsuario[0]);
  } catch (err) {
    console.error("Error al cargar medidas:", err);
  }
    document.getElementById('fecha-select').addEventListener('change', (e) => {
    const index = e.target.value;
    renderizarMedicion(historialUsuario[index]);
  });
}

function renderizarMedicion(d) {
  document.getElementById('m-peso').textContent = d['Peso'] || '-';
  document.getElementById('m-grasa-corp').textContent = d['Grasa Corporal'] || '-';
  document.getElementById('m-masa-corp').textContent = d['Masa Corporal'] || '-';
  document.getElementById('m-altura').textContent = d['Altura'] || '-';

  document.getElementById('m-pli-tri').textContent = d['Tricep'] || '-';
  document.getElementById('m-pli-sub').textContent = d['Subescapular'] || '-';
  document.getElementById('m-pli-sup').textContent = d['Suprailiaco'] || '-';
  document.getElementById('m-pli-abd').textContent = d['Abdominal'] || '-';
  document.getElementById('m-pli-mus').textContent = d['Muslo'] || '-';
  document.getElementById('m-pli-pie').textContent = d['Pierna'] || '-';

  document.getElementById('m-cuello').textContent = d['Cuello'] || '-';
  document.getElementById('m-cintura').textContent = d['Cintura'] || '-';
  document.getElementById('m-abdomen').textContent = d['Abdomen'] || '-';
  document.getElementById('m-cadera').textContent = d['Cadera'] || '-';
  document.getElementById('m-icc').textContent = d['ICC'] || '-';

  document.getElementById('m-pecho').textContent = d['Pecho'] || '-';
  document.getElementById('m-b-rel-d').textContent = d['Brazo Der'] || d['Brazo Der '] || '-';
  document.getElementById('m-b-rel-i').textContent = d['Brazo Izq'] || '-';
  document.getElementById('m-b-con-d').textContent = d['Brazo Der Contr'] || '-';
  document.getElementById('m-b-con-i').textContent = d['Brazo Izq Contr'] || '-';
  document.getElementById('m-ant-d').textContent = d['Antebrazo Der'] || '-';
  document.getElementById('m-ant-i').textContent = d['Antebrazo Izq'] || '-';
  document.getElementById('m-m-sup-d').textContent = d['Muslo Sup Der'] || '-';
  document.getElementById('m-m-sup-i').textContent = d['Muslo Sup Izq'] || '-';
  document.getElementById('m-m-med-d').textContent = d['Muslo Med Der'] || '-';
  document.getElementById('m-m-med-i').textContent = d['Muslo Med Izq'] || '-';
  document.getElementById('m-pan-d').textContent = d['Pantorrila Der'] || d['Pantorrilla Der'] || '-';
  document.getElementById('m-pan-i').textContent = d['Pantorrilla Izq'] || '-';
}

// Cargar Rutinas
async function cargarRutinas() {
  try {
    const token = await obtenerTokenUsuario();
    if (!token) return;

    const res = await fetch(`${API_URL}?sheet=rutinas&token=${encodeURIComponent(token)}`);
    const data = await res.json();

    // Como el servidor ya filtró por correo, tomamos la primera coincidencia
    rutinaUsuarioActual = data[0] || null;    
    if (rutinaUsuarioActual) {
        localStorage.setItem('topofit_rutina', JSON.stringify(rutinaUsuarioActual));
      }
    } catch (err) {
      console.warn("Sin conexión. Cargando rutina local...", err);
      const rutinaGuardada = localStorage.getItem('topofit_rutina');
      if (rutinaGuardada) {
        rutinaUsuarioActual = JSON.parse(rutinaGuardada);
      }
    }

    if (rutinaUsuarioActual) {
      const diasSemana = ['sabado', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const diaHoy = diasSemana[new Date().getDay()];
      const diaInicial = mapaColumnas[diaHoy] ? diaHoy : 'lunes';

      document.getElementById('dia-rutina-select').value = diaInicial;
      mostrarRutinaPorDia(diaInicial);
    }
  } catch (err) {
    console.error("Error al cargar rutinas:", err);
  }
}

document.getElementById('dia-rutina-select').addEventListener('change', (e) => {
  mostrarRutinaPorDia(e.target.value);
});

function mostrarRutinaPorDia(diaClave) {
  if (!rutinaUsuarioActual) return;

  const config = mapaColumnas[diaClave];
  const grupoMuscular = rutinaUsuarioActual[config.grupo] || 'Descanso';
  const ejerciciosRaw = rutinaUsuarioActual[config.ejercicios] || '';

  document.getElementById('rutina-grupo-muscular').textContent = `🎯 Enfoque: ${grupoMuscular}`;
  const contenedor = document.getElementById('contenedor-ejercicios');
  contenedor.innerHTML = '';

  if (!ejerciciosRaw || grupoMuscular.toLowerCase().includes('descanso')) {
    contenedor.innerHTML = `<div class="placeholder-card"><p>😴 Día de descanso programado o sin ejercicios asignados.</p></div>`;
    return;
  }

  const listaEjercicios = ejerciciosRaw.split(',').map(e => e.trim()).filter(Boolean);

  listaEjercicios.forEach((ejercicioNombre, index) => {
    const card = document.createElement('div');
    card.className = 'metric-card purple';
    card.style.marginBottom = '10px';
    card.innerHTML = `
      <div class="metric-title">Ejercicio #${index + 1}</div>
      <div class="metric-value" style="font-size: 1rem; margin-top: 5px;">${ejercicioNombre}</div>
    `;
    contenedor.appendChild(card);
  });
}

// Descarga PWA
let deferredPrompt;
const installBanner = document.getElementById('pwa-install-banner');
const installBtn = document.getElementById('install-pwa-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBanner.style.display = 'flex';
});

installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') installBanner.style.display = 'none';
    deferredPrompt = null;
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
  });
}

async function cargarConfiguracionGym() {
  try {
    const res = await fetch(`${API_URL}?sheet=config`);
    const data = await res.json();

    const configMap = {};
    data.forEach(row => {
      const keys = Object.keys(row);
      const key = row[keys[0]];
      const val = row[keys[1]];
      if (key) configMap[key.toString().trim()] = val ? val.toString().trim() : '';
    });

    localStorage.setItem('topofit_config', JSON.stringify(configMap));
  } catch (err) {
    console.warn("Sin conexión. Cargando configuración local...", err);
    const configGuardada = localStorage.getItem('topofit_config');
    if (configGuardada) {
      configMap = JSON.parse(configGuardada);
    }
  }
    

    const statusBadge = document.getElementById('gym-status-badge');
    const estado = (configMap['Abierto'] || '').toLowerCase();

    if (estado === 'si' || estado === 'sí') {
      statusBadge.textContent = '🟢 ABIERTO';
      statusBadge.className = 'status-badge status-open';
    } else {
      statusBadge.textContent = '🔴 CERRADO';
      statusBadge.className = 'status-badge status-closed';
    }

    if (configMap['Lunes a Viernes']) {
      document.getElementById('info-horario-semana').textContent = configMap['Lunes a Viernes'];
    }
    // Maneja tanto "Sabado" como "Sábado" de manera segura
    const horarioSabado = configMap['Sabado'] || configMap['Sábado'];
    if (horarioSabado) {
      document.getElementById('info-horario-sabado').textContent = horarioSabado;
    }
  } catch (err) {
    console.error("Error al cargar configuración:", err);
    // Si hay un error de red, dejamos al menos un estado neutro o el último conocido
    const statusBadge = document.getElementById('gym-status-badge');
    statusBadge.textContent = '⚠️ SIN CONEXIÓN';
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    cargarMedidas();
    cargarRutinas();
    cargarConfiguracionGym();
  } else {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('dashboard-section').style.display = 'none';
  }
});
