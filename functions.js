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

    imageUploadInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            // Clear existing images to load only one image at a time
            images = [];
    
            const file = files[0]; // Get the first selected file
    
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


function handleCanvasClick(e) {
    const x = e.clientX;
    const y = e.clientY;

    // Find the index of the clicked image
    activeImageIndex = findClickedImage(x, y);

    // Redraw the canvas to reflect the selected image and show/hide the rotation button
    drawImagesOnCanvas();
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

function handleRotationButtonMouseDown(e) {
    const x = e.clientX;
    const y = e.clientY;

    // Find the index of the clicked image
    activeImageIndex = findClickedImage(x, y);

    // Check if the mouse click is within the rotation button
    if (activeImageIndex !== -1 && e.button !== 2) {
        const image = images[activeImageIndex];
        const buttonX = image.x + image.width / 2;
        const buttonY = image.y - 15; // Adjust the vertical position of the button as needed
        const buttonRadius = 15; // Adjust the button size as needed

        // Calculate the distance from the click to the rotation button center
        const distance = Math.sqrt((x - buttonX) ** 2 + (y - buttonY) ** 2);

        // Check if the click is within the rotation button
        if (distance <= buttonRadius) {
            isRotating = true;
            rotatingImageIndex = activeImageIndex;
            // Store the initial rotation angle
            startRotationAngle = images[rotatingImageIndex].rotation;
        }
    }
}

// Function to handle rotation when the mouse is moved
function handleRotation(e) {
    if (isRotating) {
        const x = e.clientX;
        const y = e.clientY;
        const image = images[rotatingImageIndex];

        // Calculate the angle of rotation based on mouse movement
        const deltaX = x - canvas.width / 2;
        const deltaY = canvas.height / 2 - y;
        const angle = Math.atan2(deltaY, deltaX) - Math.atan2(startY, startX);
        rotateImage((angle * 180) / Math.PI); // Convert radians to degrees
    }
}

// Function to stop rotation when the mouse is released
function stopRotation() {
    isRotating = false;
    rotatingImageIndex = -1;
}

function saveAction() {
    // Save the current state (e.g., images array) in the history
    const currentState = JSON.stringify(images);
    actionHistory.push(currentState);
    currentActionIndex = actionHistory.length - 1;
}

function undo() {
    if (currentActionIndex > 0) {
        currentActionIndex--;
        const previousState = JSON.parse(actionHistory[currentActionIndex]);
        images = previousState;
        drawImagesOnCanvas();
    }
}

function redo() {
    if (currentActionIndex < actionHistory.length - 1) {
        currentActionIndex++;
        const nextState = JSON.parse(actionHistory[currentActionIndex]);
        images = nextState;
        drawImagesOnCanvas();
    }
}