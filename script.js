/* ============================================================
VIEWMETRICAMX
VISOR 360° + EXPERIENCIAS
============================================================ */

/* ============================================================
CONFIGURACIÓN
============================================================ */

const CONFIG = {

whatsapp:
"https://wa.me/528714005421?text=Hola%2C%20quiero%20conocer%20m%C3%A1s%20sobre%20ViewmetricaMX.",

autoChangeMinutes: 3,

autoRotateSpeed: 0.005,

fovDefault: 80,

fovMin: 35,

fovMax: 95

};

/* ============================================================
EXPERIENCIAS
============================================================ */

const EXPERIENCES = [

{
key: "patrimonio",
title: "PATRIMONIO CULTURAL",
file: "assets/viewmetricamx_demo_360_patrimonio_cultural.jpg"
},

{
key: "exterior",
title: "EXTERIOR",
file: "assets/viewmetricamx_demo_360_exterior.jpg"
},

{
key: "restaurant",
title: "RESTAURANT",
file: "assets/viewmetricamx_demo_360_restaurant.jpg"
},

{
key: "salon",
title: "SALÓN",
file: "assets/viewmetricamx_demo_360_salon.jpg"
},

{
key: "universidad",
title: "UNIVERSIDAD",
file: "assets/viewmetricamx_demo_360_universidad.jpg"
}

];

/* ============================================================
ESTADO
============================================================ */

let renderer = null;
let scene = null;
let camera = null;
let sphere = null;

let currentExperience = 0;

let lon = 0;
let lat = 0;

let targetFov = CONFIG.fovDefault;

let isPointerDown = false;

let startX = 0;
let startY = 0;

let startLon = 0;
let startLat = 0;

let velocityLon = 0;
let velocityLat = 0;

let lastInteraction = performance.now();

let userInteracted = false;

let autoTimer = null;
let autoStartedAt = performance.now();

let textureLoader = null;

const textureCache = {};

/* ============================================================
DOM
============================================================ */

const stage =
document.getElementById("viewer-stage");

const canvas =
document.getElementById("pano-canvas");

const loading =
document.getElementById("viewer-loading");

const loadingLabel =
document.getElementById("loading-label");

const titleEl =
document.getElementById("experience-title");

const counterEl =
document.getElementById("experience-counter");

const autoTimeEl =
document.getElementById("auto-time");

const progressBar =
document.getElementById("autoplay-progress-bar");

const dragHint =
document.getElementById("drag-hint");

/* ============================================================
WEBGL
============================================================ */

function supportsWebGL() {

try {

```
const test =
  document.createElement("canvas");

return !!(
  window.WebGLRenderingContext &&
  (
    test.getContext("webgl") ||
    test.getContext("experimental-webgl")
  )
);
```

} catch (error) {

```
return false;
```

}

}

/* ============================================================
INIT
============================================================ */

function initViewer() {

if (
typeof THREE === "undefined" ||
!supportsWebGL()
) {

```
showViewerError(
  "No fue posible inicializar el visor 360°."
);

return;
```

}

try {

```
renderer =
  new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });


renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio || 1,
    2
  )
);


renderer.setClearColor(
  0x000000,
  1
);


scene =
  new THREE.Scene();


camera =
  new THREE.PerspectiveCamera(
    CONFIG.fovDefault,
    1,
    1,
    1100
  );


camera.position.set(
  0,
  0,
  0
);


const geometry =
  new THREE.SphereGeometry(
    500,
    64,
    48
  );


/*
  IMPORTANTE:
  La cámara está dentro de la esfera.
  Invertimos el eje Z para ver la textura desde dentro.
*/

geometry.scale(
  1,
  1,
  -1
);


const material =
  new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.FrontSide
  });


sphere =
  new THREE.Mesh(
    geometry,
    material
  );


scene.add(sphere);


textureLoader =
  new THREE.TextureLoader();


resizeViewer();

window.addEventListener(
  "resize",
  resizeViewer
);


setupMouse();

setupTouch();

setupWheel();

setupButtons();

setupNavigation();

setupCTA();

setupReveal();

loadExperience(
  0,
  true
);


requestAnimationFrame(
  animate
);


startAutoTimer();

updateAutoUI();


setTimeout(
  () => {

    dragHint.classList.add(
      "is-hidden"
    );

  },
  5500
);


console.log(
  "[ViewmetricaMX] Visor iniciado."
);
```

} catch (error) {

```
console.error(
  "[ViewmetricaMX] Error inicializando visor:",
  error
);

showViewerError(
  "No fue posible iniciar la experiencia 360°."
);
```

}

}

/* ============================================================
ERROR
============================================================ */

