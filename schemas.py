# schemas.py

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# =====================================================
# PRODUCTOS
# =====================================================

class ProductoBase(BaseModel):
    nombre: str = Field(
        min_length=2,
        max_length=150
    )

    descripcion: Optional[str] = None

    precio: float = Field(gt=0)

    unidad_medida: str = Field(
        default="kg",
        min_length=1,
        max_length=30
    )

    stock_disponible: float = Field(
        default=0,
        ge=0
    )

    categoria: str = Field(
        min_length=2,
        max_length=100
    )

    imagen_url: Optional[str] = None

    disponible: bool = True


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(ProductoBase):
    pass


class ProductoResponse(ProductoBase):
    id: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True


# =====================================================
# DETALLES DE PEDIDO
# =====================================================
class DetallePedidoCreate(BaseModel):
    producto_id: int = Field(gt=0)
    cantidad: int = Field(gt=0)


class ProductoPedidoResponse(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True

class DetallePedidoResponse(BaseModel):
    id: int
    producto_id: int
    cantidad: int
    precio_unitario: float

    producto: ProductoPedidoResponse

    class Config:
        from_attributes = True


# =====================================================
# PEDIDOS
# =====================================================

class PedidoCreate(BaseModel):
    cliente_nombre: str = Field(
        min_length=2,
        max_length=150
    )

    telefono: str = Field(
        min_length=8,
        max_length=30
    )

    direccion: str = Field(
        min_length=5,
        max_length=300
    )

    detalles: List[DetallePedidoCreate] = Field(
        min_length=1
    )


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


# =====================================================
# LOGIN ADMINISTRADOR
# =====================================================

class LoginRequest(BaseModel):
    username: str = Field(
        min_length=1,
        max_length=100
    )

    password: str = Field(
        min_length=1,
        max_length=200
    )