# Agregar una mascota

Tres pasos. El script hace todo lo demás.

### 1. Corre el generador

```bash
npm run nueva-mascota -- --nombre "Luna" --raza "Golden Retriever" \
  --tutor "María" --whatsapp 593999999999 --nota "Es nerviosa con desconocidos"
```

`--nota` es opcional. `--whatsapp` con código de país, solo dígitos.

**Foto (opcional):** agrega `--foto ~/Descargas/luna.png`. Acepta jpg, png o webp; el script la gira bien, la recorta a formato vertical 4:5 (960×1200, centrada para conservar orejas, cara y pecho) y la guarda como `public/pets/<token>.jpg`. Con `--foto` puedes saltarte el paso 2.

**Segundo contacto (opcional):** agrega `--tutor2 "Pedro" --whatsapp2 593988888888`. Van juntos: los dos o ninguno. En la página aparece un segundo bloque "Avisar a Pedro por WhatsApp / o llamar al…" debajo del primero.

Para agregarlo a una mascota que ya existe, edita su archivo `src/content/pets/<token>.md` y suma, dentro del bloque `---`:

```yaml
contacto2:
  tutor: 'Pedro'
  whatsapp: '593988888888'
```

El QR no cambia: apunta a la página, no al número.

El script crea el archivo de la mascota, genera los QR en `qr/<token>/` e imprime el **token**, el **código a grabar** (`A7K9-X2M4`), la **URL** y dónde va la foto. Anota el código.

### 2. Pon y optimiza la foto (ImageMagick)

Si no pasaste `--foto` en el paso 1, convierte y optimiza la imagen antes de subirla. El perfil de la mascota se abre en la calle desde un celular (frecuentemente con mala cobertura 3G), por lo que la imagen debe ser liviana, tener ratio vertical **4:5 (960×1200)** para mostrar la cara y el pecho completos, y estar libre de metadatos GPS/EXIF.

Ejecuta con **ImageMagick** (v7 `magick` o v6 `convert`):

```bash
magick ~/Descargas/foto-original.jpg \
  -auto-orient \
  -gravity Center \
  -resize 960x1200^ \
  -extent 960x1200 \
  -strip \
  -quality 84 \
  -interlace Plane \
  public/pets/<token>.jpg
```

*(En ImageMagick 6 reemplaza `magick` por `convert`).*

**¿Por qué estos parámetros?**
- `-auto-orient`: corrige la orientación del celular según el sensor EXIF antes de cortar.
- `-gravity Center`: centra el encuadre (captura orejas, ojos, hocico, lengua y pecho de la mascota).
- `-resize 960x1200^ -extent 960x1200`: ajusta al ratio vertical 4:5 óptimo para pantallas móviles sin distorsionar.
- `-strip`: remueve metadatos EXIF, miniaturas y geolocalización GPS (privacidad del tutor y ahorro crítico de KB).
- `-quality 84`: compresión limpia sin pérdida visible de detalle (mismo perfil que usa `sharp` en el script).
- `-interlace Plane`: genera un JPEG progresivo para renderizado gradual en redes lentas.

### 3. Publica

```bash
git add src/content/pets public/pets && git commit -m "pet: Luna" && git push
```

Vercel publica solo. En un par de minutos, `https://pawreli.com/<token>` muestra el perfil.

---

## Qué mandar al taller

En `qr/<token>/` hay cuatro SVG. Son vectores, listos para grabado láser.

- **Empieza con `qr-may-Q.svg`** (mayúsculas, corrección Q): es el más compacto y el más tolerante a rayones. El script imprime la versión y los módulos por lado de cada uno; a menor versión, módulos más grandes y mejor lectura en placa chica.
- **Medida:** placa de ~2.5 cm de lado. Deja el QR lo más grande que entre.
- **Pídele al grabador:** grabar el SVG **tal cual, sin recortar el borde blanco** (esa zona de silencio de 4 módulos es parte del código), negro pleno sobre el metal, **sin logo ni texto encima** del QR.
- Si un QR no escanea bien en la placa física, prueba otra de las cuatro variantes antes de rediseñar nada.
