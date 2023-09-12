// Constants for resize handles and other variables
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageUploadInput = document.getElementById('file-input');
const clearCanvasButton = document.getElementById('clear-canvas-button');
const saveButton = document.getElementById('save-button');
const loadButton = document.getElementById('load-button');
const addPhotoButton = document.getElementById('add-photo-button');
const contextMenu = document.getElementById('context-menu');
const deleteImageOption = document.getElementById('delete-image');
const zoomOutButton = document.getElementById('zoom-out-button');
const resizeHandleSize =1; // Size of the resize handles
const canvasSizeFactor = 2;

let images = [];
let isDragging = false;
let isResizing = false;
let activeImageIndex = -1;
let startX, startY, startWidth, startHeight;
let resizingHandleIndex = -1;
let canvasOffsetX = 0;
let canvasOffsetY = 0;
let isCanvasDragging = false;
let canvasBackgroundColor = 'white';


// Add event listeners to buttons
clearCanvasButton.addEventListener('click', clearCanvas);
saveButton.addEventListener('click', () => {

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
        console.log(fileName);
        saveCanvas(fileName);
    }
});

loadButton.addEventListener('click', () => {
    loadCanvas();
});

addPhotoButton.addEventListener('click', () => {
    imageUploadInput.click();
});

imageUploadInput.addEventListener('change', (e) => {
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

// Add an event listener to the button
zoomOutButton.addEventListener('click', () => {
    // Calculate the current canvas width and height
    const currentCanvasWidth = canvas.width;
    const currentCanvasHeight = canvas.height;

    // Calculate the scaling factor for zooming out
    const scaleFactor = 0.9; // Decrease the size by 10%

    // Apply the scaling factor to the canvas and images
    canvas.width *= scaleFactor;
    canvas.height *= scaleFactor;
    canvasOffsetX *= scaleFactor;
    canvasOffsetY *= scaleFactor;

    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        image.x *= scaleFactor;
        image.y *= scaleFactor;
        image.width *= scaleFactor;
        image.height *= scaleFactor;
    }

    // Redraw all images on the canvas with the new positions and sizes
    drawImagesOnCanvas();

    // Toggle the 'canvas-border' class to show/hide the canvas border
    canvas.classList.toggle('canvas-border', canvas.width <= currentCanvasWidth && canvas.height <= currentCanvasHeight);
});


// Event listener for the canvas mousedown event
canvas.addEventListener('mousedown', handleCanvasMouseDown);

// Event listener for the canvas mousemove event
canvas.addEventListener('mousemove', handleCanvasMouseMove);

// Event listener for the canvas mouseup event
canvas.addEventListener('mouseup', handleCanvasMouseUp);

canvas.addEventListener('wheel', handleCanvasWheel);

canvas.addEventListener('mouseleave', handleCanvasMouseLeave);

canvas.addEventListener('dragstart', handleCanvasDragStart);

canvas.addEventListener('contextmenu', handleCanvasContextMenu);

canvas.addEventListener('zoomOutButton',zoomOutButton);



// Function to handle canvas mousedown event
function handleCanvasMouseDown(e) {
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
            resizingHandleIndex = getResizingHandleIndex(imageX, imageY, x , y );
            startWidth = width;
            startHeight = height;
        } else {
            // Clicking inside the image but not in a resize handle, enable dragging
            isDragging = true;
            startX = x - imageX;
            startY = y - imageY;

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
}

// Function to handle canvas mousemove event
function handleCanvasMouseMove(e) {
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
}

// Function to handle canvas mouseup event
function handleCanvasMouseUp() {
    isDragging = false;
    isResizing = false;
    resizingHandleIndex = -1;
    isCanvasDragging = false;
    canvasStartX = 0;
    canvasStartY = 0;
}

function handleCanvasWheel(e) {
    e.preventDefault();

    // Find the index of the image that the mouse is over
    const x = e.clientX;
    const y = e.clientY;
    const hoveredImageIndex = findClickedImage(x, y);

    // Calculate the current canvas width and height
    const currentCanvasWidth = canvas.width;
    const currentCanvasHeight = canvas.height;

    // Calculate the maximum canvas size based on the current window size
    const maxWidth = window.innerWidth * canvasSizeFactor;
    const maxHeight = window.innerHeight * canvasSizeFactor;

    if (hoveredImageIndex !== -1) {
        const image = images[hoveredImageIndex];
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1; // Increase or decrease size based on scroll direction

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
    } else {
        // Mouse is over empty space, allow zooming the canvas
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1; // Increase or decrease size based on scroll direction

        // Calculate the new canvas width and height after scaling
        const newCanvasWidth = currentCanvasWidth * scaleFactor;
        const newCanvasHeight = currentCanvasHeight * scaleFactor;

        // Check if the new canvas size exceeds the maximum canvas size
        if (newCanvasWidth <= maxWidth && newCanvasHeight <= maxHeight) {
            // Calculate the scaling factor for the images
            const imageScaleFactor = 1 / scaleFactor;

            // Update the canvas size
            canvas.width = newCanvasWidth;
            canvas.height = newCanvasHeight;
            

            // // Update the x and y positions of all images to maintain their positions relative to the canvas
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                image.x *= scaleFactor;
                image.y *= scaleFactor;
                image.width *= imageScaleFactor;
                image.height *= imageScaleFactor;
            }
            
            // Redraw all images on the canvas with the new positions and sizes
            drawImagesOnCanvas();
            // Update the canvas size display in the navbar
            updateCanvasSizeDisplay(canvas.width, canvas.height);
        }
    }
}


