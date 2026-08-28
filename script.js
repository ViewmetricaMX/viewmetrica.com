/* ==========================================================================
   VIEWMETRICAMX — MASTER 360° VIEWER
========================================================================== */


/* ==========================================================================
   CONFIGURACIÓN
========================================================================== */

const CONFIG = {

  /* WhatsApp */
  WHATSAPP_NUMBER: "528714005421",

  WHATSAPP_MESSAGE:
    "Hola, vi la experiencia 360° de ViewmetricaMX y me gustaría conocer cómo podría aplicarse a mi negocio.",


  /* Google Maps */
  GOOGLE_MAPS_URL:
    "https://maps.google.com/",


  /* Tiempo entre experiencias */
  AUTOPLAY_SECONDS: 30,


  /* Movimiento automático */
  AUTOROTATE_SPEED: 0.006,

  AUTOROTATE_RESUME_DELAY: 5200

};


/* ==========================================================================
   EXPERIENCIAS DEL HERO
==========================================================================

   IMPORTANTE:

   Si las imágenes están directamente dentro de assets,
   cambia solamente "file".

   Si están dentro de carpetas, usa:

   assets/viewmetricamx_demo_360_patrimonio_cultural/imagen.jpg

========================================================================== */

const EXPERIENCES = [

  {
    key: "patrimonio",
    title: "PATRIMONIO CULTURAL",

    file:
      "assets/viewmetricamx_demo_360_patrimonio_cultural.jpg",

    lon: 0,
    lat: 0,
    fov: 84
  },


  {
    key: "exterior",
    title: "EXTERIOR",

    file:
      "assets/viewmetricamx_demo_360_exterior.jpg",

    lon: 0,
    lat: 0,
    fov: 84
  },


  {
    key: "restaurant",
    title: "RESTAURANT",

    file:
      "assets/viewmetricamx_demo_360_Restaurant.jpg",

    lon: 0,
    lat: 0,
    fov: 84
  },


  {
    key: "salon",
    title: "SALÓN",

    file:
      "assets/viewmetricamx_demo_360_salon.jpg",

    lon: 0,
    lat: 0,
    fov: 84
  },


  {
    key: "universidad",
    title: "UNIVERSIDAD",

    file:
      "assets/viewmetricamx_demo_360_universidad.jpg",

    lon: 0,
    lat: 0,
    fov: 84
  }

];


/* ==========================================================================
   ESTADO
========================================================================== */

let renderer;
let scene;
let camera;
let sphere;

let currentExperience = 0;

let lon = EXPERIENCES[0].lon;
let lat = EXPERIENCES[0].lat;

let targetFov = EXPERIENCES[0].fov;

let isPointerDown = false;

let pointerDownX = 0;
let pointerDownY = 0;

let pointerDownLon = 0;
let pointerDownLat = 0;


/* Inercia */

let velocityLon = 0;
let velocityLat = 0;

const INERTIA_FRICTION = 0.94;
const MAX_INERTIA = 2.5;


/* Interacción */

let userHasInteracted = false;
let lastInteraction = performance.now();


/* Texturas */

const textureCache = {};

const textureLoader =
  new THREE.TextureLoader();


/* Autoplay */

let autoplayStartedAt =
  performance.now();

let autoplayPaused = false;


/* ==========================================================================
   DOM
========================================================================== */

const stage =
  document.getElementById("viewer-stage");

const canvas =
  document.getElementById("pano-canvas");

const loading =
  document.getElementById("viewer-loading");

const loadingLabel =
  document.getElementById("loading-label");

const experienceTitle =
  document.getElementById("experience-title");

const experienceCounter =
  document.getElementById("experience-counter");

const progressBar =
  document.getElementById("autoplay-progress-bar");

const countdown =
  document.getElementById("autoplay-countdown");

const dragHint =
  document.getElementById("drag-hint");


/* ==========================================================================
   WEBGL
========================================================================== */

function hasWebGL() {

  try {

    const testCanvas =
      document.createElement("canvas");

    return !!(
      window.WebGLRenderingContext &&
      (
        testCanvas.getContext("webgl") ||
        testCanvas.getContext("experimental-webgl")
      )
    );

  } catch (error) {

    return false;

  }

}


/* ==========================================================================
   INICIALIZACIÓN
========================================================================== */

