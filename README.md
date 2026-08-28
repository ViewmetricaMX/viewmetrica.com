# ViewMetricaMX — Demos 360°

Colección de demos interactivos 360° desarrollados por **ViewMetricaMX** para mostrar aplicaciones de recorridos virtuales, fotografía 360° y experiencias de navegación inmersiva.

## Demos

Los proyectos están organizados bajo una misma estructura visual y técnica:

1. `viewmetricamx_demo_360_patrimonio_cultural`
2. `viewmetricamx_demo_360_exterior`
3. `viewmetricamx_demo_360_Restaurant`
4. `viewmetricamx_demo_360_salon`
5. `viewmetricamx_demo_360_universidad`

---

## Estructura del proyecto

Cada demo utiliza una estructura independiente:

```text
demo/
│
├── index.html
├── style.css
├── script.js
│
└── assets/
    ├── panorama-01.jpg
    ├── panorama-02.jpg
    ├── panorama-03.jpg
    └── ...
```

### `index.html`

Contiene:

- Header
- Logo de ViewMetricaMX
- Visor panorámico 360°
- Controles de navegación
- Información comercial
- Bloques de beneficios
- Llamado a la acción
- Footer

### `style.css`

Controla:

- Diseño responsive
- Tipografía
- Espaciado
- Visor
- Controles
- Flechas
- Contador
- Animaciones
- Bloques informativos
- Adaptación para dispositivos móviles

### `script.js`

Controla:

- Three.js
- Carga de panoramas
- Navegación entre vistas
- Flechas
- Autonavegación
- Contador de tiempo
- Drag con mouse
- Gestos táctiles
- Zoom
- Pantalla completa
- Inercia del movimiento
- WhatsApp
- Animaciones de aparición

---

# Visor 360°

El visor se encuentra en la parte superior de la página para que sea el elemento visual principal.

La estructura conceptual es:

```text
┌─────────────────────────────────────┐
│             VISOR 360°              │
│                                     │
│          ←             →            │
│                                     │
│             01 / 05                 │
│        Cambio automático            │
└─────────────────────────────────────┘

              LOGO

        Información principal

      ┌──────────┐ ┌──────────┐
      │ Beneficio│ │ Beneficio│
      └──────────┘ └──────────┘

      ┌──────────┐ ┌──────────┐
      │ Beneficio│ │ Beneficio│
      └──────────┘ └──────────┘

          LLAMADO A LA ACCIÓN
```

La intención es que el visitante **primero experimente el espacio y después conozca la propuesta**.

---

# Navegación

La navegación principal ya no depende de una barra de botones por área.

El visor utiliza:

- Flecha izquierda
- Flecha derecha
- Contador de vistas
- Cambio automático

Ejemplo:

```text
←                         →
             02 / 05
```

El usuario puede recorrer manualmente las vistas mediante las flechas.

---

# Autonavegación

Si el visitante permanece inactivo, el visor puede cambiar automáticamente de panorama.

La lógica prevista es:

```text
Usuario entra
     ↓
Panorama 01
     ↓
Espera
     ↓
Panorama 02
     ↓
Espera
     ↓
Panorama 03
     ↓
...
```

Cuando el usuario interactúa con el visor:

```text
Mouse / Touch / Flecha
          ↓
Se detiene la autonavegación
          ↓
Usuario controla el recorrido
```

Después del periodo definido de inactividad, la navegación automática puede reanudarse.

El tiempo de espera se controla desde `script.js`.

---

# Assets

Los panoramas deben colocarse dentro de:

```text
/assets/
```

Se recomienda utilizar nombres descriptivos y orientados a SEO.

Ejemplo:

```text
restaurant_garufa_parrilla_argentina_torreon_entrada_360.jpg
restaurant_garufa_parrilla_argentina_torreon_interior_360.jpg
restaurant_garufa_parrilla_argentina_torreon_cava_360.jpg
restaurant_garufa_parrilla_argentina_torreon_salon_principal_360.jpg
restaurant_garufa_parrilla_argentina_torreon_toilets_360.jpg
```

### Recomendación

Mantener una nomenclatura consistente:

```text
[tipo]_[nombre]_[ciudad]_[area]_360.jpg
```

Esto facilita posteriormente:

- Organización
- Mantenimiento
- SEO
- Sustitución de panoramas
- Automatización de proyectos

---

# Three.js

