document.addEventListener('DOMContentLoaded', () => {
    // 1. REFERENCIAS
    const outputPrincipal = document.getElementById('output');
    const botonTTS = document.getElementById('boton-tts');
    const botonLimpiar = document.getElementById('boton-limpiar');
    const tecladoDiv = document.getElementById('teclado');
    const vistas = document.querySelectorAll('.vista');
    const menuBotones = document.querySelectorAll('.menu-boton');

    let currentFocusTime = 2000; 
    let keyDwellTimer = null;

    // --- MOTOR DE TIEMPO (DWELL) ---
    function startDwellTimer(elemento, accion) {
        elemento.classList.add('tecla-hovering');
        keyDwellTimer = setTimeout(() => {
            accion();
            elemento.classList.remove('tecla-hovering');
        }, currentFocusTime);
    }

    function clearDwellTimer(elemento) {
        if (keyDwellTimer) { clearTimeout(keyDwellTimer); keyDwellTimer = null; }
        if (elemento) elemento.classList.remove('tecla-hovering');
    }

    // --- 🚨 ALARMA SOS Y SONIDO ---
    function tocarPitido() {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                osc.connect(gain); gain.connect(audioCtx.destination);
                osc.start(); osc.stop(audioCtx.currentTime + 0.1);
            }, i * 150);
        }
    }

    // --- 🗣️ FUNCIÓN HABLAR (REFORZADA) ---
    function hablar(texto) {
        if ('speechSynthesis' in window && texto.trim() !== "") {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(texto);
            u.lang = 'es-ES';
            window.speechSynthesis.speak(u);
        }
    }

    // --- LÓGICA SELECTOR VELOCIDAD [-] [+] ---
    const velMenos = document.getElementById('vel-menos');
    const velMas = document.getElementById('vel-mas');
    const velValor = document.getElementById('vel-valor');
    const velocidades = [500, 1000, 2000, 3000];
    let indiceVel = 2;

    function actualizarVelocidad() {
        currentFocusTime = velocidades[indiceVel];
        velValor.textContent = (currentFocusTime / 1000).toFixed(1) + 's';
        tocarPitido();
    }

    if(velMenos && velMas) {
        velMenos.onclick = () => { if(indiceVel > 0) { indiceVel--; actualizarVelocidad(); }};
        velMas.onclick = () => { if(indiceVel < velocidades.length -1) { indiceVel++; actualizarVelocidad(); }};
        [velMenos, velMas].forEach(btn => {
            btn.onmouseenter = () => startDwellTimer(btn, () => btn.click());
            btn.onmouseleave = () => clearDwellTimer(btn);
        });
    }

    // --- BOTONES PRINCIPALES (HABLAR Y LIMPIAR) ---
    botonTTS.onclick = () => hablar(outputPrincipal.value);
    botonTTS.onmouseenter = () => startDwellTimer(botonTTS, () => hablar(outputPrincipal.value));
    botonTTS.onmouseleave = () => clearDwellTimer(botonTTS);

    botonLimpiar.onclick = () => { outputPrincipal.value = ''; outputPrincipal.focus(); };
    botonLimpiar.onmouseenter = () => startDwellTimer(botonLimpiar, () => { outputPrincipal.value = ''; });
    botonLimpiar.onmouseleave = () => clearDwellTimer(botonLimpiar);

    // --- NAVEGACIÓN ---
    function cambiarVista(id) {
        vistas.forEach(v => { v.classList.add('oculto'); v.classList.remove('activa'); });
        const destino = document.getElementById(`vista-${id}`);
        if(destino) { destino.classList.remove('oculto'); destino.classList.add('activa'); }
    }

    menuBotones.forEach(btn => {
        const destino = btn.getAttribute('data-vista');
        btn.onmouseenter = () => startDwellTimer(btn, () => cambiarVista(destino));
        btn.onmouseleave = () => clearDwellTimer(btn);
        btn.onclick = () => cambiarVista(destino);
    });

    // --- TECLADO ---
    const layout = ['Q W E R T Y U I O P', 'A S D F G H J K L Ñ', 'Z X C V B N M , . ?', 'PITIDO ESPACIO BORRAR'];
    function generarTeclado() {
        tecladoDiv.innerHTML = '';
        layout.forEach(fila => {
            const div = document.createElement('div');
            div.className = 'tecla-row';
            fila.split(' ').forEach(t => {
                const b = document.createElement('button');
                b.textContent = t; b.className = 'tecla';
                const acc = () => { 
                     if(t === 'ESPACIO') {
                        outputPrincipal.value += ' '; 
                        // --- PITIDO DE CONFIRMACIÓN PARA ESPACIO ---
                        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                        const osc = audioCtx.createOscillator();
                        const gain = audioCtx.createGain();
                        osc.frequency.setValueAtTime(660, audioCtx.currentTime); // Un tono distinto, más suave
                        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
                        osc.connect(gain); gain.connect(audioCtx.destination);
                        osc.start(); osc.stop(audioCtx.currentTime + 0.05); // Muy cortito: 0.05s
                    } else if(t === 'BORRAR') {
                        outputPrincipal.value = outputPrincipal.value.slice(0, -1); 
                    } else if(t === 'PITIDO') {
                        tocarPitido(); // Tu ráfaga SOS de siempre
                    } else {
                        outputPrincipal.value += t; 
                    }
                };
                b.onclick = acc;
                b.onmouseenter = () => startDwellTimer(b, acc);
                b.onmouseleave = () => clearDwellTimer(b);
                div.appendChild(b);
            });
            tecladoDiv.appendChild(div);
        });
    }

    // --- SUB-BOTONES (FRASES) ---
    document.querySelectorAll('.sub-boton').forEach(btn => {
        const frase = btn.getAttribute('data-frase');
        const acc = () => {
            hablar(frase);
            setTimeout(() => { cambiarVista('teclado'); outputPrincipal.value = ''; }, 2000);
        };
        btn.onclick = acc;
        btn.onmouseenter = () => startDwellTimer(btn, acc);
        btn.onmouseleave = () => clearDwellTimer(btn);
    });

    generarTeclado();
    cambiarVista('teclado');
});