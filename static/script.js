// =====================================================
// ESTADO GLOBAL
// =====================================================

let productos = [];
let carrito = leerCarrito();


// =====================================================
// UTILIDADES
// =====================================================

function leerCarrito() {
    try {
        const datos = JSON.parse(
            localStorage.getItem("carrito_vvh")
        );

        return Array.isArray(datos)
            ? datos
            : [];

    } catch (error) {
        console.error(
            "No se pudo leer el carrito:",
            error
        );

        return [];
    }
}


function guardarCarrito() {
    localStorage.setItem(
        "carrito_vvh",
        JSON.stringify(carrito)
    );

    actualizarContador();
}


function dinero(valor) {
    return Number(valor).toLocaleString(
        "es-MX",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function rutaImagen(url) {
    if (!url) {
        return "/static/img/logo_vvh.jpg";
    }

    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("/")
    ) {
        return url;
    }

    return `/static/img/${url}`;
}


function crearEstado(texto) {
    const mensaje =
        document.createElement("p");

    mensaje.className =
        "estado-vacio";

    mensaje.textContent =
        texto;

    return mensaje;
}


function mostrarMensajePedido(texto) {
    const mensaje =
        document.getElementById(
            "mensajePedido"
        );

    if (!mensaje) {
        return;
    }

    mensaje.textContent =
        texto;
}


// =====================================================
// CARGAR PRODUCTOS
// =====================================================

async function cargarProductos() {
    const catalogo =
        document.getElementById(
            "catalogo"
        );

    if (!catalogo) {
        return;
    }

    try {
        const respuesta =
            await fetch(
                "/api/productos",
                {
                    cache: "no-store"
                }
            );

        if (!respuesta.ok) {
            throw new Error(
                `Error HTTP ${respuesta.status}`
            );
        }

        productos =
            await respuesta.json();

        sincronizarCarrito();
        cargarCategorias();
        aplicarFiltros();

    } catch (error) {
        console.error(
            "Error al cargar productos:",
            error
        );

        catalogo.replaceChildren(
            crearEstado(
                "No se pudieron cargar los productos."
            )
        );
    }
}


// =====================================================
// SINCRONIZAR CARRITO
// =====================================================

function sincronizarCarrito() {
    carrito = carrito
        .map(item => {

            const productoActual =
                productos.find(
                    producto =>
                        producto.id === item.id
                );

            if (!productoActual) {
                return null;
            }

            const stock =
                Number(
                    productoActual.stock_disponible
                );

            const cantidad =
                Math.min(
                    Number(item.cantidad) || 1,
                    Math.max(
                        Math.floor(stock),
                        0
                    )
                );

            if (
                cantidad <= 0 ||
                !productoActual.disponible
            ) {
                return null;
            }

            return {
                ...productoActual,
                cantidad: cantidad
            };
        })
        .filter(Boolean);

    guardarCarrito();
}


// =====================================================
// MOSTRAR PRODUCTOS
// =====================================================

function renderizarProductos(lista) {
    const catalogo =
        document.getElementById(
            "catalogo"
        );

    if (!catalogo) {
        return;
    }

    catalogo.replaceChildren();

    if (!lista.length) {
        catalogo.append(
            crearEstado(
                "No hay productos disponibles."
            )
        );

        return;
    }

    lista.forEach(producto => {
        catalogo.append(
            crearTarjetaProducto(
                producto
            )
        );
    });
}


function crearTarjetaProducto(producto) {
    const tarjeta =
        document.createElement(
            "article"
        );

    tarjeta.className =
        "producto-card";


    // Imagen

    const imagen =
        document.createElement(
            "img"
        );

    imagen.className =
        "producto-img";

    imagen.src =
        rutaImagen(
            producto.imagen_url
        );

    imagen.alt =
        producto.nombre;

    imagen.loading =
        "lazy";

    imagen.addEventListener(
        "error",
        () => {
            imagen.src =
                "/static/img/logo_vvh.jpg";
        },
        {
            once: true
        }
    );


    // Contenido

    const contenido =
        document.createElement(
            "div"
        );

    contenido.className =
        "producto-body";


    const categoria =
        document.createElement(
            "span"
        );

    categoria.className =
        "producto-categoria";

    categoria.textContent =
        producto.categoria ||
        "Sin categoría";


    const nombre =
        document.createElement(
            "h3"
        );

    nombre.className =
        "producto-nombre";

    nombre.textContent =
        producto.nombre;


    const descripcion =
        document.createElement(
            "p"
        );

    descripcion.className =
        "producto-descripcion";

    descripcion.textContent =
        producto.descripcion || "";


    // Stock

    const stock =
        document.createElement(
            "p"
        );

    stock.className =
        "producto-stock";

    const cantidadDisponible =
        Number(
            producto.stock_disponible
        );

    const agotado =
        !producto.disponible ||
        cantidadDisponible <= 0;

    const stockBajo =
        !agotado &&
        cantidadDisponible <= 5;

    if (agotado) {
        stock.textContent =
            "❌ Agotado";

        stock.classList.add(
            "agotado"
        );

    } else {
        stock.textContent =
            `✅ Stock: ${producto.stock_disponible} ${producto.unidad_medida}`;

        if (stockBajo) {
            stock.classList.add(
                "stock-bajo"
            );
        }
    }


    // Pie de tarjeta

    const footer =
        document.createElement(
            "div"
        );

    footer.className =
        "producto-footer";


    const precio =
        document.createElement(
            "span"
        );

    precio.className =
        "producto-precio";

    precio.textContent =
        `$${dinero(producto.precio)} MXN`;


    const boton =
        document.createElement(
            "button"
        );

    boton.className =
        "btn-producto";

    boton.type =
        "button";

    boton.disabled =
        agotado;

    boton.textContent =
        agotado
            ? "Agotado"
            : "Agregar";

    boton.addEventListener(
        "click",
        () => {
            agregarAlCarrito(
                producto.id
            );
        }
    );


    footer.append(
        precio,
        boton
    );

    contenido.append(
        categoria,
        nombre,
        descripcion,
        stock,
        footer
    );

    tarjeta.append(
        imagen,
        contenido
    );

    return tarjeta;
}


// =====================================================
// CATEGORIAS
// =====================================================

function cargarCategorias() {
    const select =
        document.getElementById(
            "selectCategoria"
        );

    if (!select) {
        return;
    }

    const categoriaSeleccionada =
        select.value;

    select.replaceChildren(
        new Option(
            "Todas las categorías",
            ""
        )
    );

    const categorias = [
        ...new Set(
            productos
                .map(
                    producto =>
                        producto.categoria
                )
                .filter(Boolean)
        )
    ];

    categorias
        .sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "es"
                )
        )
        .forEach(categoria => {

            select.add(
                new Option(
                    categoria,
                    categoria
                )
            );

        });

    if (
        categorias.includes(
            categoriaSeleccionada
        )
    ) {
        select.value =
            categoriaSeleccionada;
    }
}


