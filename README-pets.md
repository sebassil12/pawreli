# Agregar una mascota

Tres pasos. El script hace todo lo demás.

### 1. Corre el generador

```bash
npm run nueva-mascota -- --nombre "Luna" --raza "Golden Retriever" \
  --tutor "María" --whatsapp 593999999999 --nota "Es nerviosa con desconocidos"
```

`--nota` es opcional. `--whatsapp` con código de país, solo dígitos.

El script crea el archivo de la mascota, genera los QR en `qr/<token>/` e imprime el **token**, el **código a grabar** (`A7K9-X2M4`), la **URL** y dónde va la foto. Anota el código.

### 2. Pon la foto

Copia la foto a `public/pets/<token>.jpg` (el token que imprimió el script). Debe ser `.jpg` y coincidir con el nombre.

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
