// =====================================================
// ESTADO
// =====================================================

let productosAdmin = [];
let pedidosAdmin = [];
let productoEditandoId = null;
let productoPendienteEliminar = null;

// =====================================================
// UTILIDADES
// =====================================================

function rutaImagen(url) {
    if (!url) return "/static/img/logo3.jpg";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) return url;
    return `/static/img/${url}`;
}

function dinero(valor) {
    return Number(valor).toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function mostrarMensaje(texto, tipo = "success") {
    const elemento = document.getElementById("adminMessage");
    elemento.textContent = texto;
    elemento.className = texto ? `admin-message ${tipo}` : "admin-message";
}

function gestionarSesion(response) {
    if (response.status === 401 || response.status === 403) {
        window.location.replace("/login");
        return false;
    }
    return true;
}

async function solicitar(url, opciones = {}) {
    const response = await fetch(url, {
        credentials: "same-origin",
        ...opciones
    });

    if (!gestionarSesion(response)) throw new Error("La sesión ha finalizado.");

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        const detalle = data?.detail ? JSON.stringify(data.detail) : `Error HTTP ${response.status}`;
        throw new Error(detalle);
    }
    return data;
}

// =====================================================
// INVENTARIO
// =====================================================

async function cargarProductosAdmin() {
    try {
        productosAdmin = await solicitar("/api/productos");
        renderizarTabla();
    } catch (error) {
        console.error("Error al cargar productos:", error);
        mostrarMensaje("No se pudieron cargar los productos.", "error");
    }
}

function renderizarTabla() {
    const tbody = document.getElementById("tablaProductos");
    const contador = document.getElementById("contadorProductos");
    tbody.replaceChildren();
    contador.textContent = `${productosAdmin.length} ${productosAdmin.length === 1 ? "producto" : "productos"}`;

    if (!productosAdmin.length) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 9;
        celda.className = "tabla-vacia";
        celda.textContent = "No hay productos registrados.";
        fila.append(celda);
        tbody.append(fila);
        return;
    }

    productosAdmin.forEach(producto => tbody.append(crearFilaProducto(producto)));
}

function crearFilaProducto(producto) {
    const fila = document.createElement("tr");
    agregarCeldaTexto(fila, producto.id);
    agregarCeldaImagen(fila, producto);
    agregarCeldaTexto(fila, producto.nombre);
    agregarCeldaTexto(fila, `$${dinero(producto.precio)}`);
    agregarCeldaTexto(fila, producto.unidad_medida);
    agregarCeldaTexto(fila, producto.stock_disponible);
    agregarCeldaTexto(fila, producto.categoria);
    agregarCeldaTexto(fila, producto.disponible ? "✅" : "❌");

    const celda = document.createElement("td");
    const acciones = document.createElement("div");
    acciones.className = "action-buttons";

    const editar = document.createElement("button");
    editar.type = "button";
    editar.className = "btn-editar";
    editar.textContent = "Editar";
    editar.addEventListener("click", () => activarModoEdicion(producto));

    const eliminar = document.createElement("button");
    eliminar.type = "button";
    eliminar.className = "btn-eliminar";
    eliminar.textContent = "Eliminar";
    eliminar.addEventListener("click", () => abrirConfirmacion(producto));

    acciones.append(editar, eliminar);
    celda.append(acciones);
    fila.append(celda);
    return fila;
}

function agregarCeldaTexto(fila, valor) {
    const celda = document.createElement("td");
    celda.textContent = valor ?? "";
    fila.append(celda);
}

function agregarCeldaImagen(fila, producto) {
    const celda = document.createElement("td");
    const imagen = document.createElement("img");
    imagen.className = "admin-table-img";
    imagen.src = rutaImagen(producto.imagen_url);
    imagen.alt = producto.nombre;
    imagen.addEventListener("error", () => {
        imagen.src = "/static/img/logo_vvh.jpg";
    }, { once: true });
    celda.append(imagen);
    fila.append(celda);
}

// =====================================================
// FORMULARIO ÚNICO
// =====================================================

function leerFormulario() {
    return {
        nombre: document.getElementById("nombre").value.trim(),
        descripcion: document.getElementById("descripcion").value.trim() || null,
        precio: Number(document.getElementById("precio").value),
        unidad_medida: document.getElementById("unidad_medida").value.trim(),
        stock_disponible: Number(document.getElementById("stock").value),
        categoria: document.getElementById("categoria").value.trim(),
        imagen_url: document.getElementById("imagen_url").value.trim() || null,
        disponible: document.getElementById("disponible").checked
    };
}

