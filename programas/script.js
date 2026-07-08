// ==========================================
// SCRIPT DE BLINDAJE Y BLOQUEO DE CONSOLA (ANTI-CURIOSOS)
// ==========================================
(function() {
    // 1. Bloquear Clic Derecho (Evita "Inspeccionar")
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // 2. Bloquear Atajos de Teclado del Navegador
    document.addEventListener('keydown', function(e) {
        // Bloquear F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        // Bloquear Ctrl+Shift+I (Inspeccionar)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }
        // Bloquear Ctrl+Shift+J (Consola)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }
        // Bloquear Ctrl+U (Ver Código Fuente)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
    });

    // 3. Contramedida Dinámica: Congelar la Consola si logran abrirla
    // Se ejecuta un bucle infinito que detecta la apertura y congela la pestaña
    function congelarConsola() {
        function reaccionar() {
            setInterval(function() {
                debugger;
            }, 50);
        }
        try {
            // Evaluamos si las herramientas de desarrollo están activas
            var elementoPrueba = new Image();
            Object.defineProperty(elementoPrueba, 'id', {
                get: function() {
                    reaccionar();
                }
            });
            console.log(elementoPrueba);
        } catch (err) {}
    }

    // Ejecutar la contramedida constantemente en segundo plano
    setInterval(congelarConsola, 1000);
})();
// ==========================================
// ==========================================
// 1. CONFIGURACIÓN Y CONEXIÓN CON SUPABASE (BLINDAJE ANTIBLOQUEO CORS)
// ==========================================
const SUPABASE_URL = "https://mpjwdgekznvukmpprlat.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_lnwuBk9887iZy76uvAxeIQ_8StvDZ8K";

// Mini-librería con aislamiento nativo estable para forzar la ruta real de tu negocio mpjwdgekznvukmpprlat
(function(global) {
    function SupabaseClient(urlProyecto, keyProyecto) {
        this.url = urlProyecto;
        this.key = keyProyecto;
        this.from = function(t) {
            var filters = [];
            var ctx = {
                select: function(cols) { return ctx; },
                eq: function(col, val) { filters.push(col + '=eq.' + encodeURIComponent(val)); return ctx; },
                maybeSingle: function() {
                    var query = filters.length ? '?' + filters.join('&') : '';
                    return fetch(urlProyecto + '/rest/v1/' + t + query, { 
                        headers: { 'apikey': keyProyecto, 'Authorization': 'Bearer ' + keyProyecto, 'Accept': 'application/json' } 
                    }).then(function(r) { 
                        return r.json().then(function(d) { 
                            if (!r.ok) return { data: null, error: d }; 
                            var dataObj = (Array.isArray(d) && d.length > 0) ? d : (Array.isArray(d) ? null : d); 
                            return { data: dataObj, error: null }; 
                        }); 
                    });
                }
            };
            return ctx;
        };
    }
    global.supabaseNativo = { createClient: function(u, k) { return new SupabaseClient(u, k); } };
})(window);

// Inicializamos el cliente blindado apuntando al subdominio único de tu negocio
const supabaseClient = window.supabaseNativo.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variable global para almacenar temporalmente las fotos que descargamos de Supabase
let imagenesCargadasDeDB = [];

