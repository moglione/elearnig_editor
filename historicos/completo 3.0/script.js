// VARIABLES GLOBALES
let cardId = 0;
let currentZoom = 100;
let currentLayout = "vertical";
let activeCard = null;
let imageLibrary = [];
let currentImageWrapper = null;
let currentTextCard = null;
let currentTextLayer = null;
let currentCourseName = ""; // Cadena vacía si no hay nombre aún
let replaceImageMode = false;
const giphyApiKey = "ogL11TqE2yn1np4MN3Yfc9EagPyHHcJU"; // Su API key de Giphy

// Actualizar zoom
function updateZoom() {
  const cardsContainer = document.getElementById("cards-container");
  cardsContainer.style.transform = `scale(${currentZoom / 100})`;
  document.getElementById("zoom-level").textContent = `${currentZoom}%`;
}

// Limpiar elementos transitorios antes de guardar
function cleanCardContent(cardContent) {
  cardContent.querySelectorAll('.rotate-handle, .resize-handle').forEach(el => el.remove());
  cardContent.querySelectorAll('.card-image-wrapper').forEach(el => el.classList.remove("selected-image"));
  return cardContent.innerHTML;
}

// Agregar nueva tarjeta
function addCard({ title = `Tarjeta ${cardId + 1}`, text = "Texto de la tarjeta", content = null, id = null } = {}) {
  const container = document.getElementById("cards-container");
  const card = document.createElement("div");
  if (id === null) {
    id = cardId++;
  } else {
    cardId = Math.max(cardId, parseInt(id) + 1);
  }
  card.className = "card";
  card.setAttribute("data-id", id);
  card.innerHTML = `
    <div class="card-content">
      <div class="card-images"></div>
    </div>
    <div class="card-buttons">
      <!-- Botón para agregar un nuevo text-layer -->
      <button onclick="addTextLayer(this)"><i class="fas fa-font"></i></button>
      <button onclick="duplicateCard(this)"><i class="fas fa-clone"></i></button>
      <!-- Botón de borrar modificado (ver punto 3) -->
      <button onclick="deleteCard(this)"><i class="fas fa-trash"></i></button>
      <button class="open-side-panel-btn" onclick="openSidePanelForCard(this)"><i class="fas fa-image"></i></button>
    </div>
  `;

  if (content !== null) {
    card.querySelector(".card-content").innerHTML = content;
  }
  
  card.addEventListener("click", function(e) {
    if (e.target.closest(".card-buttons")) return;
    document.querySelectorAll(".card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    activeCard = card;
  });

  
  addTextLayer(null, card);

  // Llamar a reinitializeListenersForCard para aplicar los listeners al text-layer y demás elementos
  reinitializeListenersForCard(card);
  

  container.appendChild(card);
  return card;
}

// Funciones para guardar y cargar cursos en el servidor
function serverSaveCourse() {
  // Se obtiene la lista de cursos guardados
  fetch("list_courses.php")
    .then(response => response.json())
    .then(courses => {
      openSaveCourseModal(courses);
    })
    .catch(error => {
      console.error(error);
      alert("Error al cargar la lista de cursos.");
    });
}


function openSaveCourseModal(courses) {
  const modal = document.getElementById("save-course-modal");
  const courseList = document.getElementById("course-list-save");
  const courseNameInput = document.getElementById("course-name-input");
  
  // Vaciar la lista existente
  courseList.innerHTML = "";
  
  // Llenar la lista con los cursos obtenidos
  courses.forEach(course => {
    const li = document.createElement("li");
    li.textContent = course;
    li.style.cursor = "pointer";
    li.addEventListener("click", function() {
      // Al hacer clic, se asigna ese nombre al input
      courseNameInput.value = course;
    });
    courseList.appendChild(li);
  });
  
  // Prellenar el campo si ya existe un nombre
  if (currentCourseName) {
    courseNameInput.value = currentCourseName;
  } else {
    courseNameInput.value = "";
  }
  
  // Mostrar el modal
  modal.style.display = "flex";
}

function closeSaveCourseModal() {
  document.getElementById("save-course-modal").style.display = "none";
}


function saveCourse() {
  const courseNameInput = document.getElementById("course-name-input");
  const courseName = courseNameInput.value.trim();
  
  if (!courseName) {
    alert("Debe ingresar un nombre para el curso.");
    return;
  }
  
  // Actualizar la variable global (para que la próxima vez se prellene)
  currentCourseName = courseName;
  
  // Recopilar los datos de las tarjetas (puedes ajustar según tu estructura)
  const cards = document.querySelectorAll(".card");
  const data = [];
  cards.forEach(card => {
    const contentDiv = card.querySelector(".card-content");
    const cleanContent = cleanCardContent(contentDiv);
    data.push({ id: card.getAttribute("data-id"), content: cleanContent });
  });
  
  // Enviar los datos al servidor (la API save_course.php debe soportar sobreescritura)
  fetch("save_course.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courseName: courseName, courseData: data })
  })
    .then(response => response.json())
    .then(result => {
      if (result.status === "success") {
        alert("Curso guardado exitosamente.");
        closeSaveCourseModal();
      } else {
        alert("Error al guardar el curso: " + result.message);
      }
    })
    .catch(error => {
      console.error(error);
      alert("Error en la comunicación con el servidor.");
    });
}



