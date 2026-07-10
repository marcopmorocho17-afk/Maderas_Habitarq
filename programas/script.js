// =========================================================================
// 1. CONFIGURACIÓN Y CONEXIÓN CON SUPABASE (ENTORNO PÚBLICO EMPRESA)
// =========================================================================
const SUPABASE_URL = "https://mpjwdgekznvukmpprlat.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_lnwuBk9887iZy76uvAxeIQ_8StvDZ8K";

// Variable global receptora que alimenta la galería horizontal mixta
let imagenesCargadasDeDB = [];
let listaVideosGlobalEmpresa = [];
let indiceVideoActualTikTok = 0;

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
            
            // A. PRIMER PASO: Renderizado de tus clones locales originales nativos de tu HTML
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

            // B. SEGUNDO PASO: Escaneo automático e inyección de fotos nuevas infinitas del botón ➕
            const fotosExtrasNuevas = imagenesCargadasDeDB.filter(f => f.seccion_id === seccionId && isNaN(f.orden));

            if (fotosExtrasNuevas && fotosExtrasNuevas.length > 0) {
                fotosExtrasNuevas.forEach(item => {
                    const cajaNuevaExtra = document.createElement('div');
                    cajaNuevaExtra.className = 'item-variante';
                    
                    // FORCE TEXTO DIRECTO: Aplicamos color oscuro y visibilidad absoluta rompiendo bloqueos CSS
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
            
            if (ventanaModal) ventanaModal.className = 'modal-visible';
        });
    });

    if (cerrarBtn) {
        cerrarBtn.addEventListener('click', () => { if (ventanaModal) ventanaModal.className = 'modal-oculto'; });
    }

    window.addEventListener('click', (e) => {
        if (e.target === ventanaModal) { if (ventanaModal) ventanaModal.className = 'modal-oculto'; }
    });
    
    // Disparamos las descargas dinámicas en el arranque del cliente
    actualizarEnlaceDelCatalogo();
    descargarYActualizarFotosEnWeb();
    sincronizarVideoAnuncioWeb();
    cargarProductosModularesPublico();
});

// =========================================================================
// 3. DOWNLOAD GENERAL: DESCARGA RECEPTORA DE IMÁGENES Y NOMBRES PLANOS
// =========================================================================
async function descargarYActualizarFotosEnWeb() {
    try {
        const urlFetch = SUPABASE_URL + '/rest/v1/catalogo_imagenes?select=id,seccion_id,orden,ruta_imagen,nombre_sub_variante';
        const respuesta = await fetch(urlFetch, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
        });
        const datos = await respuesta.json();

        if (datos && Array.isArray(datos)) {
            imagenesCargadasDeDB = datos;

            // Renderizado simétrico inicial para tus 12 maderas tradicionales fijas
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
                        
                        const elementoTexto = elementoImg.nextElementSibling;
                        if (elementoTexto && elementoTexto.tagName === "SPAN" && item.nombre_sub_variante) {
                            elementoTexto.textContent = item.nombre_sub_variante;
                        }
                    }
                }
            });
            console.log("¡Lote global de imágenes y nombres planos sincronizados con éxito!");
        }
    } catch (err) { console.error("Error en la descarga de metadatos públicos:", err); }
}

// Variables de control global para la cartelera secuencial estilo TikTok
let listaVideosGlobalEmpresa = [];
let indiceVideoActualTikTok = 0;

// =========================================================================
// 4. MOTOR COMERCIAL TIKTOK: VERSIÓN BRONCE CONTRA CAJAS VACÍAS
// =========================================================================
async function sincronizarVideoAnuncioWeb() {
    const contenedorVideosPublico = document.getElementById('contenedor-video-anuncio') || document.getElementById('seccion-videos-empresa');
    if (!contenedorVideosPublico) return;

    try {
        const urlFetch = SUPABASE_URL + '/rest/v1/videos?select=id,titulo,ruta_video';
        const respuesta = await fetch(urlFetch, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
        });
        const datosBrutos = await respuesta.json();

        // Guardamos los videos recibidos de internet de forma directa
        listaVideosGlobalEmpresa = (datosBrutos && Array.isArray(datosBrutos)) ? datosBrutos : [];

        contenedorVideosPublico.innerHTML = '';

        // ESCUDO DE PROTECCIÓN: Si tu tabla de internet está vacía o limpia, inyectamos un video de respaldo simulado 
        // para que la caja se dibuje inmediatamente en la pantalla de la empresa y no quede en blanco
        if (listaVideosGlobalEmpresa.length === 0) {
            listaVideosGlobalEmpresa = [{
                id: "respaldo",
                titulo: "Catálogo de Maderas Comerciales",
                ruta_video: "https://w3schools.com" // Video de prueba estable de internet
            }];
        }

        indiceVideoActualTikTok = 0; 
        const primerVideo = listaVideosGlobalEmpresa[0]; // Captura limpia e inequívoca del primer objeto

        contenedorVideosPublico.style.cssText = "display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; width: 100% !important; padding: 25px 0 !important; box-sizing: border-box !important; clear: both !important;";

        const cajaTikTok = document.createElement('div');
        cajaTikTok.id = "reproductor-tiktok-container";
        cajaTikTok.style.cssText = "width: 100%; max-width: 450px; background: #000; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3); display: flex; flex-direction: column; position: relative;";

        cajaTikTok.innerHTML = `
            <div style="width: 100%; height: 420px; display: flex; align-items: center; justify-content: center; background: #000;">
                <video id="videoElementoTikTok" src="${primerVideo.ruta_video}" controls autoplay muted style="width: 100%; height: 100%; object-fit: contain;"></video>
            </div>
            <div style="padding: 15px; background: rgba(0, 0, 0, 0.9); text-align: center; width: 100%; box-sizing: border-box;">
                <strong id="tituloVideoTikTok" style="font-size: 15px; color: #fff; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: inherit; font-weight: bold;">
                    ${primerVideo.titulo || 'Video Comercial'}
                </strong>
                <span id="contadorVideoTikTok" style="font-size: 12px; color: #a8a29e; display: block; margin-top: 4px;">
                    Anuncio 1 de ${listaVideosGlobalEmpresa.length}
                </span>
            </div>
        `;
        contenedorVideosPublico.appendChild(cajaTikTok);

        const videoHtml = document.getElementById('videoElementoTikTok');
        if (videoHtml) {
            videoHtml.loop = false;
            videoHtml.removeAttribute('loop');
            videoHtml.onended = reproducirSiguienteVideoTikTok; // Salto en riel continuo
        }

    } catch (err) { 
        console.error("Error en el motor TikTok:", err); 
    }
}

