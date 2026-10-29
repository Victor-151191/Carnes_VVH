# models.py

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String
)

from sqlalchemy.orm import relationship

from database import Base


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)

    nombre = Column(String, nullable=False, index=True)

    descripcion = Column(String)

    precio = Column(Float, nullable=False)

    unidad_medida = Column(
        String,
        nullable=False,
        default="kg"
    )

    stock_disponible = Column(
        Float,
        nullable=False,
        default=0
    )

    categoria = Column(String)

    imagen_url = Column(String)

    disponible = Column(
        Boolean,
        default=True
    )

    fecha_creacion = Column(
        DateTime,
        default=datetime.utcnow
    )


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    cliente_nombre = Column(String)

    telefono = Column(String)

    direccion = Column(String)

    total = Column(Float)

    estado = Column(
        String,
        default="Pendiente"
    )

    fecha_creacion = Column(
        DateTime,
        default=datetime.utcnow
    )

    detalles = relationship(
        "DetallePedido",
        back_populates="pedido"
    )


class DetallePedido(Base):
    __tablename__ = "detalles_pedido"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    pedido_id = Column(
        Integer,
        ForeignKey("pedidos.id")
    )

    producto_id = Column(
        Integer,
        ForeignKey("productos.id")
    )

    cantidad = Column(Integer)

    precio_unitario = Column(Float)

    pedido = relationship(
        "Pedido",
        back_populates="detalles"
    )

    producto = relationship(
        "Producto"
    )