function serverLoadCourse() {
  fetch("list_courses.php")
  .then(response => response.json())
  .then(courses => {
    openLoadCourseModal(courses);
  })
  .catch(error => {
    console.error(error);
    alert("Error al cargar la lista de cursos.");
  });
}

function openLoadCourseModal(courses) {
  const modal = document.getElementById("load-course-modal");
  const courseList = document.getElementById("course-list-load");
  
  courseList.innerHTML = "";
  
  courses.forEach(course => {
    const li = document.createElement("li");
    li.textContent = course;
    li.style.cursor = "pointer";
    li.addEventListener("click", function() {
      loadCourseFromServer(course);
      closeLoadCourseModal();
    });
    courseList.appendChild(li);
  });
  
  modal.style.display = "flex";
}

function closeLoadCourseModal() {
  document.getElementById("load-course-modal").style.display = "none";
}


function loadCourseFromServer(courseName) {
  fetch("load_course.php?course=" + encodeURIComponent(courseName))
    .then(response => response.json())
    .then(data => {
      const container = document.getElementById("cards-container");
      container.innerHTML = "";
      // Reiniciar la biblioteca de imágenes (opcional, según si deseas conservar las imágenes anteriores o no)
      imageLibrary = [];
      
      data.forEach(item => {
        let card = addCard({ content: item.content, id: item.id });
        reinitializeListenersForCard(card);
        
        // Extraer todas las imágenes de la tarjeta
        const imgs = card.querySelectorAll(".card-images img");
        imgs.forEach(img => {
          // Agregar la URL a la biblioteca solo si no está ya incluida
          if (!imageLibrary.includes(img.src)) {
            imageLibrary.push(img.src);
          }
        });
      });
      
      updateZoom();
      updateImageLibrary(); // Actualizar la UI de la biblioteca con las imágenes extraídas
    })
    .catch(error => {
      console.error(error);
      alert("Error al cargar el curso.");
    });
}




// Reestablecer listeners en una tarjeta cargada
// Actualizar listeners para el text-layer
function reinitializeListenersForCard(card) {
  const textLayer = card.querySelector(".text-layer");
  if (textLayer) {
  
    // Agrega el listener para el clic derecho (contextmenu)
    textLayer.addEventListener("contextmenu", function(e) {
      e.preventDefault(); // Evita que aparezca el menú contextual del navegador
      // Quitar la selección de otros text‑layers y marcar este como seleccionado
      document.querySelectorAll(".text-layer").forEach(t => t.classList.remove("selected-text"));
      textLayer.classList.add("selected-text");
      // Actualizar la variable global para el text-layer actual
      currentTextLayer = textLayer;
      currentTextCard = card;
      // Mostrar el text-panel como menú contextual en la posición del ratón
      showTextPanelContextMenu(e.pageX, e.pageY);
    });
    


    // Agregar handles de rotación y redimensionamiento si aún no existen
    if (!textLayer.querySelector(".rotate-handle")) {
      const rotateHandle = document.createElement("div");
      rotateHandle.className = "rotate-handle";
      rotateHandle.addEventListener("mousedown", function(e) {
        e.stopPropagation();
        startRotate(e, textLayer);
      });
      textLayer.appendChild(rotateHandle);
      addResizeHandles(textLayer);
    }
    
    // Permitir editar el texto con doble clic
    textLayer.querySelectorAll("h2, p").forEach(el => {
      el.addEventListener("dblclick", function(e) {
        e.stopPropagation();
        el.setAttribute("contenteditable", "true");
        el.focus();
        el.addEventListener("blur", function() {
          el.removeAttribute("contenteditable");
        }, { once: true });
      });
    });
  }
  
  // (Aquí continúa el código para reestablecer listeners en las imágenes, sin cambios respecto a lo existente)
  const wrappers = card.querySelectorAll(".card-image-wrapper");
  wrappers.forEach(wrapper => {
    let rotateHandle = wrapper.querySelector(".rotate-handle");
    if (!rotateHandle) {
      rotateHandle = document.createElement("div");
      rotateHandle.className = "rotate-handle";
      rotateHandle.addEventListener("mousedown", function(e) {
        e.stopPropagation();
        startRotate(e, wrapper);
      });
      wrapper.appendChild(rotateHandle);
    }
    addResizeHandles(wrapper);
    wrapper.addEventListener("mousedown", function(e) {
      if (e.target.classList.contains("resize-handle") || e.target.classList.contains("rotate-handle")) return;
      initDragImage(e, wrapper);
    });
    wrapper.addEventListener("contextmenu", function(e) {
      e.preventDefault();
      currentImageWrapper = wrapper;
      showImageContextMenu(e.pageX, e.pageY);
    });
    wrapper.addEventListener("click", function(e) {
      e.stopPropagation();
      const imagesContainer = card.querySelector(".card-images");
      imagesContainer.querySelectorAll(".card-image-wrapper").forEach(w => w.classList.remove("selected-image"));
      wrapper.classList.add("selected-image");
    });
  });
}