function init() {

  if (
    typeof THREE === "undefined" ||
    !hasWebGL()
  ) {

    loadingLabel.textContent =
      "Tu navegador no soporta la experiencia 360°.";

    return;

  }


  buildScene();

  loadExperience(0);

  setupControls();

  setupNavigation();

  setupAutoplay();

  setupScrollReveal();

  setupCTA();

  setupFullscreen();

  window.addEventListener(
    "resize",
    resizeRenderer
  );

}


/* ==========================================================================
   CONSTRUIR ESCENA
========================================================================== */

function buildScene() {

  renderer =
    new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false
    });


  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio || 1,
      2
    )
  );


  scene =
    new THREE.Scene();


  camera =
    new THREE.PerspectiveCamera(
      targetFov,
      16 / 9,
      1,
      1100
    );


  const geometry =
    new THREE.SphereGeometry(
      500,
      60,
      40
    );


  /*
    La esfera se invierte para mirar desde dentro.
  */

  geometry.scale(
    1,
    1,
    -1
  );


  const material =
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      toneMapped: false
    });


  sphere =
    new THREE.Mesh(
      geometry,
      material
    );


  scene.add(sphere);


  resizeRenderer();

  animate();

}


/* ==========================================================================
   RESIZE
========================================================================== */

function resizeRenderer() {

  if (!renderer || !camera) {
    return;
  }


  const width =
    stage.clientWidth;

  const height =
    stage.clientHeight;


  if (!width || !height) {
    return;
  }


  renderer.setSize(
    width,
    height,
    false
  );


  camera.aspect =
    width / height;

  camera.updateProjectionMatrix();

}


/* ==========================================================================
   CARGAR EXPERIENCIA
========================================================================== */

function loadExperience(index) {

  if (
    index < 0 ||
    index >= EXPERIENCES.length
  ) {
    return;
  }


  currentExperience = index;


  const experience =
    EXPERIENCES[index];


  lon = experience.lon;
  lat = experience.lat;

  targetFov =
    experience.fov;


  camera.fov =
    experience.fov;

  camera.updateProjectionMatrix();


  updateExperienceUI();


  resetAutoplay();


  const cacheKey =
    experience.key;


  if (textureCache[cacheKey]) {

    applyTexture(
      textureCache[cacheKey]
    );

    loading.hidden = true;

    return;

  }


  loading.hidden = false;


  loadingLabel.textContent =
    "Preparando " +
    experience.title.toLowerCase() +
    "…";


  textureLoader.load(

    experience.file,

    function(texture) {

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


      textureCache[cacheKey] =
        texture;


      applyTexture(texture);


      loading.hidden = true;

    },


    undefined,

    function(error) {

      console.error(
        "[ViewmetricaMX] Error cargando:",
        experience.file,
        error
      );


      loadingLabel.textContent =
        "No se pudo cargar esta experiencia.";

    }

  );

}


/* ==========================================================================
   APLICAR TEXTURA
========================================================================== */

function applyTexture(texture) {

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


  sphere.material.map =
    texture;

  sphere.material.color.set(
    0xffffff
  );

  sphere.material.needsUpdate =
    true;

}


/* ==========================================================================
   UI
========================================================================== */

function updateExperienceUI() {

  const experience =
    EXPERIENCES[currentExperience];


  experienceTitle.textContent =
    experience.title;


  const current =
    String(
      currentExperience + 1
    ).padStart(2, "0");


  const total =
    String(
      EXPERIENCES.length
    ).padStart(2, "0");


  experienceCounter.textContent =
    current + " / " + total;

}


/* ==========================================================================
   SIGUIENTE / ANTERIOR
========================================================================== */

function nextExperience() {

  const next =
    (
      currentExperience + 1
    ) % EXPERIENCES.length;


  loadExperience(next);

}


function previousExperience() {

  const previous =
    (
      currentExperience -
      1 +
      EXPERIENCES.length
    ) % EXPERIENCES.length;


  loadExperience(previous);

}


/* ==========================================================================
   AUTOPLAY
========================================================================== */

function setupAutoplay() {

  autoplayStartedAt =
    performance.now();


  requestAnimationFrame(
    updateAutoplay
  );

}


function resetAutoplay() {

  autoplayStartedAt =
    performance.now();

  autoplayPaused = false;

}


function updateAutoplay() {

  requestAnimationFrame(
    updateAutoplay
  );


  if (autoplayPaused) {
    return;
  }


  const elapsed =
    (
      performance.now() -
      autoplayStartedAt
    ) / 1000;


  const total =
    CONFIG.AUTOPLAY_SECONDS;


  const remaining =
    Math.max(
      0,
      total - elapsed
    );


  countdown.textContent =
    Math.ceil(remaining);


  const progress =
    Math.max(
      0,
      1 - (
        elapsed / total
      )
    );


  progressBar.style.transform =
    "scaleX(" + progress + ")";


  if (elapsed >= total) {

    nextExperience();

  }

}


