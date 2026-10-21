document.addEventListener("DOMContentLoaded", () => {
    cargarProductosAdmin();
    configurarFormularioAlta();
    configurarFormularioEdicion();
});

// 1. Cargar productos con botones de Editar y Eliminar
async function cargarProductosAdmin() {
    try {
        const res = await fetch("/api/productos");
        if (!res.ok) throw new Error("Error al consultar productos");

        const productos = await res.json();
        const tbody = document.getElementById("tablaProductos");
        tbody.innerHTML = "";

        if (productos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#777; padding:2rem;">No hay productos registrados.</td></tr>`;
            return;
        }

        productos.forEach(prod => {
            const tr = document.createElement("tr");

            let imgUrl = prod.imagen_url;
            if (imgUrl && !imgUrl.startsWith("http") && !imgUrl.startsWith("/static/")) {
                imgUrl = `/static/${imgUrl}`;
            }

            // Escapar JSON para el atributo onclick
            const prodData = JSON.stringify(prod).replace(/'/g, "&apos;").replace(/"/g, "&quot;");

            tr.innerHTML = `
                <td><strong>#${prod.id}</strong></td>
                <td>
                    <img src="${imgUrl || 'https://via.placeholder.com/48?text=VVH'}" 
                         alt="${prod.nombre}" 
                         class="admin-table-img"
                         onerror="this.src='https://via.placeholder.com/48?text=VVH'">
                </td>
                <td><strong>${prod.nombre}</strong></td>
                <td style="color: #800000; font-weight: bold;">$${prod.precio.toFixed(2)}</td>
                <td>${prod.unidad_medida || 'kg'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-editar" onclick="prepararEdicion(${prodData})">Editar</button>
                        <button class="btn-eliminar" onclick="eliminarProducto(${prod.id}, '${prod.nombre}')">Eliminar</button>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error al cargar productos:", err);
    }
}

// 2. Cargar los datos del producto seleccionado en el formulario de edición
function prepararEdicion(prod) {
    document.getElementById("formProducto").style.display = "none";
    
    const formEdit = document.getElementById("formEditarProducto");
    formEdit.style.display = "flex";
    
    document.getElementById("edit-id-badge").innerText = `#${prod.id}`;
    document.getElementById("edit_id").value = prod.id;
    document.getElementById("edit_nombre").value = prod.nombre || "";
    document.getElementById("edit_descripcion").value = prod.descripcion || "";
    document.getElementById("edit_precio").value = prod.precio || 0;
    document.getElementById("edit_unidad_medida").value = prod.unidad_medida || "";
    document.getElementById("edit_stock").value = prod.stock_disponible || 0;
    document.getElementById("edit_categoria_id").value = prod.categoria_id || 1;
    document.getElementById("edit_imagen_url").value = prod.imagen_url || "";

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 3. Cancelar la edición y regresar al formulario normal
function cancelarEdicion() {
    document.getElementById("formEditarProducto").style.display = "none";
    document.getElementById("formProducto").style.display = "flex";
}

// 4. Enviar actualización PUT a FastAPI
function configurarFormularioEdicion() {
    const formEdit = document.getElementById("formEditarProducto");

    formEdit.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id = document.getElementById("edit_id").value;
        const productoActualizado = {
            nombre: document.getElementById("edit_nombre").value,
            descripcion: document.getElementById("edit_descripcion").value,
            precio: parseFloat(document.getElementById("edit_precio").value),
            unidad_medida: document.getElementById("edit_unidad_medida").value,
            stock_disponible: parseFloat(document.getElementById("edit_stock").value),
            categoria_id: parseInt(document.getElementById("edit_categoria_id").value),
            imagen_url: document.getElementById("edit_imagen_url").value || null
        };

        try {
            const res = await fetch(`/api/productos/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(productoActualizado)
            });

            if (res.ok) {
                alert("¡Producto actualizado correctamente!");
                cancelarEdicion();
                cargarProductosAdmin();
            } else {
                alert("Error al actualizar el producto");
            }
        } catch (err) {
            console.error("Error al actualizar producto:", err);
        }
    });
}

// 5. Alta de Producto
function configurarFormularioAlta() {
    const form = document.getElementById("formProducto");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nuevoProducto = {
            nombre: document.getElementById("nombre").value,
            descripcion: document.getElementById("descripcion").value,
            precio: parseFloat(document.getElementById("precio").value),
            unidad_medida: document.getElementById("unidad_medida").value,
            stock_disponible: parseFloat(document.getElementById("stock").value),
            categoria_id: parseInt(document.getElementById("categoria_id").value),
            imagen_url: document.getElementById("imagen_url").value || null
        };

        try {
            const res = await fetch("/api/productos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(nuevoProducto)
            });

            if (res.ok) {
                alert("¡Producto agregado correctamente!");
                form.reset();
                cargarProductosAdmin();
            } else {
                alert("Error al agregar el producto");
            }
        } catch (err) {
            console.error("Error al agregar producto:", err);
        }
    });
}

// 6. Eliminar Producto
async function eliminarProducto(id, nombre) {
    const confirmar = confirm(`¿Estás seguro de eliminar "${nombre}"?`);
    if (!confirmar) return;

    try {
        const res = await fetch(`/api/productos/${id}`, { method: "DELETE" });

        if (res.ok) {
            cargarProductosAdmin();
        } else {
            alert("No se pudo eliminar el producto.");
        }
    } catch (err) {
        console.error("Error al eliminar producto:", err);
    }
}