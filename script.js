/**
 * Editor de Puntos Interactivos
 * Aplicación web autónoma para crear puntos interactivos sobre imágenes
 * Desarrollado con HTML, CSS y JavaScript puro
 */

// Elementos DOM principales
const bgUpload = document.getElementById('bg-upload');
const loadUpload = document.getElementById('load-upload');
const backgroundImage = document.getElementById('background-image');
const imageContainer = document.getElementById('image-container');
const imageWrapper = document.getElementById('image-wrapper');
const pointsContainer = document.getElementById('points-container');
const startupMessage = document.getElementById('startup-message');

// Botón de configuración
const configBtn = document.getElementById('config-btn');

// Elementos del modal de configuración
const configModal = document.getElementById('config-modal');
const startingNumberInput = document.getElementById('starting-number');
const saveConfigBtn = document.getElementById('save-config-btn');
const cancelConfigBtn = document.getElementById('cancel-config-btn');

// Panel de detalles
const pointDetailsSidebar = document.getElementById('point-details-sidebar');
const pointDetailsContent = document.getElementById('point-details-content');
const toggleDetailsBtn = document.getElementById('toggle-details-btn');
const closeDetailsBtn = document.getElementById('close-details-btn');
const prevPointBtn = document.getElementById('prev-point-btn');
const nextPointBtn = document.getElementById('next-point-btn');

const addPointIndicator = document.getElementById('add-point-indicator');
const pointPreview = document.getElementById('point-preview');

// Botones de la barra de herramientas
const addPointBtn = document.getElementById('add-point-btn');
const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const zoomResetBtn = document.getElementById('zoom-reset-btn');
const saveBtn = document.getElementById('save-btn');