function rellenarFormulario(producto) {
    document.getElementById("nombre").value = producto.nombre ?? "";
    document.getElementById("descripcion").value = producto.descripcion ?? "";
    document.getElementById("precio").value = producto.precio ?? "";
    document.getElementById("unidad_medida").value = producto.unidad_medida ?? "";
    document.getElementById("stock").value = producto.stock_disponible ?? 0;
    document.getElementById("categoria").value = producto.categoria ?? "";
    document.getElementById("imagen_url").value = producto.imagen_url ?? "";
    document.getElementById("disponible").checked = Boolean(producto.disponible);
}

function activarModoCreacion(limpiarMensaje = true) {
    productoEditandoId = null;
    document.getElementById("formProducto").reset();
    document.getElementById("productoId").value = "";
    document.getElementById("disponible").checked = true;
    document.getElementById("formMode").textContent = "Modo creación";
    document.getElementById("formTitle").textContent = "Nuevo producto";
    document.getElementById("btnGuardarProducto").textContent = "Guardar producto";
    document.getElementById("btnGuardarProducto").className = "btn-agregar";
    document.getElementById("btnCancelarEdicion").hidden = true;
    if (limpiarMensaje) mostrarMensaje("");
}

function activarModoEdicion(producto) {
    productoEditandoId = producto.id;
    document.getElementById("productoId").value = producto.id;
    rellenarFormulario(producto);
    document.getElementById("formMode").textContent = "Modo edición";
    document.getElementById("formTitle").textContent = `Editando producto #${producto.id}`;
    document.getElementById("btnGuardarProducto").textContent = "Guardar cambios";
    document.getElementById("btnGuardarProducto").className = "btn-actualizar";
    document.getElementById("btnCancelarEdicion").hidden = false;
    mostrarMensaje(`Editando “${producto.nombre}”.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.getElementById("nombre").focus();
}

async function guardarProducto(event) {
    event.preventDefault();
    const boton = document.getElementById("btnGuardarProducto");
    const producto = leerFormulario();
    const editando = productoEditandoId !== null;
    boton.disabled = true;
    boton.textContent = editando ? "Guardando cambios..." : "Guardando producto...";

    try {
        if (editando) {
            await solicitar(`/api/productos/${productoEditandoId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(producto)
            });
        } else {
            await solicitar("/api/productos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(producto)
            });
        }

        activarModoCreacion(false);
        mostrarMensaje(editando ? "Producto actualizado correctamente." : "Producto agregado correctamente.");
        await cargarProductosAdmin();
    } catch (error) {
        console.error("Error al guardar producto:", error);
        mostrarMensaje(editando ? "No se pudo actualizar el producto." : "No se pudo agregar el producto.", "error");
    } finally {
        boton.disabled = false;
        boton.textContent = productoEditandoId === null ? "Guardar producto" : "Guardar cambios";
    }
}

// =====================================================
// ELIMINACIÓN
// =====================================================

function abrirConfirmacion(producto) {
    productoPendienteEliminar = producto;
    document.getElementById("confirmText").textContent = `¿Quieres eliminar “${producto.nombre}”? Esta acción no se puede deshacer.`;
    const modal = document.getElementById("confirmModal");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.getElementById("btnCancelarEliminar").focus();
}

function cerrarConfirmacion() {
    productoPendienteEliminar = null;
    const modal = document.getElementById("confirmModal");
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
}

async function confirmarEliminacion() {
    if (!productoPendienteEliminar) return;
    const producto = productoPendienteEliminar;
    const boton = document.getElementById("btnConfirmarEliminar");
    boton.disabled = true;
    boton.textContent = "Eliminando...";

    try {
        await solicitar(`/api/productos/${producto.id}`, { method: "DELETE" });
        if (productoEditandoId === producto.id) activarModoCreacion(false);
        cerrarConfirmacion();
        mostrarMensaje("Producto eliminado correctamente.");
        await cargarProductosAdmin();
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        mostrarMensaje("No se pudo eliminar el producto.", "error");
    } finally {
        boton.disabled = false;
        boton.textContent = "Eliminar";
    }
}

async function cargarPedidosAdmin() {

    try {

        pedidosAdmin = await solicitar(
            "/api/pedidos"
        );

        renderizarPedidos();

    } catch (error) {

        console.error(
            "Error al cargar pedidos:",
            error
        );

    }

}


function renderizarPedidos() {

    const contenedor =
        document.getElementById(
            "listaPedidos"
        );

    const contador =
        document.getElementById(
            "contadorPedidos"
        );

    if (!contenedor || !contador) {
        return;
    }

    contador.textContent =
        `${pedidosAdmin.length} pedidos`;

    contenedor.replaceChildren();

    if (!pedidosAdmin.length) {

        contenedor.innerHTML = `
            <p class="tabla-vacia">
                No existen pedidos registrados.
            </p>
        `;

        return;
    }

    const grid =
        document.createElement("div");

    grid.className =
        "pedidos-grid";

    pedidosAdmin.forEach(
        pedido => {

            grid.append(
                crearTarjetaPedido(
                    pedido
                )
            );

        }
    );

    contenedor.append(
        grid
    );

    document
    .querySelectorAll(".pedido-estado")
    .forEach(select => {

        select.addEventListener(
            "change",
            event => {

                actualizarEstadoPedido(
                    event.target.dataset.id,
                    event.target.value
                );

            }
        );

    });

}


