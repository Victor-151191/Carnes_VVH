# schemas.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- SCHEMAS DE PRODUCTOS ---
class ProductoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    categoria: str
    imagen_url: Optional[str] = None
    disponible: bool = True

class ProductoCreate(ProductoBase):
    pass

class ProductoResponse(ProductoBase):
    id: int

    class Config:
        from_attributes = True

# --- SCHEMAS DE PEDIDOS ---
class DetallePedidoCreate(BaseModel):
    producto_id: int
    cantidad: int
    precio_unitario: float

class DetallePedidoResponse(DetallePedidoCreate):
    id: int

    class Config:
        from_attributes = True

class PedidoCreate(BaseModel):
    cliente_nombre: str
    telefono: str
    direccion: str
    total: float
    detalles: List[DetallePedidoCreate]

class PedidoResponse(BaseModel):
    id: int
    cliente_nombre: str
    telefono: str
    direccion: str
    total: float
    estado: str
    fecha_creacion: datetime
    detalles: List[DetallePedidoResponse]

    class Config:
        from_attributes = True