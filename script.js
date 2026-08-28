/* ==========================================================================
   VIEWMETRICAMX — REALITY INTELLIGENCE
   Visor 360° principal
   ========================================================================== */


/* ==========================================================================
   CONFIGURACIÓN
========================================================================== */

const CONFIG = {

  WHATSAPP_NUMBER: "528714005421",

  WHATSAPP_MESSAGE:
    "Hola, vi la experiencia 360° de ViewmetricaMX y me gustaría conocer cómo podría aplicarse a mi negocio.",

  AUTOPLAY_MINUTES: 3,

  AUTOROTATE_SPEED: 0.006,

  FOV_MIN: 32,

  FOV_MAX: 92

};


/* ==========================================================================
   PANORAMAS
========================================================================== */

const PANORAMAS = [

  {
    key: "patrimonio",
    label: "PATRIMONIO CULTURAL",
    file: "assets/viewmetricamx_demo_360_patrimonio_cultural.jpg"
  },

  {
    key: "exterior",
    label: "EXTERIOR",
    file: "assets/viewmetricamx_demo_360_exterior.jpg"
  },

  {
    key: "restaurant",
    label: "RESTAURANTE",
    file: "assets/viewmetricamx_demo_360_Restaurant.jpg"
  },

  {
    key: "salon",
    label: "SALÓN DE EVENTOS",
    file: "assets/viewmetricamx_demo_360_salon.jpg"
  },

  {
    key: "universidad",
    label: "UNIVERSIDAD",
    file: "assets/viewmetricamx_demo_360_universidad.jpg"
  }

];


/* ==========================================================================
   INICIO
========================================================================== */