// =====================================================
// CREAR TARJETA DE PEDIDO
// =====================================================

function crearTarjetaPedido(
    pedido
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "pedido-card";

const detalles =
    pedido.detalles
        ?.map(
            item => `
                <li>
                    <strong>
                        ${item.producto?.nombre || "Producto"}
                    </strong>
                    |
                    Cantidad:
                    ${item.cantidad}
                    |
                    $${dinero(item.precio_unitario)}
                </li>
            `
        )
        .join("")
        || "";

// =====================================================
// COLORES DE ESTADO DE PEDIDO
// =====================================================

     let claseEstado = "";

switch (pedido.estado) {

    case "Pendiente":
        claseEstado =
            "estado-pendiente";
        break;

    case "Preparando":
        claseEstado =
            "estado-preparando";
        break;

    case "Entregado":
        claseEstado =
            "estado-entregado";
        break;

    case "Cancelado":
        claseEstado =
            "estado-cancelado";
        break;
}   

    card.innerHTML = `
        <h3>
            Pedido #${pedido.id}
        </h3>

        <div class="pedido-info">

            <div>
                <strong>Cliente:</strong>
                ${pedido.cliente_nombre}
            </div>

            <div>
                <strong>Teléfono:</strong>
                ${pedido.telefono}
            </div>

            <div>
                <strong>Dirección:</strong>
                ${pedido.direccion}
            </div>

           <div>
    <strong>Estado:</strong>

<span
    class="estado-badge ${claseEstado}"
>
    ${pedido.estado}
</span>

    <select
        class="pedido-estado"
        data-id="${pedido.id}"
    >
        <option
            value="Pendiente"
            ${pedido.estado === "Pendiente" ? "selected" : ""}
        >
            Pendiente
        </option>

        <option
            value="Preparando"
            ${pedido.estado === "Preparando" ? "selected" : ""}
        >
            Preparando
        </option>

        <option
            value="Entregado"
            ${pedido.estado === "Entregado" ? "selected" : ""}
        >
            Entregado
        </option>

        <option
            value="Cancelado"
            ${pedido.estado === "Cancelado" ? "selected" : ""}
        >
            Cancelado
        </option>
    </select>
</div>

            <div>
                <strong>Fecha:</strong>
                ${new Date(
                    pedido.fecha_creacion
                ).toLocaleString()}
            </div>

        </div>

        <div class="pedido-total">
            Total:
            $${dinero(
                pedido.total
            )}
        </div>

        <div class="pedido-detalles">
            <strong>Detalles</strong>

            <ul>
                ${detalles}
            </ul>
        </div>
    `;

    return card;
}

// =====================================================
// SESIÓN E INICIALIZACIÓN
// =====================================================

async function cerrarSesion() {
    try {
        await solicitar("/api/admin/logout", { method: "POST" });
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    } finally {
        window.location.replace("/login");
    }
}

async function actualizarEstadoPedido(
    pedidoId,
    estado
) {

    console.log(
    "Pedido:",
    pedidoId
);

console.log(
    "Estado:",
    estado
);

    try {

        await solicitar(
            `/api/pedidos/${pedidoId}/estado`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    estado
                })
            }
        );

        await cargarPedidosAdmin();

        await cargarProductosAdmin();

        mostrarMensaje(
            `Pedido #${pedidoId} actualizado.`
        );

    } catch (error) {

        console.error(
            error
        );

        mostrarMensaje(
            "No se pudo actualizar el pedido.",
            "error"
        );
    }
}

document.addEventListener("DOMContentLoaded", () => {
    activarModoCreacion();
    cargarProductosAdmin();
    cargarPedidosAdmin();
    document.getElementById("formProducto").addEventListener("submit", guardarProducto);
    document.getElementById("btnCancelarEdicion").addEventListener("click", () => activarModoCreacion());
    document.getElementById("btnLogout").addEventListener("click", cerrarSesion);
    document.getElementById("btnCancelarEliminar").addEventListener("click", cerrarConfirmacion);
    document.getElementById("btnConfirmarEliminar").addEventListener("click", confirmarEliminacion);
    document.getElementById("confirmModal").addEventListener("click", event => {
        if (event.target.id === "confirmModal") cerrarConfirmacion();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") cerrarConfirmacion();
    });
});