// Elementos de modal de puntos
const pointModal = document.getElementById('point-modal');
const pointViewMode = document.getElementById('point-view-mode');
const pointEditMode = document.getElementById('point-edit-mode');
const pointTitle = document.getElementById('point-title');
const pointDescription = document.getElementById('point-description');
const pointImageView = document.getElementById('point-image-view');
const editPointBtn = document.getElementById('edit-point-btn');
const deletePointBtn = document.getElementById('delete-point-btn');
const pointTitleInput = document.getElementById('point-title-input');
const pointDescInput = document.getElementById('point-desc-input');
const pointNumberInput = document.getElementById('point-number-input');
const pointImageUpload = document.getElementById('point-image-upload');
const pointImagePreview = document.getElementById('point-image-preview');
const removeImageBtn = document.getElementById('remove-image-btn');
const savePointBtn = document.getElementById('save-point-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

// Elementos de modal de confirmación
const confirmModal = document.getElementById('confirm-modal');
const confirmTitle = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const confirmYesBtn = document.getElementById('confirm-yes-btn');
const confirmNoBtn = document.getElementById('confirm-no-btn');

// Estado global de la aplicación
const state = {
    // Imagen y dimensiones
    backgroundImageLoaded: false,
    backgroundDataUrl: null,
    naturalWidth: 0,
    naturalHeight: 0,

    currentProjectPath: null, // Nueva propiedad para ruta del archivo
    hasUnsavedChanges: false, // Para controlar cambios no guardados

    lastKeyPressTime: 0,
    currentViewerPointId: null,
    
    // Estado de zoom y desplazamiento
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastPosX: 0,
    lastPosY: 0,
    startingPointNumber: 1,

    // Control de puntos
    points: [],
    isAddingPoint: false,
    currentPointId: null,
    currentPointImageDataUrl: null,
    isDraggingPoint: false,
    draggedPointId: null,
    dragStartX: 0,
    dragStartY: 0,
    dragThreshold: 5,
    // Estado del panel de detalles
    detailsVisible: false,
    
    // Callbacks para modal de confirmación
    confirmCallback: null,
    
    // Constantes
    MIN_SCALE: 0.1,
    MAX_SCALE: 10,
    SCALE_FACTOR: 1.2,
    MAX_IMAGE_SIZE: 800
};

/**
 * Funciones de inicialización
 */
function init() {
    // Añadir verificación de compatibilidad
    checkFileSystemCompatibility();
    
    setupEventListeners();
    
    // Mostrar sidebar por defecto en dispositivos grandes
    if (window.innerWidth > 768) {
        setTimeout(() => {
            showDetailsPanel();
        }, 10);
    }
}

function setupEventListeners() {
    // Eventos para cargar imágenes
    bgUpload.addEventListener('change', handleBackgroundUpload);
    loadUpload.addEventListener('change', handleProjectLoad);

// Modificar el evento de carga de proyecto
    if (state.hasFileSystemAccess) {
        // Si el navegador soporta File System Access API, usamos ese método
        loadUpload.style.display = 'none'; // Ocultamos el input file
        document.querySelector('.tool-group label[for="load-upload"]').addEventListener('click', (e) => {
            e.preventDefault();
            handleProjectLoad();
        });
    } else {
        // Si no soporta la API, usamos el input file tradicional
        loadUpload.addEventListener('change', handleProjectLoadFallback);
    }

    // Eventos del visor de imágenes
    document.getElementById('close-image-viewer').addEventListener('click', closeImageViewer);
    document.getElementById('prev-image-btn').addEventListener('click', () => navigateImageViewer('prev'));
    document.getElementById('next-image-btn').addEventListener('click', () => navigateImageViewer('next'));
    document.getElementById('image-viewer-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('image-viewer-modal')) {
            closeImageViewer();
        }
    });
    
    // Eventos de teclado
    document.addEventListener('keydown', (e) => {
        if (!document.getElementById('image-viewer-modal').classList.contains('hidden')) {
            const now = Date.now();
            if (now - state.lastKeyPressTime < 50) return;
            
            state.lastKeyPressTime = now;
            
            if (e.key === 'Escape') {
                closeImageViewer();
            } else if (e.key === 'ArrowLeft') {
                navigateImageViewer('prev');
            } else if (e.key === 'ArrowRight') {
                navigateImageViewer('next');
            }
        }
    });
 
    // Eventos del botón de configuración
    configBtn.addEventListener('click', openConfigModal);
    saveConfigBtn.addEventListener('click', saveConfig);
    cancelConfigBtn.addEventListener('click', closeConfigModal);
    document.querySelector('#config-modal .close-btn').addEventListener('click', closeConfigModal);
    
    // Eventos de la barra de herramientas
    addPointBtn.addEventListener('click', toggleAddPointMode);
    zoomInBtn.addEventListener('click', () => adjustZoom(state.SCALE_FACTOR));
    zoomOutBtn.addEventListener('click', () => adjustZoom(1 / state.SCALE_FACTOR));
    zoomResetBtn.addEventListener('click', resetZoom);
    saveBtn.addEventListener('click', () => saveProject(false));
    toggleDetailsBtn.addEventListener('click', toggleDetailsPanel);
    closeDetailsBtn.addEventListener('click', hideDetailsPanel);
    
    // Eventos del contenedor de imagen (zoom, pan, click)
    imageContainer.addEventListener('wheel', handleMouseWheel);
    imageContainer.addEventListener('mousedown', handleDragStart);
    imageContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    imageContainer.addEventListener('click', handleImageClick);
    
    // Eventos de documento (para movimiento y finalización de arrastre)
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);
    
    // Eventos del modal de puntos
    document.querySelector('.close-btn').addEventListener('click', closePointModal);
    editPointBtn.addEventListener('click', switchToEditMode);
    deletePointBtn.addEventListener('click', confirmDeletePoint);
    savePointBtn.addEventListener('click', savePointData);
    cancelEditBtn.addEventListener('click', switchToViewMode);
    pointImageUpload.addEventListener('change', handlePointImageUpload);
    removeImageBtn.addEventListener('click', removePointImage);
    
    // Eventos del modal de confirmación
    confirmYesBtn.addEventListener('click', handleConfirmYes);
    confirmNoBtn.addEventListener('click', hideConfirmModal);
    
    // Eventos de navegación entre puntos
    prevPointBtn.addEventListener('click', showPreviousPoint);
    nextPointBtn.addEventListener('click', showNextPoint);
    
    // Evento de redimensionamiento de ventana
    window.addEventListener('resize', updateImagePosition);

    // Event listeners para el menú de guardar
    document.getElementById('save-menu-item').addEventListener('click', (e) => {
    e.preventDefault();
    saveProject(false); // Guardar normal
});

document.getElementById('save-as-menu-item').addEventListener('click', (e) => {
    e.preventDefault();
    saveProject(true); // Guardar como
});
}

function checkFileSystemCompatibility() {
    state.hasFileSystemAccess = 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
    console.log(`File System Access API ${state.hasFileSystemAccess ? 'soportada' : 'no soportada'}`);
}


/**
 * Manejo de archivos e imágenes
 */
function handleBackgroundUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        alert('Por favor, selecciona una imagen JPG o PNG.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        loadBackground(event.target.result);
    };
    reader.readAsDataURL(file);
}

function loadBackground(dataUrl) {
    backgroundImage.onload = function() {
        state.backgroundImageLoaded = true;
        state.backgroundDataUrl = dataUrl;
        state.naturalWidth = backgroundImage.naturalWidth;
        state.naturalHeight = backgroundImage.naturalHeight;
        
        resetZoom();
        
        backgroundImage.classList.remove('hidden');
        startupMessage.classList.add('hidden');
        enableControls();
    };
    
    backgroundImage.src = dataUrl;
}

function handlePointImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        alert('Por favor, selecciona una imagen JPG o PNG.');
        return;
    }
    
    processAndResizeImage(file)
        .then(dataUrl => {
            state.currentPointImageDataUrl = dataUrl;
            pointImagePreview.src = dataUrl;
            pointImagePreview.classList.remove('hidden');
            removeImageBtn.classList.remove('hidden');
        })
        .catch(error => {
            console.error('Error al procesar la imagen:', error);
            alert('Error al procesar la imagen. Por favor, inténtalo de nuevo.');
        });
}

function processAndResizeImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                if (img.width <= state.MAX_IMAGE_SIZE && img.height <= state.MAX_IMAGE_SIZE) {
                    resolve(e.target.result);
                    return;
                }
                
                let newWidth, newHeight;
                if (img.width > img.height) {
                    newWidth = state.MAX_IMAGE_SIZE;
                    newHeight = (img.height * state.MAX_IMAGE_SIZE) / img.width;
                } else {
                    newHeight = state.MAX_IMAGE_SIZE;
                    newWidth = (img.width * state.MAX_IMAGE_SIZE) / img.height;
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                
                resolve(canvas.toDataURL(file.type));
            };
            img.onerror = () => {
                reject(new Error('Error al cargar la imagen'));
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            reject(new Error('Error al leer el archivo'));
        };
        reader.readAsDataURL(file);
    });
}

function removePointImage() {
    state.currentPointImageDataUrl = null;
    pointImagePreview.classList.add('hidden');
    removeImageBtn.classList.add('hidden');
    pointImageUpload.value = '';
}

/**
 * Control de puntos
 */
function toggleAddPointMode() {
    state.isAddingPoint = !state.isAddingPoint;
    
    if (state.isAddingPoint) {
        addPointBtn.classList.add('btn-danger');
        imageContainer.classList.add('adding-point');
        addPointIndicator.classList.remove('hidden');
        
        imageContainer.addEventListener('mousemove', updatePointPreview);
        pointPreview.classList.remove('hidden');
    } else {
        addPointBtn.classList.remove('btn-danger');
        imageContainer.classList.remove('adding-point');
        addPointIndicator.classList.add('hidden');
        
        imageContainer.removeEventListener('mousemove', updatePointPreview);
        pointPreview.classList.add('hidden');
    }
}

function handleImageClick(e) {
    if (!state.backgroundImageLoaded) return;
    
    if (state.isAddingPoint) {
        const rect = imageWrapper.getBoundingClientRect();
        const offsetX = (e.clientX - rect.left) / (rect.width);
        const offsetY = (e.clientY - rect.top) / (rect.height);
        
        if (offsetX >= 0 && offsetX <= 1 && offsetY >= 0 && offsetY <= 1) {
            addPoint(offsetX, offsetY);
            toggleAddPointMode();
        }
    }
}

function addPoint(relativeX, relativeY) {
    const pointId = Date.now().toString();
    const pointNumber = state.startingPointNumber + state.points.length;
    
    const newPoint = {
        id: pointId,
        number: pointNumber,
        x: relativeX,
        y: relativeY,
        title: '',
        description: '',
        imageDataUrl: null
    };
    
    state.points.push(newPoint);
    createPointElement(newPoint);
    showPointDetails(pointId);
    openPointModal(pointId, true);
}

function createPointElement(point) {
    const pointElement = document.createElement('div');
    pointElement.className = 'point';
    pointElement.id = `point-${point.id}`;
    pointElement.innerHTML = point.number;
    pointElement.style.left = `${point.x * 100}%`;
    pointElement.style.top = `${point.y * 100}%`;
    
    pointElement.addEventListener('click', (e) => {
        e.stopPropagation();
        showPointDetails(point.id);
        showDetailsPanel();
    });
    
    pointElement.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            e.stopPropagation();
            startDraggingPoint(point.id, e);
        }
    });
    
    pointElement.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        const touch = e.touches[0];
        startDraggingPoint(point.id, touch);
    }, { passive: false });
    
    pointsContainer.appendChild(pointElement);
}

function updatePointPreview(e) {
    if (!state.isAddingPoint) return;
    
    const rect = imageWrapper.getBoundingClientRect();
    const offsetX = (e.clientX - rect.left) / rect.width;
    const offsetY = (e.clientY - rect.top) / rect.height;
    
    if (offsetX >= 0 && offsetX <= 1 && offsetY >= 0 && offsetY <= 1) {
        pointPreview.style.left = `${offsetX * 100}%`;
        pointPreview.style.top = `${offsetY * 100}%`;
        pointPreview.classList.remove('hidden');
    } else {
        pointPreview.classList.add('hidden');
    }
}

function updatePointPosition(pointId, relativeX, relativeY) {
    const pointIndex = state.points.findIndex(p => p.id === pointId);
    if (pointIndex === -1) return;
    
    state.points[pointIndex].x = relativeX;
    state.points[pointIndex].y = relativeY;
    
    const pointElement = document.getElementById(`point-${pointId}`);
    if (pointElement) {
        pointElement.style.left = `${relativeX * 100}%`;
        pointElement.style.top = `${relativeY * 100}%`;
    }
}

function removePoint(pointId) {
    const pointElement = document.getElementById(`point-${pointId}`);
    if (pointElement) {
        pointElement.remove();
    }
    
    const pointIndex = state.points.findIndex(p => p.id === pointId);
    if (pointIndex !== -1) {
        state.points.splice(pointIndex, 1);
    }
    
    state.points.forEach((point, index) => {
        point.number = state.startingPointNumber + index;
        const element = document.getElementById(`point-${point.id}`);
        if (element) {
            element.innerHTML = point.number;
        }
    });
    
    updateNavigationControls();
    
    if (state.currentPointId === pointId) {
        state.currentPointId = null;
        if (state.points.length > 0) {
            showPointDetails(state.points[0].id);
        } else {
            pointDetailsContent.innerHTML = '<div class="empty-details-message">No hay puntos creados todavía</div>';
        }
    }
}

