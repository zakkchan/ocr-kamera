document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Script loaded!");

    const cameraButton = document.getElementById("cameraButton");
    const switchButton = document.getElementById("switchCamera");
    const buttonLanjut = document.getElementById("buttonLanjut");
    const deleteButton = document.getElementById("deleteButton");
    const video = document.getElementById("video");
    const img = document.getElementById("imagePreview");
    const outputText = document.getElementById("outputText");
    const statusText = document.getElementById("statusText");

    let stream = null;
    let usingBackCamera = true;
    let isProcessingOCR = false;
    let lastFrameData = null; // Simpan data piksel frame sebelumnya

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
                buttonLanjut.style.display = "none";
                deleteButton.style.display = "none";
                outputText.innerText = "Hasil OCR akan muncul di sini...";
                statusText.innerText = "📷 Mencari teks...";
                statusText.style.backgroundColor = "orange";

                video.addEventListener("loadedmetadata", () => {
                    console.log("📷 Video metadata loaded.");
                    requestAnimationFrame(checkFrameChanges);
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

    function getPixelData(video) {
        if (video.videoWidth === 0 || video.videoHeight === 0) {
            return null;
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    function hasSignificantChange(newFrame, oldFrame) {
        if (!oldFrame) return true; // Jika belum ada frame sebelumnya, anggap berubah
    
        let diffCount = 0;
        let totalPixels = newFrame.data.length / 4; // Total jumlah piksel
        let sampleRate = 10; // Cek setiap 10 piksel untuk efisiensi
        let threshold = totalPixels * 0.05; // Jika lebih dari 5% piksel berubah, anggap signifikan
    
        for (let i = 0; i < newFrame.data.length; i += 4 * sampleRate) {
            let rDiff = Math.abs(newFrame.data[i] - oldFrame.data[i]);
            let gDiff = Math.abs(newFrame.data[i + 1] - oldFrame.data[i + 1]);
            let bDiff = Math.abs(newFrame.data[i + 2] - oldFrame.data[i + 2]);
    
            if (rDiff > 15 || gDiff > 15 || bDiff > 15) {
                diffCount++;
                if (diffCount > threshold) return true; // Jika perbedaan signifikan, return true
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
            console.log("📷 Perubahan terdeteksi, menjalankan OCR...");
            lastFrameData = newFrameData;
            processOCR(newFrameData);
        } else {
            console.log("⏳ Tidak ada perubahan, menunggu...");
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
        } else {
            console.log("❌ Tidak ada teks terdeteksi, tetap mencari...");
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

    function captureImage(imageData, detectedText) {
        console.log("📸 Mengambil gambar dengan teks:", detectedText);

        img.src = imageData;
        img.style.display = "block";
        video.style.display = "none";
        buttonLanjut.style.display = "block";
        deleteButton.style.display = "block";
        statusText.style.display = "none";

        outputText.innerText = detectedText;

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
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

    buttonLanjut.addEventListener("click", () =>{
        console.log("Lanjut Kehalaman Berikutnya");
        window.location.href = "lanjut.html";
    });

    deleteButton.addEventListener("click", () => {
        console.log("🗑️ Gambar dihapus, kembali ke mode kamera...");
        startCamera();
    });
});