// función para mostrar el text‑panel como menú contextual
function showTextPanelContextMenu(x, y) {
  const panel = document.getElementById("text-panel");
  // Asegurarse de que el panel tenga posición fixed para posicionarlo en (x, y)
  panel.style.position = "fixed";
  panel.style.left = x + "px";
  panel.style.top = y + "px";
  // Mostrar el panel (por ejemplo, cambiando display o removiendo una clase que lo oculta)
  panel.classList.add("open");
}



// Funciones para botones internos del texto
function toggleTitle(btn) {
  const card = btn.closest(".card");
  const title = card.querySelector("h2");
  title.style.display = title.style.display === "none" ? "block" : "none";
}

function toggleText(btn) {
  const card = btn.closest(".card");
  let text = card.querySelector("p");
  if (!text) {
    text = document.createElement("p");
    text.textContent = "Texto de la tarjeta";
    card.insertBefore(text, card.querySelector(".card-buttons"));
  } else {
    text.style.display = text.style.display === "none" ? "block" : "none";
  }
}

function duplicateCard(btn) {
  const card = btn.closest(".card");
  const content = card.querySelector(".card-content").innerHTML;
  addCard({ content: content });
}

function deleteCard(btn) {
  const card = btn.closest(".card");
  // Buscar un text‑layer seleccionado en la tarjeta
  const selectedText = card.querySelector(".text-layer.selected-text");
  // Buscar una imagen seleccionada en la tarjeta
  const selectedImage = card.querySelector(".card-images .card-image-wrapper.selected-image");
  
  if (selectedText) {
    if (confirm("¿Está seguro de borrar el texto seleccionado?")) {
      selectedText.remove();
      // Si el text-layer borrado es el actual, limpiar la variable global
      if (currentTextLayer === selectedText) {
        currentTextLayer = null;
      }
      return;
    }
  } else if (selectedImage) {
    if (confirm("¿Está seguro de borrar la imagen seleccionada?")) {
      selectedImage.remove();
      return;
    }
  } else {
    if (confirm("¿Está seguro de borrar la tarjeta completa?")) {
      card.remove();
    }
  }
}

function openSidePanelForCard(btn) {
  activeCard = btn.closest(".card");
  openSidePanel();
}

// Funciones para agregar imagen a la tarjeta
function addImageToCard(card, src) {
  const imagesContainer = card.querySelector(".card-images");
  const wrapper = document.createElement("div");
  wrapper.className = "card-image-wrapper";
  wrapper.style.top = "0px";
  wrapper.style.left = "0px";
  
  const img = document.createElement("img");
  img.src = src;
  img.onload = function() {
    wrapper.style.width = img.naturalWidth + "px";
    wrapper.style.height = img.naturalHeight + "px";
  };
  
  const rotateHandle = document.createElement("div");
  rotateHandle.className = "rotate-handle";
  rotateHandle.addEventListener("mousedown", function(e) {
    e.stopPropagation();
    startRotate(e, wrapper);
  });
  
  // Agregar el handle de rotación al wrapper
  wrapper.appendChild(rotateHandle);
  addResizeHandles(wrapper);
  
  wrapper.addEventListener("mousedown", function(e) {
    if (e.target.classList.contains("resize-handle") || e.target.classList.contains("rotate-handle")) return;
    initDragImage(e, wrapper);
  });
  
  wrapper.addEventListener("click", function(e) {
    e.stopPropagation();
    // Remover la clase "selected-image" de otros wrappers y marcar este
    const allWrappers = card.querySelectorAll(".card-image-wrapper");
    allWrappers.forEach(w => w.classList.remove("selected-image"));
    wrapper.classList.add("selected-image");
  });
  
  wrapper.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    currentImageWrapper = wrapper;
    showImageContextMenu(e.pageX, e.pageY);
  });
  
  // Agregar la imagen al wrapper y al contenedor
  wrapper.appendChild(img);
  imagesContainer.appendChild(wrapper);
  
  // Retornar el wrapper para poder usarlo en otras funciones (por ejemplo, para reemplazar la imagen)
  return wrapper;
}

function addResizeHandles(wrapper) {
  if (wrapper.querySelector(".resize-handle.tl")) return;
  const tl = document.createElement("div");
  tl.className = "resize-handle tl";
  const tr = document.createElement("div");
  tr.className = "resize-handle tr";
  const bl = document.createElement("div");
  bl.className = "resize-handle bl";
  const br = document.createElement("div");
  br.className = "resize-handle br";
  [tl, tr, bl, br].forEach(handle => {
    wrapper.appendChild(handle);
    handle.addEventListener("mousedown", initResize);
  });
}