/* ==========================================================================
   RENDER LOOP
========================================================================== */

function animate() {

  requestAnimationFrame(
    animate
  );


  if (!isPointerDown) {

    if (
      Math.abs(velocityLon) > 0.001 ||
      Math.abs(velocityLat) > 0.001
    ) {

      lon += velocityLon;
      lat += velocityLat;

      velocityLon *=
        INERTIA_FRICTION;

      velocityLat *=
        INERTIA_FRICTION;

    }

    else if (
      userHasInteracted &&
      performance.now() -
      lastInteraction >
      CONFIG.AUTOROTATE_RESUME_DELAY
    ) {

      lon +=
        CONFIG.AUTOROTATE_SPEED;

    }

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
      ) * 0.15;

    camera.updateProjectionMatrix();

  }


  renderer.render(
    scene,
    camera
  );

}


/* ==========================================================================
   INTERACCIÓN
========================================================================== */

function markInteraction() {

  userHasInteracted = true;

  lastInteraction =
    performance.now();


  resetAutoplay();


  if (
    !dragHint.classList.contains(
      "is-hidden"
    )
  ) {

    dragHint.classList.add(
      "is-hidden"
    );

  }

}


function onPointerDown(
  x,
  y
) {

  isPointerDown = true;

  stage.classList.add(
    "is-dragging"
  );


  pointerDownX = x;
  pointerDownY = y;

  pointerDownLon = lon;
  pointerDownLat = lat;

}


function onPointerMove(
  x,
  y
) {

  if (!isPointerDown) {
    return;
  }


  const newLon =
    (
      pointerDownX -
      x
    ) * 0.16 +
    pointerDownLon;


  const newLat =
    (
      y -
      pointerDownY
    ) * 0.16 +
    pointerDownLat;


  velocityLon =
    clamp(
      newLon - lon,
      -MAX_INERTIA,
      MAX_INERTIA
    );


  velocityLat =
    clamp(
      newLat - lat,
      -MAX_INERTIA,
      MAX_INERTIA
    );


  lon = newLon;
  lat = newLat;


  markInteraction();

}


function onPointerUp() {

  isPointerDown = false;

  stage.classList.remove(
    "is-dragging"
  );

}


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


/* ==========================================================================
   CONTROLES
========================================================================== */

function setupControls() {

  document
    .getElementById("viewer-prev")
    .addEventListener(
      "click",
      function(e) {

        e.stopPropagation();

        markInteraction();

        previousExperience();

      }
    );


  document
    .getElementById("viewer-next")
    .addEventListener(
      "click",
      function(e) {

        e.stopPropagation();

        markInteraction();

        nextExperience();

      }
    );


  stage.addEventListener(
    "mousedown",
    function(e) {

      onPointerDown(
        e.clientX,
        e.clientY
      );

      markInteraction();

    }
  );


  window.addEventListener(
    "mousemove",
    function(e) {

      onPointerMove(
        e.clientX,
        e.clientY
      );

    }
  );


  window.addEventListener(
    "mouseup",
    onPointerUp
  );


  /* TOUCH */

  let pinchStartDist = null;
  let pinchStartFov = null;


  stage.addEventListener(
    "touchstart",
    function(e) {

      markInteraction();


      if (
        e.touches.length === 1
      ) {

        onPointerDown(
          e.touches[0].clientX,
          e.touches[0].clientY
        );

      }


      if (
        e.touches.length === 2
      ) {

        isPointerDown = false;

        pinchStartDist =
          touchDistance(
            e.touches
          );

        pinchStartFov =
          targetFov;

      }

    },
    {
      passive: true
    }
  );


  stage.addEventListener(
    "touchmove",
    function(e) {

      if (
        e.touches.length === 1 &&
        isPointerDown
      ) {

        onPointerMove(
          e.touches[0].clientX,
          e.touches[0].clientY
        );

      }


      if (
        e.touches.length === 2 &&
        pinchStartDist
      ) {

        const distance =
          touchDistance(
            e.touches
          );


        const scale =
          pinchStartDist /
          distance;


        targetFov =
          clamp(
            pinchStartFov * scale,
            32,
            92
          );


        markInteraction();

      }

    },
    {
      passive: true
    }
  );


  stage.addEventListener(
    "touchend",
    function(e) {

      if (
        e.touches.length === 0
      ) {

        onPointerUp();

        pinchStartDist = null;

      }

    }
  );


  /* WHEEL */

  stage.addEventListener(
    "wheel",
    function(e) {

      e.preventDefault();

      markInteraction();

      targetFov =
        clamp(
          targetFov +
          e.deltaY * 0.04,
          32,
          92
        );

    },
    {
      passive: false
    }
  );


  /* ZOOM */

  document
    .getElementById("zoom-in")
    .addEventListener(
      "click",
      function() {

        markInteraction();

        targetFov =
          clamp(
            targetFov - 10,
            32,
            92
          );

      }
    );


  document
    .getElementById("zoom-out")
    .addEventListener(
      "click",
      function() {

        markInteraction();

        targetFov =
          clamp(
            targetFov + 10,
            32,
            92
          );

      }
    );


  /* RECENTER */

  document
    .getElementById("recenter")
    .addEventListener(
      "click",
      function() {

        markInteraction();

        const experience =
          EXPERIENCES[
            currentExperience
          ];


        lon =
          experience.lon;

        lat =
          experience.lat;

        targetFov =
          experience.fov;

      }
    );


  /* HIDE HINT */

  setTimeout(
    function() {

      dragHint.classList.add(
        "is-hidden"
      );

    },
    6000
  );

}


