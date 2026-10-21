// static/script.js

// Estado global de la aplicación
let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito_vvh")) || [];

// 1. Cargar productos desde la API (SQLite)
async function cargarProductos() {
    try {
        const respuesta = await fetch('/api/productos');
        if (!respuesta.ok) throw new Error("Error al obtener los productos");
        
        productos = await respuesta.json();
        renderizarProductos(productos);
        cargarCategorias();
    } catch (error) {
        console.error("Error al cargar los productos:", error);
    }
}

// 2. Dibujar las tarjetas de productos en el HTML
function renderizarProductos(lista) {
    const contenedor = document.getElementById('contenedor-productos') || 
                       document.querySelector('.grid') || 
                       document.getElementById('catalogo');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (lista.length === 0) {
        contenedor.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No hay productos disponibles.</p>';
        return;
    }

    lista.forEach(prod => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'producto-card';
        tarjeta.style.cssText = 'background: #fff; border-radius: 8px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 15px;';

        // Si la imagen falla en cargar (404), la sustituye dinámicamente por el logo oficial
        tarjeta.innerHTML = `
            <div>
                <img src="${prod.imagen_url || '/static/logo_vvh.jpg'}" 
                     onerror="this.onerror=null; this.src='/static/logo_vvh.jpg';" 
                     alt="${prod.nombre}" 
                     style="width: 100%; height: 180px; object-fit: cover; border-radius: 6px;">
                <span style="font-size: 0.75rem; color: #888; text-transform: uppercase; margin-top: 8px; display: block;">${prod.categoria || 'Cortes'}</span>
                <h3 style="font-size: 1.1rem; margin: 5px 0; color: #333;">${prod.nombre}</h3>
                <p style="font-size: 0.85rem; color: #666; margin-bottom: 10px;">${prod.descripcion || ''}</p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                <strong style="font-size: 1.1rem; color: #8b0000;">$${prod.precio} MXN</strong>
                <button onclick="agregarAlCarrito(${prod.id})" style="background: #8b0000; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    + Agregar
                </button>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

// 3. Llenar el desplegable de categorías de forma dinámica
function cargarCategorias() {
    const selectCat = document.getElementById('filtro-categoria') || document.querySelector('select');
    if (!selectCat) return;

    const categoriasUnicas = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
    
    selectCat.innerHTML = '<option value="">Todas las categorías</option>';
    categoriasUnicas.forEach(cat => {
        selectCat.innerHTML += `<option value="${cat}">${cat}</option>`;
    });

    selectCat.addEventListener('change', (e) => {
        const seleccionada = e.target.value;
        const filtrados = seleccionada ? productos.filter(p => p.categoria === seleccionada) : productos;
        renderizarProductos(filtrados);
    });
}

// 4. Lógica del Carrito
function agregarAlCarrito(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    const existe = carrito.find(item => item.id === id);
    if (existe) {
        existe.cantidad += 1;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }

    actualizarCarrito();
}

// --- REEMPLAZAR DESDE LA LÍNEA 96 EN static/script.js ---

function actualizarCarrito() {
    localStorage.setItem("carrito_vvh", JSON.stringify(carrito));
    
    // 1. Actualizar el span <span id="cantCarrito"> que tienes en tu index.html
    const cantSpan = document.getElementById('cantCarrito');
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    
    if (cantSpan) {
        cantSpan.textContent = totalItems;
    }
}

// 5. Visualización de Lista / Modal del Carrito
function abrirModalCarrito() {
    const modal = document.getElementById('modalCarrito');
    const lista = document.getElementById('listaCarrito');
    const totalSpan = document.getElementById('totalPrecio');

    if (!modal || !lista) return;

    lista.innerHTML = '';
    let total = 0;

    if (carrito.length === 0) {
        lista.innerHTML = '<p style="text-align:center; padding: 15px; color:#666;">El carrito está vacío.</p>';
        if (totalSpan) totalSpan.textContent = '0.00';
    } else {
        carrito.forEach(item => {
            const subtotal = item.precio * item.cantidad;
            total += subtotal;

            lista.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px; border-bottom: 1px solid #eee; margin-bottom: 5px;">
                    <div>
                        <strong style="color:#333;">${item.nombre}</strong><br>
                        <small style="color:#777;">$${item.precio} MXN x ${item.cantidad}</small>
                    </div>
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <strong style="color:#8b0000;">$${subtotal} MXN</strong>
                        <button onclick="eliminarDelCarrito(${item.id})" style="background:#fee2e2; color:#dc2626; border:none; border-radius:4px; padding:3px 8px; cursor:pointer; font-weight:bold;">✕</button>
                    </div>
                </div>
            `;
        });

        if (totalSpan) totalSpan.textContent = total.toFixed(2);
    }

    // Mostrar el modal
    modal.style.display = 'flex';
}

