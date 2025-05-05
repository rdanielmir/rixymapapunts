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


    lastKeyPressTime: 0,
    currentViewerPointId: null,
    
    // Estado de zoom y desplazamiento
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastPosX: 0,
    lastPosY: 0,
    startingPointNumber: 1, // Número inicial para comenzar a numerar los puntos

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
    MAX_IMAGE_SIZE: 800 // Tamaño máximo para redimensionar imágenes
};

/**
 * Funciones de inicialización
 */
function init() {
    setupEventListeners();
    
    // Mostrar sidebar por defecto en dispositivos grandes
    if (window.innerWidth > 768) {
        setTimeout(() => {
            showDetailsPanel();
        }, 10); // Esperar un poco para que todo se inicialice
    }
}

function setupEventListeners() {
    // Eventos para cargar imágenes
    bgUpload.addEventListener('change', handleBackgroundUpload);
    loadUpload.addEventListener('change', handleProjectLoad);


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
        if (now - state.lastKeyPressTime < 50) return; // Debounce de 50ms
        
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
    saveBtn.addEventListener('click', saveProject);
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
        
        // Reiniciar zoom y posición
        resetZoom();
        
        // Mostrar imagen y habilitar controles
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
                // Verificar si necesita redimensionarse
                if (img.width <= state.MAX_IMAGE_SIZE && img.height <= state.MAX_IMAGE_SIZE) {
                    resolve(e.target.result); // No es necesario redimensionar
                    return;
                }
                
                // Calcular las nuevas dimensiones manteniendo la proporción
                let newWidth, newHeight;
                if (img.width > img.height) {
                    newWidth = state.MAX_IMAGE_SIZE;
                    newHeight = (img.height * state.MAX_IMAGE_SIZE) / img.width;
                } else {
                    newHeight = state.MAX_IMAGE_SIZE;
                    newWidth = (img.width * state.MAX_IMAGE_SIZE) / img.height;
                }
                
                // Crear un canvas para redimensionar
                const canvas = document.createElement('canvas');
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                
                // Convertir a Data URL
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
        
        // Activar la previsualización
        imageContainer.addEventListener('mousemove', updatePointPreview);
        pointPreview.classList.remove('hidden');
    } else {
        addPointBtn.classList.remove('btn-danger');
        imageContainer.classList.remove('adding-point');
        addPointIndicator.classList.add('hidden');
        
        // Desactivar la previsualización
        imageContainer.removeEventListener('mousemove', updatePointPreview);
        pointPreview.classList.add('hidden');
    }
}

function handleImageClick(e) {
    if (!state.backgroundImageLoaded) return;
    
    // Si estamos en modo añadir punto
    if (state.isAddingPoint) {
        // Calcular la posición relativa
        const rect = imageWrapper.getBoundingClientRect();
        const offsetX = (e.clientX - rect.left) / (rect.width);
        const offsetY = (e.clientY - rect.top) / (rect.height);
        
        // Validar que el clic esté dentro de la imagen
        if (offsetX >= 0 && offsetX <= 1 && offsetY >= 0 && offsetY <= 1) {
            addPoint(offsetX, offsetY);
            // Desactivar modo añadir punto después de añadir uno
            toggleAddPointMode();
        }
    }
}

function addPoint(relativeX, relativeY) {
    const pointId = Date.now().toString();
    const pointNumber = state.startingPointNumber + state.points.length;
    
    // Crear nuevo punto
    const newPoint = {
        id: pointId,
        number: pointNumber,
        x: relativeX,
        y: relativeY,
        title: '',
        description: '',
        imageDataUrl: null
    };
    
    // Añadir a la lista de puntos
    state.points.push(newPoint);
    
    // Crear y añadir elemento visual
    createPointElement(newPoint);
    
    // Mostrar detalles del punto en el sidebar
    showPointDetails(pointId);
    
    // Abrir modal para editar el punto (solo la primera vez)
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
        showDetailsPanel(); // Asegurarse de que el sidebar esté visible
    });
    
    // Eventos para arrastrar puntos
    pointElement.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Solo botón izquierdo
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
    
    // Validar que esté dentro de la imagen
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
    
    // Actualizar en el estado
    state.points[pointIndex].x = relativeX;
    state.points[pointIndex].y = relativeY;
    
    // Actualizar visualmente
    const pointElement = document.getElementById(`point-${pointId}`);
    if (pointElement) {
        pointElement.style.left = `${relativeX * 100}%`;
        pointElement.style.top = `${relativeY * 100}%`;
    }
}