function showViewerError(message) {

if (loading) {

```
loading.hidden = false;

loading.innerHTML = `
  <div style="
    text-align:center;
    max-width:420px;
    padding:30px;
  ">
    <strong style="
      display:block;
      color:#00f5d4;
      margin-bottom:10px;
    ">
      VIEWMETRICAMX
    </strong>

    <span>${message}</span>
  </div>
`;
```

}

}

/* ============================================================
RESIZE
============================================================ */

function resizeViewer() {

if (
!renderer ||
!camera ||
!stage
) return;

const width =
stage.clientWidth;

const height =
stage.clientHeight;

if (
width <= 0 ||
height <= 0
) return;

renderer.setSize(
width,
height,
false
);

camera.aspect =
width / height;

camera.updateProjectionMatrix();

}

/* ============================================================
LOAD EXPERIENCE
============================================================ */

function loadExperience(
index,
resetView = true
) {

if (
index < 0 ||
index >= EXPERIENCES.length
) return;

currentExperience =
index;

const experience =
EXPERIENCES[index];

titleEl.textContent =
experience.title;

counterEl.textContent =
String(index + 1).padStart(2, "0") +
" / " +
String(EXPERIENCES.length).padStart(2, "0");

if (resetView) {

```
lon = 0;
lat = 0;

targetFov =
  CONFIG.fovDefault;
```

}

resetAutoTimer();

loadTexture(
experience
);

}

/* ============================================================
LOAD TEXTURE
============================================================ */

function loadTexture(
experience
) {

const key =
experience.key;

if (
textureCache[key]
) {

```
applyTexture(
  textureCache[key]
);

hideLoading();

return;
```

}

showLoading(
"Preparando " +
experience.title.toLowerCase() +
"…"
);

textureLoader.load(

```
experience.file,

function(texture) {

  /*
    Three.js r128 utiliza encoding.
    No usamos colorSpace aquí porque estamos
    cargando específicamente r128.
  */

  if (
    THREE.sRGBEncoding !== undefined
  ) {

    texture.encoding =
      THREE.sRGBEncoding;

  }


  texture.minFilter =
    THREE.LinearFilter;

  texture.magFilter =
    THREE.LinearFilter;

  texture.generateMipmaps =
    false;


  texture.wrapS =
    THREE.ClampToEdgeWrapping;

  texture.wrapT =
    THREE.ClampToEdgeWrapping;


  textureCache[key] =
    texture;


  applyTexture(
    texture
  );


  hideLoading();


  console.log(
    "[ViewmetricaMX] Panorama cargado:",
    experience.file
  );

},

function(xhr) {

  if (
    xhr &&
    xhr.total
  ) {

    const percent =
      Math.round(
        (xhr.loaded / xhr.total) * 100
      );


    loadingLabel.textContent =
      "Cargando " +
      percent +
      "%…";

  }

},

function(error) {

  console.error(
    "[ViewmetricaMX] Error cargando:",
    experience.file,
    error
  );


  showLoading(
    "No se pudo cargar esta experiencia."
  );

}
```

);

}

/* ============================================================
APPLY TEXTURE
============================================================ */

function applyTexture(
texture
) {

if (
!sphere ||
!sphere.material
) return;

texture.needsUpdate = true;

sphere.material.map =
texture;

sphere.material.color.set(
0xffffff
);

sphere.material.needsUpdate =
true;

}

/* ============================================================
LOADING
============================================================ */

function showLoading(message) {

loadingLabel.textContent =
message;

loading.hidden =
false;

}

function hideLoading() {

loading.hidden =
true;

}

/* ============================================================
RENDER
============================================================ */

