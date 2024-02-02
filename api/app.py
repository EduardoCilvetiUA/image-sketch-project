from flask import Flask, jsonify, request
import os
import random
from werkzeug.utils import secure_filename
import csv
import base64
import re

import cv2
import matplotlib.pyplot as plt
from PIL import Image
from io import BytesIO
import numpy as np
from flask_cors import CORS

from ipywidgets import interact, widgets


    
def upload_to_csv(id, draw_name, company):
    data = []
    with open('Datasets/'+company+'/train.csv', 'r', encoding= 'utf-8', newline='') as f:
        # Specify the delimiter as semicolon
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            if 'ProductId' in row and str(row['ProductId']) == str(id):
                row['Sketch_name'] = draw_name
                print(draw_name)
                print(company)
            data.append(row)

    fieldnames = data[0].keys()
    with open('Datasets/'+company+'/train.csv', 'w', encoding= 'utf-8', newline='') as f:
        # Specify the delimiter as semicolon
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=';')
        writer.writeheader()
        writer.writerows(data)

def buscar_id_csv(id, carpeta):
    with open('Datasets/'+carpeta+'/train.csv', 'r', encoding= 'utf-8', newline='') as f:
        # Specify the delimiter as semicolon
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            if 'ProductId' in row and str(row['ProductId']) == str(id):
                return row['Title']
    return ''



app = Flask(__name__, static_folder="../build", static_url_path='/')
CORS(app, origins="http://45.137.194.69")


@app.route('/get_blurred_image', methods=['POST'])
def get_blurred_image():
    if 'company' not in request.form or 'name_file' not in request.form or 'blur' not in request.form:
        print("Missing parameters")
        print(request.form)
        return jsonify({'error': 'Missing parameters'}), 400
    
    sldr = lambda v, mi, ma, st: widgets.FloatSlider(
        value=v,
        min=mi,
        max=ma,
        step=st,
        continuous_update=False
    )
    root = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(root, 'Datasets', request.form["company"], 'train', request.form["name_file"])
    

    img_logo = cv2.imdecode(np.fromfile(file_path, np.uint8), cv2.IMREAD_COLOR)
    if img_logo is None:
        print("Image not found")
        print(file_path)
        return
    img_logo = cv2.cvtColor(img_logo, cv2.COLOR_BGR2RGB)
    x = request.form['blur']
    x = int(x)
    if x % 2 == 0:  # If x is even
        x += 1
    blur = cv2.GaussianBlur(img_logo,(x,x), 0)
    im_pil = Image.fromarray(blur)
    img_io = BytesIO()
    im_pil.save(img_io, 'JPEG')
    img_io.seek(0)

    image_content = img_io.getvalue()

    base64_image = base64.b64encode(image_content).decode('utf-8')


    return jsonify({"imagenblur": base64_image})


@app.route('/upload_image', methods=['POST'])
def upload_image():
    if 'id' not in request.form or 'company' not in request.form or 'title' not in request.form or 'image' not in request.files:
        return jsonify({'error': 'Missing parameters'}), 400

    id = request.form['id']
    image_name = request.form['title']
    file = request.files['image']
    company = request.form['company']

    

    # Asegúrate de que la carpeta para cargar imágenes exista
    upload_folder = 'Sketches'
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)


    # Guarda la imagen con un nombre seguro
    filename = secure_filename(file.filename)
    file.save(os.path.join(upload_folder, filename))

    upload_to_csv(id, filename, company)

    # Aquí puedes realizar acciones adicionales según tus necesidades
    # (por ejemplo, guardar información en una base de datos)
    return jsonify({'id': id, 'image_name': image_name, 'message': 'Image uploaded successfully'})


def add_white_background(image_path):
    img = Image.open(image_path)
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        alpha = img.convert('RGBA').split()[-1]
        bg = Image.new("RGBA", img.size, (255,255,255,255))
        bg.paste(img, mask=alpha)
        return bg.convert('RGB')
    else:
        img = img.convert('RGB')
        return img


@app.route('/get_image', methods=['GET'])
def get_image():
    found = False
    while found == False:
        dataset_folders = [f.path for f in os.scandir('Datasets') if f.is_dir()]
        random_folder = os.path.join(random.choice(dataset_folders), 'train')
        segundo_folder = random_folder.split(os.path.sep)[1]
        
        image_files = [f for f in os.listdir(random_folder) if f.endswith('.jpg') or f.endswith('.png')]
        
        random_image = random.choice(image_files)
        """
        while True:
            random_image = random.choice(image_files)
            if re.match("^[a-zA-Z0-9_\-\. ]+$", random_image):
                break
        """

        id = random_image.split('_')[-1][:-4]

        #buscar id en csv
        title = buscar_id_csv(id, segundo_folder)
        if title != '':
            found = True

    with open(random_folder + os.path.sep + random_image, "rb") as image_file:
        img_data = image_file.read()

    img = add_white_background(BytesIO(img_data))

    img.save(random_folder + os.path.sep + random_image, format="JPEG")
    with open(random_folder + os.path.sep + random_image, "rb") as image_file:
        random_image_file = base64.b64encode(image_file.read()).decode('utf-8')

    datos_json = {
        'id': id,
        'title': title,
        'company': segundo_folder,
        'file_name': random_image
    }


    return jsonify({'datos': datos_json, 'imagen': random_image_file})



if __name__ == '__main__':
    app.run(debug=True)