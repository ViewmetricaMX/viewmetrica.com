/* ==========================================================================
ViewmetricaMX
VISOR 360° + EXPERIENCIAS + AUTOPLAY
========================================================================== */

/* ==========================================================================
CONFIGURACIÓN GENERAL
========================================================================== */

const CONFIG = {

WHATSAPP_NUMBER: "528714005421",

WHATSAPP_MESSAGE:
"Hola, vi la experiencia de ViewmetricaMX y me gustaría conocer cómo podría aplicarse a mi negocio.",

GOOGLE_MAPS_URL: "#",

/*

* Tiempo entre cambios automáticos.
*
* 180000 = 3 minutos
* 10000  = 10 segundos para pruebas
  */
  AUTO_CHANGE_TIME: 180000

};

/* ==========================================================================
EXPERIENCIAS
========================================================================== */

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
file: "assets/viewmetricamx_demo_360_Restaurant.jpg"
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

/* ==========================================================================
INICIO
========================================================================== */

document.addEventListener(
"DOMContentLoaded",
function () {

```
initSite();
```

}
);

/* ==========================================================================
INIT
========================================================================== */

function initSite() {

setupYear();
setupWhatsApp();
setupMaps();
setupReveal();
setupNavigation();
setupViewer();

}

/* ==========================================================================
AÑO
========================================================================== */

function setupYear() {

const year =
document.getElementById("year");

if (year) {

```
year.textContent =
  new Date().getFullYear();
```

}

}

/* ==========================================================================
WHATSAPP
========================================================================== */

function setupWhatsApp() {

const number =
CONFIG.WHATSAPP_NUMBER;

const url =
"https://wa.me/" +
number +
"?text=" +
encodeURIComponent(
CONFIG.WHATSAPP_MESSAGE
);

const ids = [
"whatsappCta",
"footerWhatsapp"
];

ids.forEach(function (id) {

```
const element =
  document.getElementById(id);

if (!element) return;

element.href = url;
element.target = "_blank";
element.rel = "noopener noreferrer";
```

});

}

/* ==========================================================================
GOOGLE MAPS
========================================================================== */

function setupMaps() {

const maps =
document.getElementById("footerMaps");

if (!maps) return;

maps.href =
CONFIG.GOOGLE_MAPS_URL;

}

/* ==========================================================================
REVEAL
========================================================================== */