El visor utiliza Three.js para renderizar las fotografías panorámicas.

La esfera se configura como interior de una esfera mediante:

```javascript
geometry.scale(1, 1, -1);
```

Las panorámicas se muestran mediante un `MeshBasicMaterial`.

Las texturas utilizan espacio de color sRGB cuando está disponible:

```javascript
texture.colorSpace = THREE.SRGBColorSpace;
```

---

# Responsive

El demo debe funcionar en:

- Desktop
- Laptop
- Tablet
- Smartphone

En dispositivos táctiles se soporta:

- Arrastre horizontal/vertical
- Pinch-to-zoom
- Flechas de navegación

---

# Publicación

Los demos son proyectos estáticos y **no requieren PHP, base de datos ni WordPress**.

Pueden publicarse directamente en:

- GitHub Pages
- Hostinger
- Netlify
- Vercel
- Cualquier servidor web estático

## GitHub Pages

Para demos públicos y de presentación se recomienda GitHub Pages.

La estructura del repositorio puede ser:

```text
viewmetricamx_demo_360_restaurant
│
├── index.html
├── style.css
├── script.js
└── assets/
```

Después de subir los archivos se puede activar GitHub Pages desde la configuración del repositorio.

---

# Hostinger

También pueden alojarse directamente en Hostinger.

Subir:

```text
index.html
style.css
script.js
assets/
```

dentro de la carpeta pública correspondiente al dominio o subdominio.

Ejemplo:

```text
public_html/
│
├── index.html
├── style.css
├── script.js
└── assets/
```

No es necesario instalar WordPress.

---

# Arquitectura ViewMetricaMX

Todos los demos deben conservar una arquitectura visual común:

```text
VISOR
↓
MARCA / LOGO
↓
INTRODUCCIÓN
↓
BLOQUES DE INFORMACIÓN
↓
BENEFICIOS
↓
APLICACIONES
↓
CTA
↓
CONTACTO
```

La información y las imágenes cambian según el sector, pero la experiencia debe sentirse como parte del mismo producto.

---

# Sectores

La colección inicial contempla:

### Patrimonio cultural

`viewmetricamx_demo_360_patrimonio_cultural`

Aplicaciones:

- Museos
- Centros históricos
- Monumentos
- Sitios culturales
- Espacios turísticos

### Exterior

`viewmetricamx_demo_360_exterior`

Aplicaciones:

- Inmobiliaria
- Hoteles
- Resorts
- Arquitectura
- Desarrollos

### Restaurant

`viewmetricamx_demo_360_Restaurant`

Aplicaciones:

- Restaurantes
- Parrillas
- Cafeterías
- Bares
- Experiencias gastronómicas

### Salón

`viewmetricamx_demo_360_salon`

Aplicaciones:

- Salones de eventos
- Jardines
- Haciendas
- Centros de convenciones
- Bodas y eventos sociales

### Universidad

`viewmetricamx_demo_360_universidad`

Aplicaciones:

- Universidades
- Colegios
- Campus
- Laboratorios
- Instalaciones académicas

---

# Objetivo comercial

Estos demos no son únicamente portafolio.

Su función es demostrar de manera inmediata qué puede experimentar un cliente potencial al contratar ViewMetricaMX.

El visitante debe poder pensar:

> "Quiero esto para mi negocio."

Por esta razón, la experiencia visual tiene prioridad sobre explicaciones técnicas.

---

# Principio de diseño

La interfaz debe mantenerse:

**Limpia · Elegante · Visual · Profesional · Inmersiva**

Evitar una estética excesivamente tecnológica.

ViewMetricaMX debe comunicar:

**espacio + presencia + información + confianza**

y no simplemente "tecnología 360°".

---

# Mantenimiento

Para crear un nuevo demo:

1. Copiar un demo existente.
2. Renombrar la carpeta.
3. Sustituir los panoramas en `/assets/`.
4. Actualizar la configuración de vistas en `script.js`.
5. Actualizar textos en `index.html`.
6. Cambiar el logo o identidad del cliente si corresponde.
7. Revisar el CTA.
8. Probar desktop y móvil.
9. Publicar.

La arquitectura base debe permanecer intacta para evitar que cada demo se convierta en un proyecto diferente.

---

## ViewMetricaMX

**Ingeniería de Visibilidad Local**

Fotografía 360° · Recorridos Virtuales · Google Maps · Inteligencia Visual