// ==========================================
// 2. LOGICA INTERACTIVA DE LA VENTANA MODAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const ventanaModal = document.getElementById('modal-ventana');
    const cerrarBtn = document.getElementById('modal-cerrar-btn');
    const nombreModal = document.getElementById('modal-nombre');
    const detalleModal = document.getElementById('modal-detalle');
    const galeriaInterna = document.getElementById('modal-galeria-interna');
    
    const tarjetasProductos = document.querySelectorAll('.tarjeta-producto');

    tarjetasProductos.forEach(tarjeta => {
        tarjeta.addEventListener('click', () => {
            galeriaInterna.innerHTML = '';

            const seccionId = tarjeta.getAttribute('id') || 'Seccion1';
            nombreModal.textContent = tarjeta.getAttribute('data-titulo') || '';
            detalleModal.textContent = tarjeta.getAttribute('data-descripcion') || '';
            
            const contenedorVariantes = tarjeta.querySelector('.variante-oculta');
            
            if (contenedorVariantes) {
                const items = contenedorVariantes.querySelectorAll('.item-variante');
                items.forEach((item, index) => {
                    const clon = item.cloneNode(true);
                    const ordenPuesto = index + 1;
                    const fotoModificada = imagenesCargadasDeDB.find(f => f.seccion_id === seccionId && f.orden === ordenPuesto);
                    
                    if (fotoModificada) {
                        const imgClonada = clon.querySelector('img');
                        if (imgClonada) {
                            imgClonada.src = fotoModificada.ruta_imagen;
                        }
                    }
                    galeriaInterna.appendChild(clon);
                });
            } else {
                const imgPortada = tarjeta.querySelector('img');
                if (imgPortada) {
                    const estructuraSimple = document.createElement('div');
                    estructuraSimple.className = 'item-variante';
                    estructuraSimple.style.gridColumn = '1 / -1';
                    
                    const nuevaImg = document.createElement('img');
                    nuevaImg.src = imgPortada.src;
                    nuevaImg.style.height = '260px';
                    
                    estructuraSimple.appendChild(nuevaImg);
                    galeriaInterna.appendChild(estructuraSimple);
                }
            }
            ventanaModal.className = 'modal-visible';
        });
    });

    if (cerrarBtn) {
        cerrarBtn.addEventListener('click', () => {
            ventanaModal.className = 'modal-oculto';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === ventanaModal) {
            ventanaModal.className = 'modal-oculto';
        }
    });
    
    // Disparamos las descargas dinámicas automáticas en el orden correcto
    actualizarEnlaceDelCatalogo();
    descargarYActualizarFotosEnWeb();
    sincronizarVideoAnuncioWeb();
    
    // CONEXIÓN MAESTRA: Construye la cuadrícula dinámica elástica e ilimitada en tu página principal
    cargarProductosModularesPublico();
});

// ==========================================
// 4. DESCARGA AUTOMÁTICA DEL PDF DEL CATÁLOGO (BLINDAJE DE PESTAÑA NUEVA)
// ==========================================
async function actualizarEnlaceDelCatalogo() {
  try {
    const respuestaCatalogos = await fetch(SUPABASE_URL + '/rest/v1/catalogos?select=ruta_pdf', {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
    });
    const listaCatalogos = await respuestaCatalogos.json();

    if (listaCatalogos && Array.isArray(listaCatalogos) && listaCatalogos.length > 0) {
      const pdfMasNuevo = listaCatalogos[listaCatalogos.length - 1];
      const boton = document.getElementById('btn-catalogo');
      
      if (boton && pdfMasNuevo.ruta_pdf) {
        boton.href = pdfMasNuevo.ruta_pdf; // Inyecta la URL del PDF de Supabase
        
        // REPARACIÓN DE ORO: Forzamos la apertura en pestaña nueva desde JavaScript
        boton.target = "_blank"; 
        
        console.log("¡Enlace del PDF y apertura en pestaña nueva configurados con éxito!");
      }
    }
  } catch (err) {
    console.error("Hubo un problema inesperado con el PDF:", err);
  }
}


