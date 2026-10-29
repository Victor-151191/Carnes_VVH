from getpass import getpass
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()

password = getpass("Introduce la contraseña del administrador: ")
confirmacion = getpass("Repite la contraseña: ")

if password != confirmacion:
    raise SystemExit("Las contraseñas no coinciden.")

if len(password) < 12:
    raise SystemExit("La contraseña debe tener al menos 12 caracteres.")

hash_generado = password_hash.hash(password)

print("\nCopia este hash en Render como ADMIN_PASSWORD_HASH:\n")
print(hash_generado)