(function initViewer() {

  const stage = document.getElementById("viewer-stage");

  const canvas = document.getElementById("pano-canvas");

  const loading = document.getElementById("viewer-loading");

  const loadingLabel =
    loading.querySelector(".loading-label");

  const fallback =
    document.getElementById("viewer-fallback");

  const fallbackImg =
    document.getElementById("fallback-img");

  const dragHint =
    document.getElementById("drag-hint");

  const label =
    document.getElementById("pos-tag-label");

  const counter =
    document.getElementById("point-count");

  const timer =
    document.getElementById("autoplay-timer");

  const prevButton =
    document.getElementById("area-prev");

  const nextButton =
    document.getElementById("area-next");

  const zoomIn =
    document.getElementById("zoom-in");

  const zoomOut =
    document.getElementById("zoom-out");

  const recenter =
    document.getElementById("recenter");

  const fullscreen =
    document.getElementById("fullscreen-btn");


  /* ==========================================================================
     WEBGL
  ========================================================================== */

  function hasWebGL() {

    try {

      const test =
        document.createElement("canvas");

      return !!(
        window.WebGLRenderingContext &&
        (
          test.getContext("webgl") ||
          test.getContext("experimental-webgl")
        )
      );

    } catch (error) {

      return false;

    }

  }


  if (
    typeof THREE === "undefined" ||
    !hasWebGL()
  ) {

    fallback.hidden = false;

    fallbackImg.src =
      PANORAMAS[0].file;

    loading.hidden = true;

    return;

  }


  /* ==========================================================================
     THREE STATE
  ========================================================================== */

  let renderer;

  let scene;

  let camera;

  let sphere;

  let currentIndex = 0;

  let lon = 0;

  let lat = 0;

  let targetFov = 84;

  let velocityLon = 0;

  let velocityLat = 0;

  let isDragging = false;

  let userHasInteracted = false;

  let lastInteraction =
    performance.now();


  const INERTIA_FRICTION = 0.94;

  const MAX_INERTIA = 2.5;


  let startX = 0;

  let startY = 0;

  let startLon = 0;

  let startLat = 0;


  const textureCache = {};

  const textureLoader =
    new THREE.TextureLoader();


  /* ==========================================================================
     AUTOPLAY
  ========================================================================== */

  const AUTOPLAY_SECONDS =
    CONFIG.AUTOPLAY_MINUTES * 60;

  let autoplayRemaining =
    AUTOPLAY_SECONDS;


  function resetAutoplayTimer() {

    autoplayRemaining =
      AUTOPLAY_SECONDS;

    updateTimer();

  }


  function updateTimer() {

    const minutes =
      Math.floor(autoplayRemaining / 60);

    const seconds =
      autoplayRemaining % 60;

    timer.textContent =
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds).padStart(2, "0");

  }


  function autoplayTick() {

    if (!userHasInteracted) {

      return;

    }

    autoplayRemaining--;

    updateTimer();


    if (autoplayRemaining <= 0) {

      goToPanorama(
        (currentIndex + 1) %
        PANORAMAS.length
      );

      resetAutoplayTimer();

    }

  }


  setInterval(
    autoplayTick,
    1000
  );


  /* ==========================================================================
     BUILD SCENE
  ========================================================================== */

  renderer =
    new THREE.WebGLRenderer({

      canvas: canvas,

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
     Fundamental para nuestro panorama:
     invertimos la esfera en Z para mirar
     desde el interior.
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


  resize();


  window.addEventListener(
    "resize",
    resize
  );


  animate();


  /* ==========================================================================
     RESIZE
  ========================================================================== */

  function resize() {

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
     PANORAMA
  ========================================================================== */

  function goToPanorama(index) {

    if (
      index < 0 ||
      index >= PANORAMAS.length
    ) {

      return;

    }


    currentIndex =
      index;


    const pano =
      PANORAMAS[currentIndex];


    label.textContent =
      pano.label;


    counter.textContent =
      String(currentIndex + 1)
        .padStart(2, "0") +
      "/" +
      String(PANORAMAS.length)
        .padStart(2, "0");


    lon = 0;

    lat = 0;

    targetFov = 84;

    camera.fov = 84;

    camera.updateProjectionMatrix();


    const cacheKey =
      String(currentIndex);


    if (
      textureCache[cacheKey]
    ) {

      applyTexture(
        textureCache[cacheKey]
      );

      return;

    }


    loading.hidden = false;

    loadingLabel.textContent =
      "Cargando " +
      pano.label.toLowerCase() +
      "…";


    textureLoader.load(

      pano.file,

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


        texture.wrapS =
          THREE.ClampToEdgeWrapping;

        texture.wrapT =
          THREE.ClampToEdgeWrapping;


        texture.repeat.x = 1;

        texture.offset.x = 0;


        textureCache[cacheKey] =
          texture;


        applyTexture(texture);

        loading.hidden = true;

      },

      undefined,

      function(error) {

        console.error(
          "Error cargando panorama:",
          pano.file,
          error
        );

        loadingLabel.textContent =
          "No se pudo cargar el panorama.";

      }

    );

  }


  /* ==========================================================================
     APPLY TEXTURE
  ========================================================================== */

  function applyTexture(texture) {

    sphere.material.map =
      texture;

    sphere.material.color.set(
      0xffffff
    );

    sphere.material.needsUpdate =
      true;

  }


  /* ==========================================================================
     NAVIGATION
  ========================================================================== */

  function nextPanorama() {

    markInteraction();

    goToPanorama(
      (currentIndex + 1) %
      PANORAMAS.length
    );

    resetAutoplayTimer();

  }


  function previousPanorama() {

    markInteraction();

    goToPanorama(
      (
        currentIndex -
        1 +
        PANORAMAS.length
      ) %
      PANORAMAS.length
    );

    resetAutoplayTimer();

  }


  nextButton.addEventListener(
    "click",
    nextPanorama
  );


  prevButton.addEventListener(
    "click",
    previousPanorama
  );


  /* ==========================================================================
     INTERACTION
  ========================================================================== */

  function markInteraction() {

    userHasInteracted =
      true;

    lastInteraction =
      performance.now();

    resetAutoplayTimer();


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


  /* ==========================================================================
     MOUSE
  ========================================================================== */

  stage.addEventListener(
    "mousedown",
    function(event) {

      markInteraction();

      isDragging = true;

      stage.classList.add(
        "is-dragging"
      );


      startX =
        event.clientX;

      startY =
        event.clientY;

      startLon =
        lon;

      startLat =
        lat;

    }
  );


  window.addEventListener(
    "mousemove",
    function(event) {

      if (!isDragging) {
        return;
      }


      const newLon =
        startLon +
        (
          startX -
          event.clientX
        ) *
        0.16;


      const newLat =
        startLat +
        (
          event.clientY -
          startY
        ) *
        0.16;


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

    }
  );


  window.addEventListener(
    "mouseup",
    function() {

      isDragging = false;

      stage.classList.remove(
        "is-dragging"
      );

    }
  );


  /* ==========================================================================
     TOUCH
  ========================================================================== */

  stage.addEventListener(
    "touchstart",
    function(event) {

      markInteraction();


      if (
        event.touches.length === 1
      ) {

        isDragging = true;


        startX =
          event.touches[0].clientX;

        startY =
          event.touches[0].clientY;


        startLon =
          lon;

        startLat =
          lat;

      }

    },
    {
      passive: true
    }
  );


  stage.addEventListener(
    "touchmove",
    function(event) {

      if (
        event.touches.length !== 1 ||
        !isDragging
      ) {

        return;

      }


      const newLon =
        startLon +
        (
          startX -
          event.touches[0].clientX
        ) *
        0.16;


      const newLat =
        startLat +
        (
          event.touches[0].clientY -
          startY
        ) *
        0.16;


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

    },
    {
      passive: true
    }
  );


  stage.addEventListener(
    "touchend",
    function() {

      isDragging = false;

    }
  );


  /* ==========================================================================
     WHEEL ZOOM
  ========================================================================== */

  stage.addEventListener(
    "wheel",
    function(event) {

      event.preventDefault();

      markInteraction();


      targetFov =
        clamp(
          targetFov +
          event.deltaY *
          0.04,

          CONFIG.FOV_MIN,

          CONFIG.FOV_MAX
        );

    },
    {
      passive: false
    }
  );


  /* ==========================================================================
     BUTTON ZOOM
  ========================================================================== */

  zoomIn.addEventListener(
    "click",
    function() {

      markInteraction();

      targetFov =
        clamp(
          targetFov - 10,
          CONFIG.FOV_MIN,
          CONFIG.FOV_MAX
        );

    }
  );


  zoomOut.addEventListener(
    "click",
    function() {

      markInteraction();

      targetFov =
        clamp(
          targetFov + 10,
          CONFIG.FOV_MIN,
          CONFIG.FOV_MAX
        );

    }
  );


  /* ==========================================================================
     RECENTER
  ========================================================================== */

  recenter.addEventListener(
    "click",
    function() {

      markInteraction();

      lon = 0;

      lat = 0;

      targetFov = 84;

    }
  );


  /* ==========================================================================
     FULLSCREEN
  ========================================================================== */

  fullscreen.addEventListener(
    "click",
    function() {

      markInteraction();


      if (
        !document.fullscreenElement
      ) {

        if (
          stage.requestFullscreen
        ) {

          stage.requestFullscreen();

        }

      } else {

        document.exitFullscreen();

      }

    }
  );


  document.addEventListener(
    "fullscreenchange",
    resize
  );


  /* ==========================================================================
     RENDER LOOP
  ========================================================================== */

  function animate() {

    requestAnimationFrame(
      animate
    );


    if (!isDragging) {

      if (
        Math.abs(velocityLon) >
          0.001 ||
        Math.abs(velocityLat) >
          0.001
      ) {

        lon += velocityLon;

        lat += velocityLat;


        velocityLon *=
          INERTIA_FRICTION;

        velocityLat *=
          INERTIA_FRICTION;

      } else {

        /*
          Rotación continua suave.
          Esto mantiene vivo el panorama
          cuando el usuario no está interactuando.
        */

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
      ) > .05
    ) {

      camera.fov +=
        (
          targetFov -
          camera.fov
        ) *
        .15;

      camera.updateProjectionMatrix();

    }


    renderer.render(
      scene,
      camera
    );

  }


  /* ==========================================================================
     UTILIDAD
  ========================================================================== */

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
     START
  ========================================================================== */

  updateTimer();

  goToPanorama(0);


  setTimeout(
    function() {

      dragHint.classList.add(
        "is-hidden"
      );

    },
    6000
  );


})();


/* ==========================================================================
   WHATSAPP
========================================================================== */

(function setupWhatsApp() {

  const button =
    document.getElementById(
      "whatsapp-cta"
    );

  if (!button) {
    return;
  }


  const url =
    "https://wa.me/" +
    CONFIG.WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(
      CONFIG.WHATSAPP_MESSAGE
    );


  button.href = url;

  button.target = "_blank";

  button.rel =
    "noopener noreferrer";

})();


/* ==========================================================================
   YEAR
========================================================================== */

document.getElementById(
  "year"
).textContent =
  new Date().getFullYear();