// ==========================================
// 5. DESCARGA Y RENDERIZADO DE FOTOS DE LA WEB (CATÁLOGO FIJO - FETCH REST BLINDADO)
// ==========================================
async function descargarYActualizarFotosEnWeb() {
    try {
        // CORRECCIÓN DIRECTA: Consultamos a Supabase mediante fetch REST para saltar bloqueos sintácticos
        const respuestaFetch = await fetch(SUPABASE_URL + '/rest/v1/catalogo_imagenes?select=seccion_id,orden,ruta_imagen', {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
        });
        const registros = await respuestaFetch.json();

        if (registros && Array.isArray(registros)) {
            imagenesCargadasDeDB = registros;

            registros.forEach(item => {
                let bloquePrefijo = "S1"; 
                if (item.seccion_id === "Seccion2") bloquePrefijo = "S2";
                if (item.seccion_id === "Seccion3") bloquePrefijo = "S3";
                if (item.seccion_id === "Seccion4") bloquePrefijo = "S4";
                if (item.seccion_id === "Seccion5") bloquePrefijo = "S5";
                if (item.seccion_id === "Seccion6") bloquePrefijo = "S6";
                if (item.seccion_id === "Seccion7") bloquePrefijo = "S7";
                if (item.seccion_id === "Seccion8") bloquePrefijo = "S8";
                if (item.seccion_id === "Seccion9") bloquePrefijo = "S9";
                if (item.seccion_id === "Seccion10") bloquePrefijo = "S10";
                if (item.seccion_id === "Seccion11") bloquePrefijo = "S11";
                if (item.seccion_id === "Seccion12") bloquePrefijo = "S12";

                const elementoImg = document.getElementById("img-" + bloquePrefijo + "-P" + item.orden);
                if (elementoImg) {
                    // PARÁMETRO DE FRESCURA: Sumamos la marca de tiempo (?t=) para obligar a Edge a triturar la caché vieja
                    elementoImg.src = item.ruta_imagen + "?t=" + Date.now();
                }
            });
            console.log("¡Las maderas fijas tradicionales se actualizaron en la web pública con éxito!");
        }
    } catch (err) {
        console.error("Error cargando fotos en el catálogo público:", err);
    }
}


// ==========================================
// 6. DESCARGA Y SINCRONIZACIÓN DEL VIDEO EN VIVO (CORREGIDO ÍNDICE INDIVIDUAL)
// ==========================================
async function sincronizarVideoAnuncioWeb() {
    const contenedor = document.getElementById('videoContainer');
    const barra = document.getElementById('barraAbrir');
    const elementoVideo = document.getElementById('miVideo');
    const btnCerrar = document.getElementById('btnCerrar');
    const btnAbrir = document.getElementById('btnAbrir');

    if (!contenedor || !elementoVideo) return;

    try {
        const respuestaVideos = await fetch(SUPABASE_URL + '/rest/v1/videos?select=ruta_video,fecha_subida', {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
        });
        const listaVideos = await respuestaVideos.json();

        let videoMasReciente = null;

        if (listaVideos && Array.isArray(listaVideos) && listaVideos.length > 0) {
            // Ordenamos de más nuevo a más viejo cronológicamente en JavaScript puro
            const ordenados = listaVideos.sort(function(a, b) {
                return new Date(b.fecha_subida) - new Date(a.fecha_subida);
            });
            // CORREGIDO EXÁCTAMENTE: Captura el primer elemento individual [0] para inyectar al reproductor
            videoMasReciente = ordenados[0]; 
        }

        if (videoMasReciente && videoMasReciente.ruta_video) {
            elementoVideo.src = videoMasReciente.ruta_video; // Inyecta la URL de Supabase Storage
            contenedor.style.display = 'block'; // Enciende el reproductor flotante en la pantalla
            elementoVideo.play().catch(err => console.log("Auto-play esperando interacción del usuario."));

            if (btnCerrar) {
                btnCerrar.onclick = function() {
                    contenedor.style.display = 'none';
                    if (barra) barra.style.display = 'block';
                    elementoVideo.pause();
                };
            }

            if (btnAbrir) {
                btnAbrir.onclick = function() {
                    contenedor.style.display = 'block';
                    if (barra) barra.style.display = 'none';
                    elementoVideo.play().catch(err => console.error(err));
                };
            }
            console.log("¡El video comercial más reciente se sincronizó con éxito!");
        } else {
            contenedor.style.display = 'none';
            if (barra) barra.style.display = 'none';
            elementoVideo.src = "";
        }
    } catch (err) {
        console.error("Hubo un problema inesperado con el reproductor:", err);
    }
}