// =====================================================
// FILTROS
// =====================================================

function aplicarFiltros() {
    const buscador =
        document.getElementById(
            "inputBuscar"
        );

    const selector =
        document.getElementById(
            "selectCategoria"
        );

    if (
        !buscador ||
        !selector
    ) {
        return;
    }

    const texto =
        buscador
            .value
            .trim()
            .toLowerCase();

    const categoria =
        selector.value;

    const filtrados =
        productos.filter(
            producto => {

                const coincideCategoria =
                    !categoria ||
                    producto.categoria === categoria;

                const textoProducto =
                    `${producto.nombre} ${producto.descripcion || ""}`
                        .toLowerCase();

                const coincideTexto =
                    !texto ||
                    textoProducto.includes(
                        texto
                    );

                return (
                    coincideCategoria &&
                    coincideTexto
                );
            }
        );

    renderizarProductos(
        filtrados
    );
}


// =====================================================
// CARRITO
// =====================================================

function agregarAlCarrito(id) {
    const producto =
        productos.find(
            item => item.id === id
        );

    if (
        !producto ||
        !producto.disponible ||
        Number(
            producto.stock_disponible
        ) <= 0
    ) {
        mostrarMensajePedido(
            "Este producto no está disponible."
        );

        return;
    }

    const productoCarrito =
        carrito.find(
            item => item.id === id
        );

    const cantidadActual =
        productoCarrito
            ? Number(productoCarrito.cantidad)
            : 0;

    const stockDisponible =
        Number(
            producto.stock_disponible
        );

    if (
        cantidadActual >=
        Math.floor(stockDisponible)
    ) {
        mostrarMensajePedido(
            "No hay más stock disponible."
        );

        return;
    }

    if (productoCarrito) {
        productoCarrito.cantidad += 1;

    } else {
        carrito.push({
            ...producto,
            cantidad: 1
        });
    }

    guardarCarrito();
}


function eliminarDelCarrito(id) {
    carrito =
        carrito.filter(
            item => item.id !== id
        );

    guardarCarrito();
    renderizarCarrito();
}