// Funciones para subir imagen (upload.php)
function setBackgroundImage(event, btn) {
  const card = btn.closest(".card");
  const file = event.target.files[0];
  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    fetch("upload.php", {
      method: "POST",
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === "success") {
        addImageToCard(card, data.url);
        imageLibrary.push(data.url);
        updateImageLibrary();
      } else {
        alert("Error al subir la imagen: " + data.message);
      }
    })
    .catch(error => {
      console.error("Error:", error);
      alert("Error al subir la imagen.");
    });
  }
}

function handleUploadImage(e) {
  const file = e.target.files[0];
  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    fetch("upload.php", {
      method: "POST",
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === "success") {
        if (activeCard) { 
          addImageToCard(activeCard, data.url);
        }
        imageLibrary.push(data.url);
        updateImageLibrary();
      } else {
        alert("Error al subir la imagen: " + data.message);
      }
    })
    .catch(error => {
      console.error("Error:", error);
      alert("Error al subir la imagen.");
    });
  }
}

function updateImageLibrary() {
  const libraryDiv = document.getElementById("image-library");
  libraryDiv.innerHTML = "";
  imageLibrary.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.style.cursor = "pointer";
    img.addEventListener("click", function() {
      if (activeCard) {
        if (replaceImageMode && currentImageWrapper) {
          // Actualizar la imagen existente en currentImageWrapper
          const innerImg = currentImageWrapper.querySelector("img");
          if (innerImg) {
            innerImg.src = src;
          }
          // Opcional: quitar la selección
          currentImageWrapper.classList.remove("selected-image");
          // Desactivar el modo de reemplazo
          replaceImageMode = false;
          // Opcional: cerrar el panel de imágenes
          closeSidePanel();
        } else {
          // Si no está en modo reemplazo, se agrega la imagen como de costumbre
          addImageToCard(activeCard, src);
        }
      }
    });
    libraryDiv.appendChild(img);
  });
}


function deleteSelectedImage(btn) {
  const card = btn.closest(".card");
  const selectedImg = card.querySelector(".card-images .card-image-wrapper.selected-image");
  if (selectedImg) {
    selectedImg.remove();
  } else {
    alert("No hay imagen seleccionada para borrar.");
  }
}

// Redimensionar imagen
let resizeData = {};
function initResize(e) {
  e.stopPropagation();
  resizeData.handle = e.target;
  resizeData.startX = e.clientX;
  resizeData.startY = e.clientY;
  const wrapper = e.target.parentElement;
  resizeData.startWidth = wrapper.offsetWidth;
  resizeData.startHeight = wrapper.offsetHeight;
  resizeData.startLeft = wrapper.offsetLeft;
  resizeData.startTop = wrapper.offsetTop;
  resizeData.wrapper = wrapper;
  document.addEventListener("mousemove", doResize);
  document.addEventListener("mouseup", stopResize);
}
function doResize(e) {
  e.preventDefault();
  const dx = e.clientX - resizeData.startX;
  const dy = e.clientY - resizeData.startY;
  const handle = resizeData.handle;
  const wrapper = resizeData.wrapper;
  if (handle.classList.contains("tl")) {
    wrapper.style.width = (resizeData.startWidth - dx) + "px";
    wrapper.style.height = (resizeData.startHeight - dy) + "px";
    wrapper.style.left = (resizeData.startLeft + dx) + "px";
    wrapper.style.top = (resizeData.startTop + dy) + "px";
  } else if (handle.classList.contains("tr")) {
    wrapper.style.width = (resizeData.startWidth + dx) + "px";
    wrapper.style.height = (resizeData.startHeight - dy) + "px";
    wrapper.style.top = (resizeData.startTop + dy) + "px";
  } else if (handle.classList.contains("bl")) {
    wrapper.style.width = (resizeData.startWidth - dx) + "px";
    wrapper.style.height = (resizeData.startHeight + dy) + "px";
    wrapper.style.left = (resizeData.startLeft + dx) + "px";
  } else if (handle.classList.contains("br")) {
    wrapper.style.width = (resizeData.startWidth + dx) + "px";
    wrapper.style.height = (resizeData.startHeight + dy) + "px";
  }
}
function stopResize(e) {
  document.removeEventListener("mousemove", doResize);
  document.removeEventListener("mouseup", stopResize);
}

// Arrastrar imagen
let dragData = {};
function initDragImage(e, wrapper) {
  if (e.target.classList.contains("resize-handle") || e.target.classList.contains("rotate-handle")) return;
  e.preventDefault();
  dragData.startX = e.clientX;
  dragData.startY = e.clientY;
  dragData.wrapper = wrapper;
  dragData.startLeft = wrapper.offsetLeft;
  dragData.startTop = wrapper.offsetTop;
  document.addEventListener("mousemove", doDragImage);
  document.addEventListener("mouseup", stopDragImage);
}
function doDragImage(e) {
  e.preventDefault();
  const dx = e.clientX - dragData.startX;
  const dy = e.clientY - dragData.startY;
  dragData.wrapper.style.left = (dragData.startLeft + dx) + "px";
  dragData.wrapper.style.top = (dragData.startTop + dy) + "px";
}
function stopDragImage(e) {
  document.removeEventListener("mousemove", doDragImage);
  document.removeEventListener("mouseup", stopDragImage);
}