/**
 * Arrastrar puntos
 */
function startDraggingPoint(pointId, e) {
    state.draggedPointId = pointId;
    
    if (e.touches) {
        state.dragStartX = e.touches[0].clientX;
        state.dragStartY = e.touches[0].clientY;
    } else {
        state.dragStartX = e.clientX;
        state.dragStartY = e.clientY;
    }
    
    e.preventDefault();
}

function handlePointDragMove(e) {
    if (!state.draggedPointId) return;
    
    e.preventDefault();
    
    let clientX, clientY;
    if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    const deltaX = Math.abs(clientX - state.dragStartX);
    const deltaY = Math.abs(clientY - state.dragStartY);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (!state.isDraggingPoint && distance > state.dragThreshold) {
        state.isDraggingPoint = true;
        const pointElement = document.getElementById(`point-${state.draggedPointId}`);
        pointElement.classList.add('dragging');
    }
    
    if (state.isDraggingPoint) {
        const rect = imageWrapper.getBoundingClientRect();
        const offsetX = (clientX - rect.left) / rect.width;
        const offsetY = (clientY - rect.top) / rect.height;
        
        if (offsetX >= 0 && offsetX <= 1 && offsetY >= 0 && offsetY <= 1) {
            const pointElement = document.getElementById(`point-${state.draggedPointId}`);
            pointElement.style.left = `${offsetX * 100}%`;
            pointElement.style.top = `${offsetY * 100}%`;
        }
    }
}

function endDraggingPoint() {
    if (!state.draggedPointId) return;
    
    if (state.isDraggingPoint) {
        const pointElement = document.getElementById(`point-${state.draggedPointId}`);
        
        const rect = imageWrapper.getBoundingClientRect();
        const left = parseFloat(pointElement.style.left) / 100;
        const top = parseFloat(pointElement.style.top) / 100;
        
        updatePointPosition(state.draggedPointId, left, top);
        pointElement.classList.remove('dragging');
    }
    
    state.isDraggingPoint = false;
    state.draggedPointId = null;
    state.dragStartX = 0;
    state.dragStartY = 0;
}

/**
 * Panel de detalles del punto
 */
function toggleDetailsPanel() {
    if (state.detailsVisible) {
        hideDetailsPanel();
    } else {
        showDetailsPanel();
    }
}

function showDetailsPanel() {
    pointDetailsSidebar.classList.remove('hidden');
    
    if (window.innerWidth <= 768) {
        pointDetailsSidebar.classList.add('visible');
    }
    
    state.detailsVisible = true;
    
    if (state.currentPointId) {
        showPointDetails(state.currentPointId);
    } else if (state.points.length > 0) {
        showPointDetails(state.points[0].id);
    } else {
        pointDetailsContent.innerHTML = '<div class="empty-details-message">No hay puntos creados todavía</div>';
    }
}

function hideDetailsPanel() {
    if (window.innerWidth <= 768) {
        pointDetailsSidebar.classList.remove('visible');
        setTimeout(() => {
            if (!state.detailsVisible) {
                pointDetailsSidebar.classList.add('hidden');
            }
        }, 300);
    } else {
        pointDetailsSidebar.classList.add('hidden');
    }
    
    state.detailsVisible = false;
}

function showPointDetails(pointId) {
    const point = state.points.find(p => p.id === pointId);
    if (!point) return;
    
    state.currentPointId = pointId;
    
    const html = `
        <div class="point-header">
            <div class="point-number">Punto ${point.number}</div>
            <h3>${point.title}</h3>
        </div>
        ${point.imageDataUrl ? `
            <img src="${point.imageDataUrl}" 
                 class="point-details-image" 
                 alt="${point.title}"
                 id="details-image-${point.id}"
                 style="cursor: pointer">
        ` : ''}
        <div class="point-description-box">
            ${point.description || 'Sin descripción'}
        </div>
        <div class="point-actions">
            <button id="edit-point-sidebar-btn" class="btn">Editar</button>
            <button id="delete-point-sidebar-btn" class="btn btn-danger">Eliminar</button>
        </div>
    `;
    
    pointDetailsContent.innerHTML = html;
    
    document.getElementById('edit-point-sidebar-btn').addEventListener('click', () => {
        openPointModal(pointId, true);
    });
    
    document.getElementById('delete-point-sidebar-btn').addEventListener('click', confirmDeletePoint);
    
    updateNavigationControls();
    highlightPoint(pointId);
    
    if (point.imageDataUrl) {
        const detailsImage = document.getElementById(`details-image-${point.id}`);
        if (detailsImage) {
            detailsImage.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openImageViewer(point.id);
            });
        }
    }
} 