function actualizarContador() {
    const contador =
        document.getElementById(
            "cantCarrito"
        );

    if (!contador) {
        return;
    }

    contador.textContent =
        carrito.reduce(
            (total, item) =>
                total +
                Number(
                    item.cantidad
                ),
            0
        );
}


// =====================================================
// MODAL DEL CARRITO
// =====================================================

function abrirModalCarrito() {
    const modal =
        document.getElementById(
            "modalCarrito"
        );

    if (!modal) {
        return;
    }

    renderizarCarrito();
    mostrarMensajePedido("");

    modal.classList.add(
        "is-open"
    );
}


function cerrarModalCarrito() {
    const modal =
        document.getElementById(
            "modalCarrito"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "is-open"
    );

    mostrarMensajePedido("");
}


// =====================================================
// RENDERIZAR CARRITO
// =====================================================

function renderizarCarrito() {
    const lista =
        document.getElementById(
            "listaCarrito"
        );

    const totalElemento =
        document.getElementById(
            "totalPrecio"
        );

    if (
        !lista ||
        !totalElemento
    ) {
        return;
    }

    lista.replaceChildren();

    let total = 0;

    if (!carrito.length) {
        lista.append(
            crearEstado(
                "El carrito está vacío."
            )
        );

        totalElemento.textContent =
            dinero(0);

        return;
    }

    carrito.forEach(item => {

        const subtotal =
            Number(item.precio) *
            Number(item.cantidad);

        total += subtotal;


        const fila =
            document.createElement(
                "div"
            );

        fila.className =
            "item-carrito";


        const informacion =
            document.createElement(
                "div"
            );

        informacion.className =
            "item-info";


        const nombre =
            document.createElement(
                "strong"
            );

        nombre.textContent =
            item.nombre;


        const detalle =
            document.createElement(
                "small"
            );

        detalle.textContent =
            `$${dinero(item.precio)} × ${item.cantidad}`;


        informacion.append(
            nombre,
            document.createElement(
                "br"
            ),
            detalle
        );


        const acciones =
            document.createElement(
                "div"
            );

        acciones.className =
            "item-acciones";


        const precio =
            document.createElement(
                "span"
            );

        precio.className =
            "item-subtotal";

        precio.textContent =
            `$${dinero(subtotal)}`;


        const quitar =
            document.createElement(
                "button"
            );

        quitar.className =
            "btn-quitar";

        quitar.type =
            "button";

        quitar.textContent =
            "✕";

        quitar.setAttribute(
            "aria-label",
            `Quitar ${item.nombre}`
        );

        quitar.addEventListener(
            "click",
            () => {
                eliminarDelCarrito(
                    item.id
                );
            }
        );


        acciones.append(
            precio,
            quitar
        );

        fila.append(
            informacion,
            acciones
        );

        lista.append(
            fila
        );
    });

    totalElemento.textContent =
        dinero(total);
}


// =====================================================
// ENVIAR PEDIDO POR WHATSAPP
// =====================================================