function removePoint(pointId) {
    // Eliminar del DOM
    const pointElement = document.getElementById(`point-${pointId}`);
    if (pointElement) {
        pointElement.remove();
    }
    
    // Eliminar del estado
    const pointIndex = state.points.findIndex(p => p.id === pointId);
    if (pointIndex !== -1) {
        state.points.splice(pointIndex, 1);
    }
    
    // Renumerar los puntos restantes
    state.points.forEach((point, index) => {
        point.number = state.startingPointNumber + index;
        const element = document.getElementById(`point-${point.id}`);
        if (element) {
            element.innerHTML = point.number;
        }
    });
    
    // Actualizar controles de navegación
    updateNavigationControls();
    
    // Si el punto eliminado era el que se mostraba en el panel
    if (state.currentPointId === pointId) {
        state.currentPointId = null;
        if (state.points.length > 0) {
            // Mostrar el primer punto disponible
            showPointDetails(state.points[0].id);
        } else {
            // No hay puntos, mostrar mensaje
            pointDetailsContent.innerHTML = '<div class="empty-details-message">No hay puntos creados todavía</div>';
        }
    }
}

/**
 * Arrastrar puntos
 */
function startDraggingPoint(pointId, e) {
    // Todavía no activamos el arrastre, solo guardamos el estado inicial
    state.draggedPointId = pointId;
    
    // Guardar la posición inicial del cursor o toque
    if (e.touches) {
        state.dragStartX = e.touches[0].clientX;
        state.dragStartY = e.touches[0].clientY;
    } else {
        state.dragStartX = e.clientX;
        state.dragStartY = e.clientY;
    }
    
    // No activamos la clase de arrastre todavía
    
    // Detener eventos de arrastre de imagen
    e.preventDefault();
}

function handlePointDragMove(e) {
    if (!state.draggedPointId) return;
    
    e.preventDefault();
    
    // Obtener coordenadas actuales
    let clientX, clientY;
    if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    // Calcular la distancia movida
    const deltaX = Math.abs(clientX - state.dragStartX);
    const deltaY = Math.abs(clientY - state.dragStartY);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Si superamos el umbral, activar el arrastre
    if (!state.isDraggingPoint && distance > state.dragThreshold) {
        state.isDraggingPoint = true;
        const pointElement = document.getElementById(`point-${state.draggedPointId}`);
        pointElement.classList.add('dragging');
    }
    
    // Solo actualizar la posición si estamos arrastrando realmente
    if (state.isDraggingPoint) {
        // Calcular la posición relativa
        const rect = imageWrapper.getBoundingClientRect();
        const offsetX = (clientX - rect.left) / rect.width;
        const offsetY = (clientY - rect.top) / rect.height;
        
        // Validar que el punto esté dentro de la imagen
        if (offsetX >= 0 && offsetX <= 1 && offsetY >= 0 && offsetY <= 1) {
            // Actualizar visualmente la posición mientras se arrastra
            const pointElement = document.getElementById(`point-${state.draggedPointId}`);
            pointElement.style.left = `${offsetX * 100}%`;
            pointElement.style.top = `${offsetY * 100}%`;
        }
    }
}

function endDraggingPoint() {
    if (!state.draggedPointId) return;
    
    // Solo actualizamos la posición si realmente estábamos arrastrando
    if (state.isDraggingPoint) {
        const pointElement = document.getElementById(`point-${state.draggedPointId}`);
        
        // Calcular la posición final
        const rect = imageWrapper.getBoundingClientRect();
        const left = parseFloat(pointElement.style.left) / 100;
        const top = parseFloat(pointElement.style.top) / 100;
        
        // Actualizar el punto en el estado
        updatePointPosition(state.draggedPointId, left, top);
        
        // Quitar clase de arrastre
        pointElement.classList.remove('dragging');
    }
    
    // Limpiar estado de arrastre
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
    
    // En móvil usamos una clase para animación en CSS
    if (window.innerWidth <= 768) {
        pointDetailsSidebar.classList.add('visible');
    }
    
    state.detailsVisible = true;
    
    // Si hay un punto seleccionado, mostrarlo
    if (state.currentPointId) {
        showPointDetails(state.currentPointId);
    } else if (state.points.length > 0) {
        // Mostrar el primer punto si hay puntos pero ninguno seleccionado
        showPointDetails(state.points[0].id);
    } else {
        // No hay puntos, mostrar mensaje
        pointDetailsContent.innerHTML = '<div class="empty-details-message">No hay puntos creados todavía</div>';
    }
}

