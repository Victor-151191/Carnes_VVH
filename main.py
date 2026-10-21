# main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import engine, get_db

# Crear tablas en SQLite automáticamente
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Carnes VVH API")

# Montar carpeta de archivos estáticos (CSS, JS, imágenes)
app.mount("/static", StaticFiles(directory="static"), name="static")


# --- RUTAS DE NAVEGACIÓN (VINCULADAS A LINKS.TXT) ---

@app.get("/")
def home():
    """Redirige http://127.0.0.1:8000 a la tienda pública"""
    return FileResponse("static/index.html")

@app.get("/admin")
def panel_administrador():
    """Redirige http://127.0.0.1:8000/admin al panel de control"""
    return FileResponse("static/admin.html")


# --- RUTAS DE PRODUCTOS ---

@app.get("/api/productos", response_model=List[schemas.ProductoResponse])
def obtener_productos(db: Session = Depends(get_db)):
    return db.query(models.Producto).all()

@app.post("/api/productos", response_model=schemas.ProductoResponse, status_code=status.HTTP_201_CREATED)
def crear_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db)):
    nuevo_p = models.Producto(**producto.model_dump())
    db.add(nuevo_p)
    db.commit()
    db.refresh(nuevo_p)
    return nuevo_p


# --- RUTAS DE PEDIDOS (INTEGRACIÓN WHATSAPP + SQLITE) ---

@app.get("/api/pedidos", response_model=List[schemas.PedidoResponse])
def listar_pedidos(db: Session = Depends(get_db)):
    return db.query(models.Pedido).all()

@app.post("/api/pedidos", response_model=schemas.PedidoResponse, status_code=status.HTTP_201_CREATED)
def registrar_pedido(pedido: schemas.PedidoCreate, db: Session = Depends(get_db)):
    # 1. Crear el pedido principal
    nuevo_pedido = models.Pedido(
        cliente_nombre=pedido.cliente_nombre,
        telefono=pedido.telefono,
        direccion=pedido.direccion,
        total=pedido.total,
        estado="Pendiente"
    )
    db.add(nuevo_pedido)
    db.commit()
    db.refresh(nuevo_pedido)

    # 2. Agregar los detalles de los productos comprados
    for item in pedido.detalles:
        detalle = models.DetallePedido(
            pedido_id=nuevo_pedido.id,
            producto_id=item.producto_id,
            cantidad=item.cantidad,
            precio_unitario=item.precio_unitario
        )
        db.add(detalle)
    
    db.commit()
    db.refresh(nuevo_pedido)
    return nuevo_pedido
# --- RUTA DE CATEGORÍAS ---

@app.get("/api/categorias")
def obtener_categorias(db: Session = Depends(get_db)):
    # Obtener todas las categorías distintas que existen en los productos
    categorias = db.query(models.Producto.categoria).distinct().all()
    # Retornar una lista simple de nombres: ["Cortes Selectos", "Cortes Tradicionales", "Complementos"]
    return [c[0] for c in categorias if c[0]]