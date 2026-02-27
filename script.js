document.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('output');
    const checkFocusTalk = document.getElementById('check-focus-talk');
    const speedValueSpan = document.getElementById('focus-speed-value');
    const tecladoDiv = document.getElementById('teclado');

    let dwellTimer = null;
    let currentFocusTime = 2000;
    let focusMode = true; 

    // --- 🚨 FUNCIÓN ALERTA PITIDO (RANGO SSS) ---
    function tocarPitido() {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                osc.connect(gain); gain.connect(audioCtx.destination);
                osc.start(); osc.stop(audioCtx.currentTime + 0.1);
            }, i * 200);
        }
    }

    // --- MOTOR DE FOCO ---
    function startDwellTimer(element, action) {
        if (!focusMode) return;
        element.classList.add('focus-active');
        dwellTimer = setTimeout(() => {
            action();
            element.classList.remove('focus-active');
        }, currentFocusTime);
    }

    function clearDwellTimer(element) {
        if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
        if (element) element.classList.remove('focus-active');
    }

    const hablar = (texto) => {
        window.speechSynthesis.cancel();
        const voz = new SpeechSynthesisUtterance(texto);
        voz.lang = 'es-ES';
        window.speechSynthesis.speak(voz);
    };

    // --- ASIGNAR FOCO A BOTONES DE CONTROL ---
    const asignarFoco = (id, accion) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.onclick = () => { if (!focusMode) accion(); };
        el.onmouseenter = () => startDwellTimer(el, accion);
        el.onmouseleave = () => clearDwellTimer(el);
    };

    asignarFoco('btn-mas', () => { currentFocusTime += 500; speedValueSpan.textContent = (currentFocusTime/1000).toFixed(1) + 's'; });
    asignarFoco('btn-menos', () => { currentFocusTime = Math.max(500, currentFocusTime - 500); speedValueSpan.textContent = (currentFocusTime/1000).toFixed(1) + 's'; });
    asignarFoco('boton-tts', () => hablar(output.value));
    asignarFoco('boton-limpiar', () => { output.value = ''; window.speechSynthesis.cancel(); });
    
    // El Checkbox es especial (cambia el modo)
    const labelCheck = checkFocusTalk.parentElement;
    labelCheck.onmouseenter = () => startDwellTimer(labelCheck, () => {
        checkFocusTalk.checked = !checkFocusTalk.checked;
        focusMode = checkFocusTalk.checked;
    });
    labelCheck.onmouseleave = () => clearDwellTimer(labelCheck);
    checkFocusTalk.onchange = (e) => focusMode = e.target.checked;

    // --- TECLADO (CON PITIDO Y BORRAR AJUSTADO) ---
    const filas = ['Q W E R T Y U I O P', 'A S D F G H J K L Ñ', 'Z X C V B N M , . ?', 'ESPACIO BORRAR PITIDO'];
    filas.forEach(f => {
        const row = document.createElement('div'); row.className = 'tecla-row';
        f.split(' ').forEach(t => {
            const b = document.createElement('button'); b.textContent = t; b.className = 'tecla';
            if (['ESPACIO','BORRAR','PITIDO'].includes(t)) b.classList.add('tecla-especial');
            if (t === 'PITIDO') b.style.background = "#ff4444"; b.style.color = "white";

            const acc = () => {
                if (t === 'ESPACIO') output.value += ' ';
                else if (t === 'BORRAR') output.value = output.value.slice(0, -1);
                else if (t === 'PITIDO') tocarPitido();
                else {
                    output.value += t;
                    if (t === '.') {
                        const frases = output.value.split('.');
                        const ultima = frases[frases.length - 2].trim();
                        if (ultima) hablar(ultima);
                    }
                }
            };
            b.onclick = () => { if (!focusMode) acc(); };
            b.onmouseenter = () => startDwellTimer(b, acc);
            b.onmouseleave = () => clearDwellTimer(b);
            row.appendChild(b);
        });
        tecladoDiv.appendChild(row);
    });

    // --- NAVEGACIÓN Y SUB-BOTONES ---
    document.querySelectorAll('.menu-boton').forEach(btn => {
        const acc = () => {
            document.querySelectorAll('.vista').forEach(v => v.classList.add('oculto'));
            document.getElementById('vista-' + btn.dataset.vista).classList.remove('oculto');
        };
        btn.onclick = () => { if (!focusMode) acc(); };
        btn.onmouseenter = () => startDwellTimer(btn, acc);
        btn.onmouseleave = () => clearDwellTimer(btn);
    });

    document.querySelectorAll('.sub-boton').forEach(btn => {
        const acc = () => hablar(btn.dataset.frase);
        btn.onclick = () => { if (!focusMode) acc(); };
        btn.onmouseenter = () => startDwellTimer(btn, acc);
        btn.onmouseleave = () => clearDwellTimer(btn);
    });
});