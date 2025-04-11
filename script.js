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

    // Güvenlik ayarları
    const securitySettings = {
        maxFileSize: 20 * 1024 * 1024, // 20MB maksimum dosya boyutu
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
        maxWidth: 8000, // Maksimum görsel genişliği
        maxHeight: 8000, // Maksimum görsel yüksekliği
        minWidth: 50, // Minimum görsel genişliği
        minHeight: 50, // Minimum görsel yüksekliği
    };

    let compressedImage = null;
    let originalFileName = '';
    let pendingDownload = null;

    // Custom alert function
    function showCustomAlert(message, callback) {
        alertMessage.textContent = message;
        customAlert.classList.add('show');
        
        alertOkBtn.onclick = () => {
            customAlert.classList.remove('show');
            if (callback) callback();
        };
    }

    // Güvenlik kontrolleri
    function validateFile(file) {
        // Dosya tipi kontrolü
        if (!securitySettings.allowedTypes.includes(file.type)) {
            throw new Error('Desteklenmeyen dosya formatı. Lütfen JPEG, PNG, GIF, WEBP veya BMP formatında bir görsel yükleyin.');
        }

        // Dosya boyutu kontrolü
        if (file.size > securitySettings.maxFileSize) {
            throw new Error(`Dosya boyutu çok büyük. Maksimum dosya boyutu: ${formatFileSize(securitySettings.maxFileSize)}`);
        }

        return true;
    }

    // Görsel boyutlarını kontrol et
    function validateImageDimensions(img) {
        return new Promise((resolve, reject) => {
            if (img.width > securitySettings.maxWidth || img.height > securitySettings.maxHeight) {
                reject(new Error(`Görsel boyutları çok büyük. Maksimum boyutlar: ${securitySettings.maxWidth}x${securitySettings.maxHeight}px`));
            }
            if (img.width < securitySettings.minWidth || img.height < securitySettings.minHeight) {
                reject(new Error(`Görsel boyutları çok küçük. Minimum boyutlar: ${securitySettings.minWidth}x${securitySettings.minHeight}px`));
            }
            resolve(true);
        });
    }

    // Dosya adını temizle ve güvenli hale getir
    function sanitizeFileName(fileName) {
        // Uzantıyı kaldır
        let name = fileName.replace(/\.[^/.]+$/, "");
        
        // Windows'da yasaklı olan karakterleri temizle
        name = name.replace(/[<>:"/\\|?*]/g, '');
        
        // Maksimum uzunluğu kontrol et
        name = name.substring(0, 100);
        
        // Boş string kontrolü
        if (!name.trim()) {
            name = 'gorsel';
        }
        
        return name;
    }

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#007bff';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Click to upload
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Handle file upload
    function handleFile(file) {
        try {
            // Dosya güvenlik kontrollerini yap
            validateFile(file);

            // Dosya adını temizle ve güvenli hale getir
            originalFileName = sanitizeFileName(file.name);

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = async () => {
                    try {
                        // Görsel boyutlarını kontrol et
                        await validateImageDimensions(img);
                        compressImage(img, file.size);
                    } catch (error) {
                        showCustomAlert(error.message);
                    }
                };
                img.onerror = () => {
                    showCustomAlert('Görsel yüklenirken bir hata oluştu. Lütfen geçerli bir görsel dosyası yükleyin.');
                };
                img.src = e.target.result;
            };
            reader.onerror = () => {
                showCustomAlert('Dosya okuma hatası. Lütfen tekrar deneyin.');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            showCustomAlert(error.message);
        }
    }

    // Compress image
    function compressImage(img, originalFileSize) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0);

        // Initial quality
        let quality = 0.9;
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        let compressedSize = getBase64Size(compressedDataUrl);

        // Binary search to find the right quality
        let min = 0;
        let max = 1;
        let attempts = 0;
        const maxAttempts = 10;

        while (compressedSize > 200 * 1024 && attempts < maxAttempts) {
            quality = (min + max) / 2;
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            compressedSize = getBase64Size(compressedDataUrl);

            if (compressedSize > 200 * 1024) {
                max = quality;
            } else {
                min = quality;
            }
            attempts++;
        }

        // Update UI
        previewImage.src = compressedDataUrl;
        originalSize.textContent = formatFileSize(originalFileSize);
        newSize.textContent = formatFileSize(compressedSize);
        previewContainer.style.display = 'block';
        compressedImage = compressedDataUrl;
    }

    // Calculate base64 string size
    function getBase64Size(base64String) {
        const padding = base64String.endsWith('==') ? 2 : 1;
        return (base64String.length * 3) / 4 - padding;
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Generate random string of specified length
    function generateRandomString(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // Download compressed image
    downloadBtn.addEventListener('click', () => {
        if (compressedImage) {
            // Generate random 4-character string
            const randomString = generateRandomString(4);
            const newFileName = originalFileName + '-' + randomString + '.jpg';
            
            // Show custom alert with the new filename
            showCustomAlert('Dosya adı: ' + newFileName, () => {
                const link = document.createElement('a');
                link.download = newFileName;
                link.href = compressedImage;
                link.click();
            });
        }
    });
}); 