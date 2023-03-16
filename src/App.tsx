// App.tsx

import { useEffect, useRef, useState } from "react";

type Result = {
  name: string;
  confidence: string;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

function App() {
  const [results, setResults] = useState<Result[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false); // Nouvel état de chargement

  const startCamera = async () => {
    if (videoRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    }
  };

  useEffect(() => {
    startCamera();
  }, []);

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        const width = videoRef.current.videoWidth;
        const height = videoRef.current.videoHeight;
        canvasRef.current.width = width;
        canvasRef.current.height = height;

        context.drawImage(videoRef.current, 0, 0, width, height);

        const imageData = context.getImageData(0, 0, width, height);
        context.putImageData(imageData, 0, 0);

        return new Promise<Blob>((resolve) => {
          canvasRef.current &&
            canvasRef.current.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              }
            }, "image/jpeg");
        });
      }
    }
    return null;
  };

  const submitImage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const imageBlob = await captureImage();

    if (imageBlob) {
      const formData = new FormData();
      formData.append("image", imageBlob);

      const response = await fetch("http://127.0.0.1:8000/face_recognition", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResults(data.results);
      setIsLoading(false);
    }
  };

  const buttonStyles = (isLoading: boolean): React.CSSProperties => {
    return {
      display: "block",
      width: "100%",
      maxWidth: "300px",
      padding: "12px 24px",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "bold",
      textAlign: "center",
      textTransform: "uppercase",
      backgroundColor: "#333",
      color: "#fff",
      cursor: !isLoading ? "pointer" : "progress",
    };
  };
  return (
    <form
      onSubmit={(e) => submitImage(e)}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "sans-serif",
        color: "white",
        background: "#000",
        minHeight: "100vh",
      }}
    >
      <h1>Face Recognition</h1>
      <br />
      <video ref={videoRef} autoPlay></video>
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
      <br />
      <button type="submit" style={buttonStyles(false)}>
        Submit Image
      </button>
      <br />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {results.map((item) => {
          const str = item.name;
          const fileName = str.slice(0, str.lastIndexOf(".")); 
          const words = fileName.split("_"); 
          const capitalizedWords = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)); 
          const name = capitalizedWords.join(" ");
          
          return (
            <div>
              <h1>Name: {name}</h1>
              <br />
              <h1>Confidence: {item.confidence}</h1>
            </div>
          );
        })}
      </div>
    </form>
  );
}

export default App;
