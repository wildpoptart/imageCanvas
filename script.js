const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let images = []; // Array to store multiple images
let isDragging = false;
let isResizing = false;
let activeImageIndex = -1; // Index of the active (selected) image
let startX, startY, startWidth, startHeight;
const resizeHandleSize = 8; // Size of the resize handles
// Variables to track canvas position
let canvasOffsetX = 0;
let canvasOffsetY = 0;
let isCanvasDragging = false;
let isBorderApplied = false; // Variable to track the border state
let canvasBackgroundColor = 'transparent'; // Default value


// Add a click event listener to the "Clear Canvas" button
document.getElementById('clear-canvas-button').addEventListener('click', clearCanvas);

// 1 Event listener for the "Add Photo" button
document.getElementById('add-photo-button').addEventListener('click', () => {
    // Trigger the file input click event
    document.getElementById('file-input').click();
});

// Add a click event listener to the "Save" button
document.getElementById('save-button').addEventListener('click', () => {

    // Check if there are images in the canvas
    if (images.length === 0) {
        alert("Cannot save a blank canvas. Add images before saving.");
        return;
    }

    // Create a modal dialog for entering the file name
    const fileName = prompt('Enter file name:', 'canvas_image');
    
    // Check if the user provided a file name
    if (fileName !== null && fileName.trim() !== '') {
        // Call the saveCanvas function with the provided file name
        saveCanvas(fileName);
    }
});

// Add a click event listener to the "Load" button
document.getElementById('load-button').addEventListener('click', () => {
    loadCanvas();
});

// Function to clear the canvas
function clearCanvas() {
    // Clear the images array to remove all images from the canvas
    images = [];
    
    // Clear the canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Optionally, you can reset the background color to white
    canvas.style.backgroundColor = 'white';
}

// Function to save the canvas as an image
function saveCanvas(userFileName) {
    const fileNameInput = document.getElementById('file-name');
    const extension = '.png'; // Change this to match the desired file format (e.g., '.jpg', '.png')
    const fileName = userFileName.trim() === '' ? 'canvas_image' + extension : userFileName + extension;
    const canvasDataURL = canvas.toDataURL();
    const blob = dataURItoBlob(canvasDataURL);
    const url = URL.createObjectURL(blob);

    // Create a download link for the saved canvas image
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);

    // Hide the file name input field after saving
    fileNameInput.style.display = 'none';
    fileNameInput.value = ''; // Clear the input value
}

// Function to convert data URI to Blob
function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

// Function to load a saved canvas image
function loadCanvas() {
    const input = document.createElement('input');
    input.type = 'file';

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    // Clear existing images
                    images = [];
                    // Add the loaded image to the canvas
                    images.push({ img, x: 0, y: 0, width: img.width, height: img.height });
                    // Calculate the average color and set it as the canvas background color
                    canvasBackgroundColor = calculateCanvasAverageColor();
                    // Redraw the canvas
                    drawImagesOnCanvas();
                };
            };
            reader.readAsDataURL(file);
        }
    });

    input.click();
}

// 2 Function to handle file upload
document.getElementById('file-input').addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.src = e.target.result;

                    // Add the image-resizable class here
                    img.classList.add('image-resizable');

                    img.onload = () => {
                        images.push({ img, x: 0, y: 0, width: img.width, height: img.height });
                        // Calculate the average color and set it as the canvas background color
                        canvasBackgroundColor = calculateCanvasAverageColor();
                        drawImagesOnCanvas();
                    };
                };
                reader.readAsDataURL(file);
            }
        }
    }
});

// Function to find the index of the clicked image
function findClickedImage(mouseX, mouseY) {
    for (let i = images.length - 1; i >= 0; i--) {
        const image = images[i];
        const { x, y, width, height } = image;
        if (
            mouseX >= x &&
            mouseX <= x + width &&
            mouseY >= y &&
            mouseY <= y + height
        ) {
            return i;
        }
    }
    return -1; // No image was clicked
}

// 5 Function to draw resize handles
function drawResizeHandles(x, y, width, height) {
    ctx.fillStyle = 'blue';
    const halfSize = resizeHandleSize / 2;
    ctx.fillRect(x - halfSize, y - halfSize, resizeHandleSize, resizeHandleSize); // Top-left
    ctx.fillRect(x + width - halfSize, y - halfSize, resizeHandleSize, resizeHandleSize); // Top-right
    ctx.fillRect(x - halfSize, y + height - halfSize, resizeHandleSize, resizeHandleSize); // Bottom-left
    ctx.fillRect(x + width - halfSize, y + height - halfSize, resizeHandleSize, resizeHandleSize); // Bottom-right
}

// 6 Function to check if the mouse is within the resize handles
function isMouseInResizeHandles(x, y, mouseX, mouseY, width, height) {
    return (
        (mouseX >= x - resizeHandleSize / 2 && mouseX <= x + width + resizeHandleSize / 2) &&
        (mouseY >= y - resizeHandleSize / 2 && mouseY <= y + height + resizeHandleSize / 2)
    );
}

