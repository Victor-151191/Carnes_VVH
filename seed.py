# seed.py

from database import SessionLocal, engine
import models

# Crear tablas
models.Base.metadata.create_all(bind=engine)


PRODUCTOS_INICIALES = [

    {
        "nombre": "Rib Eye Select",
        "descripcion": "Corte premium ideal para asar.",
        "precio": 380.00,
        "unidad_medida": "kg",
        "stock_disponible": 35,
        "categoria": "Cortes Premium",
        "imagen_url": "ribeye.jpg",
        "disponible": True
    },

    {
        "nombre": "Tomahawk Prime",
        "descripcion": "Corte premium con hueso de gran presentación.",
        "precio": 650.00,
        "unidad_medida": "kg",
        "stock_disponible": 20,
        "categoria": "Cortes Premium",
        "imagen_url": "tomahawk.jpg",
        "disponible": True
    },

    {
        "nombre": "Costilla Cargada de Res",
        "descripcion": "Ideal para asados lentos y ahumados.",
        "precio": 220.00,
        "unidad_medida": "kg",
        "stock_disponible": 50,
        "categoria": "Cortes Tradicionales",
        "imagen_url": "costillacargada.webp",
        "disponible": True
    },

    {
        "nombre": "Carbón de Mezquite 5kg",
        "descripcion": "Carbón natural de larga duración.",
        "precio": 90.00,
        "unidad_medida": "bolsa",
        "stock_disponible": 80,
        "categoria": "Complementos",
        "imagen_url": "carbon.jpg",
        "disponible": True
    },

    {
        "nombre": "Salsa Casera Molcajeteada",
        "descripcion": "Salsa artesanal preparada diariamente.",
        "precio": 65.00,
        "unidad_medida": "botella",
        "stock_disponible": 120,
        "categoria": "Complementos",
        "imagen_url": "salsa.jpg",
        "disponible": True
    }
]


def seed_productos():
    db = SessionLocal()

    try:

        existe_producto = (
            db.query(models.Producto)
            .first()
        )

        if existe_producto:
            print(
                "Ya existen productos. Seed omitido."
            )
            return

        for p in PRODUCTOS_INICIALES:

            producto = models.Producto(
                nombre=p["nombre"],
                descripcion=p["descripcion"],
                precio=p["precio"],
                unidad_medida=p["unidad_medida"],
                stock_disponible=p["stock_disponible"],
                categoria=p["categoria"],
                imagen_url=p["imagen_url"],
                disponible=p["disponible"]
            )

            db.add(producto)

        db.commit()

        print(
            "Productos iniciales insertados correctamente."
        )

    finally:
        db.close()


if __name__ == "__main__":
    seed_productos()