function hideDetailsPanel() {
    if (window.innerWidth <= 768) {
        pointDetailsSidebar.classList.remove('visible');
        // Dar tiempo a la animación antes de ocultar
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
    
    // Actualizar el contenido del panel con las nuevas clases y botones
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
    
    // Añadir event listeners a los nuevos botones
    document.getElementById('edit-point-sidebar-btn').addEventListener('click', () => {
        openPointModal(pointId, true);
    });
    
    document.getElementById('delete-point-sidebar-btn').addEventListener('click', confirmDeletePoint);
    
    // Actualizar controles de navegación
    updateNavigationControls();
    
    // Resaltar el punto en la imagen
    highlightPoint(pointId);
    // Hacer la imagen clicable
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
    
    // Determinar dirección y factor de zoom
    const direction = e.deltaY < 0 ? 1 : -1;
    const factor = direction > 0 ? state.SCALE_FACTOR : 1 / state.SCALE_FACTOR;
    
    // Calcular punto de origen para zoom (posición del cursor)
    const rect = imageContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    applyZoom(factor, x, y);
}

function applyZoom(factor, originX, originY) {
    // Guardar escala actual para calcular el cambio
    const prevScale = state.scale;
    
    // Aplicar factor de zoom
    state.scale *= factor;
    
    // Limitar escala a valores mínimo y máximo
    state.scale = Math.max(state.MIN_SCALE, Math.min(state.MAX_SCALE, state.scale));
    
    // Si no hubo cambio, salir
    if (prevScale === state.scale) return;
    
    // Calcular el cambio en offset para mantener el punto de origen fijo
    const scaleFactor = state.scale / prevScale;
    const containerWidth = imageContainer.offsetWidth;
    const containerHeight = imageContainer.offsetHeight;
    
    if (originX !== undefined && originY !== undefined) {
        // Calcular nuevos offsets respecto al punto de origen
        const dx = (originX - containerWidth / 2);
        const dy = (originY - containerHeight / 2);
        
        state.offsetX = state.offsetX * scaleFactor + dx - dx * scaleFactor;
        state.offsetY = state.offsetY * scaleFactor + dy - dy * scaleFactor;
    }
    
    updateImagePosition();
}

function adjustZoom(factor) {
    // Calcular punto de origen como centro del contenedor
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
    // Aplicar transformación al contenedor de la imagen
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
    
    // Calcular el desplazamiento
    const deltaX = e.clientX - state.lastPosX;
    const deltaY = e.clientY - state.lastPosY;
    
    // Actualizar la posición
    state.offsetX += deltaX;
    state.offsetY += deltaY;
    
    // Guardar la nueva posición del cursor
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
        // Calcular el desplazamiento
        const deltaX = e.touches[0].clientX - state.lastPosX;
        const deltaY = e.touches[0].clientY - state.lastPosY;
        
        // Actualizar la posición
        state.offsetX += deltaX;
        state.offsetY += deltaY;
        
        // Guardar la nueva posición del cursor
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
    
    // Llenar los datos en el modal
    pointTitle.textContent = point.title;
    document.querySelector('.point-number').textContent = `Punto ${point.number}`;
    pointDescription.textContent = point.description;
    
    // Manejar la imagen si existe
    if (point.imageDataUrl) {
        pointImageView.src = point.imageDataUrl;
        pointImageView.classList.remove('hidden');
    } else {
        pointImageView.classList.add('hidden');
    }
    
    // Mostrar modal
    pointModal.classList.remove('hidden');
    
    // Mostrar en modo edición si se solicita
    if (editMode) {
        switchToEditMode();
    } else {
        switchToViewMode();
    }
    
    // Resaltar el punto en la imagen
    highlightPoint(pointId);
}

function switchToViewMode() {
    pointViewMode.classList.remove('hidden');
    pointEditMode.classList.add('hidden');
}

function switchToEditMode() {
    const point = state.points.find(p => p.id === state.currentPointId);
    if (!point) return;
    
    // Llenar los campos de edición
    pointTitleInput.value = point.title;
    document.querySelector('.point-number').textContent = `Punto ${point.number}`;
    pointDescInput.value = point.description;
    
    // Manejar la imagen
    if (point.imageDataUrl) {
        pointImagePreview.src = point.imageDataUrl;
        pointImagePreview.classList.remove('hidden');
        removeImageBtn.classList.remove('hidden');
    } else {
        pointImagePreview.classList.add('hidden');
        removeImageBtn.classList.add('hidden');
    }
    
    // Mostrar modo edición
    pointViewMode.classList.add('hidden');
    pointEditMode.classList.remove('hidden');
}

function savePointData() {
    const pointIndex = state.points.findIndex(p => p.id === state.currentPointId);
    if (pointIndex === -1) return;
    
    // Actualizar datos en el estado
    state.points[pointIndex].title = pointTitleInput.value.trim();
    state.points[pointIndex].description = pointDescInput.value.trim();
    state.points[pointIndex].imageDataUrl = state.currentPointImageDataUrl;
    
    // Actualizar panel de detalles
    if (state.detailsVisible) {
        showPointDetails(state.currentPointId);
    }
    
    // Cerrar el modal después de guardar
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
    
    // Quitar resaltado del punto
    removePointHighlight();
}

function highlightPoint(pointId) {
    // Quitar cualquier resaltado previo
    removePointHighlight();
    
    // Resaltar el punto en la imagen
    const pointElement = document.getElementById(`point-${pointId}`);
    if (pointElement) {
        pointElement.classList.add('highlight');
    }
}

function removePointHighlight() {
    // Quitar resaltado de todos los puntos
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
    
    // Configurar el visor
    document.getElementById('viewer-point-title').textContent = `Punto ${point.number}`;
    const viewerImage = document.getElementById('viewer-image');
    viewerImage.src = point.imageDataUrl;
    
    // Mostrar modal
    const modal = document.getElementById('image-viewer-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Enfocar el modal para eventos de teclado
    modal.focus();
    
    // Resaltar el punto actual
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
    
    // Encontrar todos los puntos con imágenes
    const pointsWithImages = state.points.filter(p => p.imageDataUrl);
    if (pointsWithImages.length <= 1) return;
    
    // Encontrar posición actual en el array filtrado
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
    // Establecer el valor actual en el input
    startingNumberInput.value = state.startingPointNumber;
    
    // Mostrar modal
    configModal.classList.remove('hidden');
}

function closeConfigModal() {
    configModal.classList.add('hidden');
}

function saveConfig() {
    // Obtener y validar el número inicial
    const startingNumber = parseInt(startingNumberInput.value, 10);
    if (isNaN(startingNumber) || startingNumber < 1) {
        alert('Por favor, introduce un número válido mayor o igual a 1.');
        return;
    }
    
    // Guardar la configuración
    state.startingPointNumber = startingNumber;
    
    // Si ya hay puntos, preguntar si quiere renumerarlos
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
    // Renumerar todos los puntos
    state.points.forEach((point, index) => {
        point.number = state.startingPointNumber + index;
        const element = document.getElementById(`point-${point.id}`);
        if (element) {
            element.innerHTML = point.number;
        }
    });
    
    // Actualizar el panel de detalles si es necesario
    if (state.currentPointId) {
        showPointDetails(state.currentPointId);
    }

// Actualizar el número en el modal si está abierto
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
 * Persistencia (guardar/cargar)
 */
function saveProject() {
    if (!state.backgroundImageLoaded) return;
    
    const projectData = {
        version: '1.0',
        backgroundImage: state.backgroundDataUrl,
        startingPointNumber: state.startingPointNumber, // Añadir número inicial
        points: state.points.map(point => ({
            id: point.id,
            number: point.number,
            x: point.x,
            y: point.y,
            title: point.title,
            description: point.description,
            imageDataUrl: point.imageDataUrl
        }))
    };
    
    // Convertir a JSON
    const jsonData = JSON.stringify(projectData);
    
    // Crear un elemento de descarga
    const a = document.createElement('a');
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    a.href = url;
    a.download = `punto_interactivo_${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

function handleProjectLoad(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/json') {
        alert('Por favor, selecciona un archivo JSON válido.');
        return;
    }
    
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
    reader.readAsText(file);
}

function loadProject(projectData) {
    if (!projectData || !projectData.backgroundImage) {
        alert('Archivo de proyecto no válido. Falta la imagen de fondo.');
        return;
    }
    
    // Limpiar puntos actuales
    pointsContainer.innerHTML = '';
    state.points = [];
    
    // Cargar imagen de fondo
    loadBackground(projectData.backgroundImage);
    
    // Cargar número inicial si existe
    if (projectData.startingPointNumber) {
        state.startingPointNumber = projectData.startingPointNumber;
    }
    
    // Cargar puntos
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
            
            createPointElement(point);
        });
    }
    
    // Mostrar detalles del primer punto si hay puntos
    if (state.points.length > 0) {
        showPointDetails(state.points[0].id);
    }
}

/**
 * Iniciar la aplicación una vez que el DOM esté cargado
 */
document.addEventListener('DOMContentLoaded', init);
