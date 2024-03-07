import "./App.css";
import React, { useState, useRef, useEffect } from "react";
import CanvasDraw from "react-canvas-draw";
import Button from "react-bootstrap/Button";
import axios from "axios";

function App() {
  const [backendIP, setBackendIP] = useState("45.137.194.69:8000");
  const [reload, setReload] = useState(false);
  const [brushRadius, setBrushRadius] = useState(3);
  const [brushColor, setBrushColor] = useState("black");
  const canvasRef = useRef();
  // Datos imagenes URL
  const [imageData, setImageData] = useState(null);
  const [canvasImage, setCanvasImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef(null);
  const timer = useRef(null);
  const [appTitle, setAppTitle] = useState("Sketch App");
  const [intensityIncrement, setIntensityIncrement] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [limit_blured_timer, setLimit_Blured_Timer] = useState(null);

  const LoadConfig = () => {
    var json = require("./config.json");
    setAppTitle(json["title"]);
    setBackendIP(json["backend_ip"]);
    setBrushRadius(json["brush_radius"]);
    setBrushColor(json["brush_color"]);
    setIntensityIncrement(json["intensityIncrement"]);
    setSpeed(json["speed"]); // Agrega esta línea para establecer la velocidad desde el archivo de configuración
    setLimit_Blured_Timer(json["limit_blured_timer"]);
  };

  useEffect(() => {
    LoadConfig();
    const fetchData = async () => {
      try {
        const response = await axios.get("http://" + backendIP + "/get_image");
        setImageData(response.data);
        setCanvasImage(response.data.imagen);
        setIsLoading(false);
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };
    fetchData();
  }, [reload, backendIP]);

  useEffect(() => {
    if (imageData) {
      const intervalTime = 2000 / speed; // Calcula el tiempo del intervalo basado en la velocidad
      let counter = 0;
      intervalRef.current = setInterval(async () => {
        const formData = new FormData();
        formData.append("company", imageData.datos.company);
        formData.append("name_file", imageData.datos.file_name);

        formData.append("blur", counter);
        try {
          const response = await axios.post(
            "http://" + backendIP + "/get_blurred_image",
            formData
          );
          setCanvasImage(response.data.imagenblur);
          counter += intensityIncrement;
        } catch (error) {
          console.error("Error al obtener los datos:", error);
        }
      }, intervalTime);

      // Detener el intervalo después de 4 segundos (en milisegundos)

      timer.current = setTimeout(() => {
        clearInterval(intervalRef.current);
        counter = 0;
      }, limit_blured_timer);
    }
  }, [imageData, intensityIncrement, limit_blured_timer, speed, backendIP]);

  const handleReload = () => {
    clearInterval(intervalRef.current);
    clearTimeout(timer.current);
    setReload(!reload);
  };

  // const handleClearInterval = () => {
  //  clearInterval(intervalRef.current);
  //  console.log("clear");
  // };
  

  const UploadToFlask = async (dataUrl) => {
    try {
      const blob = await fetch(dataUrl).then((r) => r.blob());

      const formData = new FormData();
      formData.append("id", imageData.datos.id);
      formData.append("title", imageData.datos.title);
      formData.append("company", imageData.datos.company);
      formData.append(
        "image",
        blob,
        imageData.datos.company +
          "_" +
          imageData.datos.title +
          "_" +
          imageData.datos.id +
          ".jpeg"
      );
      axios
        .post("http://" + backendIP + "/upload_image", formData)
        .then((response) => {})
        .catch((error) => {
          console.error("Error uploading image:", error);
        });
      //newImage();
    } catch (error) {
      console.error("Error fetching image:", error);
    }
  };

  const downloadImageWithWhiteBackground = (dataUrl) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const image = new Image();
    image.src = dataUrl;
    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      context.fillStyle = "#fff"; // color de fondo
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);

      const whiteBackgroundImageUrl = canvas.toDataURL("image/jpeg");
      // Actualizar el estado con la imagen en fondo blanco
      UploadToFlask(whiteBackgroundImageUrl);
    };
  };

  // Función para obtener la URL de datos de la imagen del canvas
  const getCanvasImage = () => {
    const dataUrl = canvasRef.current.getDataURL();
    downloadImageWithWhiteBackground(dataUrl);
  };

  const handleSave = () => {
    clearInterval(intervalRef.current);
    clearTimeout(timer.current);
    getCanvasImage();
    handleReload();
    handleClearCanvas();
  };

  const handleClearCanvas = () => {
    canvasRef.current.clear();
  };

  const undo = () => {
    canvasRef.current.undo();
  };

  const DrawingControls = () => (
    <div className="drawing-controls">
      <Button variant="primary" onClick={handleClearCanvas}>
        <i className="bi bi-trash"></i>
      </Button>
      <Button variant="primary" onClick={undo}>
        <i className="bi bi-arrow-counterclockwise"></i>
      </Button>
      <label htmlFor="brushSize"></label>
      <br />
    </div>
  );

  return (
    <div className="App">
      <h1>{appTitle}</h1>
      <div className="elementos-dibujos-boton">
        {isLoading && !imageData && (
          <div className="loader-container">
            <div className="loader-1 center">
              <span></span>
            </div>
          </div>
        )}
        {imageData && (
          <>
            <div className="elementos-dibujos">
              <div className="image-container">
                <img
                  src={`data:image/jpeg;base64,${canvasImage}`}
                  alt="Imagen"
                  className="responsive-image"
                />
              </div>

              <div className="canvas-container">
                <CanvasDraw
                  ref={canvasRef}
                  brushRadius={brushRadius}
                  brushColor={brushColor}
                  catenaryColor="black"
                  hideGrid={true}
                  hideInterface={true}
                  lazyRadius={0}
                  onChange={LoadConfig}
                  style={{ border: "3px solid #000", borderRadius: "10px" }}
                />
              </div>
              <DrawingControls />
            </div>
            <Button
              className="boton-frontal"
              variant="primary"
              style={{ padding: "5px 10px", marginRight: "10px" }}
              onClick={handleReload}
            >
              Reload Image
            </Button>
            <Button
              className="boton-frontal"
              variant="primary"
              onClick={handleSave}
              style={{ marginTop: "20px" }}
            >
              Save
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
