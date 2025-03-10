document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ Script loaded!");

  const cameraButton = document.getElementById("cameraButton");
  const switchButton = document.getElementById("switchCamera");
  const deleteButton = document.getElementById("deleteButton");
  const video = document.getElementById("video");
  const img = document.getElementById("imagePreview");
  const outputText = document.getElementById("outputText");
  const statusText = document.getElementById("statusText");

  let stream = null;
  let usingBackCamera = true;
  let isCapturing = false;
  let lastOCRText = "";

  function startCamera() {
      console.log("🎥 Membuka kamera...");
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
          video: { facingMode: usingBackCamera ? "environment" : "user" }
      };

      navigator.mediaDevices.getUserMedia(constraints)
          .then(newStream => {
              stream = newStream;
              video.srcObject = stream;
              video.style.display = "block";
              img.style.display = "none";
              cameraButton.style.display = "none";
              switchButton.style.display = "block";
              statusText.style.display = "block";
              deleteButton.style.display = "none";
              outputText.innerText = "Hasil OCR akan muncul di sini...";
              statusText.innerText = "📷 Mencari teks...";
              statusText.style.backgroundColor = "orange";

              video.addEventListener("loadedmetadata", () => {
                  console.log("📷 Video metadata loaded.");
                  requestAnimationFrame(checkForText);
              });
          })
          .catch(error => {
              alert("❌ Tidak dapat mengakses kamera.");
              console.error("Error membuka kamera:", error);
          });
  }

  cameraButton.addEventListener("click", startCamera);
  switchButton.addEventListener("click", async () => {
      usingBackCamera = !usingBackCamera;
      await startCamera();
  });

  function getImageDataFromCanvas(video) {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
          return null;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      return canvas.toDataURL("image/png"); // Kembalikan base64 image
  }

  async function checkForText() {
      if (!stream || isCapturing) {
          requestAnimationFrame(checkForText);
          return;
      }

      let imageData = getImageDataFromCanvas(video);
      if (!imageData) {
          requestAnimationFrame(checkForText);
          return;
      }

      let detectedText = await runOCR(imageData);

      if (detectedText && detectedText.trim() && detectedText !== lastOCRText) {
          console.log("📖 Teks terdeteksi! Mengambil gambar...");
          captureImage(imageData, detectedText);
          return;
      }

      requestAnimationFrame(checkForText);
  }

  function captureImage(imageData, detectedText) {
    console.log("📸 Mengambil gambar dengan teks:", detectedText);
    isCapturing = true;

    img.src = imageData;
    img.style.display = "block";
    video.style.display = "none";
    deleteButton.style.display = "block";
    statusText.style.display = "none";

    outputText.innerText = detectedText;
    lastOCRText = detectedText;

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null; // Pastikan stream dihapus setelah berhenti
    }
}


  async function runOCR(imageData) {
      console.log("📖 Memproses OCR...");
      const formData = new FormData();
      formData.append("apikey", "K88783416288957");
      formData.append("base64Image", imageData);
      formData.append("language", "eng");

      try {
          const response = await fetch("https://api.ocr.space/parse/image", {
              method: "POST",
              body: formData,
          });

          const data = await response.json();
          let extractedText = data.ParsedResults?.[0]?.ParsedText || "";
          console.log("OCR Result:", extractedText);
          return extractedText;
      } catch (error) {
          console.error("❌ Error saat OCR:", error);
          return "";
      }
  }

  deleteButton.addEventListener("click", () => {
      console.log("🗑️ Gambar dihapus, kembali ke mode kamera...");
      isCapturing = false; // Biarkan sistem kembali mencari teks lagi
      startCamera();
  });
});