function touchDistance(touches) {

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


/* ==========================================================================
   FULLSCREEN
========================================================================== */

function setupFullscreen() {

  document
    .getElementById("fullscreen-btn")
    .addEventListener(
      "click",
      function() {

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

        }

        else {

          const exit =
            document.exitFullscreen ||
            document.webkitExitFullscreen;


          if (exit) {
            exit.call(document);
          }

        }

      }
    );


  document.addEventListener(
    "fullscreenchange",
    resizeRenderer
  );

}


/* ==========================================================================
   CTA / WHATSAPP
========================================================================== */

function setupCTA() {

  const whatsappUrl =
    "https://wa.me/" +
    CONFIG.WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(
      CONFIG.WHATSAPP_MESSAGE
    );


  [
    "whatsappCta",
    "footerWhatsapp"
  ].forEach(
    function(id) {

      const element =
        document.getElementById(id);


      if (!element) {
        return;
      }


      element.href =
        whatsappUrl;

      element.target =
        "_blank";

      element.rel =
        "noopener noreferrer";

    }
  );


  const maps =
    document.getElementById(
      "footerMaps"
    );


  if (maps) {

    maps.href =
      CONFIG.GOOGLE_MAPS_URL;

    maps.target =
      "_blank";

    maps.rel =
      "noopener noreferrer";

  }

}


/* ==========================================================================
   DEMO 360
==========================================================================

   Sustituir cuando tengamos la URL definitiva de Kuula.
========================================================================== */

function setupDemoViewer() {

  const frame =
    document.getElementById(
      "demo-frame"
    );


  const fullscreenButton =
    document.getElementById(
      "fullscreenTour"
    );


  if (!frame || !fullscreenButton) {
    return;
  }


  const demoUrl =
    "about:blank";


  frame.src =
    demoUrl;


  fullscreenButton.addEventListener(
    "click",
    function(e) {

      e.preventDefault();


      if (
        frame.requestFullscreen
      ) {

        frame.requestFullscreen();

      }

      else {

        window.open(
          demoUrl,
          "_blank"
        );

      }

    }
  );

}


/* ==========================================================================
   SCROLL REVEAL
========================================================================== */

function setupScrollReveal() {

  const elements =
    document.querySelectorAll(
      ".reveal"
    );


  if (
    !("IntersectionObserver" in window)
  ) {

    elements.forEach(
      function(element) {

        element.classList.add(
          "in"
        );

      }
    );

    return;

  }


  const observer =
    new IntersectionObserver(
      function(entries) {

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
        threshold: 0.15
      }
    );


  elements.forEach(
    function(element) {

      observer.observe(
        element
      );

    }
  );

}


/* ==========================================================================
   NAVEGACIÓN
========================================================================== */

function setupNavigation() {

  const links =
    document.querySelectorAll(
      ".nav-link"
    );


  links.forEach(
    function(link) {

      link.addEventListener(
        "click",
        function() {

          links.forEach(
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

}


/* ==========================================================================
   AÑO
========================================================================== */

document
  .getElementById("year")
  .textContent =
  new Date().getFullYear();


/* ==========================================================================
   INICIAR
========================================================================== */

init();

setupDemoViewer();