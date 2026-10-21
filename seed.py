# seed.py
from database import SessionLocal, engine
import models

# Recrear tablas desde cero para limpiar registros antiguos
models.Base.metadata.create_all(bind=engine)

def rellenar_forzado():
    db = SessionLocal()

    # 1. Limpiar la tabla de productos completamente
    db.query(models.Producto).delete()
    db.commit()

    # 2. Insertar los productos nuevamente
    productos_iniciales = [
        {
            "nombre": "Rib Eye Select (1 kg)",
            "descripcion": "Corte jugoso con excelente marmoleo ideal para asar a la parrilla.",
            "precio": 380.0,
            "categoria": "Cortes Selectos",
            "imagen_url": "/static/ribeye.jpg",
            "disponible": True
        },
        {
            "nombre": "Tomahawk Prime (1.2 kg)",
            "descripcion": "Corte de grueso calibre con hueso, el rey de la carne asada.",
            "precio": 650.0,
            "categoria": "Cortes Selectos",
            "imagen_url": "/static/tomahawk.jpg",
            "disponible": True
        },
        {
            "nombre": "Costilla Cargada de Res (1 kg)",
            "descripcion": "Costilla jugosa ideal para dorar al carbón a fuego lento.",
            "precio": 220.0,
            "categoria": "Cortes Tradicionales",
            "imagen_url": "/static/costilla.jpg",
            "disponible": True
        },
        {
            "nombre": "Carbón de Mezquite 5kg",
            "descripcion": "Carbón vegetal de encendido rápido y gran duración de brasa.",
            "precio": 90.0,
            "categoria": "Complementos",
            "imagen_url": "/static/carbon.jpg",
            "disponible": True
        },
        {
            "nombre": "Salsa Casera Molcajeteada 500ml",
            "descripcion": "Salsa asada tradicional con chile serrano y tomate fresco.",
            "precio": 65.0,
            "categoria": "Complementos",
            "imagen_url": "/static/salsa.jpg",
            "disponible": True
        }
    ]

    for item in productos_iniciales:
        nuevo_p = models.Producto(**item)
        db.add(nuevo_p)

    db.commit()
    db.close()
    print("¡Base de datos limpiada y rellenada exitosamente con 5 productos!")

if __name__ == "__main__":
    rellenar_forzado()