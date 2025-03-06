document.addEventListener("DOMContentLoaded", function () {
  console.log("Script loaded!");

  const cameraButton = document.getElementById("cameraButton");
  const scanButton = document.getElementById("scanImage");
  const deleteButton = document.getElementById("deleteButton");
  const video = document.getElementById("video");
  const img = document.getElementById("imagePreview");
  const outputText = document.getElementById("outputText");
  const progress = document.querySelector(".progress");

  let stream = null;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Fungsi untuk membuka kamera
  cameraButton.addEventListener("click", async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      video.style.display = "block";
      video.play();
      cameraButton.style.display = "none";
      scanButton.style.display = "block";
    } catch (error) {
      console.error("Error membuka kamera:", error);
    }
  });

  // Fungsi untuk menangkap gambar dan melakukan OCR.Space
  scanButton.addEventListener("click", async () => {
    if (!stream) {
      alert("Aktifkan kamera terlebih dahulu");
      return;
    }

    // Ambil gambar dari video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageBase64 = canvas.toDataURL("image/png").split(",")[1]; // Ambil Base64 tanpa prefix

    img.src = canvas.toDataURL("image/png");
    img.style.display = "block";
    video.style.display = "none";
    deleteButton.style.display = "block";

    // Hentikan kamera setelah mengambil gambar
    stream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    stream = null;

    cameraButton.style.display = "block";

    // Mulai proses OCR.Space
    progress.style.display = "block";
    outputText.innerText = "Menganalisis teks...";

    try {
      const apiKey = "K84167834388957"; // Ganti dengan API Key kamu
      const formData = new FormData();
      formData.append("apikey", apiKey);
      formData.append("base64Image", `data:image/png;base64,${imageBase64}`);
      formData.append("language", "eng"); // Bisa diganti "ind" untuk Bahasa Indonesia

      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.ParsedResults && data.ParsedResults.length > 0) {
        outputText.innerText = data.ParsedResults[0].ParsedText;
      } else {
        outputText.innerText = "Gagal membaca teks.";
      }
    } catch (error) {
      console.error("OCR Error:", error);
      outputText.innerText = "Gagal membaca teks.";
    }

    progress.style.display = "none";
  });

  // Fungsi untuk menutup kamera dan menghapus gambar
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
  });
});