async function enviarPedidoWhatsApp() {
    if (!carrito.length) {
        mostrarMensajePedido(
            "Agrega productos antes de pedir."
        );

        return;
    }


    const nombreElemento =
        document.getElementById(
            "nombreCliente"
        );

    const telefonoElemento =
        document.getElementById(
            "telefonoCliente"
        );

    const direccionElemento =
        document.getElementById(
            "direccionCliente"
        );

    const boton =
        document.getElementById(
            "btnEnviarWhatsapp"
        );


    if (
        !nombreElemento ||
        !telefonoElemento ||
        !direccionElemento ||
        !boton
    ) {
        console.error(
            "Faltan elementos del formulario del pedido."
        );

        return;
    }


    const nombre =
        nombreElemento
            .value
            .trim();

    const telefono =
        telefonoElemento
            .value
            .trim();

    const direccion =
        direccionElemento
            .value
            .trim();


    if (
        nombre.length < 2 ||
        telefono.length < 8 ||
        direccion.length < 5
    ) {
        mostrarMensajePedido(
            "Completa nombre, teléfono y dirección."
        );

        return;
    }


    // Abrir WhatsApp antes del fetch evita
    // que algunos navegadores bloqueen la ventana.

    const ventanaWhatsApp =
        window.open(
            "",
            "_blank"
        );


    if (!ventanaWhatsApp) {
        mostrarMensajePedido(
            "Permite las ventanas emergentes para abrir WhatsApp."
        );

        return;
    }


    ventanaWhatsApp.opener =
        null;


    ventanaWhatsApp.document.write(
        "<p style='font-family:sans-serif;text-align:center;padding:2rem'>Preparando pedido...</p>"
    );


    // El servidor solamente recibe producto y cantidad.
    // El precio y el total se calculan en el backend.

    const pedido = {
        cliente_nombre: nombre,

        telefono: telefono,

        direccion: direccion,

        detalles: carrito.map(
            producto => ({
                producto_id:
                    producto.id,

                cantidad:
                    Number(
                        producto.cantidad
                    )
            })
        )
    };


    boton.disabled =
        true;

    boton.textContent =
        "Registrando pedido...";

    mostrarMensajePedido(
        "Registrando pedido..."
    );


    try {
        const respuesta =
            await fetch(
                "/api/pedidos",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            pedido
                        )
                }
            );


        const data =
            await respuesta
                .json()
                .catch(
                    () => null
                );


        if (!respuesta.ok) {
            let mensajeError =
                "No se pudo registrar el pedido.";

            if (
                data &&
                typeof data.detail === "string"
            ) {
                mensajeError =
                    data.detail;
            }

            throw new Error(
                mensajeError
            );
        }


        const detallesServidor =
            Array.isArray(
                data.detalles
            )
                ? data.detalles
                : [];


        const detalleWhatsApp =
            detallesServidor
                .map(detalle => {

                    const producto =
                        productos.find(
                            item =>
                                item.id ===
                                detalle.producto_id
                        );

                    const nombreProducto =
                        producto
                            ? producto.nombre
                            : `Producto #${detalle.producto_id}`;


                    return (
                        `• ${detalle.cantidad}x ` +
                        `${nombreProducto} ` +
                        `($${dinero(detalle.precio_unitario)} MXN)`
                    );
                })
                .join("\n");


        const textoWhatsApp =
            `¡Hola Carnes VVH! Realicé un nuevo pedido desde la tienda web.\n\n` +
            `📋 *Pedido #${data.id}*\n` +
            `👤 *Cliente:* ${nombre}\n` +
            `📞 *Teléfono:* ${telefono}\n` +
            `📍 *Dirección:* ${direccion}\n\n` +
            `🥩 *Detalle del pedido:*\n${detalleWhatsApp}\n\n` +
            `💰 *Total:* $${dinero(data.total)} MXN`;


        const numeroCarnesVVH =
            "528120070546";


        const urlWhatsApp =
            `https://wa.me/${numeroCarnesVVH}?text=${encodeURIComponent(textoWhatsApp)}`;


        ventanaWhatsApp.location.href =
            urlWhatsApp;


        carrito = [];

        guardarCarrito();
        renderizarCarrito();


        nombreElemento.value =
            "";

        telefonoElemento.value =
            "";

        direccionElemento.value =
            "";


        mostrarMensajePedido(
            `Pedido #${data.id} registrado correctamente.`
        );


        // Recargar los productos porque el backend
        // ya descontó el inventario.

        await cargarProductos();


    } catch (error) {
        console.error(
            "Error al registrar pedido:",
            error
        );


        ventanaWhatsApp.close();


        mostrarMensajePedido(
            error.message ||
            "No se pudo registrar el pedido."
        );


    } finally {
        boton.disabled =
            false;

        boton.textContent =
            "📲 Pedir por WhatsApp";
    }
}


// =====================================================
// INICIALIZACION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        actualizarContador();
        cargarProductos();


        const buscador =
            document.getElementById(
                "inputBuscar"
            );

        const categorias =
            document.getElementById(
                "selectCategoria"
            );

        const botonCarrito =
            document.getElementById(
                "btnVerCarrito"
            );

        const cerrarCarrito =
            document.getElementById(
                "btnCerrarCarrito"
            );

        const enviarWhatsApp =
            document.getElementById(
                "btnEnviarWhatsapp"
            );

        const modalCarrito =
            document.getElementById(
                "modalCarrito"
            );


        buscador?.addEventListener(
            "input",
            aplicarFiltros
        );


        categorias?.addEventListener(
            "change",
            aplicarFiltros
        );


        botonCarrito?.addEventListener(
            "click",
            abrirModalCarrito
        );


        cerrarCarrito?.addEventListener(
            "click",
            cerrarModalCarrito
        );


        enviarWhatsApp?.addEventListener(
            "click",
            enviarPedidoWhatsApp
        );


        modalCarrito?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modalCarrito
                ) {
                    cerrarModalCarrito();
                }
            }
        );


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {
                    cerrarModalCarrito();
                }
            }
        );

    }
);