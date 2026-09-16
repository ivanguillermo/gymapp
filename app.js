import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const googleProvider = new GoogleAuthProvider();

const SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTIWPk8cl4-Tr6lJylnL-TPvEcWgfIdRW3ktWr6LlOfWO0fDhFcnkwFzkbVl0GBoUzgYFAhJFps6q9D/pub?output=csv';

let historialUsuario = [];

// Autenticación por Correo/Clave
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

// Autenticación por Google
document.getElementById('google-login-btn').addEventListener('click', async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    alert("Error al iniciar sesión con Google: " + err.message);
  }
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

// Escuchador del Estado de Sesión
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    cargarDatosDesdeSheets(user.email);
  } else {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('dashboard-section').style.display = 'none';
  }
});

// Control de Pestañas
const tabMedidas = document.getElementById('tab-btn-medidas');
const tabRutina = document.getElementById('tab-btn-rutina');
const secMedidas = document.getElementById('sec-medidas');
const secRutina = document.getElementById('sec-rutina');

tabMedidas.addEventListener('click', () => {
  tabMedidas.classList.add('active');
  tabRutina.classList.remove('active');
  secMedidas.classList.remove('hidden');
  secRutina.classList.add('hidden');
});

tabRutina.addEventListener('click', () => {
  tabRutina.classList.add('active');
  tabMedidas.classList.remove('active');
  secRutina.classList.remove('hidden');
  secMedidas.classList.add('hidden');
});

// Cargar y procesar CSV
function cargarDatosDesdeSheets(userEmail) {
  Papa.parse(SHEETS_CSV_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      const data = results.data;
      
      historialUsuario = data.filter(row => row['Correo'] && row['Correo'].trim().toLowerCase() === userEmail.toLowerCase());

      if (historialUsuario.length === 0) {
        alert("No se encontraron mediciones registradas para el correo: " + userEmail);
        return;
      }

      historialUsuario.sort((a, b) => {
        const fechaA = new Date(a['Fecha Medicion'] || a['Fecha Medicion Peso']);
        const fechaB = new Date(b['Fecha Medicion'] || b['Fecha Medicion Peso']);
        return fechaB - fechaA;
      });

      const primerRegistro = historialUsuario[0];
      document.getElementById('user-greeting').textContent = `¡Hola, ${primerRegistro['Nombres']}!`;

      const selectFecha = document.getElementById('fecha-select');
      selectFecha.innerHTML = '';

      historialUsuario.forEach((medicion, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = medicion['Fecha Medicion'] || medicion['Fecha Medicion Peso'];
        selectFecha.appendChild(opt);
      });

      renderizarMedicion(historialUsuario[0]);
    }
  });
}

document.getElementById('fecha-select').addEventListener('change', (e) => {
  const idx = e.target.value;
  renderizarMedicion(historialUsuario[idx]);
});

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

// Lógica de descarga PWA
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
    if (outcome === 'accepted') {
      installBanner.style.display = 'none';
    }
    deferredPrompt = null;
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('Service Worker activo:', reg.scope))
      .catch((err) => console.error('Error al registrar SW:', err));
  });
}

let rutinaUsuarioActual = null;

// Mapa de correspondencia entre el select y los encabezados del CSV
const mapaColumnas = {
  'lunes': { grupo: 'lunes', ejercicios: 'Ejercicios_lun' },
  'martes': { grupo: 'martes', ejercicios: 'Ejercicios_mar' },
  'miercoles': { grupo: 'miércoles', ejercicios: 'Ejercicios_mie' },
  'jueves': { grupo: 'jueves', ejercicios: 'Ejercicios_jue' },
  'viernes': { grupo: 'viernes', ejercicios: 'Ejercicios_vie' },
  'sabado': { grupo: 'sábado', ejercicios: 'Ejercicios_sab' }
};

// Guardar los datos de rutinas cargados desde el CSV
function guardarDatosRutina(datosRutinas, userEmail) {
  rutinaUsuarioActual = datosRutinas.find(
    row => row['Correo'] && row['Correo'].trim().toLowerCase() === userEmail.toLowerCase()
  );
  
  if (rutinaUsuarioActual) {
    // Seleccionar automáticamente el día actual de la semana
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaHoy = diasSemana[new Date().getDay()];
    const diaInicial = mapaColumnas[diaHoy] ? diaHoy : 'lunes';
    
    document.getElementById('dia-rutina-select').value = diaInicial;
    mostrarRutinaPorDia(diaInicial);
  }
}

// Escuchar cambios de selección de día
document.getElementById('dia-rutina-select').addEventListener('change', (e) => {
  mostrarRutinaPorDia(e.target.value);
});

// Renderizar grupo muscular y lista de ejercicios
function mostrarRutinaPorDia(diaClave) {
  if (!rutinaUsuarioActual) return;

  const config = mapaColumnas[diaClave];
  const grupoMuscular = rutinaUsuarioActual[config.grupo] || 'Descanso';
  const ejerciciosRaw = rutinaUsuarioActual[config.ejercicios] || '';

  const headerElem = document.getElementById('rutina-grupo-muscular');
  const contenedor = document.getElementById('contenedor-ejercicios');

  headerElem.textContent = `🎯 Enfoque: ${grupoMuscular}`;
  contenedor.innerHTML = '';

  if (!ejerciciosRaw || grupoMuscular.toLowerCase().includes('descanso')) {
    contenedor.innerHTML = `
      <div class="placeholder-card">
        <p>😴 Día de descanso programado o sin ejercicios asignados.</p>
      </div>`;
    return;
  }

  // Separar los ejercicios por comas
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