// 7 Function to maintain aspect ratio when resizing
function maintainAspectRatio(newWidth, newHeight, originalWidth, originalHeight) {
    const aspectRatio = originalWidth / originalHeight;
    if (newWidth / newHeight > aspectRatio) {
        return { width: newHeight * aspectRatio, height: newHeight };
    } else {
        return { width: newWidth, height: newWidth / aspectRatio };
    }
}

// 4 Function to draw all images on the canvas
function drawImagesOnCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        ctx.drawImage(image.img, image.x, image.y, image.width, image.height);
        if (i === activeImageIndex && isResizing) {
            drawResizeHandles(image.x, image.y, image.width, image.height);
        }
    }
    // Apply the stored average color as the background color
    canvas.style.backgroundColor = canvasBackgroundColor;
}

// Function to check if the mouse is within the resize handles
function isMouseInResizeHandles(x, y, mouseX, mouseY, width, height) {
    const halfSize = resizeHandleSize / 2;
    const cornerRectangles = [
        [x - halfSize, y - halfSize, resizeHandleSize, resizeHandleSize], // Top-left
        [x + width - halfSize, y - halfSize, resizeHandleSize, resizeHandleSize], // Top-right
        [x - halfSize, y + height - halfSize, resizeHandleSize, resizeHandleSize], // Bottom-left
        [x + width - halfSize, y + height - halfSize, resizeHandleSize, resizeHandleSize] // Bottom-right
    ];

    for (let i = 0; i < cornerRectangles.length; i++) {
        const [rectX, rectY, rectWidth, rectHeight] = cornerRectangles[i];
        if (
            mouseX >= rectX &&
            mouseX <= rectX + rectWidth &&
            mouseY >= rectY &&
            mouseY <= rectY + rectHeight
        ) {
            return true;
        }
    }

    return false;
}

// Function to get the index of the resizing handle being dragged
function getResizingHandleIndex(x, y, mouseX, mouseY) {
    const halfSize = resizeHandleSize / 2;
    const handlePositions = [
        [x - halfSize, y - halfSize], // Top-left
        [x + halfSize, y - halfSize], // Top-right
        [x - halfSize, y + halfSize], // Bottom-left
        [x + halfSize, y + halfSize]  // Bottom-right
    ];

    for (let i = 0; i < handlePositions.length; i++) {
        const [handleX, handleY] = handlePositions[i];
        if (mouseX >= handleX && mouseX <= handleX + resizeHandleSize && mouseY >= handleY && mouseY <= handleY + resizeHandleSize) {
            return i;
        }
    }

    return -1; // No handle found
}

function calculateAverageColor(image) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0, image.width, image.height);
    
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    const data = imageData.data;
    
    let totalRed = 0;
    let totalGreen = 0;
    let totalBlue = 0;
    
    for (let i = 0; i < data.length; i += 4) {
        totalRed += data[i];
        totalGreen += data[i + 1];
        totalBlue += data[i + 2];
    }
    
    const pixelCount = data.length / 4;
    const avgRed = Math.round(totalRed / pixelCount);
    const avgGreen = Math.round(totalGreen / pixelCount);
    const avgBlue = Math.round(totalBlue / pixelCount);
    
    return `rgb(${avgRed}, ${avgGreen}, ${avgBlue})`;
}

function calculateCanvasAverageColor() {
    let totalRed = 0;
    let totalGreen = 0;
    let totalBlue = 0;
    
    for (let i = 0; i < images.length; i++) {
        const image = images[i].img;
        const avgColor = calculateAverageColor(image);
        const colorComponents = avgColor.match(/\d+/g).map(Number);
        
        totalRed += colorComponents[0];
        totalGreen += colorComponents[1];
        totalBlue += colorComponents[2];
    }
    
    const avgRed = Math.round(totalRed / images.length);
    const avgGreen = Math.round(totalGreen / images.length);
    const avgBlue = Math.round(totalBlue / images.length);
    
    return `rgb(${avgRed}, ${avgGreen}, ${avgBlue})`;
}

function deleteImage() {
    if (activeImageIndex !== -1) {
        images.splice(activeImageIndex, 1);
        activeImageIndex = -1; // Deselect any active image
        canvasBackgroundColor = calculateCanvasAverageColor();
        drawImagesOnCanvas(); // Redraw the canvas without the deleted image
    }
}

