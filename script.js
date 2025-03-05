document.addEventListener("DOMContentLoaded", async function () {
    console.log("Script loaded!");
  
    const cameraButton = document.getElementById("cameraButton");
    const img = document.getElementById("imagePreview");
    const progress = document.querySelector(".progress");
    const outputText = document.getElementById("outputText");
    const deleteButton = document.getElementById("deleteButton");
    const video = document.getElementById("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    let stream = null;
    let worker = null;
  
    async function initTesseract() {
      console.log("Initializing Tesseract...");
      const { createWorker } = Tesseract;
      worker = await createWorker({
        logger: (m) => {
          console.log(m);
          progress.innerHTML = `Progress: ${(m.progress * 100).toFixed(2)}%`;
        },
      });
      await worker.loadLanguage("eng+ind");
      await worker.initialize("eng+ind");
      console.log("Tesseract Initialized!");
    }
  
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        video.play();
        video.style.display = "block";
      } catch (error) {
        alert("Tidak dapat mengakses kamera.");
      }
    }
  
    async function captureImageAndProcessOCR() {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      img.src = canvas.toDataURL("image/png");
      video.style.display = "none";
      deleteButton.style.display = "block";
  
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
  
      progress.innerHTML = "Processing...";
      outputText.innerHTML = "Processing...";
      if (!worker) {
        await initTesseract();
      }
      try {
        const { data } = await worker.recognize(img.src, {
          dpi: 300,
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", // Hanya huruf dan angka
          psm: 6 // Mode pemrosesan yang lebih akurat untuk teks dalam satu blok
        });
        outputText.innerHTML = data.text;
        progress.innerHTML = "Done!";
      } catch (error) {
        alert("Terjadi kesalahan saat memproses gambar.");
      }
    }
  
    cameraButton.addEventListener("click", async () => {
      await startCamera();
      setTimeout(captureImageAndProcessOCR, 3000); // Ambil gambar setelah 3 detik
    });
  
    deleteButton.addEventListener("click", () => {
      img.src = "";
      outputText.innerHTML = "Hasil OCR akan muncul di sini...";
      progress.innerHTML = "Progress: 0%";
      deleteButton.style.display = "none";
      video.style.display = "block";
    });
  });