// Giro arbitrario mediante rotate-handle
let rotatingData = {};
function startRotate(e, wrapper) {
  e.stopPropagation();
  rotatingData.wrapper = wrapper;
  const rect = wrapper.getBoundingClientRect();
  rotatingData.centerX = rect.left + rect.width / 2;
  rotatingData.centerY = rect.top + rect.height / 2;
  rotatingData.startAngle = Math.atan2(e.pageY - rotatingData.centerY, e.pageX - rotatingData.centerX) * (180 / Math.PI);
  rotatingData.initialRotation = parseFloat(wrapper.getAttribute("data-rotation")) || 0;
  rotatingData.active = true;
  document.addEventListener("mousemove", doRotate);
  document.addEventListener("mouseup", stopRotate);
}
function doRotate(e) {
  if (!rotatingData.active) return;
  const currentAngle = Math.atan2(e.pageY - rotatingData.centerY, e.pageX - rotatingData.centerX) * (180 / Math.PI);
  const newRotation = rotatingData.initialRotation + (currentAngle - rotatingData.startAngle);
  rotatingData.wrapper.style.transform = `rotate(${newRotation}deg)`;
  rotatingData.wrapper.setAttribute("data-rotation", newRotation);
}
function stopRotate(e) {
  rotatingData.active = false;
  document.removeEventListener("mousemove", doRotate);
  document.removeEventListener("mouseup", stopRotate);
}

// Menú contextual para imagen
function showImageContextMenu(x, y) {
  const menu = document.getElementById("image-context-menu");
  menu.style.display = "block";
  menu.style.left = x + "px";
  menu.style.top = y + "px";
}
function hideImageContextMenu() {
  document.getElementById("image-context-menu").style.display = "none";
}
function contextImageDelete() {
  if (currentImageWrapper) {
    currentImageWrapper.remove();
    currentImageWrapper = null;
  }
  hideImageContextMenu();
}
function contextImageFullScreen() {
  if (currentImageWrapper && activeCard) {
    const cardContent = activeCard.querySelector(".card-content");
    currentImageWrapper.style.width = cardContent.offsetWidth + "px";
    currentImageWrapper.style.height = cardContent.offsetHeight + "px";
    currentImageWrapper.style.top = "0px";
    currentImageWrapper.style.left = "0px";
  }
  hideImageContextMenu();
}
function contextImageThumbnail() {
  if (currentImageWrapper && activeCard) {
    const cardContent = activeCard.querySelector(".card-content");
    currentImageWrapper.style.width = (cardContent.offsetWidth * 0.3) + "px";
    currentImageWrapper.style.height = (cardContent.offsetHeight * 0.3) + "px";
  }
  hideImageContextMenu();
}
function contextImageBringToFront() {
  if (currentImageWrapper) {
    currentImageWrapper.style.zIndex = "9999";
  }
  hideImageContextMenu();
}
function contextImageSendToBack() {
  if (currentImageWrapper) {
    currentImageWrapper.style.zIndex = "4";
  }
  hideImageContextMenu();
}



// Alternar layout vertical/horizontal
function toggleLayout() {
  const container = document.getElementById("cards-container");
  const btn = document.getElementById("toggle-layout");
  if (currentLayout === "vertical") {
    container.classList.add("horizontal-layout");
    currentLayout = "horizontal";
    btn.textContent = "Layout: Horizontal";
  } else {
    container.classList.remove("horizontal-layout");
    currentLayout = "vertical";
    btn.textContent = "Layout: Vertical";
  }
  // Guardar la elección en localStorage
  localStorage.setItem("layout", currentLayout);
}


// API de Giphy: búsqueda por defecto ("Happy", 24 resultados)
function searchGiphyDefault() {
  const query = "Happy";
  fetch(`https://api.giphy.com/v1/gifs/search?api_key=${giphyApiKey}&q=${encodeURIComponent(query)}&limit=24`)
    .then(response => response.json())
    .then(data => {
      const resultsDiv = document.getElementById("giphy-results");
      resultsDiv.innerHTML = "";
      data.data.forEach(item => {
        const imgUrl = item.images.fixed_height.url;
        const imgElem = document.createElement("img");
        imgElem.src = imgUrl;
        imgElem.style.cursor = "pointer";
        imgElem.addEventListener("click", function() {
          if (activeCard) {
            // Agregar inmediatamente la imagen desde la URL de Giphy
            let wrapper = addImageToCard(activeCard, imgUrl);
            // Opcional: marcar este wrapper como el actual para reemplazo
            currentImageWrapper = wrapper;
            // Iniciar la descarga en el servidor y, al recibir el nuevo URL, reemplazar el src
            downloadGiphyImage(imgUrl)
              .then(newUrl => {
                // Una vez descargada, actualizar el src de la imagen
                let innerImg = wrapper.querySelector("img");
                if (innerImg) {
                  innerImg.src = newUrl;
                }
                // Actualizar la biblioteca de imágenes (opcional)
                if (!imageLibrary.includes(newUrl)) {
                  imageLibrary.push(newUrl);
                  updateImageLibrary();
                }
              })
              .catch(err => {
                console.error(err);
                alert("Error al descargar la imagen desde Giphy.");
              });
          }
        });
        resultsDiv.appendChild(imgElem);
      });
    })
    .catch(error => {
      console.error(error);
      alert("Error al buscar GIFs en Giphy.");
    });
}