canvas.addEventListener('mousedown', (e) => {
    const x = e.clientX;
    const y = e.clientY;

    // Find the index of the clicked image
    activeImageIndex = findClickedImage(x, y);

    // Check if the mouse click is within any resizing handle
    if (activeImageIndex !== -1 && e.button !== 2) {
        const image = images[activeImageIndex];
        const { x: imageX, y: imageY, width, height } = image;

        if (isMouseInResizeHandles(imageX, imageY, x - imageX, y - imageY, width, height)) {
            isResizing = true;
            resizingHandleIndex = getResizingHandleIndex(imageX, imageY, x - imageX, y - imageY);
            startWidth = width;
            startHeight = height;
        } else {
            // Clicking inside the image but not in a resize handle, enable dragging
            isDragging = true;
            startX = x - imageX;
            startY = y - imageY;

            // Show the resize handles (blue boxes) when the image is clicked
            images[activeImageIndex].showResizeHandles = true;

            // Move the clicked image to the front (last index) in the images array
            images.push(images.splice(activeImageIndex, 1)[0]);

            // Update activeImageIndex to point to the clicked image
            activeImageIndex = images.length - 1;

            // Redraw the canvas to reflect the change in the z-order
            drawImagesOnCanvas();
        }
    } else if (e.button !== 2) { // Check if the left mouse button (button 2 is the right mouse button)
        // Clicked on empty space or with the left mouse button, start moving the canvas
        isCanvasDragging = true;
        canvasStartX = x;
        canvasStartY = y;
    }
});


canvas.addEventListener('mousemove', (e) => {
    if (isResizing) {
        const x = e.clientX;
        const y = e.clientY;
        const image = images[activeImageIndex];
        const { x: imageX, y: imageY } = image;

        const newWidth = startWidth + (x - (imageX + startWidth / 2));
        const newHeight = startHeight + (y - (imageY + startHeight / 2));

        // Maintain aspect ratio while resizing
        const aspectCorrectedSize = maintainAspectRatio(
            newWidth,
            newHeight,
            image.img.width,
            image.img.height
        );

        image.width = aspectCorrectedSize.width;
        image.height = aspectCorrectedSize.height;

        drawImagesOnCanvas();
    } else if (isDragging) {
        const x = e.clientX;
        const y = e.clientY;

        if (activeImageIndex !== -1) {
            const image = images[activeImageIndex];
            image.x = x - startX;
            image.y = y - startY;

            drawImagesOnCanvas();
        }
    } else if (isCanvasDragging) {
        const x = e.clientX;
        const y = e.clientY;

        // Calculate the distance moved
        const deltaX = x - canvasStartX;
        const deltaY = y - canvasStartY;

        // Update canvas position
        canvasOffsetX += deltaX;
        canvasOffsetY += deltaY;

        for (let i = 0; i < images.length; i++) {
            images[i].x += deltaX;
            images[i].y += deltaY;
        }

        // Redraw all images on the canvas with the new positions
        drawImagesOnCanvas();

        // Update start position for the next move
        canvasStartX = x;
        canvasStartY = y;
    }
});


canvas.addEventListener('wheel', (e) => {
    e.preventDefault();

    // Find the index of the image that the mouse is over
    const x = e.clientX;
    const y = e.clientY;
    const hoveredImageIndex = findClickedImage(x, y);

    if (hoveredImageIndex !== -1) {
        const image = images[hoveredImageIndex];
        const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9; // Increase or decrease size based on scroll direction

        // Calculate the cursor's position relative to the image's center
        const cursorXRelativeToCenter = x - (image.x + image.width / 2);
        const cursorYRelativeToCenter = y - (image.y + image.height / 2);

        // Update the image's width and height with the scaling factor
        image.width *= scaleFactor;
        image.height *= scaleFactor;

        // Adjust the image's position to keep the cursor position relative to the center unchanged
        image.x = x - cursorXRelativeToCenter - image.width / 2;
        image.y = y - cursorYRelativeToCenter - image.height / 2;

        // Redraw the canvas to reflect the change
        drawImagesOnCanvas();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
    resizingHandleIndex = -1;
    isCanvasDragging = false;
    canvasStartX = 0;
    canvasStartY = 0;
    
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    isResizing = false;
});

// Prevent default dragging behavior of the browser
canvas.addEventListener('dragstart', (e) => {
    e.preventDefault();
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Prevent the default context menu

    const x = e.clientX;
    const y = e.clientY;

    // Find the index of the clicked image
    activeImageIndex = findClickedImage(x, y);

    // Check if the mouse click is within any resizing handle
    if (activeImageIndex !== -1) {
        const contextMenu = document.getElementById('context-menu');
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.style.display = 'block';

        // Handle the "Delete Image" option
        const deleteImageOption = document.getElementById('delete-image');
        deleteImageOption.addEventListener('click', () => {
            deleteImage(); // Implement the deleteImage function to remove the selected image
            contextMenu.style.display = 'none'; // Hide the context menu
        });

        // Handle clicks outside of the context menu to hide it
        window.addEventListener('click', (e) => {
            if (!contextMenu.contains(e.target)) {
                contextMenu.style.display = 'none';
            }
        });
    }else {
        // Hide the context menu if it's visible and the user right-clicks in empty space
        const contextMenu = document.getElementById('context-menu');
        contextMenu.style.display = 'none';
    }
});


// Function to handle window resize and redraw the canvas
function handleWindowResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Redraw all images on the canvas when the window is resized
    drawImagesOnCanvas();
}

// Add an event listener for the window's resize event
window.addEventListener('resize', handleWindowResize);

// Initial canvas setup when the page loads
handleWindowResize();