function updateNavigationControls() {
    if (state.points.length === 0) {
        prevPointBtn.disabled = true;
        nextPointBtn.disabled = true;
        return;
    }
    
    const currentIndex = state.points.findIndex(p => p.id === state.currentPointId);
    
    prevPointBtn.disabled = currentIndex <= 0;
    nextPointBtn.disabled = currentIndex >= state.points.length - 1;
}

function showPreviousPoint() {
    if (!state.currentPointId) return;
    
    const currentIndex = state.points.findIndex(p => p.id === state.currentPointId);
    if (currentIndex > 0) {
        showPointDetails(state.points[currentIndex - 1].id);
    }
}

function showNextPoint() {
    if (!state.currentPointId) return;
    
    const currentIndex = state.points.findIndex(p => p.id === state.currentPointId);
    if (currentIndex < state.points.length - 1) {
        showPointDetails(state.points[currentIndex + 1].id);
    }
}

/**
 * Zoom y navegación
 */
function handleMouseWheel(e) {
    if (!state.backgroundImageLoaded) return;
    
    e.preventDefault();
    
    const direction = e.deltaY < 0 ? 1 : -1;
    const factor = direction > 0 ? state.SCALE_FACTOR : 1 / state.SCALE_FACTOR;
    
    const rect = imageContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    applyZoom(factor, x, y);
}

function applyZoom(factor, originX, originY) {
    const prevScale = state.scale;
    state.scale *= factor;
    state.scale = Math.max(state.MIN_SCALE, Math.min(state.MAX_SCALE, state.scale));
    
    if (prevScale === state.scale) return;
    
    const scaleFactor = state.scale / prevScale;
    const containerWidth = imageContainer.offsetWidth;
    const containerHeight = imageContainer.offsetHeight;
    
    if (originX !== undefined && originY !== undefined) {
        const dx = (originX - containerWidth / 2);
        const dy = (originY - containerHeight / 2);
        
        state.offsetX = state.offsetX * scaleFactor + dx - dx * scaleFactor;
        state.offsetY = state.offsetY * scaleFactor + dy - dy * scaleFactor;
    }
    
    updateImagePosition();
}

function adjustZoom(factor) {
    const containerWidth = imageContainer.offsetWidth;
    const containerHeight = imageContainer.offsetHeight;
    
    applyZoom(factor, containerWidth / 2, containerHeight / 2);
}

function resetZoom() {
    state.scale = 1;
    state.offsetX = 0;
    state.offsetY = 0;
    updateImagePosition();
}

function updateImagePosition() {
    imageWrapper.style.transform = `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.scale})`;
}

/**
 * Manejo de arrastre (pan)
 */
function handleDragStart(e) {
    if (!state.backgroundImageLoaded || state.isAddingPoint) return;
    
    e.preventDefault();
    
    state.isDragging = true;
    state.lastPosX = e.clientX;
    state.lastPosY = e.clientY;
    
    imageContainer.classList.add('grabbing');
}

function handleTouchStart(e) {
    if (!state.backgroundImageLoaded || state.isAddingPoint) return;
    
    e.preventDefault();
    
    if (e.touches.length === 1) {
        state.isDragging = true;
        state.lastPosX = e.touches[0].clientX;
        state.lastPosY = e.touches[0].clientY;
    }
}

function handleDragMove(e) {
    if (state.draggedPointId) {
        handlePointDragMove(e);
        return;
    }
    
    if (!state.isDragging) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - state.lastPosX;
    const deltaY = e.clientY - state.lastPosY;
    
    state.offsetX += deltaX;
    state.offsetY += deltaY;
    
    state.lastPosX = e.clientX;
    state.lastPosY = e.clientY;
    
    updateImagePosition();
}

function handleTouchMove(e) {
    if (state.draggedPointId) {
        handlePointDragMove(e);
        return;
    }
    
    if (!state.isDragging) return;
    
    e.preventDefault();
    
    if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - state.lastPosX;
        const deltaY = e.touches[0].clientY - state.lastPosY;
        
        state.offsetX += deltaX;
        state.offsetY += deltaY;
        
        state.lastPosX = e.touches[0].clientX;
        state.lastPosY = e.touches[0].clientY;
        
        updateImagePosition();
    }
}

function handleDragEnd(e) {
    if (state.draggedPointId) {
        endDraggingPoint();
        return;
    }
    
    state.isDragging = false;
    imageContainer.classList.remove('grabbing');
}

/**
 * Gestión del modal de puntos
 */
function openPointModal(pointId, editMode = false) {
    const point = state.points.find(p => p.id === pointId);
    if (!point) return;
    
    state.currentPointId = pointId;
    state.currentPointImageDataUrl = point.imageDataUrl;
    
    pointTitle.textContent = point.title;
    document.querySelector('.point-number').textContent = `Punto ${point.number}`;
    pointDescription.textContent = point.description;
    
    if (editMode && point.title === '') {
        document.getElementById('point-number-input').value = '';
    }
    
    if (point.imageDataUrl) {
        pointImageView.src = point.imageDataUrl;
        pointImageView.classList.remove('hidden');
    } else {
        pointImageView.classList.add('hidden');
    }
    
    pointModal.classList.remove('hidden');
    
    if (editMode) {
        switchToEditMode();
    } else {
        switchToViewMode();
    }
    
    highlightPoint(pointId);
}

