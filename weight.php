<?php
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['truck_number'])) {
  $_SESSION['truck_number'] = $_POST['truck_number'];
}
?>

<!DOCTYPE html>
<html lang="id">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ailox</title>
  <link rel="stylesheet" href="index.css">
  <script src="jquery-3.7.1.min.js"></script>
</head>

<body>
  <div class="container">
    <input type="text" id="truck-number" value="<?= $_SESSION['truck_number'] ?>" hidden>
    <input type="text" id="truck-weight" value="" hidden>
    <h2 id="title">Truck Weight Scan</h2>

    <video id="camera-object" autoplay></video>

    <div class="image-container">
      <img id="imagePreview">
    </div>

    <div class="statustext" id="statusText"></div>

    <div id=response></div>

    <div class="result-container">
      <h3>Hasil OCR:</h3>
      <pre id="outputText"><i>Hasil OCR akan muncul di sini...</i></pre>
    </div>
  </div>

  <script async src="https://docs.opencv.org/4.5.1/opencv.js"></script>

  <script>
    document.addEventListener("DOMContentLoaded", function() {
      const video = document.getElementById("camera-object");
      const img = document.getElementById("imagePreview");
      const outputText = document.getElementById("outputText");
      let stream = null;
      let lastFrameData = null;
      let isProcessingOCR = false;

      function startCamera() {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment"
            }
          })
          .then(newStream => {
            stream = newStream;
            video.srcObject = stream;
            video.style.display = "block";
            img.style.display = "none";
            outputText.innerText = "Hasil OCR akan muncul di sini...";

            video.addEventListener("loadedmetadata", () => {
              console.log("📷 Video metadata loaded.");
              requestAnimationFrame(checkFrameChanges);
            });
          })
          .catch(error => {
            console.error("Error membuka kamera:", error);
          });
      }

      function getPixelData(video) {
        if (video.videoWidth === 0 || video.videoHeight === 0) return null;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
      }

      function hasSignificantChange(newFrame, oldFrame) {
        if (!oldFrame) return true;
        let diffCount = 0;
        let totalPixels = newFrame.data.length / 4;
        let sampleRate = 10;
        let threshold = totalPixels * 0.05;

        for (let i = 0; i < newFrame.data.length; i += 4 * sampleRate) {
          let rDiff = Math.abs(newFrame.data[i] - oldFrame.data[i]);
          let gDiff = Math.abs(newFrame.data[i + 1] - oldFrame.data[i + 1]);
          let bDiff = Math.abs(newFrame.data[i + 2] - oldFrame.data[i + 2]);

          if (rDiff > 15 || gDiff > 15 || bDiff > 15) {
            diffCount++;
            if (diffCount > threshold) return true;
          }
        }
        return false;
      }

      function checkFrameChanges() {
        if (!stream || isProcessingOCR) {
          requestAnimationFrame(checkFrameChanges);
          return;
        }

        let newFrameData = getPixelData(video);
        if (!newFrameData) {
          requestAnimationFrame(checkFrameChanges);
          return;
        }

        if (hasSignificantChange(newFrameData, lastFrameData)) {
          lastFrameData = newFrameData;
          processOCR(newFrameData);
        }
        requestAnimationFrame(checkFrameChanges);
      }

      async function processOCR(frameData) {
        if (!stream || isProcessingOCR) return;
        isProcessingOCR = true;
        let imageData = getImageFromFrame(frameData);
        let detectedText = await runOCR(imageData);

        if (detectedText && detectedText.trim()) {
          console.log("📖 Teks terdeteksi! Mengambil gambar...");
          captureImage(imageData, detectedText);
        }
        isProcessingOCR = false;
      }

      function getImageFromFrame(frameData) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = frameData.width;
        canvas.height = frameData.height;
        ctx.putImageData(frameData, 0, 0);
        return canvas.toDataURL("image/png");
      }

      function postData(truck_weight, truck_number) {
        $.ajax({
          url: 'save.php',
          method: 'POST',
          data: {
            truck_weight,
            truck_number,
          },
          success: (response) => {
            console.log(response);
            $("#response").text(response);
          }
        });
      }

      function captureImage(imageData, detectedText) {
        $('#truck-weight').val(detectedText);
        postData($('#truck-weight').val(), $('#truck-number').val());
        img.src = imageData;
        img.style.display = "block";
        video.style.display = "none";
        outputText.innerText = detectedText;

        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          stream = null;
        }

        setTimeout(() => {
          window.location.href = "plate.php";
        }, 2000);
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
            body: formData
          });
          const data = await response.json();
          return data.ParsedResults?.[0]?.ParsedText || "";
        } catch (error) {
          console.error("❌ Error saat OCR:", error);
          return "";
        }
      }

      startCamera();
    });
  </script>
</body>

</html>