function cerrarModalCarrito() {
    const modal = document.getElementById('modalCarrito');
    if (modal) {
        modal.style.display = 'none';
    }
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(p => p.id !== id);
    actualizarCarrito();
    abrirModalCarrito();
}

// Vinculación de eventos al cargar el documento
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    actualizarCarrito();

    // 1. Evento para el botón verde del Header <button id="btnVerCarrito">
    document.getElementById('btnVerCarrito')?.addEventListener('click', abrirModalCarrito);

    // 2. Evento para cerrar el modal <span id="btnCerrarCarrito">
    document.getElementById('btnCerrarCarrito')?.addEventListener('click', cerrarModalCarrito);

    // 3. Evento para enviar por WhatsApp <button id="btnEnviarWhatsapp">
    document.getElementById('btnEnviarWhatsapp')?.addEventListener('click', enviarPedidoWhatsApp);

    // 4. Cerrar al hacer clic fuera del contenido del modal
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('modalCarrito');
        if (e.target === modal) {
            cerrarModalCarrito();
        }
    });
});

// 6. Función para enviar el pedido (SQLite + WhatsApp)
async function enviarPedidoWhatsApp(event) {
    if (event) event.preventDefault();

    const carritoGuardado = JSON.parse(localStorage.getItem("carrito_vvh")) || [];

    if (carritoGuardado.length === 0) {
        alert("El carrito está vacío. Agrega cortes de carne antes de pedir.");
        return;
    }

    const clienteNombre = document.getElementById("nombreCliente")?.value || "Cliente General";
    const clienteTelefono = document.getElementById("telefonoCliente")?.value || "Sin Teléfono";
    const clienteDireccion = document.getElementById("direccionCliente")?.value || "Entrega en Tienda";

    const totalCalculado = carritoGuardado.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);

    const datosPedido = {
        cliente_nombre: clienteNombre,
        telefono: clienteTelefono,
        direccion: clienteDireccion,
        total: totalCalculado,
        detalles: carritoGuardado.map(p => ({
            producto_id: p.id,
            cantidad: p.cantidad,
            precio_unitario: p.precio
        }))
    };

    try {
        const respuesta = await fetch("/api/pedidos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosPedido)
        });

        if (respuesta.ok) {
            const pedidoCreado = await respuesta.json();
            const numeroCarnesVVH = "528120070546"; // Reemplaza con tu número oficial
            
            let resumenCortes = carritoGuardado.map(p => `• ${p.cantidad}x ${p.nombre} ($${p.precio} MXN)`).join("\n");

            const textoWhatsApp = 
                `¡Hola Carnes VVH! Realicé un nuevo pedido desde la tienda web.\n\n` +
                `📋 *Pedido #${pedidoCreado.id}*\n` +
                `👤 *Cliente:* ${datosPedido.cliente_nombre}\n` +
                `📞 *Teléfono:* ${datosPedido.telefono}\n` +
                `📍 *Dirección:* ${datosPedido.direccion}\n\n` +
                `🥩 *Detalle del Pedido:*\n${resumenCortes}\n\n` +
                `💰 *Total:* $${datosPedido.total} MXN`;

            const urlFinal = `https://wa.me/${numeroCarnesVVH}?text=${encodeURIComponent(textoWhatsApp)}`;

            localStorage.removeItem("carrito_vvh");
            carrito = [];
            actualizarCarrito();

            window.open(urlFinal, "_blank");
            alert(`¡Pedido #${pedidoCreado.id} registrado con éxito en el sistema!`);
        } else {
            alert("No se pudo registrar el pedido en el servidor.");
        }
    } catch (error) {
        console.error("Error al procesar el pedido:", error);
        alert("Ocurrió un error al conectar con el servidor.");
    }
}

// 7. Iniciar automáticamente al cargar la página y vincular botones
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    actualizarCarrito();

    // Vincular clic del botón verde a la apertura de la lista de productos
    const botonVerde = document.getElementById('contador-carrito') || 
                       document.querySelector('button:has(.fa-shopping-cart)') || 
                       document.querySelector('.btn-carrito') ||
                       document.querySelector('header button, nav button');

    if (botonVerde) {
        botonVerde.onclick = abrirModalCarrito;
    }
});