function switchToViewMode() {
    pointViewMode.classList.remove('hidden');
    pointEditMode.classList.add('hidden');
}

function switchToEditMode() {
    const point = state.points.find(p => p.id === state.currentPointId);
    if (!point) return;
    
    pointTitleInput.value = point.title;
    document.querySelector('.point-number').textContent = `Punto ${point.number}`;
    pointDescInput.value = point.description;
    document.getElementById('point-number-input').value = point.number;
    
    if (point.imageDataUrl) {
        pointImagePreview.src = point.imageDataUrl;
        pointImagePreview.classList.remove('hidden');
        removeImageBtn.classList.remove('hidden');
    } else {
        pointImagePreview.classList.add('hidden');
        removeImageBtn.classList.add('hidden');
    }
    
    pointViewMode.classList.add('hidden');
    pointEditMode.classList.remove('hidden');
}

function renumberPointsAfter(newNumber) {
    const affectedPoints = state.points.filter(p => p.number >= newNumber);
    affectedPoints.sort((a, b) => b.number - a.number);
    
    // Incrementar números
    affectedPoints.forEach(point => {
        point.number += 1;
        const element = document.getElementById(`point-${point.id}`);
        if (element) {
            element.innerHTML = point.number;
        }
    });

    // Reordenar el array state.points según el número
    state.points.sort((a, b) => a.number - b.number);
}

function savePointData() {
    const pointIndex = state.points.findIndex(p => p.id === state.currentPointId);
    if (pointIndex === -1) return;

    const numberInput = document.getElementById('point-number-input');
    const newNumberStr = numberInput.value.trim();
    if (newNumberStr === '' || isNaN(parseInt(newNumberStr)) || parseInt(newNumberStr) < 1) {
        alert('Por favor, introduce un número válido mayor que cero.');
        return;
    }
    const newNumber = parseInt(newNumberStr);

    const existingPoint = state.points.find(p => p.number === newNumber && p.id !== state.currentPointId);
    if (existingPoint) {
        confirmTitle.textContent = 'Conflicto de numeración';
        confirmMessage.textContent = `El número ${newNumber} ya está asignado a otro punto. ¿Quieres reasignar los números?`;

        state.confirmCallback = () => {
            // Guardar ID para asegurarnos de tener referencia tras reordenar
            const currentPointId = state.currentPointId;
            
            renumberPointsAfter(newNumber);
            state.points[pointIndex].number = newNumber;
            state.points.sort((a, b) => a.number - b.number);
            
            // Buscar el nuevo índice después de ordenar
            const newPointIndex = state.points.findIndex(p => p.id === currentPointId);
            updatePointAfterSave(newPointIndex);
            
            // Actualizar visualmente el elemento del punto
            const pointElement = document.getElementById(`point-${currentPointId}`);
            if (pointElement) {
                pointElement.innerHTML = newNumber;
            }
            
            closePointModal();
        };

        showConfirmModal();
        return;
    }

    // Guardar el número antiguo y el ID para comparar después
    const currentPointId = state.currentPointId;
    const oldNumber = state.points[pointIndex].number;
    
    // Actualizar el número y reordenar
    state.points[pointIndex].number = newNumber;
    state.points.sort((a, b) => a.number - b.number);
    
    // Buscar el nuevo índice después de ordenar
    const newPointIndex = state.points.findIndex(p => p.id === currentPointId);
    updatePointAfterSave(newPointIndex);
    
    // Actualizar visualmente el elemento del punto, asegurándose que muestre el nuevo número
    const pointElement = document.getElementById(`point-${currentPointId}`);
    if (pointElement) {
        pointElement.innerHTML = newNumber;
    }
}


function updatePointAfterSave(pointIndex) {
    const point = state.points[pointIndex];

    // Actualizar datos del punto
    point.title = pointTitleInput.value.trim();
    point.description = pointDescInput.value.trim();
    point.imageDataUrl = state.currentPointImageDataUrl;

    // Actualizar número en el círculo (DOM del punto visual)
    const pointElement = document.getElementById(`point-${point.id}`);
    if (pointElement) {
        pointElement.innerHTML = point.number;
    }

    // Actualizar número en el modal
    const pointNumberLabel = document.querySelector('.point-number');
    if (pointNumberLabel) {
        pointNumberLabel.textContent = `Punto ${point.number}`;
    }

    // Actualizar panel lateral si está visible
    if (state.detailsVisible) {
        showPointDetails(point.id);
    }

    closePointModal();
}

function confirmDeletePoint() {
    confirmTitle.textContent = 'Eliminar punto';
    confirmMessage.textContent = '¿Estás seguro de que quieres eliminar este punto?';
    
    state.confirmCallback = () => {
        const pointId = state.currentPointId;
        closePointModal();
        removePoint(pointId);
    };
    
    showConfirmModal();
}

