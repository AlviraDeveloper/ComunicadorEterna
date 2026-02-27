// --- VARIABLES DEL SISTEMA 3 (RANGO SSS) ---
const output = document.getElementById('output');
const botonTTS = document.getElementById('boton-tts');
const botonLimpiar = document.getElementById('boton-limpiar');
const checkFocusTalk = document.getElementById('check-focus-talk');
const speedValueSpan = document.getElementById('focus-speed-value'); // El numerito
const tecladoDiv = document.getElementById('teclado');
const btnMas = document.getElementById('btn-mas'); // Botón +
const btnMenos = document.getElementById('btn-menos'); // Botón -

let dwellTimer = null;
let currentFocusTime = 2000; // Empezamos en 2 segundos por defecto
let currentFocusElement = null;
let focusMode = checkFocusTalk.checked; 

// --- BLOQUEO DE TECLADO FÍSICO (VIVA EL F11) ---
window.addEventListener('keydown', (e) => {
    const teclasPermitidas = ['F5', 'F11', 'F12'];
    if (!teclasPermitidas.includes(e.key)) {
        e.preventDefault();
    }
}, { capture: true });

// --- LÓGICA DE FOCO (DWELL TIME) ---
function clearDwellTimer() {
    if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
    if (currentFocusElement) {
        currentFocusElement.classList.remove('focus-active');
        currentFocusElement = null;
    }
}

function startDwellTimer(element, actionFunction) {
    clearDwellTimer();
    if (!focusMode) return; 
    currentFocusElement = element;
    currentFocusElement.classList.add('focus-active');
    dwellTimer = setTimeout(() => {
        actionFunction();
        clearDwellTimer();
    }, currentFocusTime);
}

// --- CONFIGURACIÓN DE VOZ ---
const synth = window.speechSynthesis;

function hablarUltimaFrase() {
    synth.cancel();
    const textoCompleto = output.value.trim();
    if (textoCompleto === '') return;
    const frases = textoCompleto.split('.');
    let ultimaFrase = frases[frases.length - 1].trim() === '' ? frases[frases.length - 2] : frases[frases.length - 1];
    if (ultimaFrase) {
        const voz = new SpeechSynthesisUtterance(ultimaFrase);
        voz.lang = 'es-ES';
        voz.rate = 0.9;
        synth.speak(voz);
    }
}

function hablarTextoCompleto() {
    synth.cancel();
    if (output.value.trim() !== '') {
        const voz = new SpeechSynthesisUtterance(output.value);
        voz.lang = 'es-ES';
        voz.rate = 0.9;
        synth.speak(voz);
    }
}

// --- ACTUALIZAR VELOCIDAD CON BOTONES ---
const actualizarVelocidad = (nuevoTiempo) => {
    currentFocusTime = Math.max(100, Math.min(5000, nuevoTiempo));
    speedValueSpan.textContent = (currentFocusTime / 1000).toFixed(1) + 's';
    clearDwellTimer();
};

// --- ACCIONES DE ESCRITURA ---
function manejarEntrada(tecla) {
    output.focus();
    const start = output.selectionStart;
    const end = output.selectionEnd;
    const currentText = output.value;

    if (tecla === 'ESPACIO') {
        output.value = currentText.substring(0, start) + ' ' + currentText.substring(end);
        output.selectionStart = output.selectionEnd = start + 1;
    } else if (tecla === 'BORRAR') {
        if (start === end && start > 0) {
            output.value = currentText.substring(0, start - 1) + currentText.substring(end);
            output.selectionStart = output.selectionEnd = start - 1;
        } else if (start !== end) {
            output.value = currentText.substring(0, start) + currentText.substring(end);
            output.selectionStart = output.selectionEnd = start;
        }
    } else {
        output.value = currentText.substring(0, start) + tecla + currentText.substring(end);
        output.selectionStart = output.selectionEnd = start + 1;
        if (tecla === '.') setTimeout(hablarUltimaFrase, 100);
    }
}

// --- CREACIÓN DEL TECLADO ---
const filas = [
    'Q W E R T Y U I O P',
    'A S D F G H J K L Ñ',
    'Z X C V B N M , . ?',
    'ESPACIO BORRAR'
];

tecladoDiv.innerHTML = '';
filas.forEach(filaStr => {
    const filaDiv = document.createElement('div');
    filaDiv.classList.add('tecla-row');
    filaStr.split(' ').forEach(tecla => {
        const boton = document.createElement('button');
        boton.textContent = tecla;
        boton.classList.add('tecla');
        if (tecla === 'ESPACIO' || tecla === 'BORRAR') boton.classList.add('tecla-especial');
        
        boton.addEventListener('click', (e) => {
            if (focusMode) { e.preventDefault(); return; }
            manejarEntrada(tecla);
        });
        boton.addEventListener('mouseenter', () => {
            if (focusMode) startDwellTimer(boton, () => manejarEntrada(tecla));
        });
        boton.addEventListener('mouseleave', clearDwellTimer);
        filaDiv.appendChild(boton);
    });
    tecladoDiv.appendChild(filaDiv);
});

// --- EVENTOS BOTONES VELOCIDAD ---
btnMas.addEventListener('click', () => { if (!focusMode) actualizarVelocidad(currentFocusTime + 500); });
btnMas.addEventListener('mouseenter', () => { if (focusMode) startDwellTimer(btnMas, () => actualizarVelocidad(currentFocusTime + 500)); });
btnMas.addEventListener('mouseleave', clearDwellTimer);

btnMenos.addEventListener('click', () => { if (!focusMode) actualizarVelocidad(currentFocusTime - 500); });
btnMenos.addEventListener('mouseenter', () => { if (focusMode) startDwellTimer(btnMenos, () => actualizarVelocidad(currentFocusTime - 500)); });
btnMenos.addEventListener('mouseleave', clearDwellTimer);

// --- OTROS CONTROLES ---
botonTTS.addEventListener('click', () => { if (!focusMode) hablarTextoCompleto(); });
botonTTS.addEventListener('mouseenter', () => { if (focusMode) startDwellTimer(botonTTS, hablarTextoCompleto); });
botonTTS.addEventListener('mouseleave', clearDwellTimer);

botonLimpiar.addEventListener('click', () => {
    synth.cancel();
    output.value = '';
    output.focus();
});

checkFocusTalk.addEventListener('change', (e) => { focusMode = e.target.checked; clearDwellTimer(); });