function handleCanvasMouseLeave() {
    isDragging = false;
    isResizing = false;
}

function handleCanvasDragStart(e) {
    e.preventDefault();
}

function handleCanvasContextMenu(e) {
    e.preventDefault(); // Prevent the default context menu

    const x = e.clientX;
    const y = e.clientY;

    // Find the index of the clicked image
    activeImageIndex = findClickedImage(x, y);

    // Check if the mouse click is within any resizing handle
    if (activeImageIndex !== -1) {
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.style.display = 'block';


        // Handle the "Delete Image" option
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
        contextMenu.style.display = 'none';
    }
}


//-------------------------------------------------------------------------------------------


function updateCanvasSizeDisplay(width, height) {
    const canvasWidthElement = document.getElementById('canvas-width');
    const canvasHeightElement = document.getElementById('canvas-height');

    if (canvasWidthElement && canvasHeightElement) {
        canvasWidthElement.textContent = width;
        canvasHeightElement.textContent = height;
    }
}


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

// Function to save the canvas
function saveCanvas(userFileName) {
    const fileNameInput = document.getElementById('file-name');;
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

// Function to load the canvas
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

                    // Calculate the center position of the canvas
                    const centerX = canvas.width / 2  - img.width / 2;
                    const centerY = canvas.height / 2 - img.height / 2;

                    // Add the loaded image to the canvas
                    images.push({ img, x: centerX, y: centerY, width: img.width, height: img.height });

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

// Function to delete an image
function deleteImage() {
    if (activeImageIndex !== -1) {
        images.splice(activeImageIndex, 1);
        activeImageIndex = -1; // Deselect any active image
        canvasBackgroundColor = calculateCanvasAverageColor();
        drawImagesOnCanvas(); // Redraw the canvas without the deleted image
    }
}

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

// 4 Function to draw all images on the canvas
function drawImagesOnCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        ctx.drawImage(image.img, image.x, image.y, image.width, image.height);
    }
    // Apply the stored average color as the background color
    canvas.style.backgroundColor = canvasBackgroundColor;
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

// Function to handle window resize
function handleWindowResize() {
    // Calculate the maximum canvas size based on the current window size
    const maxWidth = window.innerWidth * canvasSizeFactor;
    const maxHeight = window.innerHeight * canvasSizeFactor;

    // Ensure that the canvas width and height do not exceed the calculated maximum canvas size
    canvas.width = Math.min(window.innerWidth, maxWidth);
    canvas.height = Math.min(window.innerHeight, maxHeight);

    // Update the canvas size display in the navbar
    const canvasSizeElement = document.getElementById('canvas-size');
    canvasSizeElement.textContent = `Canvas Size: ${canvas.width} x ${canvas.height}`;
    

    // Redraw all images on the canvas when the window is resized
    drawImagesOnCanvas();
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

// 7 Function to maintain aspect ratio when resizing
function maintainAspectRatio(newWidth, newHeight, originalWidth, originalHeight) {
    const aspectRatio = originalWidth / originalHeight;
    if (newWidth / newHeight > aspectRatio) {
        return { width: newHeight * aspectRatio, height: newHeight };
    } else {
        return { width: newWidth, height: newWidth / aspectRatio };
    }
}


// Add an event listener for the window's resize event
window.addEventListener('resize', handleWindowResize);

// Initial canvas setup when the page loads
handleWindowResize();