function closePointModal() {
    pointModal.classList.add('hidden');
    state.currentPointId = null;
    state.currentPointImageDataUrl = null;
    removePointHighlight();
}

function highlightPoint(pointId) {
    removePointHighlight();
    const pointElement = document.getElementById(`point-${pointId}`);
    if (pointElement) {
        pointElement.classList.add('highlight');
    }
}

function removePointHighlight() {
    document.querySelectorAll('.point').forEach(el => {
        el.classList.remove('highlight');
    });
}

/**
 * Visor de imágenes ampliadas
 */
function openImageViewer(pointId) {
    const point = state.points.find(p => p.id === pointId);
    if (!point || !point.imageDataUrl) return;
    
    state.currentViewerPointId = pointId;
    
    document.getElementById('viewer-point-title').textContent = `Punto ${point.number}`;
    const viewerImage = document.getElementById('viewer-image');
    viewerImage.src = point.imageDataUrl;
    
    const modal = document.getElementById('image-viewer-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    modal.focus();
    highlightPoint(pointId);
}

function closeImageViewer() {
    document.getElementById('image-viewer-modal').classList.add('hidden');
    document.body.style.overflow = '';
    removePointHighlight();
}

function navigateImageViewer(direction) {
    if (!state.currentViewerPointId) return;
    
    const currentIndex = state.points.findIndex(p => p.id === state.currentViewerPointId);
    if (currentIndex === -1) return;
    
    const pointsWithImages = state.points.filter(p => p.imageDataUrl);
    if (pointsWithImages.length <= 1) return;
    
    const currentInFiltered = pointsWithImages.findIndex(p => p.id === state.currentViewerPointId);
    
    let newIndex;
    if (direction === 'prev') {
        newIndex = (currentInFiltered - 1 + pointsWithImages.length) % pointsWithImages.length;
    } else {
        newIndex = (currentInFiltered + 1) % pointsWithImages.length;
    }
    
    openImageViewer(pointsWithImages[newIndex].id);
}

/**
 * Gestión del modal de confirmación
 */
function showConfirmModal() {
    confirmModal.classList.remove('hidden');
}

function hideConfirmModal() {
    confirmModal.classList.add('hidden');
    state.confirmCallback = null;
}

function handleConfirmYes() {
    if (state.confirmCallback) {
        state.confirmCallback();
    }
    hideConfirmModal();
}

/**
 * Gestión del modal de configuración
 */
function openConfigModal() {
    startingNumberInput.value = state.startingPointNumber;
    configModal.classList.remove('hidden');
}

function closeConfigModal() {
    configModal.classList.add('hidden');
}

function saveConfig() {
    const startingNumber = parseInt(startingNumberInput.value, 10);
    if (isNaN(startingNumber) || startingNumber < 1) {
        alert('Por favor, introduce un número válido mayor o igual a 1.');
        return;
    }
    
    state.startingPointNumber = startingNumber;
    
    if (state.points.length > 0) {
        confirmTitle.textContent = 'Renumerar puntos';
        confirmMessage.textContent = '¿Quieres renumerar los puntos existentes con la nueva numeración?';
        
        state.confirmCallback = () => {
            renumberPoints();
        };
        
        closeConfigModal();
        showConfirmModal();
    } else {
        closeConfigModal();
    }
}

function renumberPoints() {
    state.points.forEach((point, index) => {
        point.number = state.startingPointNumber + index;
        const element = document.getElementById(`point-${point.id}`);
        if (element) {
            element.innerHTML = point.number;
        }
    });
    
    if (state.currentPointId) {
        showPointDetails(state.currentPointId);
    }

    if (!pointModal.classList.contains('hidden') && state.currentPointId) {
        const point = state.points.find(p => p.id === state.currentPointId);
        if (point) {
            document.querySelector('.point-number').textContent = `Punto ${point.number}`;
        }
    }
}

/**
 * Utilidades
 */
function enableControls() {
    addPointBtn.disabled = false;
    zoomInBtn.disabled = false;
    zoomOutBtn.disabled = false;
    zoomResetBtn.disabled = false;
    saveBtn.disabled = false;
    toggleDetailsBtn.disabled = false;
}

/**
 * Persistencia (guardar/cargar) - VERSIÓN CORREGIDA
 */
async function saveProject(saveAs = false) {
    if (!state.backgroundImageLoaded) {
        alert("Primero carga una imagen de fondo.");
        return;
    }

    if (!state.hasFileSystemAccess) {
        alert("Tu navegador no permite guardar directamente. Usa Chrome/Edge.");
        return;
    }

    const projectData = {
        backgroundImage: state.backgroundDataUrl,
        startingPointNumber: state.startingPointNumber,
        points: state.points
    };

    try {
        let fileHandle;
        
        // Si es "Guardar" y ya existe un archivo, úsalo
        if (!saveAs && state.currentProjectPath) {
            fileHandle = state.currentProjectPath;
        } 
        // Si es "Guardar como" o no hay archivo, crea uno nuevo
        else {
            fileHandle = await window.showSaveFilePicker({
                types: [{
                    description: 'Archivos de proyecto',
                    accept: { 'application/json': ['.json'] }
                }],
                suggestedName: `proyecto_puntos_${Date.now()}.json`
            });
            state.currentProjectPath = fileHandle;
        }

        // Escribe el archivo
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(projectData));
        await writable.close();

        showSaveSuccess();
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error("Error al guardar:", error);
            alert("No se pudo guardar el proyecto.");
        }
    }
}