function searchGiphy() {
  const query = document.getElementById("giphy-query").value;
  if (!query) return;
  fetch(`https://api.giphy.com/v1/gifs/search?api_key=${giphyApiKey}&q=${encodeURIComponent(query)}&limit=24`)
    .then(response => response.json())
    .then(data => {
      const resultsDiv = document.getElementById("giphy-results");
      resultsDiv.innerHTML = "";
      data.data.forEach(item => {
        const imgUrl = item.images.fixed_height.url;
        const imgElem = document.createElement("img");
        imgElem.src = imgUrl;
        imgElem.style.cursor = "pointer";
        imgElem.addEventListener("click", function() {
          if (activeCard) {
            // Agregar inmediatamente la imagen desde la URL de Giphy
            let wrapper = addImageToCard(activeCard, imgUrl);
            // Opcional: marcar este wrapper como el actual para reemplazo
            currentImageWrapper = wrapper;
            // Iniciar la descarga en el servidor y, al recibir el nuevo URL, reemplazar el src
            downloadGiphyImage(imgUrl)
              .then(newUrl => {
                // Una vez descargada, actualizar el src de la imagen
                let innerImg = wrapper.querySelector("img");
                if (innerImg) {
                  innerImg.src = newUrl;
                }
                // Actualizar la biblioteca de imágenes (opcional)
                if (!imageLibrary.includes(newUrl)) {
                  imageLibrary.push(newUrl);
                  updateImageLibrary();
                }
              })
              .catch(err => {
                console.error(err);
                alert("Error al descargar la imagen desde Giphy.");
              });
          }
        });
        resultsDiv.appendChild(imgElem);
      });
    })
    .catch(error => {
      console.error(error);
      alert("Error al buscar GIFs en Giphy.");
    });
}




function searchGiphy() {
  const query = document.getElementById("giphy-query").value;
  if (!query) return;
  fetch(`https://api.giphy.com/v1/gifs/search?api_key=${giphyApiKey}&q=${encodeURIComponent(query)}&limit=24`)
  .then(response => response.json())
  .then(data => {
    const resultsDiv = document.getElementById("giphy-results");
    resultsDiv.innerHTML = "";
    data.data.forEach(item => {
      const imgUrl = item.images.fixed_height.url;
      const img = document.createElement("img");
      img.src = imgUrl;
      img.style.cursor = "pointer";
      img.addEventListener("click", function() {
        if (activeCard) {
          // En lugar de agregar directamente, se descarga la imagen al servidor
          downloadGiphyImage(imgUrl)
            .then(newUrl => {
              addImageToCard(activeCard, newUrl);
              // También se puede actualizar la biblioteca de imágenes
              if (!imageLibrary.includes(newUrl)) {
                imageLibrary.push(newUrl);
                updateImageLibrary();
              }
            })
            .catch(err => {
              console.error(err);
              alert("Error al descargar la imagen desde Giphy.");
            });
        }
      });
      resultsDiv.appendChild(img);
    });
  })
  .catch(error => {
    console.error(error);
    alert("Error al buscar GIFs en Giphy.");
  });
}




function downloadGiphyImage(url) {
  return fetch("download_giphy.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: url })
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === "success") {
      return data.url; // La nueva URL en la carpeta uploads
    } else {
      throw new Error(data.message || "Error al descargar la imagen.");
    }
  });
}


// Ocultar menús contextuales y quitar la selección 
// (bordes/handles) al hacer clic fuera

document.addEventListener("click", function(e) {
  // Ocultar menú contextual de imagen si se hace clic fuera
  if (!e.target.closest("#image-context-menu")) {
    hideImageContextMenu();
  }
  
  // Remover la selección de imágenes (borde y handles)
  if (!e.target.closest(".card-image-wrapper")) {
    document.querySelectorAll(".card-image-wrapper.selected-image").forEach(el => {
      el.classList.remove("selected-image");
    });
  }
  // Remover la selección de texto (asumiendo que se marca con la clase "selected-text")
  if (!e.target.closest(".text-layer")) {
    document.querySelectorAll(".text-layer.selected-text").forEach(el => {
      el.classList.remove("selected-text");
    });
  }

  //Ocultar el menú contextual de texto al hacer clic fuera
  if (!e.target.closest("#text-panel") && !e.target.closest(".text-layer")) {
    // Remover la clase "open" del text-panel para ocultarlo
    document.getElementById("text-panel").classList.remove("open");
    // También quitar la clase de selección de los text-layers, si lo deseas
    document.querySelectorAll(".text-layer.selected-text").forEach(el => el.classList.remove("selected-text"));
  }

});  



