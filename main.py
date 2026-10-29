# main.py

import os
import secrets
from typing import List

from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Request
)

from fastapi.responses import (
    FileResponse,
    RedirectResponse
)

from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pwdlib import PasswordHash
from starlette.middleware.sessions import SessionMiddleware

import models
import schemas

from database import engine, get_db


# =====================================================
# BASE DE DATOS
# =====================================================

models.Base.metadata.create_all(bind=engine)


# =====================================================
# APP
# =====================================================

app = FastAPI(
    title="Carnes VVH API"
)


# =====================================================
# SESIONES
# =====================================================

SESSION_SECRET = os.getenv("SESSION_SECRET")

if not SESSION_SECRET:
    raise RuntimeError(
        "Falta SESSION_SECRET"
    )


app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    session_cookie="carnes_vvh_admin",
    max_age=60 * 60 * 8,
    same_site="lax",
    https_only=False
)


# =====================================================
# ADMIN
# =====================================================

ADMIN_USERNAME = os.getenv(
    "ADMIN_USERNAME"
)

ADMIN_PASSWORD_HASH = os.getenv(
    "ADMIN_PASSWORD_HASH"
)

if (
    not ADMIN_USERNAME
    or not ADMIN_PASSWORD_HASH
):
    raise RuntimeError(
        "Faltan variables ADMIN"
    )


password_hash = PasswordHash.recommended()


# =====================================================
# STATIC
# =====================================================

app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)


# =====================================================
# HELPERS
# =====================================================

def require_admin(
    request: Request
):
    username = request.session.get(
        "admin_username"
    )

    if not username:
        raise HTTPException(
            status_code=401,
            detail="Debes iniciar sesión"
        )

    if not secrets.compare_digest(
        username,
        ADMIN_USERNAME
    ):
        request.session.clear()

        raise HTTPException(
            status_code=401,
            detail="Sesión inválida"
        )

    return username


# =====================================================
# VISTAS
# =====================================================

@app.get("/")
def home():
    return FileResponse(
        "static/index.html"
    )


@app.get("/login")
def login_page(
    request: Request
):
    if (
        request.session.get(
            "admin_username"
        )
        == ADMIN_USERNAME
    ):
        return RedirectResponse(
            "/admin"
        )

    return FileResponse(
        "static/login.html"
    )


@app.get("/admin")
def admin_page(
    request: Request
):
    if (
        request.session.get(
            "admin_username"
        )
        != ADMIN_USERNAME
    ):
        return RedirectResponse(
            "/login"
        )

    return FileResponse(
        "static/admin.html"
    )


# =====================================================
# LOGIN ADMINISTRADOR
# =====================================================

@app.post("/api/admin/login")
def admin_login(
    datos: schemas.LoginRequest,
    request: Request
):
    usuario_ok = secrets.compare_digest(
        datos.username,
        ADMIN_USERNAME
    )

    try:
        password_ok = password_hash.verify(
            datos.password,
            ADMIN_PASSWORD_HASH
        )

    except Exception:
        password_ok = False

    if (
        not usuario_ok
        or not password_ok
    ):
        raise HTTPException(
            status_code=401,
            detail="Usuario o contraseña incorrectos."
        )

    request.session.clear()

    request.session[
        "admin_username"
    ] = ADMIN_USERNAME

    return {
        "message": "Sesión iniciada correctamente",
        "username": ADMIN_USERNAME
    }


@app.post("/api/admin/logout")
def admin_logout(
    request: Request
):
    request.session.clear()

    return {
        "message": "Sesión cerrada correctamente"
    }


@app.get("/api/admin/session")
def admin_session(
    username: str = Depends(
        require_admin
    )
):
    return {
        "authenticated": True,
        "username": username
    }


# =====================================================
# PRODUCTOS
# =====================================================

