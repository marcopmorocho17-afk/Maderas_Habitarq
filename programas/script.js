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

// =========================================================================
// 2. LOGICA INTERACTIVA DEL MODAL (GALERÍA HORIZONTAL CON TÍTULOS VISIBLES BLINDADOS)
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const ventanaModal = document.getElementById('modal-ventana');
    const cerrarBtn = document.getElementById('modal-cerrar-btn');
    const nombreModal = document.getElementById('modal-nombre');
    const detalleModal = document.getElementById('modal-detalle');
    const galeriaInterna = document.getElementById('modal-galeria-interna');
    
    const tarjetasProductos = document.querySelectorAll('.tarjeta-producto');

    tarjetasProductos.forEach(tarjeta => {
        tarjeta.addEventListener('click', () => {
            if (galeriaInterna) galeriaInterna.innerHTML = '';

            const seccionId = tarjeta.getAttribute('id') || 'Seccion1';
            nombreModal.textContent = tarjeta.getAttribute('data-titulo') || '';
            detalleModal.textContent = tarjeta.getAttribute('data-descripcion') || '';
            
            const contenedorVariantes = tarjeta.querySelector('.variante-oculta');
            
            // 1. PRIMER PASO: Renderizado de tus clones locales originales nativos de tu HTML
            if (contenedorVariantes) {
                const items = contenedorVariantes.querySelectorAll('.item-variante');
                items.forEach((item, index) => {
                    const clon = item.cloneNode(true);
                    const ordenPuesto = index + 1;
                    
                    const fotoModificada = imagenesCargadasDeDB.find(f => f.seccion_id === seccionId && f.orden == ordenPuesto);
                    if (fotoModificada) {
                        const imgClonada = clon.querySelector('img');
                        if (imgClonada) imgClonada.src = fotoModificada.ruta_imagen;
                    }
                    if (galeriaInterna) galeriaInterna.appendChild(clon);
                });
            }

            // 2. SEGUNDO PASO: Escaneo automático e inyección de fotos nuevas infinitas del botón ➕
            const fotosExtrasNuevas = imagenesCargadasDeDB.filter(f => f.seccion_id === seccionId && isNaN(f.orden));

            if (fotosExtrasNuevas && fotosExtrasNuevas.length > 0) {
                fotosExtrasNuevas.forEach(item => {
                    const cajaNuevaExtra = document.createElement('div');
                    cajaNuevaExtra.className = 'item-variante';
                    
                    // FORCE TEXTO DIRECTO: Le aplicamos color oscuro, tamaño visible y bloque para romper cualquier bloqueo de tu style.css
                    cajaNuevaExtra.innerHTML = `
                        <img src="${item.ruta_imagen}?t=${Date.now()}" alt="${item.nombre_sub_variante || 'Extra'}" />
                        ${item.nombre_sub_variante ? `
                            <span style="display: block !important; visibility: visible !important; opacity: 1 !important; font-size: 14px !important; color: #1e293b !important; margin-top: 10px !important; font-weight: bold !important; text-align: center !important; font-family: inherit !important; width: 100% !important; clear: both !important;">
                                ${item.nombre_sub_variante}
                            </span>
                        ` : ''}
                    `;
                    
                    if (galeriaInterna) galeriaInterna.appendChild(cajaNuevaExtra);
                });
            }

            if (!contenedorVariantes && (!fotosExtrasNuevas || fotosExtrasNuevas.length === 0)) {
                const imgPortada = tarjeta.querySelector('img');
                if (imgPortada) {
                    const estructuraSimple = document.createElement('div');
                    estructuraSimple.className = 'item-variante';
                    estructuraSimple.style.gridColumn = '1 / -1';
                    
                    const nuevaImg = document.createElement('img');
                    nuevaImg.src = imgPortada.src;
                    nuevaImg.style.height = '260px';
                    
                    estructuraSimple.appendChild(nuevaImg);
                    if (galeriaInterna) galeriaInterna.appendChild(estructuraSimple);
                }
            }
            
            ventanaModal.className = 'modal-visible';
        });
    });

    if (cerrarBtn) {
        cerrarBtn.addEventListener('click', () => { ventanaModal.className = 'modal-oculto'; });
    }

    window.addEventListener('click', (e) => {
        if (e.target === ventanaModal) { ventanaModal.className = 'modal-oculto'; }
    });
    
    actualizarEnlaceDelCatalogo();
    descargarYActualizarFotosEnWeb();
    sincronizarVideoAnuncioWeb();
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
// =========================================================================
// SIFE-MOTOR: DESCARGA RECEPTORA DE IMÁGENES Y NOMBRES PLANOS DE LA DB
// =========================================================================
async function descargarYActualizarFotosEnWeb() {
    try {
        // Hacemos la consulta REST inyectando la nueva columna de nombres planos
        const urlFetch = SUPABASE_URL + '/rest/v1/catalogo_imagenes?select=id,seccion_id,orden,ruta_imagen,nombre_sub_variante';
        
        const respuesta = await fetch(urlFetch, {
            headers: { 
                'apikey': SUPABASE_ANON_KEY, 
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY 
            }
        });
        const datos = await respuesta.json();

        if (datos && Array.isArray(datos)) {
            // Sincronizamos la variable global para que la Función 2 lea los textos
            imagenesCargadasDeDB = datos;

            // Renderizado simétrico inicial para tus 12 maderas fijas
            datos.forEach(function(item) {
                if (!isNaN(item.orden)) {
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
                        elementoImg.src = item.ruta_imagen + "?t=" + Date.now();
                        
                        // Si cambias el nombre de una foto fija, actualiza su span nativo automáticamente
                        const elementoTexto = elementoImg.nextElementSibling;
                        if (elementoTexto && elementoTexto.tagName === "SPAN" && item.nombre_sub_variante) {
                            elementoTexto.textContent = item.nombre_sub_variante;
                        }
                    }
                }
            });
            console.log("¡Lote global de imágenes y nombres planos sincronizados con éxito!");
        }
    } catch (err) {
        console.error("Error en la descarga de metadatos públicos:", err);
    }
}
// Registro obligatorio en el contexto global window
window.descargarYActualizarFotosEnWeb = descargarYActualizarFotosEnWeb;
// ==========================================
// 6. DESCARGA Y SINCRONIZACIÓN DEL VIDEO EN VIVO (CORREGIDO ÍNDICE INDIVIDUAL)
// ==========================================
// Variables de control global para la cartelera secuencial estilo TikTok
let listaVideosGlobalEmpresa = [];
let indiceVideoActualTikTok = 0;

