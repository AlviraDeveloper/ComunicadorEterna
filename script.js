document.addEventListener('DOMContentLoaded', () => {

    // 1. RECOGIDA DE REFERENCIAS CRÍTICAS
    // VISTA 1: Teclado principal
    const outputPrincipal = document.getElementById('output');
    const botonTTSPrincipal = document.getElementById('boton-tts');
    const botonLimpiarPrincipal = document.getElementById('boton-limpiar');
    const tecladoDiv = document.getElementById('teclado');

    // Elementos de navegación
    const menuBotones = document.querySelectorAll('.menu-boton');
    const vistas = document.querySelectorAll('.vista');

    // Variable para saber qué área de texto está activa
    let outputActivo = outputPrincipal;

    // --- 1. CONFIGURACIÓN INICIAL DEL TECLADO ---
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
                
                if (tecla === 'ESPACIO' || tecla === 'BORRAR' || tecla === 'PITIDO') {
                    boton.classList.add('tecla-especial');
                }
                
                if (tecla === 'PITIDO') {
                    boton.style.flex = '0.1';
                } else if (tecla === 'ESPACIO') {
                    boton.style.flex = '6';
                } else if (tecla === 'BORRAR') {
                    boton.style.flex = '1.5';
                }
                
                boton.addEventListener('click', () => manejarEntrada(tecla));
                rowDiv.appendChild(boton);
            });
            tecladoDiv.appendChild(rowDiv);
        });
    }

    // --- 2. LÓGICA DE ESCRITURA ---
    function manejarEntrada(tecla) {
        // CRÍTICO: Solo se debe escribir si la vista activa es la del teclado.
        if (outputActivo !== outputPrincipal) return;

        outputActivo.focus(); 
        
        if (tecla === 'ESPACIO') {
            outputActivo.value += ' ';
        } else if (tecla === 'BORRAR') {
            outputActivo.value = outputActivo.value.slice(0, -1);
        } else if (tecla === 'PITIDO') {
            tocarAlarma();
        } else {
            outputActivo.value += tecla;
        }
    }

    // --- LÓGICA DE ALARMA (código abreviado por espacio) ---
    let alarmaIntervalo;
    function tocarAlarma() {
        const duracionTotal = 5000;
        const intervaloTono = 500;
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let tiempoPasado = 0;
        const emitirPitido = () => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.15);
            tiempoPasado += intervaloTono;
        };
        clearInterval(alarmaIntervalo);
        emitirPitido();
        alarmaIntervalo = setInterval(() => {
            if (tiempoPasado < duracionTotal) {
                emitirPitido();
            } else {
                clearInterval(alarmaIntervalo);
            }
        }, intervaloTono);
    }

    // --- 3. LÓGICA DE FUNCIONES SUPERIORES (TTS & Limpiar) ---
    
    function limpiarTexto() {
        outputActivo.value = '';
        outputActivo.focus();
    }
    
    function hablarTexto(textoDirecto) {
        const texto = textoDirecto || outputActivo.value;
        if (texto.trim() === '') return;
        const utterance = new SpeechSynthesisUtterance(texto);
        speechSynthesis.speak(utterance);
    }
    
    // Asignar listeners a los botones principales
    botonLimpiarPrincipal.addEventListener('click', limpiarTexto);
    botonTTSPrincipal.addEventListener('click', () => hablarTexto());


    // --- 4. LÓGICA DE VISTAS Y NAVEGACIÓN ---

    function cambiarVista(vistaId) {
        vistas.forEach(vista => {
            vista.classList.add('oculto');
        });
        
        const vistaActiva = document.getElementById(vistaId);
        if (vistaActiva) {
            vistaActiva.classList.remove('oculto');
            // CRÍTICO: Forzamos el outputActivo
            if (vistaId === 'vista-teclado') {
                outputActivo = outputPrincipal;
            } else {
                // Si cambiamos a cualquier submenú (SOS, QUIERO, etc.),
                // el output activo se considera el principal para que 
                // las frases rápidas puedan usar TTS si se desea, aunque
                // para SOS no se use el input. Si cambiamos a otra vista
                // que necesite input (como QUIERO), lo estableceremos más tarde.
                outputActivo = outputPrincipal;
            }
        }
        outputActivo.focus();
    }

    // Manejador de clic para los botones de menú de la izquierda
    menuBotones.forEach(boton => {
        boton.addEventListener('click', () => {
            const vistaBase = boton.getAttribute('data-vista');
            const vistaId = `vista-${vistaBase}`;
            cambiarVista(vistaId);
        });
    });

    // Lógica para que los nuevos botones de submenú HABLE y regrese
    const subBotones = document.querySelectorAll('.sub-boton');

    subBotones.forEach(boton => {
        boton.addEventListener('click', () => {
            const frase = boton.getAttribute('data-frase');
            
            // 1. Opcional: Escribir la frase en el input principal para que quede registro
            outputPrincipal.value = frase; 
            
            // 2. Hablar la frase al instante
            if ('speechSynthesis' in window) {
                hablarTexto(frase); 
            }

            // 3. Regresar a la vista principal (Teclado) después de 1.5 segundos
            setTimeout(() => {
                cambiarVista('vista-teclado'); 
                
                // CRÍTICO: Esperamos un poco más para asegurar que la vista esté estable, y limpiamos el output
                setTimeout(() => {
                    outputPrincipal.value = ''; // Limpia el texto del teclado principal
                    outputPrincipal.focus();   // Pone el cursor listo para escribir
                }, 50); // 0.05 segundos después de que la vista del teclado haya vuelto

            }, 1500);
        });
    });

    // --- INICIO ---
    if (!('speechSynthesis' in window)) {
        botonTTSPrincipal.textContent = 'TTS NO SOPORTADO';
        botonTTSPrincipal.disabled = true;
    }

    generarTeclado();
    cambiarVista('vista-teclado'); // Asegura que se inicia en el teclado
});