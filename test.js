// Event listener for mouse down on the rotation button
document.getElementById('rotate-button').addEventListener('mousedown', handleRotationButtonMouseDown);

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

// rotateClockwiseButton.addEventListener('click', () => rotateImage(true));
// rotateCounterClockwiseButton.addEventListener('click', () => rotateImage(false));


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

canvas.addEventListener('mousedown', handleCanvasMouseDown);

canvas.addEventListener('mousedown', handleRotationButtonMouseDown);

canvas.addEventListener('mousemove', handleRotation);

canvas.addEventListener('mouseup', stopRotation);

// Event listener for canvas click to select an image
canvas.addEventListener('click', handleCanvasClick);



// Add an event listener for the window's resize event
window.addEventListener('resize', handleWindowResize);

// Initial canvas setup when the page loads
handleWindowResize();



const actionHistory = [];
let currentActionIndex = -1;