function animate() {

requestAnimationFrame(
animate
);

if (!renderer) return;

/*
Inercia después del drag.
*/

if (!isPointerDown) {

```
lon += velocityLon;
lat += velocityLat;


velocityLon *= 0.94;
velocityLat *= 0.94;


if (
  Math.abs(velocityLon) < 0.0005
) {

  velocityLon = 0;

}


if (
  Math.abs(velocityLat) < 0.0005
) {

  velocityLat = 0;

}


/*
  Rotación automática suave
  cuando el usuario no está arrastrando.
*/

if (
  Math.abs(velocityLon) < 0.01 &&
  performance.now() -
  lastInteraction >
  2500
) {

  lon +=
    CONFIG.autoRotateSpeed;

}
```

}

lat =
Math.max(
-85,
Math.min(
85,
lat
)
);

const phi =
THREE.MathUtils.degToRad(
90 - lat
);

const theta =
THREE.MathUtils.degToRad(
lon
);

const target =
new THREE.Vector3(

```
  500 *
  Math.sin(phi) *
  Math.cos(theta),

  500 *
  Math.cos(phi),

  500 *
  Math.sin(phi) *
  Math.sin(theta)

);
```

camera.position.set(
0,
0,
0
);

camera.lookAt(
target
);

/*
Zoom suave.
*/

if (
Math.abs(
camera.fov -
targetFov
) > 0.05
) {

```
camera.fov +=
  (
    targetFov -
    camera.fov
  ) * 0.15;


camera.updateProjectionMatrix();
```

}

renderer.render(
scene,
camera
);

updateAutoUI();

}

/* ============================================================
POINTER
============================================================ */

function beginDrag(
x,
y
) {

isPointerDown =
true;

startX = x;
startY = y;

startLon = lon;
startLat = lat;

velocityLon = 0;
velocityLat = 0;

stage.classList.add(
"is-dragging"
);

registerInteraction();

}

function moveDrag(
x,
y
) {

if (!isPointerDown)
return;

const newLon =
startLon +
(startX - x) *
0.16;

const newLat =
startLat +
(y - startY) *
0.16;

velocityLon =
newLon - lon;

velocityLat =
newLat - lat;

velocityLon =
clamp(
velocityLon,
-2.5,
2.5
);

velocityLat =
clamp(
velocityLat,
-2.5,
2.5
);

lon = newLon;
lat = newLat;

registerInteraction();

}

function endDrag() {

isPointerDown =
false;

stage.classList.remove(
"is-dragging"
);

}

/* ============================================================
MOUSE
============================================================ */

function setupMouse() {

stage.addEventListener(
"mousedown",
function(event) {

```
  beginDrag(
    event.clientX,
    event.clientY
  );

}
```

);

window.addEventListener(
"mousemove",
function(event) {

```
  moveDrag(
    event.clientX,
    event.clientY
  );

}
```

);

window.addEventListener(
"mouseup",
endDrag
);

}

/* ============================================================
TOUCH
============================================================ */

let pinchStartDistance = null;
let pinchStartFov = null;

function setupTouch() {

stage.addEventListener(
"touchstart",
function(event) {

```
  registerInteraction();


  if (
    event.touches.length === 1
  ) {

    beginDrag(
      event.touches[0].clientX,
      event.touches[0].clientY
    );

  }


  if (
    event.touches.length === 2
  ) {

    isPointerDown =
      false;

    pinchStartDistance =
      getTouchDistance(
        event.touches
      );

    pinchStartFov =
      targetFov;

  }

},
{
  passive: true
}
```

);

stage.addEventListener(
"touchmove",
function(event) {

```
  if (
    event.touches.length === 1 &&
    isPointerDown
  ) {

    moveDrag(
      event.touches[0].clientX,
      event.touches[0].clientY
    );

  }


  if (
    event.touches.length === 2 &&
    pinchStartDistance
  ) {

    const distance =
      getTouchDistance(
        event.touches
      );


    const scale =
      pinchStartDistance /
      distance;


    targetFov =
      clamp(
        pinchStartFov *
        scale,
        CONFIG.fovMin,
        CONFIG.fovMax
      );


    registerInteraction();

  }

},
{
  passive: true
}
```

);

stage.addEventListener(
"touchend",
function(event) {

```
  if (
    event.touches.length === 0
  ) {

    endDrag();

    pinchStartDistance =
      null;

    pinchStartFov =
      null;

  }

}
```

);

}

function getTouchDistance(
touches
) {

const dx =
touches[0].clientX -
touches[1].clientX;

const dy =
touches[0].clientY -
touches[1].clientY;

return Math.sqrt(
dx * dx +
dy * dy
);

}

/* ============================================================
WHEEL
============================================================ */

function setupWheel() {

stage.addEventListener(
"wheel",
function(event) {

```
  event.preventDefault();


  targetFov =
    clamp(
      targetFov +
      event.deltaY *
      0.04,

      CONFIG.fovMin,
      CONFIG.fovMax
    );


  registerInteraction();

},
{
  passive: false
}
```

);

}

/* ============================================================
BUTTONS
============================================================ */

function setupButtons() {

document
.getElementById("viewer-prev")
.addEventListener(
"click",
function() {

```
    loadExperience(
      (
        currentExperience -
        1 +
        EXPERIENCES.length
      ) %
      EXPERIENCES.length
    );

  }
);
```

document
.getElementById("viewer-next")
.addEventListener(
"click",
function() {

```
    loadExperience(
      (
        currentExperience +
        1
      ) %
      EXPERIENCES.length
    );

  }
);
```

document
.getElementById("zoom-in")
.addEventListener(
"click",
function() {

```
    targetFov =
      clamp(
        targetFov - 8,
        CONFIG.fovMin,
        CONFIG.fovMax
      );

    registerInteraction();

  }
);
```

document
.getElementById("zoom-out")
.addEventListener(
"click",
function() {

```
    targetFov =
      clamp(
        targetFov + 8,
        CONFIG.fovMin,
        CONFIG.fovMax
      );

    registerInteraction();

  }
);
```

document
.getElementById("recenter")
.addEventListener(
"click",
function() {

```
    lon = 0;
    lat = 0;

    targetFov =
      CONFIG.fovDefault;

    registerInteraction();

  }
);
```

document
.getElementById("fullscreen-btn")
.addEventListener(
"click",
function() {

```
    registerInteraction();


    if (
      !document.fullscreenElement
    ) {

      if (
        stage.requestFullscreen
      ) {

        stage.requestFullscreen();

      } else if (
        stage.webkitRequestFullscreen
      ) {

        stage.webkitRequestFullscreen();

      }

    } else {

      if (
        document.exitFullscreen
      ) {

        document.exitFullscreen();

      } else if (
        document.webkitExitFullscreen
      ) {

        document.webkitExitFullscreen();

      }

    }

  }
);
```

document.addEventListener(
"fullscreenchange",
resizeViewer
);

}

/* ============================================================
INTERACTION
============================================================ */

function registerInteraction() {

userInteracted =
true;

lastInteraction =
performance.now();

resetAutoTimer();

if (
dragHint &&
!dragHint.classList.contains(
"is-hidden"
)
) {

```
dragHint.classList.add(
  "is-hidden"
);
```

}

}

/* ============================================================
AUTO CHANGE
============================================================ */

function getAutoDuration() {

return (
CONFIG.autoChangeMinutes *
60 *
1000
);

}

function startAutoTimer() {

autoStartedAt =
performance.now();

clearTimeout(
autoTimer
);

autoTimer =
setTimeout(
function() {

```
    nextExperience();

  },
  getAutoDuration()
);
```

}

function resetAutoTimer() {

autoStartedAt =
performance.now();

clearTimeout(
autoTimer
);

autoTimer =
setTimeout(
function() {

```
    nextExperience();

  },
  getAutoDuration()
);
```

}

function nextExperience() {

const next =
(
currentExperience +
1
) %
EXPERIENCES.length;

loadExperience(
next
);

}

/* ============================================================
AUTO UI
============================================================ */

function updateAutoUI() {

if (
!autoTimeEl ||
!progressBar
) return;

const duration =
getAutoDuration();

const elapsed =
performance.now() -
autoStartedAt;

const progress =
Math.min(
elapsed / duration,
1
);

const remaining =
Math.max(
duration - elapsed,
0
);

const totalSeconds =
Math.ceil(
remaining / 1000
);

const minutes =
Math.floor(
totalSeconds / 60
);

const seconds =
totalSeconds % 60;

autoTimeEl.textContent =
String(minutes).padStart(2, "0") +
":" +
String(seconds).padStart(2, "0");

progressBar.style.width =
(
progress *
100
) +
"%";

}

/* ============================================================
NAV
============================================================ */

function setupNavigation() {

document
.querySelectorAll(".nav-link")
.forEach(
function(link) {

```
    link.addEventListener(
      "click",
      function() {

        document
          .querySelectorAll(".nav-link")
          .forEach(
            function(item) {

              item.classList.remove(
                "active"
              );

            }
          );


        link.classList.add(
          "active"
        );

      }
    );

  }
);
```

}

/* ============================================================
CTA
============================================================ */

function setupCTA() {

[
"whatsappCta",
"footerWhatsapp"
].forEach(
function(id) {

```
  const element =
    document.getElementById(id);


  if (!element)
    return;


  element.href =
    CONFIG.whatsapp;


  element.target =
    "_blank";


  element.rel =
    "noopener noreferrer";

}
```

);

}

/* ============================================================
SCROLL REVEAL
============================================================ */

function setupReveal() {

const elements =
document.querySelectorAll(
".reveal"
);

if (
!("IntersectionObserver" in window)
) {

```
elements.forEach(
  function(element) {

    element.classList.add(
      "in"
    );

  }
);

return;
```

}

const observer =
new IntersectionObserver(
function(entries) {

```
    entries.forEach(
      function(entry) {

        if (
          entry.isIntersecting
        ) {

          entry.target.classList.add(
            "in"
          );


          observer.unobserve(
            entry.target
          );

        }

      }
    );

  },
  {
    threshold: 0.12
  }
);
```

elements.forEach(
function(element) {

```
  observer.observe(
    element
  );

}
```

);

}

/* ============================================================
UTILITY
============================================================ */

function clamp(
value,
min,
max
) {

return Math.max(
min,
Math.min(
max,
value
)
);

}

/* ============================================================
YEAR
============================================================ */

const year =
document.getElementById(
"year"
);

if (year) {

year.textContent =
new Date()
.getFullYear();

}

/* ============================================================
START
============================================================ */

if (
document.readyState ===
"loading"
) {

document.addEventListener(
"DOMContentLoaded",
initViewer
);

} else {

initViewer();

}