/**
 * Guardar proyecto en un archivo existente usando File System Access API
 */
async function saveToExistingFile(fileHandle, content) {
    try {
        // Crear un FileSystemWritableFileStream para escribir
        const writable = await fileHandle.createWritable();
        // Escribir el contenido
        await writable.write(content);
        // Cerrar el archivo
        await writable.close();
        return true;
    } catch (error) {
        console.error('Error al guardar archivo:', error);
        throw error;
    }
}

/**
 * Guardar como nuevo archivo usando File System Access API
 */
async function saveAsNewFile(content) {
    try {
        // Mostrar el diálogo de guardado de archivo
        const fileHandle = await window.showSaveFilePicker({
            types: [{
                description: 'Archivos de proyecto',
                accept: {
                    'application/json': ['.json']
                }
            }],
            suggestedName: `punto_interactivo_${Date.now()}.json`
        });
        
        // Guardar el archivo
        await saveToExistingFile(fileHandle, content);
        
        // Actualizar estado
        state.currentProjectPath = fileHandle;
        state.hasUnsavedChanges = false;
        showSaveSuccess();
    } catch (error) {
        // El usuario canceló el diálogo
        if (error.name !== 'AbortError') {
            console.error('Error al guardar:', error);
            alert('Error al guardar el proyecto. Por favor, inténtalo de nuevo.');
        }
    }
}

function exportProject() {
    const data = JSON.stringify({
        backgroundImage: state.backgroundDataUrl,
        points: state.points
    });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proyecto_puntos_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Manejar la carga de un proyecto - VERSIÓN CORREGIDA
 */
async function handleProjectLoad() {
    try {
        const [fileHandle] = await window.showOpenFilePicker({
            types: [{
                description: 'Archivos de proyecto',
                accept: { 'application/json': ['.json'] }
            }]
        });

        const file = await fileHandle.getFile();
        const content = await file.text();
        const projectData = JSON.parse(content);

        state.currentProjectPath = fileHandle;
        loadProject(projectData);
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error("Error al cargar:", error);
            alert("No se pudo cargar el proyecto. Asegúrate de seleccionar un archivo válido.");
        }
    }
}

/**
 * Función auxiliar para leer un archivo y cargar el proyecto
 */
function readFileAndLoadProject(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const projectData = JSON.parse(event.target.result);
                loadProject(projectData);
                state.hasUnsavedChanges = false;
                resolve(true);
            } catch (error) {
                console.error('Error al parsear el proyecto:', error);
                alert('Error al cargar el proyecto. El archivo parece estar corrupto.');
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}


// Añadir esta nueva función para el fallback con input file
function handleProjectLoadFallback(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const projectData = JSON.parse(event.target.result);
            loadProject(projectData);
        } catch (error) {
            console.error('Error al cargar el proyecto:', error);
            alert('Error al cargar el proyecto. El archivo parece estar corrupto.');
        }
    };
    reader.onerror = function() {
        alert('Error al leer el archivo. Por favor, inténtalo de nuevo.');
    };
    reader.readAsText(file);
    
    // Limpiar el input para permitir cargar el mismo archivo otra vez si es necesario
    e.target.value = '';
}

// Función para mostrar éxito en guardado
function showSaveSuccess() {
    const notification = document.createElement('div');
    notification.className = 'save-notification';
    notification.textContent = 'Proyecto guardado correctamente';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 2000);
}

function loadProject(projectData) {
    if (!projectData || !projectData.backgroundImage) {
        alert('Archivo de proyecto no válido. Falta la imagen de fondo.');
        return;
    }
    
    pointsContainer.innerHTML = '';
    state.points = [];
    loadBackground(projectData.backgroundImage);
    
    if (projectData.startingPointNumber) {
        state.startingPointNumber = projectData.startingPointNumber;
    }
    
    if (projectData.points && Array.isArray(projectData.points)) {
        projectData.points.forEach(point => {
            state.points.push({
                id: point.id,
                number: point.number,
                x: point.x,
                y: point.y,
                title: point.title,
                description: point.description,
                imageDataUrl: point.imageDataUrl
            });
        });

        // Ordenar puntos por número al cargar
        state.points.sort((a, b) => a.number - b.number);
        
        // Crear elementos después de ordenar
        state.points.forEach(point => {
            createPointElement(point);
        });
    }
    
    if (state.points.length > 0) {
        showPointDetails(state.points[0].id);
    }
}

/**
 * Iniciar la aplicación una vez que el DOM esté cargado
 */
document.addEventListener('DOMContentLoaded', init);