// ==========================================
// 7. DESCARGA Y RENDERIZADO DE PRODUCTOS MODULARES EN VIVO (MEDICIÓN SIMÉTRICA REPARADA)
// ==========================================
async function cargarProductosModularesPublico() {
    const contenedor = document.getElementById('contenedorModularesPublico');
    if (!contenedor) return;

    try {
        const respuestaMaster = await fetch(SUPABASE_URL + '/rest/v1/productos_modulares?select=id,titulo,descripcion,ruta_portada', {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
        });
        const productos = await respuestaMaster.json();

        contenedor.innerHTML = '';

        if (productos && Array.isArray(productos) && productos.length > 0) {
            for (const prod of productos) {
                // Traemos sus imágenes de galería asociadas
                const respuestaVariantes = await fetch(SUPABASE_URL + '/rest/v1/productos_modulares_fotos?select=ruta_foto,nombre_variante&producto_id=eq.' + prod.id, {
                    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
                });
                const variantes = await respuestaVariantes.json();

                // Creamos la tarjeta con la clase limpia exacta para que el CSS la mida igual
                const tarjeta = document.createElement('div');
                tarjeta.className = 'tarjeta-producto';
                tarjeta.setAttribute('id', 'Dinamico-' + prod.id);
                tarjeta.setAttribute('data-titulo', prod.titulo);
                tarjeta.setAttribute('data-descripcion', prod.descripcion || '');
                tarjeta.style.cursor = 'pointer';

                // CORRECCIÓN DE MEDIDA: Inyección limpia directa de imagen y título sin divs contenedores que rompan el alto
                let contenidoHTML = `
                    <img src="${prod.ruta_portada}" alt="${prod.titulo}" />
                    <div class="info-tarjeta">
                        <h4>${prod.titulo}</h4>
                    </div>
                    <div class="variante-oculta">
                `;

                // Montamos las fotos secundarias en la galería interna del modal
                if (variantes && variantes.length > 0) {
                    variantes.forEach(v => {
                        contenidoHTML += `
                            <div class="item-variante">
                                <img src="${v.ruta_foto}" alt="${prod.titulo}">
                            </div>
                        `;
                    });
                } else {
                    contenidoHTML += `
                        <div class="item-variante">
                            <img src="${prod.ruta_portada}" alt="${prod.titulo}">
                        </div>
                    `;
                }

                // Cuadro café inferior con especificaciones dentro del modal
                contenidoHTML += `
                        <div class="item-variante" style="grid-column: 1 / -1; background: #eef2f3; padding: 15px; margin-top: 10px;">
                            <span style="font-size: 14px; color: #3e2723; white-space: pre-wrap; font-family: inherit; display: block; text-align: left;">
                                ${prod.descripcion || 'Sin especificaciones añadidas.'}
                            </span>
                        </div>
                    </div> <!-- Fin variante-oculta -->
                `;

                tarjeta.innerHTML = contenidoHTML;

                // Programamos el disparador del clic para tu ventana modal nativa
                tarjeta.addEventListener('click', function() {
                    const ventanaModal = document.getElementById('modal-ventana');
                    const nombreModal = document.getElementById('modal-nombre');
                    const detalleModal = document.getElementById('modal-detalle');
                    const galeriaInterna = document.getElementById('modal-galeria-interna');

                    if (!ventanaModal || !nombreModal || !detalleModal || !galeriaInterna) return;

                    galeriaInterna.innerHTML = '';
                    nombreModal.textContent = this.getAttribute('data-titulo') || '';
                    detalleModal.textContent = ''; 
                    
                    const contenedorVariantes = this.querySelector('.variante-oculta');
                    
                    if (contenedorVariantes) {
                        const items = contenedorVariantes.querySelectorAll('.item-variante');
                        items.forEach(item => {
                            const clon = item.cloneNode(true);
                            galeriaInterna.appendChild(clon);
                        });
                    }
                    
                    ventanaModal.className = 'modal-visible';
                });

                contenedor.appendChild(tarjeta);
            }
            console.log("¡Medición corregida y adaptada al CSS nativo con éxito!");
        }
    } catch (err) {
        console.error("Error al sincronizar catálogo elástico público:", err);
    }
}


// Vinculación explícita global para el entorno nativo de la web
window.cargarProductosModularesPublico = cargarProductosModularesPublico;
// Vinculaciones explícitas en el árbol de ventanas globales
window.sincronizarVideoAnuncioWeb = sincronizarVideoAnuncioWeb;