// =========================================================================
// MOTOR COMERCIAL TIKTOK: REPRODUCCIÓN SECUENCIAL EN BUCLE INFINITO
// =========================================================================
async function sincronizarVideoAnuncioWeb() {
    const contenedorVideosPublico = document.getElementById('contenedor-video-anuncio') || document.getElementById('seccion-videos-empresa');
    if (!contenedorVideosPublico) return;

    try {
        // Descargamos la lista limpia de videos desde la base de datos de internet
        const urlFetch = SUPABASE_URL + '/rest/v1/videos?select=id,titulo,ruta_video';
        const respuesta = await fetch(urlFetch, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
        });
        listaVideosGlobalEmpresa = await respuesta.json();

        // Reseteamos el contenedor visual público
        contenedorVideosPublico.innerHTML = '';

        if (listaVideosGlobalEmpresa && Array.isArray(listaVideosGlobalEmpresa) && listaVideosGlobalEmpresa.length > 0) {
            indiceVideoActualTikTok = 0; // Iniciamos siempre en el video 1

            // Ajustamos el contenedor para centrar el reproductor gigante tipo celular/pantalla comercial
            contenedorVideosPublico.style.cssText = "display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; width: 100% !important; padding: 20px 0 !important; box-sizing: border-box !important;";

            // Fabricamos la estructura del reproductor TikTok
            const cajaTikTok = document.createElement('div');
            cajaTikTok.id = "reproductor-tiktok-container";
            cajaTikTok.style.cssText = "width: 100%; max-width: 450px; background: #000; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3); display: flex; flex-direction: column; position: relative; transition: all 0.3s ease;";

            // Inyectamos el nodo de video con autoplay controlado, silenciado por defecto para que Edge permita el arranque nativo
            cajaTikTok.innerHTML = `
                <div style="width: 100%; height: 500px; display: flex; align-items: center; justify-content: center; background: #000;">
                    <video id="videoElementoTikTok" src="${listaVideosGlobalEmpresa[0].ruta_video}" controls autoplay muted style="width: 100%; height: 100%; object-fit: contain;"></video>
                </div>
                <div style="padding: 15px; background: rgba(0, 0, 0, 0.85); text-align: center; width: 100%; box-sizing: border-box;">
                    <strong id="tituloVideoTikTok" style="font-size: 15px; color: #fff; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: inherit; font-weight: bold;">
                        ${listaVideosGlobalEmpresa[0].titulo || 'Video Comercial'}
                    </strong>
                    <span id="contadorVideoTikTok" style="font-size: 12px; color: #a8a29e; display: block; margin-top: 4px;">
                        Anuncio 1 de ${listaVideosGlobalEmpresa.length}
                    </span>
                </div>
            `;

            contenedorVideosPublico.appendChild(cajaTikTok);

            // AMARRE DEL DETECTOR DE FINALIZACIÓN (EVENTO ENDED)
            const videoHtml = document.getElementById('videoElementoTikTok');
            if (videoHtml) {
                videoHtml.addEventListener('ended', reproducirSiguienteVideoTikTok);
            }

        } else {
            contenedorVideosPublico.innerHTML = `<div style="color: #94a3b8; font-size: 14px; font-style: italic; text-align: center; padding: 30px 0; border: 2px dashed #cbd5e1; border-radius: 8px; width: 100%;">⚪ Próximamente nuevos videos comerciales.</div>`;
        }
    } catch (err) {
        console.error("Error en el motor de reproducción TikTok:", err);
    }
}

