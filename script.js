document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.querySelector('.upload-btn');
    const previewContainer = document.getElementById('previewContainer');
    const previewImage = document.getElementById('previewImage');
    const originalSize = document.getElementById('originalSize');
    const newSize = document.getElementById('newSize');
    const downloadBtn = document.getElementById('downloadBtn');
    const customAlert = document.getElementById('customAlert');
    const alertMessage = document.getElementById('alertMessage');
    const alertOkBtn = document.getElementById('alertOkBtn');
    const imageWidth = document.getElementById('imageWidth');
    const imageHeight = document.getElementById('imageHeight');

    let compressedImage = null;
    let originalFileName = '';
    let currentImage = null;
    let isResizing = false;

    // Input değişikliklerini dinle
    imageWidth.addEventListener('input', debounce(handleDimensionChange, 500));
    imageHeight.addEventListener('input', debounce(handleDimensionChange, 500));

    // Debounce fonksiyonu
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Boyut değişikliklerini handle et
    function handleDimensionChange() {
        if (!currentImage || isResizing) return;

        const newWidth = parseInt(imageWidth.value);
        const newHeight = parseInt(imageHeight.value);

        if (isNaN(newWidth) || isNaN(newHeight) || newWidth < 1 || newHeight < 1) {
            return;
        }

        if (newWidth > 1920 || newHeight > 1920) {
            showCustomAlert('Maksimum boyut 1920x1920 pikseldir.');
            // Önceki değerlere geri dön
            imageWidth.value = Math.min(currentImage.width, 1920);
            imageHeight.value = Math.min(currentImage.height, 1920);
            return;
        }

        isResizing = true;
        resizeAndCompress(newWidth, newHeight, currentImage, getBase64Size(currentImage.src));
        isResizing = false;
    }

    // Custom alert function
    function showCustomAlert(message) {
        alertMessage.textContent = message;
        customAlert.classList.add('show');
        alertOkBtn.onclick = () => customAlert.classList.remove('show');
    }

    // Dosya adını temizle
    function sanitizeFileName(fileName) {
        let name = fileName.replace(/\.[^/.]+$/, "");
        name = name.replace(/[<>:"/\\|?*]/g, '');
        name = name.substring(0, 100);
        return name || 'gorsel';
    }

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFile(files[0]);
    });

    // Click to upload
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    // Handle file upload
    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            showCustomAlert('Lütfen bir görsel dosyası yükleyin.');
            return;
        }

        originalFileName = sanitizeFileName(file.name);
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => processImage(img, file.size);
            img.onerror = () => showCustomAlert('Görsel yüklenirken hata oluştu.');
            img.src = e.target.result;
        };
        
        reader.onerror = () => showCustomAlert('Dosya okuma hatası.');
        reader.readAsDataURL(file);
    }

    function processImage(img, originalFileSize) {
        currentImage = img;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = img.width;
        let height = img.height;
        
        // Update dimension inputs with original values
        isResizing = true; // Prevent auto-update loop
        imageWidth.value = Math.min(width, 1920);
        imageHeight.value = Math.min(height, 1920);
        isResizing = false;
        
        // Maksimum boyut 1920x1920
        const maxSize = 1920;
        if (width > maxSize || height > maxSize) {
            if (width > height) {
                height = Math.round(height * (maxSize / width));
                width = maxSize;
            } else {
                width = Math.round(width * (maxSize / height));
                height = maxSize;
            }
        }

        resizeAndCompress(width, height, img, originalFileSize);
    }

    function resizeAndCompress(width, height, img, originalFileSize) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // 300KB hedef boyutu
        const targetSize = 300 * 1024;
        let quality = 0.95;
        let compressedDataUrl;
        let currentSize;

        // Binary search ile kaliteyi ayarla
        let min = 0;
        let max = 1;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            quality = (min + max) / 2;
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            currentSize = getBase64Size(compressedDataUrl);

            if (currentSize > targetSize) {
                max = quality;
            } else {
                min = quality;
            }

            attempts++;
        } while (Math.abs(currentSize - targetSize) > 1024 && attempts < maxAttempts);

        // Eğer boyut hala 300KB'den küçükse, padding ekle
        if (currentSize < targetSize) {
            const binary = atob(compressedDataUrl.split(',')[1]);
            const paddingNeeded = targetSize - currentSize;
            const paddingData = new Uint8Array(paddingNeeded);
            let paddedBinary = binary;
            
            // JPEG yorum markörü ekle (FF FE)
            paddedBinary += String.fromCharCode(0xFF, 0xFE);
            
            // Padding ekle
            for (let i = 0; i < paddingNeeded; i++) {
                paddedBinary += String.fromCharCode(paddingData[i]);
            }
            
            compressedDataUrl = 'data:image/jpeg;base64,' + btoa(paddedBinary);
            currentSize = targetSize;
        }

        // Önizleme ve boyut bilgilerini güncelle
        previewImage.src = compressedDataUrl;
        originalSize.textContent = formatFileSize(originalFileSize);
        newSize.textContent = formatFileSize(currentSize);
        previewContainer.style.display = 'block';
        compressedImage = compressedDataUrl;
    }

    // Calculate base64 string size
    function getBase64Size(base64String) {
        const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
        return Math.floor((base64String.length * 3) / 4) - padding;
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Download handler
    downloadBtn.addEventListener('click', () => {
        if (compressedImage) {
            const link = document.createElement('a');
            link.download = originalFileName + '_300kb.jpg';
            link.href = compressedImage;
            link.click();
        }
    });
}); 