function setupReveal() {

const elements =
document.querySelectorAll(".reveal");

if (!("IntersectionObserver" in window)) {

```
elements.forEach(function (element) {

  element.classList.add("in");

});

return;
```

}

const observer =
new IntersectionObserver(

```
  function (entries) {

    entries.forEach(function (entry) {

      if (!entry.isIntersecting) return;

      entry.target.classList.add("in");

      observer.unobserve(
        entry.target
      );

    });

  },

  {
    threshold: 0.12
  }

);
```

elements.forEach(function (element) {

```
observer.observe(element);
```

});

}

/* ==========================================================================
NAVEGACIÓN
========================================================================== */

function setupNavigation() {

const nav =
document.getElementById("siteNav");

if (!nav) return;

window.addEventListener(

```
"scroll",

function () {

  nav.classList.toggle(
    "scrolled",
    window.scrollY > 40
  );

},

{
  passive: true
}
```

);

document
.querySelectorAll(".nav-link")
.forEach(function (link) {

```
  link.addEventListener(

    "click",

    function () {

      document
        .querySelectorAll(".nav-link")
        .forEach(function (item) {

          item.classList.remove(
            "is-active"
          );

        });


      link.classList.add(
        "is-active"
      );

    }

  );

});
```

}

/* ==========================================================================
VISOR 360°
========================================================================== */

function setupViewer() {

const stage =
document.getElementById(
"viewer-stage"
);

const canvas =
document.getElementById(
"pano-canvas"
);

if (!stage || !canvas) {

```
console.warn(
  "[ViewmetricaMX] No se encontró el visor."
);

return;
```

}

if (
typeof THREE === "undefined"
) {

```
showViewerError(
  "Three.js no está disponible."
);

return;
```

}

if (!hasWebGL()) {

```
showViewerError(
  "Tu navegador no soporta WebGL."
);

return;
```

}

/* ==========================================================================
ELEMENTOS DEL VISOR
========================================================================== */

const title =
document.getElementById(
"experience-title"
);

const counter =
document.getElementById(
"experience-counter"
);

const loading =
document.getElementById(
"viewer-loading"
);

const loadingLabel =
document.getElementById(
"loading-label"
);

const progress =
document.getElementById(
"autoplay-progress-bar"
);

const dragHint =
document.getElementById(
"drag-hint"
);

const prev =
document.getElementById(
"viewer-prev"
);

const next =
document.getElementById(
"viewer-next"
);

const zoomIn =
document.getElementById(
"zoom-in"
);

const zoomOut =
document.getElementById(
"zoom-out"
);

const recenter =
document.getElementById(
"recenter"
);

const fullscreen =
document.getElementById(
"fullscreen-btn"
);

/* ==========================================================================
THREE
========================================================================== */

const renderer =
new THREE.WebGLRenderer({

```
  canvas: canvas,

  antialias: true,

  alpha: false

});
```

renderer.setPixelRatio(

```
Math.min(

  window.devicePixelRatio || 1,

  2

)
```

);

const scene =
new THREE.Scene();

const camera =
new THREE.PerspectiveCamera(

```
  84,

  16 / 9,

  1,

  1100

);
```

const geometry =
new THREE.SphereGeometry(

```
  500,

  60,

  40

);
```

/*

* MUY IMPORTANTE
*
* La cámara está dentro de la esfera.
  */
  geometry.scale(
  1,
  1,
  -1
  );

const material =
new THREE.MeshBasicMaterial({

```
  color: 0xffffff,

  toneMapped: false

});
```

const sphere =
new THREE.Mesh(

```
  geometry,

  material

);
```

scene.add(
sphere
);

/* ==========================================================================
ESTADO
========================================================================== */

let currentExperience = 0;

let lon = 0;

let lat = 0;

let targetFov = 84;

let isPointerDown = false;

let pointerStartX = 0;

let pointerStartY = 0;

let startLon = 0;

let startLat = 0;

let velocityLon = 0;

let velocityLat = 0;

let userInteracted = false;

let lastInteraction =
performance.now();

/*

* Temporizador de autoplay.
  */
  let autoplayStart =
  performance.now();

/*

* Evita que dos cambios ocurran
* simultáneamente.
  */
  let isLoadingExperience = false;

const MIN_FOV = 32;

const MAX_FOV = 92;

const AUTO_ROTATE_SPEED =
0.006;

const FRICTION =
0.94;

const MAX_INERTIA =
2.5;

/* ==========================================================================
CACHE DE TEXTURAS
========================================================================== */

const textureLoader =
new THREE.TextureLoader();

const textureCache =
new Map();

/* ==========================================================================
RESIZE
========================================================================== */

function resize() {

```
const width =
  stage.clientWidth;

const height =
  stage.clientHeight;


if (!width || !height) return;


renderer.setSize(
  width,
  height,
  false
);


camera.aspect =
  width / height;


camera.updateProjectionMatrix();
```

}

resize();

window.addEventListener(
"resize",
resize
);

/* ==========================================================================
PREPARAR TEXTURA
========================================================================== */

function prepareTexture(texture) {

```
/*
 * Color correcto para fotografías 360.
 */
if (
  "colorSpace" in texture
) {

  texture.colorSpace =
    THREE.SRGBColorSpace;

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


/*
 * NO espejar la fotografía.
 */
texture.repeat.x = 1;

texture.offset.x = 0;


return texture;
```

}

/* ==========================================================================
CARGAR TEXTURA
========================================================================== */

function loadTexture(index) {

```
const experience =
  EXPERIENCES[index];


const key =
  experience.key;


/*
 * Si ya existe, devolver inmediatamente.
 */
if (
  textureCache.has(key)
) {

  return Promise.resolve(
    textureCache.get(key)
  );

}


return new Promise(

  function (resolve, reject) {

    textureLoader.load(

      experience.file,

      function (texture) {

        texture =
          prepareTexture(
            texture
          );


        textureCache.set(
          key,
          texture
        );


        resolve(
          texture
        );

      },


      undefined,


      function (error) {

        console.error(

          "[ViewmetricaMX] Error cargando:",

          experience.file,

          error

        );


        reject(
          error
        );

      }

    );

  }

);
```

}

/* ==========================================================================
APLICAR TEXTURA
========================================================================== */

function applyTexture(texture) {

```
if (!texture) return;


texture.wrapS =
  THREE.ClampToEdgeWrapping;


texture.wrapT =
  THREE.ClampToEdgeWrapping;


texture.repeat.x = 1;

texture.offset.x = 0;


if (
  "colorSpace" in texture
) {

  texture.colorSpace =
    THREE.SRGBColorSpace;

}


material.map =
  texture;


material.color.set(
  0xffffff
);


material.needsUpdate =
  true;
```

}

/* ==========================================================================
CARGAR EXPERIENCIA
========================================================================== */

async function loadExperience(

```
index,

resetView = true
```

) {

```
index =

  (
    index +
    EXPERIENCES.length
  ) %
  EXPERIENCES.length;


/*
 * Evitar cargas simultáneas.
 */
if (
  isLoadingExperience
) {

  return;

}


isLoadingExperience =
  true;


currentExperience =
  index;


const experience =
  EXPERIENCES[index];


/*
 * Actualizar título.
 */
if (title) {

  title.textContent =
    experience.title;

}


/*
 * Actualizar contador.
 */
if (counter) {

  counter.textContent =

    String(
      index + 1
    ).padStart(
      2,
      "0"
    ) +

    " / " +

    String(
      EXPERIENCES.length
    ).padStart(
      2,
      "0"
    );

}


/*
 * Reiniciar posición.
 */
if (resetView) {

  lon = 0;

  lat = 0;

  targetFov = 84;

}


camera.fov =
  targetFov;


camera.updateProjectionMatrix();


/*
 * Reiniciar contador visual.
 */
resetAutoplay();


/*
 * Si está en caché:
 * aplicar inmediatamente.
 */
if (
  textureCache.has(
    experience.key
  )
) {

  applyTexture(
    textureCache.get(
      experience.key
    )
  );


  if (loading) {

    loading.hidden =
      true;

  }


  isLoadingExperience =
    false;


  return;

}


/*
 * Mostrar pantalla de carga.
 */
if (loading) {

  loading.hidden =
    false;

}


if (loadingLabel) {

  loadingLabel.textContent =
    "Preparando la imagen…";

}


try {

  const texture =
    await loadTexture(
      index
    );


  /*
   * Solo aplicar si seguimos
   * en la misma experiencia.
   */
  if (
    currentExperience === index
  ) {

    applyTexture(
      texture
    );


    if (loading) {

      loading.hidden =
        true;

    }

  }

} catch (error) {

  console.error(
    "[ViewmetricaMX] No se pudo cargar la experiencia:",
    experience.file
  );


  if (loadingLabel) {

    loadingLabel.textContent =
      "No se pudo cargar la imagen.";

  }

}


isLoadingExperience =
  false;
```

}

/* ==========================================================================
CAMBIO DE EXPERIENCIA
========================================================================== */

function nextExperience() {

```
if (
  isLoadingExperience
) return;


loadExperience(
  currentExperience + 1
);
```

}

function previousExperience() {

```
if (
  isLoadingExperience
) return;


loadExperience(
  currentExperience - 1
);
```

}

/* ==========================================================================
BOTÓN ANTERIOR
========================================================================== */

if (prev) {

```
prev.addEventListener(

  "click",

  function (event) {

    event.stopPropagation();

    markInteraction();

    previousExperience();

  }

);
```

}

/* ==========================================================================
BOTÓN SIGUIENTE
========================================================================== */

if (next) {

```
next.addEventListener(

  "click",

  function (event) {

    event.stopPropagation();

    markInteraction();

    nextExperience();

  }

);
```

}

/* ==========================================================================
AUTOPLAY
========================================================================== */

function resetAutoplay() {

```
autoplayStart =
  performance.now();


if (progress) {

  progress.style.width =
    "0%";

}
```

}

function updateAutoplay() {

```
if (!progress) return;


const elapsed =
  performance.now() -
  autoplayStart;


const percent =

  Math.min(

    100,

    (
      elapsed /
      CONFIG.AUTO_CHANGE_TIME
    ) *
    100

  );


progress.style.width =
  percent + "%";
```

}

/*

* AUTOPLAY REAL.
*
* No depende del render loop.
  */
  const autoplayInterval =
  setInterval(

  function () {

  if (
  isLoadingExperience
  ) return;

  nextExperience();

  },

  CONFIG.AUTO_CHANGE_TIME

```
);
```

/* ==========================================================================
INTERACCIÓN
========================================================================== */

function markInteraction() {

```
userInteracted =
  true;


lastInteraction =
  performance.now();


/*
 * Una interacción reinicia
 * el ciclo de 3 minutos.
 */
resetAutoplay();


if (dragHint) {

  dragHint.classList.add(
    "is-hidden"
  );

}
```

}

/* ==========================================================================
POINTER DOWN
========================================================================== */

function pointerDown(
x,
y
) {

```
isPointerDown =
  true;


stage.classList.add(
  "is-dragging"
);


pointerStartX =
  x;


pointerStartY =
  y;


startLon =
  lon;


startLat =
  lat;


velocityLon =
  0;


velocityLat =
  0;
```

}

/* ==========================================================================
POINTER MOVE
========================================================================== */

function pointerMove(
x,
y
) {

```
if (
  !isPointerDown
) return;


const newLon =

  startLon +

  (
    pointerStartX -
    x
  ) *

  0.16;


const newLat =

  startLat +

  (
    y -
    pointerStartY
  ) *

  0.16;


velocityLon =

  clamp(

    newLon -
    lon,

    -MAX_INERTIA,

    MAX_INERTIA

  );


velocityLat =

  clamp(

    newLat -
    lat,

    -MAX_INERTIA,

    MAX_INERTIA

  );


lon =
  newLon;


lat =
  newLat;


markInteraction();
```

}

/* ==========================================================================
POINTER UP
========================================================================== */

function pointerUp() {

```
isPointerDown =
  false;


stage.classList.remove(
  "is-dragging"
);
```

}

/* ==========================================================================
MOUSE
========================================================================== */

stage.addEventListener(

```
"mousedown",

function (event) {

  pointerDown(

    event.clientX,

    event.clientY

  );


  markInteraction();

}
```

);

window.addEventListener(

```
"mousemove",

function (event) {

  pointerMove(

    event.clientX,

    event.clientY

  );

}
```

);

window.addEventListener(
"mouseup",
pointerUp
);

/* ==========================================================================
TOUCH
========================================================================== */

let pinchDistance = null;

let pinchFov = null;

stage.addEventListener(

```
"touchstart",

function (event) {

  markInteraction();


  if (
    event.touches.length === 1
  ) {

    pointerDown(

      event.touches[0].clientX,

      event.touches[0].clientY

    );

  }


  if (
    event.touches.length === 2
  ) {

    isPointerDown =
      false;


    pinchDistance =
      getTouchDistance(
        event.touches
      );


    pinchFov =
      targetFov;

  }

},

{
  passive: true
}
```

);

stage.addEventListener(

```
"touchmove",

function (event) {

  if (

    event.touches.length === 1 &&

    isPointerDown

  ) {

    pointerMove(

      event.touches[0].clientX,

      event.touches[0].clientY

    );

  }


  if (

    event.touches.length === 2 &&

    pinchDistance

  ) {

    const distance =
      getTouchDistance(
        event.touches
      );


    if (distance <= 0) return;


    const scale =

      pinchDistance /
      distance;


    targetFov =

      clamp(

        pinchFov * scale,

        MIN_FOV,

        MAX_FOV

      );


    markInteraction();

  }

},

{
  passive: true
}
```

);

stage.addEventListener(

```
"touchend",

function (event) {

  if (
    event.touches.length === 0
  ) {

    pointerUp();

    pinchDistance =
      null;

  }

}
```

);

function getTouchDistance(
touches
) {

```
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
```

}

/* ==========================================================================
WHEEL
========================================================================== */

stage.addEventListener(

```
"wheel",

function (event) {

  event.preventDefault();

  markInteraction();


  targetFov =

    clamp(

      targetFov +
      event.deltaY * 0.04,

      MIN_FOV,

      MAX_FOV

    );

},

{
  passive: false
}
```

);

/* ==========================================================================
ZOOM IN
========================================================================== */

if (zoomIn) {

```
zoomIn.addEventListener(

  "click",

  function () {

    markInteraction();


    targetFov =

      clamp(

        targetFov - 10,

        MIN_FOV,

        MAX_FOV

      );

  }

);
```

}

/* ==========================================================================
ZOOM OUT
========================================================================== */

if (zoomOut) {

```
zoomOut.addEventListener(

  "click",

  function () {

    markInteraction();


    targetFov =

      clamp(

        targetFov + 10,

        MIN_FOV,

        MAX_FOV

      );

  }

);
```

}

/* ==========================================================================
RECENTER
========================================================================== */

if (recenter) {

```
recenter.addEventListener(

  "click",

  function () {

    markInteraction();


    lon = 0;

    lat = 0;

    targetFov = 84;

  }

);
```

}

/* ==========================================================================
FULLSCREEN
========================================================================== */

if (fullscreen) {

```
fullscreen.addEventListener(

  "click",

  function () {

    markInteraction();


    if (
      !document.fullscreenElement
    ) {

      const request =

        stage.requestFullscreen ||

        stage.webkitRequestFullscreen;


      if (request) {

        request.call(stage);

      }

    } else {

      const exit =

        document.exitFullscreen ||

        document.webkitExitFullscreen;


      if (exit) {

        exit.call(document);

      }

    }

  }

);
```

}

document.addEventListener(
"fullscreenchange",
resize
);

/* ==========================================================================
CLAMP
========================================================================== */

function clamp(
value,
min,
max
) {

```
return Math.max(

  min,

  Math.min(
    max,
    value
  )

);
```

}

/* ==========================================================================
ANIMACIÓN
========================================================================== */

function animate() {

```
requestAnimationFrame(
  animate
);


/*
 * INERCIA
 */
if (
  !isPointerDown
) {

  if (

    Math.abs(
      velocityLon
    ) > 0.001 ||

    Math.abs(
      velocityLat
    ) > 0.001

  ) {

    lon +=
      velocityLon;


    lat +=
      velocityLat;


    velocityLon *=
      FRICTION;


    velocityLat *=
      FRICTION;

  }

}


/*
 * AUTORROTACIÓN
 */
if (

  !isPointerDown &&

  userInteracted

) {

  const inactive =

    performance.now() -
    lastInteraction;


  if (
    inactive > 5200
  ) {

    lon +=
      AUTO_ROTATE_SPEED;

  }

}


/*
 * LIMITAR LATITUD
 */
lat =
  clamp(
    lat,
    -85,
    85
  );


/*
 * DIRECCIÓN DE LA CÁMARA
 */
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

    500 *
    Math.sin(phi) *
    Math.cos(theta),

    500 *
    Math.cos(phi),

    500 *
    Math.sin(phi) *
    Math.sin(theta)

  );


camera.position.set(
  0,
  0,
  0
);


camera.lookAt(
  target
);


/*
 * FOV SUAVE
 */
if (

  Math.abs(

    camera.fov -
    targetFov

  ) > 0.05

) {

  camera.fov +=

    (
      targetFov -
      camera.fov
    ) *

    0.15;


  camera.updateProjectionMatrix();

}


/*
 * RENDER
 */
renderer.render(
  scene,
  camera
);


/*
 * ACTUALIZAR BARRA
 */
updateAutoplay();
```

}

/* ==========================================================================
INICIO
========================================================================== */

loadExperience(
0,
true
);

/*

* Ocultar ayuda de arrastre.
  */
  setTimeout(

```
function () {
```

```
  if (dragHint) {

    dragHint.classList.add(
      "is-hidden"
    );

  }

},

7000
```

);

/*

* PRECARGA
*
* Ahora sí utiliza EL MISMO
* sistema de caché que utiliza
* el visor.
*
* No bloquea la experiencia inicial.
  */
  EXPERIENCES.forEach(

```
function (experience, index) {
```

```
  if (index === 0) return;


  setTimeout(

    function () {

      loadTexture(index)
        .catch(function () {

          console.warn(

            "[ViewmetricaMX] No se pudo precargar:",

            experience.file

          );

        });

    },

    1500 + index * 1200

  );

}
```

);

animate();

}

/* ==========================================================================
WEBGL
========================================================================== */

function hasWebGL() {

try {

```
const canvas =
  document.createElement(
    "canvas"
  );


return !!(

  window.WebGLRenderingContext &&

  (

    canvas.getContext(
      "webgl"
    ) ||

    canvas.getContext(
      "experimental-webgl"
    )

  )

);
```

} catch (error) {

```
return false;
```

}

}

/* ==========================================================================
ERROR DEL VISOR
========================================================================== */

function showViewerError(
message
) {

const loading =
document.getElementById(
"viewer-loading"
);

const label =
document.getElementById(
"loading-label"
);

if (loading) {

```
loading.hidden =
  false;
```

}

if (label) {

```
label.textContent =
  message;
```

}

console.error(
"[ViewmetricaMX]",
message
);

}