// FUNCIÓN AUTOMÁTICA DE TRÁNSITO SECUENCIAL
function reproducirSiguienteVideoTikTok() {
    const videoHtml = document.getElementById('videoElementoTikTok');
    const tituloHtml = document.getElementById('tituloVideoTikTok');
    const contadorHtml = document.getElementById('contadorVideoTikTok');

    if (!videoHtml || listaVideosGlobalEmpresa.length === 0) return;

    // Avanzamos al siguiente índice de la lista de internet
    indiceVideoActualTikTok++;

    // REGLA DE RETORNO AL VIDEO 1: Si el índice supera la cantidad de videos, vuelve a cero
    if (indiceVideoActualTikTok >= listaVideosGlobalEmpresa.length) {
        indiceVideoActualTikTok = 0;
    }

    const siguienteVideo = listaVideosGlobalEmpresa[indiceVideoActualTikTok];

    // Transición visual suave cambiando las propiedades en caliente
    videoHtml.style.opacity = "0.3";
    
    setTimeout(() => {
        videoHtml.src = siguienteVideo.ruta_video;
        if (tituloHtml) tituloHtml.textContent = siguienteVideo.titulo || 'Video Comercial';
        if (contadorHtml) contadorHtml.textContent = `Anuncio ${indiceVideoActualTikTok + 1} de ${listaVideosGlobalEmpresa.length}`;
        
        videoHtml.style.opacity = "1";
        videoHtml.play().catch(e => console.log("Permiso de autoplay requerido por interacción del usuario."));
    }, 200);
}
// Vinculación al árbol global de carga
window.sincronizarVideoAnuncioWeb = sincronizarVideoAnuncioWeb;
window.reproducirSiguienteVideoTikTok = reproducirSiguienteVideoTikTok;
// =========================================================================
// 7. DESCARGA Y RENDERIZADO DE PRODUCTOS MODULARES EN VIVO (SIMETRÍA NATIVA FIJA)
// =========================================================================
async function cargarProductosModularesPublico() {
    const contenedor = document.getElementById('contenedorModularesPublico');
    if (!contenedor) return;

    try {
        // A. Descargamos las maderas ilimitadas desde la API REST directa de internet
        const respuestaMaster = await fetch(SUPABASE_URL + '/rest/v1/productos_modulares?select=id,titulo,descripcion,ruta_portada', {
            headers: { 
                'apikey': SUPABASE_ANON_KEY, 
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY 
            }
        });
        const productos = await respuestaMaster.json();

        // Limpiamos el contenedor elástico receptor antes de pintar para evitar duplicados
        contenedor.innerHTML = '';

        if (productos && Array.isArray(productos) && productos.length > 0) {
            for (const prod of productos) {
                // B. Traemos las variantes secundarias asociadas a este ID de madera específico
                const respuestaVariantes = await fetch(SUPABASE_URL + '/rest/v1/productos_modulares_fotos?select=ruta_foto,nombre_variante&producto_id=eq.' + prod.id, {
                    headers: { 
                        'apikey': SUPABASE_ANON_KEY, 
                        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY 
                    }
                });
                const variantes = await respuestaVariantes.json();

                // C. ESTRUCTURA COMPATIBLE COMPLETA: Clona exactamente los mismos atributos de tu Canelo
                const tarjeta = document.createElement('div');
                tarjeta.className = 'tarjeta-producto'; // Obligatorio: misma clase exacta para usar tu CSS natal
                tarjeta.setAttribute('id', 'Dinamico-' + prod.id);
                tarjeta.setAttribute('data-titulo', prod.titulo);
                tarjeta.setAttribute('data-descripcion', prod.descripcion || '');
                tarjeta.style.cursor = 'pointer';

                // Inyección idéntica a tu maquetación visual: img, info-tarjeta, h4 y variante-oculta
                let contenidoHTML = `
                    <img src="${prod.ruta_portada}?t=${Date.now()}" alt="${prod.titulo}" />
                    <div class="info-tarjeta">
                        <h4>${prod.titulo}</h4>
                    </div>
                    <div class="variante-oculta">
                `;

                // Montamos los items de variantes para la galería interna del modal
                if (variantes && variantes.length > 0) {
                    variantes.forEach(v => {
                        contenidoHTML += `
                            <div class="item-variante">
                                <img src="${v.ruta_foto}" alt="${prod.titulo}">
                            </div>
                        `;
                    });
                } else {
                    // Respaldo de seguridad si el administrador no guardó variantes internas
                    contenidoHTML += `
                        <div class="item-variante">
                            <img src="${prod.ruta_portada}" alt="${prod.titulo}">
                        </div>
                    `;
                }

                // Inyectamos tu mismo cuadro café inferior con especificaciones y medidas respetando tu diseño nativo
                contenidoHTML += `
                        <div class="item-variante" style="grid-column: 1 / -1; background: #eef2f3; padding: 15px; margin-top: 10px;">
                            <span style="font-size: 14px; color: #3e2723; white-space: pre-wrap; font-family: inherit; display: block; text-align: left;">
                                ${prod.descripcion || 'Sin especificaciones añadidas todavía.'}
                            </span>
                        </div>
                    </div> <!-- Fin variante-oculta -->
                `;

                tarjeta.innerHTML = contenidoHTML;

                // D. Programamos el disparador del clic para abrir el modal nativo idéntico de la empresa
                tarjeta.addEventListener('click', function() {
                    const ventanaModal = document.getElementById('modal-ventana');
                    const nombreModal = document.getElementById('modal-nombre');
                    const detalleModal = document.getElementById('modal-detalle'); 
                    const galeriaInterna = document.getElementById('modal-galeria-interna');

                    if (!ventanaModal || !nombreModal || !detalleModal || !galeriaInterna) return;

                    galeriaInterna.innerHTML = '';
                    nombreModal.textContent = this.getAttribute('data-titulo') || ''; 
                    detalleModal.textContent = ''; // Limpio para que no se duplique con el span nativo del clon
                    
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
            console.log("¡Medición simétrica horizontal acoplada en la misma fila con éxito!");
        }
    } catch (err) {
        console.error("Error al sincronizar catálogo elástico público:", err);
    }
}

// Registro explícito global obligatorio
window.cargarProductosModularesPublico = cargarProductosModularesPublico;
// Vinculaciones explícitas en el árbol de ventanas globales
window.sincronizarVideoAnuncioWeb = sincronizarVideoAnuncioWeb;




