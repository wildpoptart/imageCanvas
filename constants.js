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
const rotateClockwiseButton = document.getElementById('rotate-clockwise-button');
const rotateCounterClockwiseButton = document.getElementById('rotate-counter-clockwise-button');



let images = [];
let isDragging = false;
let isResizing = false;
let activeImageIndex = -1;
let startX, startY, startWidth, startHeight,startRotationAngle ;
let resizingHandleIndex = -1;
let canvasOffsetX = 0;
let canvasOffsetY = 0;
let isCanvasDragging = false;
let canvasBackgroundColor = 'white';
let isRotating = false;
let rotatingImageIndex = -1;
const resizeHandleSize =1; // Size of the resize handles
const canvasSizeFactor = 2;
