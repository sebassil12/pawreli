# Agregar una mascota

Tres pasos. El código de 8 caracteres del archivo es el mismo que se graba en la placa.

### 1. Crea el archivo de la mascota

Genera un código y crea el archivo `src/content/pets/<codigo>.md`:

```bash
CODIGO=$(openssl rand -hex 4)   # p. ej. a7k9x2m4
echo "$CODIGO"                  # anótalo: en la placa se graba como A7K9-X2M4
```

Contenido del archivo (`src/content/pets/a7k9x2m4.md`):

```yaml
---
nombre: Luna
raza: Golden Retriever
foto: /pets/a7k9x2m4.jpg
tutor: María
whatsapp: '593999999999' # país + número, sin el +
nota: 'Es muy nerviosa con desconocidos' # opcional, borra la línea si no aplica
---
```

### 2. Pon la foto

Copia la foto de la mascota a `public/pets/` con el mismo código del paso 1:

```
public/pets/a7k9x2m4.jpg
```

Debe coincidir con el campo `foto` del archivo (`.jpg`, `.png` o `.svg`).

### 3. Publica

```bash
git add src/content/pets public/pets && git commit -m "pet: Luna" && git push
```

Vercel publica solo. En un par de minutos, `https://pawreli.com/p/a7k9x2m4` muestra el perfil.