@app.get(
    "/api/productos",
    response_model=List[
        schemas.ProductoResponse
    ]
)
def obtener_productos(
    db: Session = Depends(get_db)
):
    productos = (
        db.query(models.Producto)
        .order_by(models.Producto.id.asc())
        .all()
    )

    return productos


@app.post(
    "/api/productos",
    response_model=schemas.ProductoResponse
)
def crear_producto(
    producto: schemas.ProductoCreate,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin)
):
    nuevo = models.Producto(
        **producto.model_dump()
    )

    try:
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)

        return nuevo

    except Exception as error:
        db.rollback()

        print(
            "Error al crear producto:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="No se pudo crear el producto."
        )


@app.put(
    "/api/productos/{producto_id}",
    response_model=schemas.ProductoResponse
)
def actualizar_producto(
    producto_id: int,
    datos: schemas.ProductoUpdate,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin)
):
    producto = (
        db.query(models.Producto)
        .filter(
            models.Producto.id == producto_id
        )
        .first()
    )

    if not producto:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    for campo, valor in datos.model_dump().items():
        setattr(
            producto,
            campo,
            valor
        )

    try:
        db.commit()
        db.refresh(producto)

        return producto

    except Exception as error:
        db.rollback()

        print(
            "Error al actualizar producto:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="No se pudo actualizar el producto."
        )


@app.delete(
    "/api/productos/{producto_id}"
)
def eliminar_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin)
):
    producto = (
        db.query(models.Producto)
        .filter(
            models.Producto.id == producto_id
        )
        .first()
    )

    if not producto:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    try:
        db.delete(producto)
        db.commit()

        return {
            "message": "Producto eliminado"
        }

    except Exception as error:
        db.rollback()

        print(
            "Error al eliminar producto:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="No se pudo eliminar el producto."
        )


# =====================================================
# PEDIDOS
# =====================================================

@app.get(
    "/api/pedidos",
    response_model=List[
        schemas.PedidoResponse
    ]
)
def listar_pedidos(
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin)
):
    pedidos = (
        db.query(models.Pedido)
        .order_by(models.Pedido.id.desc())
        .all()
    )

    return pedidos

@app.put("/api/pedidos/{pedido_id}/estado")
def actualizar_estado_pedido(
    pedido_id: int,
    datos: dict,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin)
):

    pedido = (
        db.query(models.Pedido)
        .filter(
            models.Pedido.id == pedido_id
        )
        .first()
    )

    if not pedido:
        raise HTTPException(
            status_code=404,
            detail="Pedido no encontrado"
        )

    estados_validos = [
        "Pendiente",
        "Preparando",
        "Entregado",
        "Cancelado"
    ]

    nuevo_estado = datos.get(
        "estado"
    )

    if nuevo_estado not in estados_validos:
        raise HTTPException(
            status_code=400,
            detail="Estado inválido"
        )

    estado_anterior = pedido.estado

    # =====================================
    # DEVOLVER STOCK
    # =====================================

    if (
        estado_anterior != "Cancelado"
        and
        nuevo_estado == "Cancelado"
    ):

        for detalle in pedido.detalles:

            producto = (
                db.query(models.Producto)
                .filter(
                    models.Producto.id ==
                    detalle.producto_id
                )
                .first()
            )

            if not producto:
                continue

            producto.stock_disponible += (
                detalle.cantidad
            )

            producto.disponible = True

    # =====================================
    # VOLVER A DESCONTAR STOCK
    # =====================================

    elif (
        estado_anterior == "Cancelado"
        and
        nuevo_estado != "Cancelado"
    ):

        for detalle in pedido.detalles:

            producto = (
                db.query(models.Producto)
                .filter(
                    models.Producto.id ==
                    detalle.producto_id
                )
                .first()
            )

            if not producto:
                continue

            if (
                producto.stock_disponible <
                detalle.cantidad
            ):
                raise HTTPException(
                    status_code=409,
                    detail=(
                        f"No hay stock suficiente para "
                        f"{producto.nombre}"
                    )
                )

            producto.stock_disponible -= (
                detalle.cantidad
            )

            if (
                producto.stock_disponible <= 0
            ):
                producto.stock_disponible = 0
                producto.disponible = False

    pedido.estado = nuevo_estado

    db.commit()

    db.refresh(pedido)

    return {
        "message": "Estado actualizado correctamente",
        "estado": pedido.estado
    }


