# Poner GymCrew en un servidor gratis de Oracle

Con esto, la app y el servidor viven en tu propia máquina de Oracle Cloud ("Always Free"):
cuentas por código, amigos, solicitudes, chat directo y de grupo, mensajes guardados si el amigo está
desconectado, presencia (🟢 en línea), grupos de gimnasio con código de 5 letras + 3 números y el relé del lado social (entrenos compartidos, reacciones, comentarios, retos y quedadas). El servidor no guarda historial de entrenos: solo reenvía y guarda una cola de entrega para quien está desconectado.

Tiempo: unos 30–40 minutos la primera vez. Hay cosas que solo puedes hacer tú (crear la cuenta, la tarjeta, la máquina).

## 1. Cuenta de Oracle Cloud
1. Entra en https://www.oracle.com/cloud/free/ y pulsa **Start for free**.
2. Te pedirá una tarjeta solo para verificar tu identidad. Los recursos "Always Free" no se cobran; usa solo esos.
3. Elige la **región de origen** con cuidado: no se puede cambiar después. Escoge una europea (por ejemplo Frankfurt o Madrid).

## 2. Crear la máquina (instancia)
1. Menú → **Compute → Instances → Create instance**.
2. **Image**: Ubuntu 22.04 o 24.04.
3. **Shape**: elige una marcada "Always Free-eligible":
   - `VM.Standard.E2.1.Micro` (AMD, 1 GB): sobra para esto y suele haber disponibilidad.
   - `VM.Standard.A1.Flex` (ARM): más potente, pero a veces dice "Out of capacity". Si pasa, usa la Micro.
4. **Networking**: deja marcada la **IP pública**.
5. **SSH keys**: pulsa *Save private key* y guarda el archivo (lo necesitas para entrar). No lo pierdas ni lo compartas.
6. Pulsa **Create**. Cuando esté en verde ("Running"), apunta su **Public IP address**.

## 3. Abrir los puertos 80 y 443 en Oracle
1. En la instancia → pulsa el enlace de la **Subnet** → **Security Lists** → la de "Default…".
2. **Add Ingress Rules** (dos reglas): Source CIDR `0.0.0.0/0`, IP Protocol `TCP`, Destination Port `80`; y otra igual con `443`.

(El script del paso 6 abre también el cortafuegos interno de la máquina.)

## 4. Un nombre gratis (necesario para el candado HTTPS)
Los móviles solo dejan conectar con `wss://` si hay certificado, y el certificado necesita un nombre.
1. Entra en https://www.duckdns.org (con tu cuenta de Google o GitHub).
2. Crea un subdominio, por ejemplo `gymcrew-julen` → será `gymcrew-julen.duckdns.org`.
3. En **current ip** pon la IP pública de tu máquina y pulsa **update ip**.

## 5. Entrar en la máquina y subir la app
En tu ordenador (PowerShell, Terminal o similar), en la carpeta donde está la clave y `gymcrew.zip`:

```
ssh -i clave.key ubuntu@IP_PUBLICA
```
(si te dice que la clave tiene permisos demasiado abiertos: `chmod 600 clave.key`). Desde otra ventana del ordenador:

```
scp -i clave.key gymcrew.zip ubuntu@IP_PUBLICA:~
```

## 6. Instalar (un solo comando)
Ya dentro de la máquina:

```
sudo apt-get install -y unzip
unzip -o gymcrew.zip -d gymcrew
cd gymcrew
sudo bash server/setup.sh gymcrew-julen.duckdns.org
```
Cambia el dominio por el tuyo. El script instala Node.js y Caddy (el que pone el HTTPS solo), copia la app,
crea el servicio que se arranca solo al encender la máquina y activa una copia de seguridad diaria de los datos.

## 7. Probar
- Abre `https://gymcrew-julen.duckdns.org` en el móvil: es la app, servida desde tu máquina.
- **Ajustes → Servidor** debe poner "Conectado ✅". A partir de ahí, añadir amigos con su código, el chat y los grupos y lo social van por tu servidor.
- Tus amigos abren esa misma dirección (puedes añadirla a la pantalla de inicio desde el navegador).

Si abres la app desde otro sitio (otro hosting), en **Ajustes → Servidor** pega `https://gymcrew-julen.duckdns.org` y pulsa *Guardar y conectar*.
También puedes fijarlo en `config.js` (`serverUrl`).

## Mantenimiento
- Ver registros: `sudo journalctl -u gymcrew -f`
- Reiniciar: `sudo systemctl restart gymcrew`
- Actualizar la app: sube un `gymcrew.zip` nuevo y repite el paso 6 (los datos se conservan en `/var/lib/gymcrew`).
- Copias: `/var/backups/gymcrew/` (una al día, se guardan 14).

## Fotos y vídeos
- Se suben por HTTP a `/media` (el WebSocket solo admite mensajes de 16 KB) y se guardan en `/var/lib/gymcrew/media/` (carpeta `media` junto a `db.json`; se puede cambiar con `MEDIA_DIR`). Caddy ya hace de proxy para esa ruta, no hay que tocar nada.
- Límites: foto ≤ 600 KB, vídeo ≤ 4 MB, 60 archivos y 40 MB por persona, 40 subidas por hora. El tipo se comprueba por los primeros bytes (JPEG, PNG, WebP, MP4, WebM).
- Caducan solos: publicaciones a los 30 días, historias a las 25 h. Se borran antes si la persona borra la publicación o «sus datos compartidos».
- **Privacidad:** quien administra el servidor puede ver los archivos de la carpeta. Cualquier persona con el enlace exacto (id aleatorio) puede verlos hasta que caduquen. Los archivos no entran en la copia de seguridad diaria.
- Para vaciarlo todo: `sudo rm -rf /var/lib/gymcrew/media/*` y borra el campo `media` de `db.json` (con el servicio parado).

## Cosas que debes saber
- **Privacidad**: los mensajes y las cuentas se guardan en un archivo (`/var/lib/gymcrew/db.json`) **sin cifrar de extremo a extremo**; quien administre la máquina (tú) podría leerlos. No uses esto para prometer privacidad total a otras personas sin decírselo.
- **Sin contraseña**: cada móvil guarda una clave secreta aleatoria. Si borras los datos del navegador, pierdes esa cuenta y tendrás un código nuevo. Una cuenta = un dispositivo por ahora.
- **Lo social es de confianza limitada**: el servidor valida formato y tamaños, pero no comprueba que un récord sea real (cada móvil calcula los suyos).
- **Oracle** puede recuperar instancias gratuitas que estén casi sin uso durante días y puede cambiar sus condiciones: revisa su página de Always Free de vez en cuando.
- **Moderación mínima**: cada persona puede bloquear, reportar un mensaje, salir de un grupo y borrar todo lo que compartió. Los reportes se guardan en `db.json` (campo `reports`) para que quien administra el servidor los revise a mano; no hay panel ni avisos automáticos.
- **Seguridad**: hay límites de mensajes por segundo, tamaño, amigos, grupos y creación/unión de grupos por hora.