function reproducirSiguienteVideoTikTok() {
    const videoHtml = document.getElementById('videoElementoTikTok');
    const tituloHtml = document.getElementById('tituloVideoTikTok');
    const contadorHtml = document.getElementById('contadorVideoTikTok');

    if (!videoHtml || listaVideosGlobalEmpresa.length === 0) return;

    indiceVideoActualTikTok++;

    if (indiceVideoActualTikTok >= listaVideosGlobalEmpresa.length) {
        indiceVideoActualTikTok = 0;
    }

    const siguienteVideo = listaVideosGlobalEmpresa[indiceVideoActualTikTok];
    videoHtml.style.opacity = "0.3";
    
    setTimeout(() => {
        videoHtml.src = siguienteVideo.ruta_video;
        videoHtml.loop = false;
        videoHtml.removeAttribute('loop');
        
        if (tituloHtml) tituloHtml.textContent = siguienteVideo.titulo || 'Video Comercial';
        if (contadorHtml) contadorHtml.textContent = `Anuncio ${indiceVideoActualTikTok + 1} de ${listaVideosGlobalEmpresa.length}`;
        
        videoHtml.style.opacity = "1";
        videoHtml.play().catch(e => console.log("Interacción requerida."));
    }, 200);
}
// Vinculación al árbol global de carga
window.sincronizarVideoAnuncioWeb = sincronizarVideoAnuncioWeb;
window.reproducirSiguienteVideoTikTok = reproducirSiguienteVideoTikTok;
// =========================================================================
// 5. FUNCIONALIDADES DE RESPALDO (CATÁLOGOS PDF Y PRODUCTOS MODULARES)
// =========================================================================
async function actualizarEnlaceDelCatalogo() {
    try {
        const urlFetch = SUPABASE_URL + '/rest/v1/catalogos?select=ruta_pdf';
        const r = await fetch(urlFetch, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY } });
        const data = await r.json();
        if (data && data.length > 0) {
            data.sort((a, b) => b.id - a.id);
            const btnDescarga = document.getElementById('btn-descargar-pdf');
            if (btnDescarga) btnDescarga.href = data.ruta_pdf;
        }
    } catch (e) { console.error(e); }
}

async function cargarProductosModularesPublico() {
    const con = document.getElementById('contenedor-productos-modulares-publico');
    if (!con) return;
    try {
        const urlFetch = SUPABASE_URL + '/rest/v1/productos_modulares?select=id,titulo,descripcion,ruta_portada';
        const r = await fetch(urlFetch, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY } });
        const data = await r.json();
        con.innerHTML = '';
        if (data && Array.isArray(data)) {
            data.forEach(p => {
                con.innerHTML += `
                    <div class="tarjeta-modular" onclick="abrirModalModularReal('${p.id}', '${p.titulo.replace(/'/g, "\\'")}', '${(p.descripcion || '').replace(/'/g, "\\'")}')" style="cursor:pointer;">
                        <img src="${p.ruta_portada}" alt="${p.titulo}">
                        <h4>${p.titulo}</h4>
                    </div>`;
            });
        }
    } catch (e) { console.error(e); }
}

// Vinculaciones explícitas de red para el árbol window global
window.descargarYActualizarFotosEnWeb = descargarYActualizarFotosEnWeb;
window.sincronizarVideoAnuncioWeb = sincronizarVideoAnuncioWeb;
window.reproducirSiguienteVideoTikTok = reproducirSiguienteVideoTikTok;
window.actualizarEnlaceDelCatalogo = actualizarEnlaceDelCatalogo;
window.cargarCamporProductosModularesPublico = cargarProductosModularesPublico;
