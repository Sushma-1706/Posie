document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const video = document.getElementById('video');
    const previewCanvas = document.getElementById('previewCanvas');
    const previewCtx = previewCanvas.getContext('2d');
    const stripCanvas = document.getElementById('stripCanvas');
    const stripCtx = stripCanvas.getContext('2d');
    const shutterButton = document.getElementById('shutterButton');
    const filterTray = document.getElementById('filterTray');
    const controls = document.querySelector('.camera-controls');
    const countdownEl = document.getElementById('countdown');
    const flashEl = document.getElementById('flash');
    const resultsArea = document.querySelector('.results-area');
    // START: CHANGE - Add new selectors
    const actionButtons = document.getElementById('actionButtons');
    const downloadLink = document.getElementById('downloadLink');
    const deleteButton = document.getElementById('deleteButton');
    // END: CHANGE

    // State
    let stream;
    let currentFilter = 'none';
    const photoCount = 4;
    const captureInterval = 1500;
    const countdownDuration = 3;
    let capturedPhotos = [];

    // Initialize: Get webcam access
    async function init() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            video.srcObject = stream;
            video.addEventListener('loadedmetadata', () => {
                const aspectRatio = video.videoWidth / video.videoHeight;
                previewCanvas.width = previewCanvas.clientWidth;
                previewCanvas.height = previewCanvas.clientWidth / aspectRatio;
                video.play();
                requestAnimationFrame(paintToCanvas);
            });
        } catch (err) {
            console.error("ERROR: Could not access webcam", err);
            alert("Could not access your webcam. Please allow camera access and refresh the page.");
        }
    }
    
    // (paintToCanvas, filterTray listener, and shutterButton listener are unchanged)
    function paintToCanvas() {
        const width = previewCanvas.width;
        const height = previewCanvas.height;
        previewCtx.clearRect(0, 0, width, height);
        previewCtx.save(); // Save the clean state
        previewCtx.translate(width, 0); // Flip horizontally for a mirror effect
        previewCtx.scale(-1, 1);
        previewCtx.filter = currentFilter;
        previewCtx.drawImage(video, 0, 0, width, height);
        previewCtx.restore(); // Restore to normal
        requestAnimationFrame(paintToCanvas);
    }
    
    filterTray.addEventListener('click', (e) => {
        const button = e.target.closest('.filter-button');
        if (!button) return;

        filterTray.querySelector('.active').classList.remove('active');
        button.classList.add('active');

        currentFilter = button.dataset.filter;
    });

    shutterButton.addEventListener('click', () => {
        controls.classList.add('controls-disabled');
        resultsArea.style.display = 'none';
        actionButtons.style.display = 'none';
        capturedPhotos = [];
        startPhotoCapture();
    });

    // START: NEW - Add delete button functionality
    deleteButton.addEventListener('click', () => {
        // Hide the entire results area
        resultsArea.style.display = 'none';

        // Clear the canvas and reset the captured photos array for the next session
        stripCtx.clearRect(0, 0, stripCanvas.width, stripCanvas.height);
        capturedPhotos = [];

        // Controls are already enabled, so the user can take photos again right away
    });
    // END: NEW

    // (startPhotoCapture, runCountdown, takePhoto, and createStrip are unchanged)
    async function startPhotoCapture() {
        for (let i = 0; i < photoCount; i++) {
            await runCountdown();
            takePhoto();
            if (i < photoCount - 1) {
                await new Promise(resolve => setTimeout(resolve, captureInterval));
            }
        }
        createStrip();
    }
    
    function runCountdown() {
        return new Promise(resolve => {
            let count = countdownDuration;
            countdownEl.style.opacity = '1';

            const timer = setInterval(() => {
                countdownEl.textContent = count > 0 ? count : ''; // Use a camera emoji
                if (count <= 0) {
                    clearInterval(timer);
                    setTimeout(() => {
                        countdownEl.style.opacity = '0';
                        resolve();
                    }, 500);
                }
                count--;
            }, 800);
        });
    }

    function takePhoto() {
        flashEl.classList.add('flash-animation');
        setTimeout(() => flashEl.classList.remove('flash-animation'), 400);

        const data = previewCanvas.toDataURL('image/jpeg', 0.9);
        capturedPhotos.push(data);
    }

    function createStrip() {
        const photoWidth = previewCanvas.width;
        const photoHeight = previewCanvas.height;
        const stripPadding = 20;

        stripCanvas.width = photoWidth + (stripPadding * 2);
        stripCanvas.height = (photoHeight * photoCount) + (stripPadding * (photoCount + 1));
        
        stripCtx.fillStyle = 'white';
        stripCtx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);
        
        let loadedImages = 0;
        capturedPhotos.forEach((dataUrl, index) => {
            const img = new Image();
            img.src = dataUrl;
            img.onload = () => {
                const y = (photoHeight + stripPadding) * index + stripPadding;
                stripCtx.drawImage(img, stripPadding, y, photoWidth, photoHeight);
                loadedImages++;
                if (loadedImages === photoCount) {
                    finalizeStrip();
                }
            };
        });
    }
    

    // START: CHANGE - Update how buttons are displayed
    function finalizeStrip() {
        const finalUrl = stripCanvas.toDataURL('image/png');
        downloadLink.href = finalUrl;
        downloadLink.download = `cute_booth_strip_${Date.now()}.png`;
        
        // Show the entire results area, which contains the canvas and buttons
        resultsArea.style.display = 'flex';
        // Show the action buttons container specifically
        actionButtons.style.display = 'flex'; 

        // Re-enable controls
        controls.classList.remove('controls-disabled');
    }
    // END: CHANGE
    
    init();
});