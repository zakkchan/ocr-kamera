document.addEventListener("DOMContentLoaded", function () {
  console.log("Script loaded!");

  const cameraButton = document.getElementById("cameraButton");
  const switchButton = document.getElementById("switchCamera");
  const scanButton = document.getElementById("scanImage");
  const deleteButton = document.getElementById("deleteButton");
  const video = document.getElementById("video");
  const img = document.getElementById("imagePreview");
  const outputText = document.getElementById("outputText");
  const progress = document.querySelector(".progress");

  let stream = null;
  let usingBackCamera = true;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  async function startCamera() {
    try {
      const constraints = {
        video: {
          facingMode: usingBackCamera ? "environment" : "user",
        },
      };

      stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      video.style.display = "block";
      video.play();
      cameraButton.style.display = "none";
      scanButton.style.display = "block";
      switchButton.style.display = "block";
    } catch (error) {
      console.error("Error membuka kamera:", error);
    }
  }

  cameraButton.addEventListener("click", startCamera);

  switchButton.addEventListener("click", async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    usingBackCamera = !usingBackCamera;
    await startCamera();
  });

  scanButton.addEventListener("click", async () => {
    if (!stream) {
      alert("Aktifkan kamera terlebih dahulu");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageBase64 = canvas.toDataURL("image/png").split(",")[1];

    img.src = canvas.toDataURL("image/png");
    img.style.display = "block";
    video.style.display = "none";
    deleteButton.style.display = "block";

    stream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    stream = null;
    cameraButton.style.display = "block";
    progress.style.display = "block";
    outputText.innerText = "Menganalisis teks...";

    try {
      const apiKey = "K84167834388957"; // Ganti dengan API Key kamu
      const formData = new FormData();
      formData.append("apikey", apiKey);
      formData.append("base64Image", `data:image/png;base64,${imageBase64}`);
      formData.append("language", "eng");
      formData.append("isOverlayRequired", true);
      formData.append("OCREngine", 2);

      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.ParsedResults && data.ParsedResults.length > 0) {
        const parsedText = data.ParsedResults[0].ParsedText.trim();
        outputText.innerText = parsedText.length > 0 ? parsedText : "Teks tidak terdeteksi.";
      } else {
        outputText.innerText = "Teks tidak terdeteksi.";
      }
    } catch (error) {
      console.error("OCR Error:", error);
      outputText.innerText = "Gagal membaca teks.";
    }

    progress.style.display = "none";
  });

  deleteButton.addEventListener("click", () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
      stream = null;
    }
    video.style.display = "none";
    img.style.display = "none";
    outputText.innerText = "Hasil OCR akan muncul di sini...";
    progress.innerText = "Progress: 0%";
    cameraButton.style.display = "block";
    scanButton.style.display = "none";
    deleteButton.style.display = "none";
    switchButton.style.display = "none";
  });
});
