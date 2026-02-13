document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DEL TECLADO VIRTUAL Y CONTROLES ---
    
    // Referencias a los elementos críticos del HTML
    const output = document.getElementById('output');
    const tecladoDiv = document.getElementById('teclado');
    const checkFocus = document.getElementById('check-focus-talk');
    const rangeSpeed = document.getElementById('focus-speed-range');
    const speedValueSpan = document.getElementById('focus-speed-value');
    const botonTTS = document.getElementById('boton-tts');
    const botonLimpiar = document.getElementById('boton-limpiar');

    // Variables de estado del sistema
    let focusTimer = null; // Timer para el output principal (indicador focus-ready)
    let keyDwellTimer = null; // Timer para la tecla actual (dwell-to-type)
    let currentFocusTime = parseInt(rangeSpeed.value); // Tiempo inicial en milisegundos (2000ms)
    let focusMode = true; // Empieza activado por defecto

    // --- FUNCIONES DE AUDIO ---

    // Función para generar 5 bips (Restaurado)
    function tocarPitido() {
        const bipCount = 5;
        const duration = 50; // Duración de cada bip en ms
        const delay = 100; // Retraso entre bips en ms
        let context;

        try {
            // Inicializar AudioContext (aseguramos que solo se inicialice una vez)
            context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error("AudioContext no soportado. No se puede generar el pitido.");
            return; 
        }

        // Función interna para generar un bip
        function generarBip(time) {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);

            // Configuración del sonido
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(440, time); 

            // Configuración de la ganancia (volumen)
            gainNode.gain.setValueAtTime(1, time);
            gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration / 1000);

            // Iniciar y parar el oscilador
            oscillator.start(time);
            oscillator.stop(time + duration / 1000);
        }

        // Generar la secuencia de bips
        for (let i = 0; i < bipCount; i++) {
            const startTime = context.currentTime + (i * (duration + delay)) / 1000;
            generarBip(startTime);
        }
    }


    // --- LÓGICA DEL TEMPORIZADOR DE FOCO (Indicador Visual del Output) ---
    
    // Función interna que se ejecuta al expirar el tiempo principal
    function handleFocusTimeout() {
        // Quitamos el indicador de que estaba activo (borde azul)
        output.classList.remove('focus-active');

        // Si hay texto, ponemos el indicador de "Listo para hablar" (borde verde)
        if (output.value.trim() !== '') { 
            output.classList.add('focus-ready');
            // Nota: Aquí no hablamos automáticamente, solo cambia el indicador visual
        } else {
             output.classList.remove('focus-ready');
        }

        // El temporizador principal se detiene
        focusTimer = null;
    }

    // Inicia/Reinicia la cuenta atrás del temporizador principal (Output)
    function startFocusTimer() {
        // 1. Limpiamos cualquier temporizador principal previo
        if (focusTimer) {
            clearTimeout(focusTimer);
            focusTimer = null; 
        }

        // 2. Si el modo está activo E HAY TEXTO, iniciamos un nuevo timeout
        if (focusMode && output.value.trim() !== '') {
            
            // Ponemos el indicador visual de "activo" (borde azul)
            output.classList.add('focus-active');
            output.classList.remove('focus-ready'); // Aseguramos quitar el verde
            
            focusTimer = setTimeout(handleFocusTimeout, currentFocusTime);
        } else {
             // Si el modo está desactivado o el texto está vacío, quitamos cualquier clase
            output.classList.remove('focus-active');
            output.classList.remove('focus-ready');
        }
    }
    
    // Se llama en CADA interacción de ESCRITURA para reiniciar la cuenta atrás del Output
    function resetFocus() {
        startFocusTimer();
    }


    // --- LÓGICA DE DWELL-TO-TYPE (Tecla Individual) ---
    
    // Función que se ejecuta cuando el tiempo de permanencia en una tecla expira
    function handleKeyDwell(tecla, botonElement) {
        // 1. Limpiamos el timer de la tecla
        keyDwellTimer = null;
        
        // 2. Realizamos la acción de la tecla
        let isWriting = false;
        let textToAdd = '';
        
        if (tecla === 'ESPACIO') {
            textToAdd = ' ';
            isWriting = true;
        } else if (tecla === 'BORRAR') {
            output.value = output.value.slice(0, -1);
            isWriting = true;
        } else if (tecla === 'PITIDO') {
            tocarPitido();
            isWriting = false; 
        } else {
            // Tecla normal
            textToAdd = tecla;
            isWriting = true;
        }

        if (textToAdd) {
            output.value += textToAdd;
        }

        output.scrollTop = output.scrollHeight; // Scroll al final
        
        // 3. CRÍTICO: Al escribir por dwell, reiniciamos el temporizador principal (output focus)
        if (isWriting) {
            resetFocus(); 
        }
        
        // 4. Quitar la clase de 'hovering' y añadir la de "pulsada" visualmente
        if (botonElement) {
             botonElement.classList.remove('tecla-hovering');
             botonElement.classList.add('tecla-dwelled');
             // Damos un feedback rápido de "pulsado"
             setTimeout(() => {
                 botonElement.classList.remove('tecla-dwelled');
             }, 100);
        }
    }


    // --- GENERACIÓN DEL TECLADO VIRTUAL ---
    
    const tecladoLayout = [
        'Q W E R T Y U I O P',
        'A S D F G H J K L Ñ',
        'Z X C V B N M , . ?',
        'PITIDO ESPACIO BORRAR'
    ];

    function generarTeclado() {
        tecladoLayout.forEach(filaStr => {
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('tecla-row');
            
            const teclas = filaStr.split(' ');
            teclas.forEach(tecla => {
                const boton = document.createElement('button');
                boton.textContent = tecla;
                boton.classList.add('tecla');
                
                // Clases especiales para diseño
                if (tecla === 'ESPACIO') {
                    boton.classList.add('tecla-espacio');
                    boton.innerHTML = 'ESPACIO';
                } else if (tecla === 'BORRAR') {
                    boton.classList.add('tecla-funcional');
                    boton.innerHTML = '⌫ BORRAR'; 
                } else if (tecla === 'PITIDO') {
                    boton.classList.add('tecla-funcional');
                    boton.innerHTML = '🔔 PITIDO';
                }

                // *** MANEJADORES DE EVENTOS PARA DWELL (PERMANENCIA) ***
                
                // EVENTO MOUSEOVER: El ratón entra en la tecla
                boton.addEventListener('mouseover', function() {
                    // Usamos 'this' para referirnos al botón actual
                    if (!focusMode) return; 

                    // 1. Limpiamos cualquier temporizador de tecla previo
                    if (keyDwellTimer) {
                        clearTimeout(keyDwellTimer);
                    }

                    // 2. Añadimos la clase visual de espera (borde azul)
                    this.classList.add('tecla-hovering');

                    // 3. Iniciamos el temporizador de dwell-to-type
                    const self = this;
                    keyDwellTimer = setTimeout(() => {
                        // Si el timer expira, disparamos la acción de la tecla
                        handleKeyDwell(tecla, self);
                    }, currentFocusTime);
                });

                // EVENTO MOUSEOUT: El ratón sale de la tecla
                boton.addEventListener('mouseout', function() {
                    // 1. Limpiamos el temporizador si el ratón sale antes de expirar
                    if (keyDwellTimer) {
                        clearTimeout(keyDwellTimer);
                        keyDwellTimer = null;
                    }
                    // 2. Quitamos la clase visual de espera
                    this.classList.remove('tecla-hovering');
                });
                
                rowDiv.appendChild(boton);
            });
            tecladoDiv.appendChild(rowDiv);
        });
    }


    // --- ASIGNACIÓN DE EVENTOS A LOS CONTROLES EXTERNOS ---

    // Botón HABLAR (Acción manual - NO RESETA EL FOCUS)
    botonTTS.addEventListener('click', () => {
        const texto = output.value.trim();
        if (texto !== '') {
             window.speechSynthesis.cancel();
             const utterance = new SpeechSynthesisUtterance(texto);
             utterance.lang = 'es-ES';
             
             // Feedback visual mientras habla
             output.classList.remove('focus-ready');
             output.classList.remove('focus-active');
             
             window.speechSynthesis.speak(utterance);
        }
    });

    // Botón LIMPIAR (NO RESETA EL FOCUS)
    botonLimpiar.addEventListener('click', () => {
        output.value = '';
        output.classList.remove('focus-active');
        output.classList.remove('focus-ready');
    });

    // Control Deslizante de Velocidad
    rangeSpeed.addEventListener('input', (event) => {
        currentFocusTime = parseInt(event.target.value);
        speedValueSpan.textContent = (currentFocusTime / 1000).toFixed(1) + ' s'; 
        
        // Si el modo foco está activo, reiniciamos el timer principal para aplicar la nueva velocidad
        if(focusMode) {
            resetFocus();
            // Cancelamos cualquier dwell actual para que el nuevo tiempo tenga efecto
            if (keyDwellTimer) {
                clearTimeout(keyDwellTimer);
                keyDwellTimer = null; 
            }
        }
    });

    // Checkbox Modo Foco
    checkFocus.addEventListener('change', (event) => {
        focusMode = event.target.checked;
        
        const label = checkFocus.previousElementSibling;
        label.textContent = focusMode 
            ? 'Modo Focus por Tiempo (Activado):' 
            : 'Modo Focus por Tiempo (Desactivado):';

        // Si se desactiva/activa, reiniciamos el estado de ambos timers
        resetFocus(); // Timer principal
        if (keyDwellTimer) { // Timer de la tecla
            clearTimeout(keyDwellTimer);
            keyDwellTimer = null;
        }
        // Quitar la clase hovering de cualquier tecla
        tecladoDiv.querySelectorAll('.tecla-hovering').forEach(btn => btn.classList.remove('tecla-hovering'));
    });
    
    // Detectar entrada de teclado físico en el textarea o actividad general
    output.addEventListener('input', () => {
        // Al escribir físicamente, reseteamos el temporizador principal
        resetFocus();
    });


    // --- INICIALIZACIÓN ---
    
    generarTeclado();
    
    // Inicializar el estado del modo foco
    checkFocus.checked = true; 
    const initialLabel = checkFocus.previousElementSibling;
    initialLabel.textContent = 'Modo Focus por Tiempo (Activado):';
    
    // Inicializar el valor del slider (2.0 segundos)
    speedValueSpan.textContent = (rangeSpeed.value / 1000).toFixed(1) + ' s'; 
    
    // Iniciar el timer principal
    startFocusTimer(); 
    
    // Poner el foco en el área de texto
    output.focus(); 

}); // Fin del DOMContentLoaded