// Funciones del Side Panel
function openSidePanel() {
  console.log("abrirrrr");
  document.getElementById("side-panel").classList.add("open");
  showTab("images");
  // Ocultar el text-panel
  document.getElementById("text-panel").classList.remove("open");
}


function closeSidePanel() {
  document.getElementById("side-panel").classList.remove("open");
}

function showTab(tabName) {
  document.querySelectorAll("#side-panel .tab-pane").forEach(pane => pane.classList.remove("active"));
  document.getElementById(tabName + "-tab").classList.add("active");
  document.querySelectorAll("#side-panel #tabs .tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });
  if (tabName === "gifs") {
    searchGiphyDefault();
  }
}



//Funciones para mostrar y ocultar el panel de formato de texto y actualizar estilos
function showTextPanel(textElement) {
  const panel = document.getElementById("text-panel");
  panel.classList.add("open");
  // Ocultar el panel de imágenes, si está activo
  document.getElementById("side-panel").classList.remove("open");
  
  // Asigna currentTextCard (si aún no se ha hecho) y actualiza controles
  const card = textElement.closest(".card");
  if (card) {
    currentTextCard = card;
  }
  // Actualizar los controles del panel según el estilo actual del textElement
  const computed = window.getComputedStyle(textElement);
  document.getElementById("font-size-input").value = parseInt(computed.fontSize);
  document.getElementById("text-color-input").value = rgbToHex(computed.color);
  document.getElementById("bg-color-input").value = rgbToHex(computed.backgroundColor || "#ffffff");
}



function hideTextPanel() {
  document.getElementById("text-panel").classList.remove("open");
}

// Helper para convertir rgb a hexadecimal
function rgbToHex(rgb) {
  const result = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(rgb);
  return result ? "#" +
    ("0" + parseInt(result[1], 10).toString(16)).slice(-2) +
    ("0" + parseInt(result[2], 10).toString(16)).slice(-2) +
    ("0" + parseInt(result[3], 10).toString(16)).slice(-2) : rgb;
}

// Listeners para los controles del panel de formato de texto
document.getElementById("align-left").addEventListener("click", function() {
  if (currentTextLayer)currentTextLayer.style.textAlign = "left";
  
});

document.getElementById("align-center").addEventListener("click", function() {
  if (currentTextLayer)currentTextLayer.style.textAlign = "center";

});

document.getElementById("align-right").addEventListener("click", function() {
  if (currentTextLayer)currentTextLayer.style.textAlign = "right";
});

document.getElementById("font-size-input").addEventListener("input", function(e) {
 if (currentTextLayer)currentTextLayer.style.fontSize = e.target.value + "px";
});

document.getElementById("toggle-bold").addEventListener("click", function() {
  if (currentTextLayer)currentTextLayer.style.fontWeight = (currentTextLayer.style.fontWeight === "bold") ? "normal" : "bold";
  
});

document.getElementById("toggle-underline").addEventListener("click", function() {
  if (currentTextLayer)currentTextLayer.style.textDecoration = (currentTextLayer.style.textDecoration === "underline") ? "none" : "underline";
  
});

document.getElementById("text-color-input").addEventListener("input", function(e) {
  if (currentTextLayer)currentTextLayer.style.color = e.target.value;
});

document.getElementById("bg-color-input").addEventListener("input", function(e) {
  if (currentTextLayer)currentTextLayer.style.backgroundColor = e.target.value;
});

// Botones de alineación vertical:
document.getElementById("align-top").addEventListener("click", function() {
  if (currentTextLayer)currentTextLayer.style.justifyContent = "flex-start";

});

document.getElementById("align-middle").addEventListener("click", function() {
  if (currentTextLayer)currentTextLayer.style.justifyContent = "center";
  
});


document.getElementById("align-bottom").addEventListener("click", function() {
 if (currentTextLayer)currentTextLayer.style.justifyContent = "flex-end";
});

// Botones toggle para ocultar/mostrar título y párrafo:
document.getElementById("toggle-title").addEventListener("click", function() {
  if (currentTextCard) {
    const title = currentTextCard.querySelector(".text-layer h2");
    title.style.display = (title.style.display === "none") ? "block" : "none";
  }
});

document.getElementById("toggle-paragraph").addEventListener("click", function() {
  if (currentTextCard) {
    const para = currentTextCard.querySelector(".text-layer p");
    para.style.display = (para.style.display === "none") ? "block" : "none";
  }
});

// Botones para traer al frente y enviar al fondo:
document.getElementById("bring-to-front").addEventListener("click", function() {
  if (currentTextCard) {
    const textLayer = currentTextCard.querySelector(".text-layer");
    textLayer.style.zIndex = "9999";
  }
});
document.getElementById("send-to-back").addEventListener("click", function() {
  if (currentTextCard) {
    const textLayer = currentTextCard.querySelector(".text-layer");
    textLayer.style.zIndex = "4";
  }
});


// Oculte el panel de formato si se hace clic fuera del text-layer y del panel
document.addEventListener("click", function(e) {
  if (!e.target.closest(".text-layer") && !e.target.closest("#text-panel")) {
    document.querySelectorAll(".text-layer.selected-text").forEach(el => el.classList.remove("selected-text"));
    hideTextPanel();
  }

  if (!e.target.closest("#side-panel") && !e.target.closest(".open-side-panel-btn") &&  document.getElementById("side-panel").classList.contains("open")) {
    closeSidePanel();
  }

});


//Evitar que los clics dentro del panel se propaguen al listener global
document.getElementById("text-panel").addEventListener("click", function(e) {
  // Evita que el clic en el panel deseleccione el texto
  e.stopPropagation();
});


// Función completa para agregar un nuevo text‑layer
function addTextLayer(btn, card=null) {
  if(btn!=null) card = btn.closest(".card");
  const newTextLayer = document.createElement("div");
  newTextLayer.className = "text-layer";
  newTextLayer.innerHTML = `
    <h2 contenteditable="true">Nuevo Título</h2>
    <p contenteditable="true">Nuevo Texto</p>
  `;
  const cardContent = card.querySelector(".card-content");
  cardContent.appendChild(newTextLayer);


  // Agrega el listener para el clic derecho (contextmenu)
  newTextLayer.addEventListener("contextmenu", function(e) {
      e.preventDefault(); // Evita que aparezca el menú contextual del navegador
      // Quitar la selección de otros text‑layers y marcar este como seleccionado
      document.querySelectorAll(".text-layer").forEach(t => t.classList.remove("selected-text"));
      newTextLayer.classList.add("selected-text");
      // Actualizar la variable global para el text-layer actual
      currentTextLayer = newTextLayer;
      currentTextCard = card;
      // Mostrar el text-panel como menú contextual en la posición del ratón
      showTextPanelContextMenu(e.pageX, e.pageY);
  });

  // Listener para seleccionar y mover el text-layer
  newTextLayer.addEventListener("mousedown", function(e) {
    if (e.target.classList.contains("resize-handle") || e.target.classList.contains("rotate-handle"))
      return;
    // Quitar la selección de otros text‑layers en la tarjeta y marcar este como seleccionado
    card.querySelectorAll(".text-layer").forEach(t => t.classList.remove("selected-text"));
    newTextLayer.classList.add("selected-text");
    // Actualizar la variable global para que el text-panel actúe sobre este elemento
    currentTextLayer = newTextLayer;
    // Actualizar también currentTextCard, si lo utilizas
    currentTextCard = card;
    // Iniciar el movimiento (drag) para reubicar el text‑layer
    initDragImage(e, newTextLayer);
  });

  // Agregar handle de rotación y redimensionamiento (si no existen)
  if (!newTextLayer.querySelector(".rotate-handle")) {
    const rotateHandle = document.createElement("div");
    rotateHandle.className = "rotate-handle";
    rotateHandle.addEventListener("mousedown", function(e) {
      e.stopPropagation();
      startRotate(e, newTextLayer);
    });
    newTextLayer.appendChild(rotateHandle);
    addResizeHandles(newTextLayer);
  }

  // Permitir la edición con doble clic
  newTextLayer.querySelectorAll("h2, p").forEach(el => {
    el.addEventListener("dblclick", function(e) {
      e.stopPropagation();
      el.setAttribute("contenteditable", "true");
      el.focus();
      el.addEventListener("blur", function() {
        el.removeAttribute("contenteditable");
      }, { once: true });
    });
  });


}


// Inicializar el editor y controles de zoom
function initializeEditor() {
    const container = document.getElementById("cards-container");
    // Recuperar layout guardado (vertical u horizontal) del localStorage
    const savedLayout = localStorage.getItem("layout");
    if (savedLayout) {
      currentLayout = savedLayout;
      if (currentLayout === "horizontal") {
        container.classList.add("horizontal-layout");
        document.getElementById("toggle-layout").textContent = "Layout: Horizontal";
      } else {
        container.classList.remove("horizontal-layout");
        document.getElementById("toggle-layout").textContent = "Layout: Vertical";
      }
    }
    if (container.children.length === 0) { addCard(); }
    updateZoom();
    document.getElementById("zoom-in").addEventListener("click", function() {
      currentZoom += 5;
      updateZoom();
    });
    document.getElementById("zoom-out").addEventListener("click", function() {
      currentZoom = Math.max(5, currentZoom - 5);
      updateZoom();
  });
}


function contextImageChange() {
  if (!currentImageWrapper) {
    alert("No hay imagen seleccionada para cambiar.");
    return;
  }
  // Activar el modo de reemplazo
  replaceImageMode = true;
  // Abrir el panel lateral de imágenes y activar la pestaña "Imagen"
  openSidePanel();
  showTab("images");
  // Ocultar el menú contextual
  hideImageContextMenu();
}



// funciones de inicio
window.onload = initializeEditor;

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("upload-image-btn").addEventListener("click", function() {
    document.getElementById("upload-image-input").click();
});
  
document.getElementById("canvas").addEventListener("wheel", function(e) {
    if (currentLayout === "horizontal") {
      e.preventDefault();
      this.scrollLeft += e.deltaY;
    }
  });
});  