@app.post(
    "/api/pedidos",
    response_model=schemas.PedidoResponse
)
def registrar_pedido(
    pedido: schemas.PedidoCreate,
    db: Session = Depends(get_db)
):
    try:
        # =============================================
        # AGRUPAR PRODUCTOS REPETIDOS
        # =============================================

        cantidades = {}

        for detalle in pedido.detalles:
            producto_id = detalle.producto_id
            cantidad = detalle.cantidad

            if producto_id in cantidades:
                cantidades[producto_id] += cantidad
            else:
                cantidades[producto_id] = cantidad

        # =============================================
        # VALIDAR PRODUCTOS Y CALCULAR TOTAL
        # =============================================

        productos_validados = []
        total = 0.0

        for producto_id, cantidad in cantidades.items():

            producto = (
                db.query(models.Producto)
                .filter(
                    models.Producto.id == producto_id
                )
                .first()
            )

            if not producto:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"El producto #{producto_id} "
                        "no existe."
                    )
                )

            if not producto.disponible:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        f'El producto "{producto.nombre}" '
                        "no está disponible."
                    )
                )

            stock_actual = float(
                producto.stock_disponible
            )

            if stock_actual < cantidad:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        f'Stock insuficiente para '
                        f'"{producto.nombre}". '
                        f'Disponible: {stock_actual:g} '
                        f'{producto.unidad_medida}.'
                    )
                )

            precio_real = float(
                producto.precio
            )

            subtotal = (
                precio_real * cantidad
            )

            total += subtotal

            productos_validados.append(
                {
                    "producto": producto,
                    "cantidad": cantidad,
                    "precio_unitario": precio_real
                }
            )

        if total <= 0:
            raise HTTPException(
                status_code=400,
                detail="El pedido no contiene productos válidos."
            )

        # =============================================
        # CREAR PEDIDO
        # =============================================

        nuevo_pedido = models.Pedido(
            cliente_nombre=pedido.cliente_nombre,
            telefono=pedido.telefono,
            direccion=pedido.direccion,
            total=round(total, 2),
            estado="Pendiente"
        )

        db.add(nuevo_pedido)

        # Envía el INSERT para obtener el ID,
        # pero todavía NO confirma la transacción.
        db.flush()

        # =============================================
        # DETALLES Y DESCUENTO DE STOCK
        # =============================================

        for item in productos_validados:

            producto = item["producto"]
            cantidad = item["cantidad"]
            precio_unitario = item[
                "precio_unitario"
            ]

            nuevo_detalle = models.DetallePedido(
                pedido_id=nuevo_pedido.id,
                producto_id=producto.id,
                cantidad=cantidad,
                precio_unitario=precio_unitario
            )

            db.add(nuevo_detalle)

            producto.stock_disponible = (
                float(producto.stock_disponible)
                - cantidad
            )

            if producto.stock_disponible <= 0:
                producto.stock_disponible = 0
                producto.disponible = False

        # =============================================
        # CONFIRMAR TODO JUNTO
        # =============================================

        db.commit()

        db.refresh(nuevo_pedido)

        return nuevo_pedido

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        print(
            "Error al registrar pedido:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="No se pudo registrar el pedido."
        )


# =====================================================
# CATEGORIAS
# =====================================================

@app.get("/api/categorias")
def obtener_categorias(
    db: Session = Depends(get_db)
):
    categorias = (
        db.query(
            models.Producto.categoria
        )
        .distinct()
        .all()
    )

    return [
        categoria[0]
        for categoria in categorias
        if categoria[0]
    ]