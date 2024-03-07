# Clonación del Repositorio e Instalación

Para comenzar, asegúrate de tener Node.js y npm instalados en tu sistema.

Antes de ejecutar la página, asegúrate de tener los siguientes archivos:

- Dentro de la carpeta `api`, necesitarás el conjunto de datos con el nombre 'Datasets'.
- Además, asegúrate de tener una carpeta llamada 'Sketches' dentro de la carpeta principal por si acaso está vacía.

En la terminal, sigue estos pasos para ejecutar la página:

1. **Correr Flask**: Dirígete a la carpeta `api` (puedes utilizar un entorno virtual) y ejecuta el siguiente comando utilizando Python 3:
    ```
    python3 app.py
    ```

2. **Correr la Aplicación de React**: Dentro de la raíz del proyecto, ejecuta los siguientes comandos:
    ```
    npm install
    npm start
    ```

## Datos Importantes

Si deseas modificar Flask y que refleje los cambios en la aplicación, necesitas ajustar las rutas de las solicitudes en el archivo `App.js` dentro de la carpeta `src`. Cambia todas las URL de las solicitudes para que apunten a tu puerto local en lugar de al servidor público. Si no realizas este ajuste, los cambios no se reflejarán, ya que las solicitudes se enviarán al servidor Flask público.

# Despliegue de la Aplicación

Para desplegar la aplicación en un servidor, necesitarás instalar Nginx y Gunicorn.

Asegúrate de que el repositorio esté ubicado en la ruta: `/var/www/`.

1. Recomendable tener un entorno virtual corriendo.
2. Instala todas las librerías que utiliza `app.py`.
3. Instala Gunicorn:
    ```
    pip install gunicorn
    ```

Crea un archivo en la ruta `/etc/systemd/system/` llamado `react-flask.service`:


Que debe contener esto:
```
[Unit]
Description=A simple Flask API
After=network.target

[Service]
User=root
WorkingDirectory=/var/www/image-sketch-project/api
ExecStart=/var/www/image-sketch-project/api/venv/bin/gunicorn -b :8000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```
Guarda el archivo y ejecuta los siguientes comandos:

```
$ sudo systemctl daemon-reload
$ sudo systemctl start react-flask
$ sudo systemctl enable react-flask
```
Puedes verificar el estado de la aplicación Flask con:
```
sudo systemctl status react-flask
```

Para la aplicación de React:

**IMPORTANTE:** Cambia las rutas que utiliza `App.js` para hacer solicitudes a la ruta que está usando Flask (puerto 8000).

Dentro del repositorio, en la terminal, ejecuta:

```
npm run deploy
```
Instala Nginx:
```
sudo apt-get install nginx
```
(si te vas a un browser y buscas la ip de el servidor, deberia salir una pagina standar de nginx)

Edita el archivo `/etc/nginx/sites-available/react-flask.conf`:

```
sudo vi /etc/nginx/sites-available/react-flask.conf
```
Y tener dentro esto:
```
server {
	listen 80;
	root /var/www/image-sketch-project/build;
	index index.html;

	access_log /var/log/nginx/image-sketch-project.access.log;
	error_log /var/log/nginx/image-sketch-project.error.log;

	location / {
		try_files $uri $uri/ =404;
	}

	location /api{
		include proxy_params;
		proxy_pass :8000;
	}
}
```
Crea un enlace simbólico:
```
$ sudo ln -s  /etc/nginx/sites-enabled/react-flask.conf
$ sudo systemctl reload nginx
```

Con esto, la página debería estar desplegada con la IP del servidor público.
