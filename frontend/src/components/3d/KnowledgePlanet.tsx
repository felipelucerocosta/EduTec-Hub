import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import planetSurfaceUrl from '../../assets/textures/planet_surface.jpg';

interface AcademicNode {
  id: string;
  name: string;
  code: string;
  category: 'Inicial' | 'Primaria' | 'Secundaria Técnica' | 'Superior';
  color: string;
  lat: number;
  lon: number;
  description: string;
}

interface KnowledgePlanetProps {
  size?: number;
  interactive?: boolean;
  onSelectNode?: (nodeName: string) => void;
  className?: string;
  activeLevel?: string;
}

const ACADEMIC_NODES: AcademicNode[] = [
  {
    id: 'inicial',
    name: 'Núcleo Inicial · Estimulación',
    code: 'LVL-01',
    category: 'Inicial',
    color: '#38bdf8',
    lat: -34.6,
    lon: -58.4,
    description: 'Salas de 3, 4 y 5 años · Primeros descubrimientos lógicos y lúdicos',
  },
  {
    id: 'primario',
    name: 'Fundamentos de Ciencias y Lógica',
    code: 'LVL-02',
    category: 'Primaria',
    color: '#34d399',
    lat: 25.2,
    lon: 55.3,
    description: '1° a 6° Grado · Alfabetización científica, robótica básica y cálculo',
  },
  {
    id: 'secundario',
    name: 'Talleres Técnicos & Sistemas E.E.S.T. 29',
    code: 'LVL-03',
    category: 'Secundaria Técnica',
    color: '#c084fc',
    lat: 40.7,
    lon: -74.0,
    description: 'Electrónica, redes, programación aplicada y arquitectura de microprocesadores',
  },
  {
    id: 'terciario',
    name: 'Instituto Técnico Superior · I+D',
    code: 'LVL-04',
    category: 'Superior',
    color: '#06b6d4',
    lat: 48.8,
    lon: 2.35,
    description: 'Desarrollo de software avanzado, computación distribuida e infraestructura',
  },
  {
    id: 'rectorado',
    name: 'Centro de Datos & Telemetría Escolar',
    code: 'SYS-OPS',
    category: 'Secundaria Técnica',
    color: '#a855f7',
    lat: 35.6,
    lon: 139.7,
    description: 'Matriz de aislamiento divisional, actas digitales y boletines oficiales',
  },
  {
    id: 'ia-lab',
    name: 'Laboratorio de IA y Robótica Aplicada',
    code: 'LAB-AI',
    category: 'Superior',
    color: '#818cf8',
    lat: -23.5,
    lon: -46.6,
    description: 'Modelos neuronales, visión artificial y automatización industrial',
  },
];

/**
 * Genera procedimentalmente una textura de superficie planetaria hiperdetallada:
 * - Océanos de abismo cósmico violeta/índigo (#080417 -> #16092e)
 * - Masas continentales orgánicas con textura de relieve digital en violeta profundo (#241044 / #32105E)
 * - Red de sinapsis de datos: rutas de fibra óptica luminiscente en púrpura eléctrico (#7929D2, #9747FF) y cian neón (#55DDF5, #38bdf8)
 * - Cuadrícula de coordenadas tecnológicas y nodos de telemetría
 */
function createPlanetTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // 1. Océanos de abismo cósmico en gradiente violeta espacial profundo
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#060312');
  oceanGrad.addColorStop(0.3, '#100624');
  oceanGrad.addColorStop(0.5, '#190a36');
  oceanGrad.addColorStop(0.7, '#0f0722');
  oceanGrad.addColorStop(1, '#05020f');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Corrientes abisales y luminiscencia oceánica
  for (let b = 0; b < 24; b++) {
    const ox = ((b * 137.5) % width);
    const oy = (Math.sin(b * 1.8) * 0.4 + 0.5) * height;
    const orad = 120 + (b % 5) * 45;
    const oGrad = ctx.createRadialGradient(ox, oy, 10, ox, oy, orad);
    oGrad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
    oGrad.addColorStop(0.5, 'rgba(121, 41, 210, 0.09)');
    oGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = oGrad;
    ctx.beginPath();
    ctx.arc(ox, oy, orad, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Masas continentales orgánicas (violeta espacial y púrpura oscuro)
  for (let i = 0; i < 48; i++) {
    const cx = (Math.sin(i * 1.73) * 0.48 + 0.5) * width;
    const cy = (Math.cos(i * 2.41) * 0.38 + 0.5) * height;
    const rad = 70 + Math.sin(i * 2.8) * 55;

    // Capa base continental
    const cGrad = ctx.createRadialGradient(cx, cy, 15, cx, cy, rad * 1.6);
    cGrad.addColorStop(0, '#2e1254'); // Púrpura medio
    cGrad.addColorStop(0.5, '#200b3b'); // Violeta profundo
    cGrad.addColorStop(0.85, '#140726'); // Borde continental
    cGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = cGrad;

    ctx.beginPath();
    // Silueta semi-orgánica con curvatura
    const points = 8;
    for (let p = 0; p < points; p++) {
      const angle = (p / points) * Math.PI * 2;
      const rMod = rad * (1 + 0.35 * Math.sin(p * 3 + i));
      const px = cx + Math.cos(angle) * rMod;
      const py = cy + Math.sin(angle) * rMod * 0.75;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  // 4. Cuadrícula de coordenadas y meridianos digitales sutiles
  ctx.strokeStyle = 'rgba(151, 71, 255, 0.07)';
  ctx.lineWidth = 1;
  const gridStepX = width / 24;
  const gridStepY = height / 12;

  for (let x = 0; x < width; x += gridStepX) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridStepY) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 5. Red de sinapsis de datos: rutas de fibra óptica luminiscente en púrpura y cian
  for (let k = 0; k < 75; k++) {
    const x1 = (Math.sin(k * 4.31) * 0.46 + 0.5) * width;
    const y1 = (Math.cos(k * 3.79) * 0.38 + 0.5) * height;
    const x2 = x1 + Math.sin(k * 2.15) * 160;
    const y2 = y1 + Math.cos(k * 1.93) * 110;

    const strokeGrad = ctx.createLinearGradient(x1, y1, x2, y2);
    strokeGrad.addColorStop(0, 'rgba(168, 85, 247, 0.85)'); // Púrpura eléctrico
    strokeGrad.addColorStop(0.5, 'rgba(121, 41, 210, 0.65)');
    strokeGrad.addColorStop(1, 'rgba(56, 189, 248, 0.75)'); // Cian neón

    ctx.strokeStyle = strokeGrad;
    ctx.lineWidth = k % 4 === 0 ? 2 : 1.2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(
      (x1 + x2) / 2 + Math.sin(k * 1.5) * 35,
      (y1 + y2) / 2 + Math.cos(k * 1.5) * 25,
      x2,
      y2
    );
    ctx.stroke();

    // Nodos metropolitanos brillantes en los extremos
    const isCyan = k % 3 === 0;
    ctx.fillStyle = isCyan ? '#38bdf8' : '#c084fc';
    ctx.beginPath();
    ctx.arc(x1, y1, isCyan ? 3.0 : 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Halo microscópico del nodo
    ctx.fillStyle = isCyan ? 'rgba(56, 189, 248, 0.25)' : 'rgba(192, 132, 252, 0.25)';
    ctx.beginPath();
    ctx.arc(x1, y1, 6.0, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Textura procedural para la capa de auroras y nubes atmosféricas:
 * CRÍTICO: Fondo 100% transparente sin color residual (evita el artefacto de velo gris o caja).
 */
function createCloudTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Fondo estrictamente transparente (RGBA 0,0,0,0)
  ctx.clearRect(0, 0, width, height);

  // Vórtices y bandas de auroras luminiscentes en violeta, lavanda y cian
  for (let j = 0; j < 40; j++) {
    const cx = (Math.sin(j * 5.73) * 0.48 + 0.5) * width;
    const cy = (Math.cos(j * 1.47) * 0.36 + 0.5) * height;
    const rx = 160 + Math.sin(j * 1.9) * 80;
    const ry = 45 + Math.cos(j * 2.3) * 22;

    const cloudGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, rx);
    cloudGrad.addColorStop(0, 'rgba(192, 132, 252, 0.28)'); // Lavanda brillante
    cloudGrad.addColorStop(0.4, 'rgba(121, 41, 210, 0.16)'); // Púrpura eléctrico
    cloudGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.10)'); // Cian etéreo
    cloudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = cloudGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0.22 * Math.sin(j), 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export const KnowledgePlanet: React.FC<KnowledgePlanetProps> = ({
  size = 480,
  interactive = true,
  onSelectNode,
  className = '',
  activeLevel,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeTooltip, setActiveTooltip] = useState<{
    node: AcademicNode;
    x: number;
    y: number;
  } | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Setup Scene, Camera, Renderer ─────────────────────────────
    // Configuración óptica calibrada:
    // FOV 38° y Z = 3.8 aseguran que el planeta (R = 0.82), su atmósfera (R = 0.86)
    // y los anillos orbitales (R = 1.08) queden 100% contenidos dentro del frustum visible
    // visible_half_span = 3.8 * tan(19°) = 1.308 > 1.15 -> CERO RECORTES NI BORDES TRUNCADOS
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1000);
    camera.position.set(0, 0, 3.8);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Grupo maestro de rotación planetaria
    const planetSystem = new THREE.Group();
    scene.add(planetSystem);

    // Radio calibrado para máxima armonía visual y proporción elegante en el Hero
    const radius = 0.82;

    // ── 1. Planeta Principal: Esfera 3D Perfecta y Continua ───────────
    // Subdivisión 96x96: curvatura perfectamente lisa, sin ángulos ni facetas
    const fallbackSurface = createPlanetTexture();
    const planetGeometry = new THREE.SphereGeometry(radius, 96, 96);
    const planetMaterial = new THREE.MeshStandardMaterial({
      map: fallbackSurface,
      roughness: 0.52,
      metalness: 0.28,
      emissive: new THREE.Color(0x241044), // Violeta profundo oficial
      emissiveIntensity: 0.65,
    });

    const textureLoader = new THREE.TextureLoader();
    let loadedSurfaceTex: THREE.Texture | null = null;
    textureLoader.load(
      planetSurfaceUrl,
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        planetMaterial.map = tex;
        planetMaterial.needsUpdate = true;
        loadedSurfaceTex = tex;
      },
      undefined,
      () => {
        // Fallback procedural de alta resolución ya activo
      }
    );

    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    planetSystem.add(planetMesh);

    // ── 2. Capa Atmosférica y Auroras con Transparencia Pura ──────────
    // Subdivisión 96x96, radio apenas superior (+1.4%) para abrazar la esfera orgánicamente
    const fallbackClouds = createCloudTexture();
    const cloudGeometry = new THREE.SphereGeometry(radius * 1.014, 96, 96);
    const cloudMaterial = new THREE.MeshStandardMaterial({
      map: fallbackClouds,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide, // FrontSide elimina artefactos de caja o polígono trasero
    });

    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    planetSystem.add(cloudMesh);

    // ── 3. Halo Atmosférico Volumétrico Fresnel (Shader Suave Frontal) ─
    // Este shader reemplaza cualquier contenedor poligonal anterior:
    // Se proyecta sobre FrontSide con R = 1.052, produciendo un resplandor
    // etéreo en el limbo de la esfera que decae suavemente a 0.0 sin cortes.
    const atmosphereGeometry = new THREE.SphereGeometry(radius * 1.052, 96, 96);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPosition.xyz);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float rim = 1.0 - clamp(dot(vNormal, vViewDir), 0.0, 1.0);
          // Curva suave exponencial: concentración luminosa en el borde exterior
          float intensity = pow(rim, 3.2) * 0.92;
          intensity *= smoothstep(0.0, 0.22, rim);

          // Paleta oficial: Púrpura eléctrico (#7929D2) a Cian neón (#55DDF5)
          vec3 haloViolet = vec3(0.474, 0.160, 0.823);
          vec3 haloCyan = vec3(0.333, 0.867, 0.960);
          vec3 haloLavender = vec3(0.725, 0.604, 1.0);

          vec3 glowColor = mix(haloViolet, mix(haloLavender, haloCyan, rim * 0.7), pow(rim, 1.8));
          gl_FragColor = vec4(glowColor, intensity);
        }
      `,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    planetSystem.add(atmosphereMesh);

    // ── 4. Polvo Estelar y Partículas de Conexión Espacial ─────────
    // Confinadas suavemente entre R*1.08 y R*1.38 para quedar 100% dentro del viewport
    const particleCount = 280;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let p = 0; p < particleCount; p++) {
      const dist = radius * 1.08 + Math.random() * (radius * 0.32);
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);

      particlePositions[p * 3] = dist * Math.sin(phi) * Math.cos(theta);
      particlePositions[p * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      particlePositions[p * 3 + 2] = dist * Math.cos(phi);

      const isCyan = Math.random() > 0.55;
      particleColors[p * 3] = isCyan ? 0.22 : 0.75;
      particleColors[p * 3 + 1] = isCyan ? 0.78 : 0.42;
      particleColors[p * 3 + 2] = isCyan ? 0.98 : 0.98;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.024,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cosmicDust = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(cosmicDust);

    // ── 5. Anillos Orbitales de Datos Tecnológicos ───────────────
    // Radios calibrados (R * 1.25 y R * 1.34) para garantizar espacio holgado
    const orbitRingGroup = new THREE.Group();
    const ringRadius1 = radius * 1.25;
    const ringRadius2 = radius * 1.34;
    const ringSegments = 240;

    // Anillo 1: Órbita de datos en violeta eléctrico
    const ringGeo1 = new THREE.BufferGeometry();
    const ringPos1 = new Float32Array(ringSegments * 3);
    for (let r = 0; r < ringSegments; r++) {
      const angle = (r / ringSegments) * Math.PI * 2;
      ringPos1[r * 3] = Math.cos(angle) * ringRadius1;
      ringPos1[r * 3 + 1] = Math.sin(angle) * ringRadius1;
      ringPos1[r * 3 + 2] = Math.sin(angle * 2) * 0.06;
    }
    ringGeo1.setAttribute('position', new THREE.BufferAttribute(ringPos1, 3));

    const ringMat1 = new THREE.LineBasicMaterial({
      color: 0x9333ea,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const orbitLine1 = new THREE.LineLoop(ringGeo1, ringMat1);
    orbitLine1.rotation.x = Math.PI * 0.36;
    orbitLine1.rotation.y = Math.PI * 0.16;
    orbitRingGroup.add(orbitLine1);

    // Anillo 2: Órbita de telemetría en cian neón
    const ringGeo2 = new THREE.BufferGeometry();
    const ringPos2 = new Float32Array(ringSegments * 3);
    for (let r = 0; r < ringSegments; r++) {
      const angle = (r / ringSegments) * Math.PI * 2;
      ringPos2[r * 3] = Math.cos(angle) * ringRadius2;
      ringPos2[r * 3 + 1] = Math.sin(angle) * ringRadius2;
      ringPos2[r * 3 + 2] = -Math.sin(angle * 2) * 0.05;
    }
    ringGeo2.setAttribute('position', new THREE.BufferAttribute(ringPos2, 3));

    const ringMat2 = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
    });
    const orbitLine2 = new THREE.LineLoop(ringGeo2, ringMat2);
    orbitLine2.rotation.x = -Math.PI * 0.38;
    orbitLine2.rotation.y = -Math.PI * 0.22;
    orbitRingGroup.add(orbitLine2);

    planetSystem.add(orbitRingGroup);

    // Micro-balizas/satélites orbitales
    const beaconGeo = new THREE.SphereGeometry(0.026, 16, 16);
    const beaconMat1 = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const orbitBeacon1 = new THREE.Mesh(beaconGeo, beaconMat1);
    orbitRingGroup.add(orbitBeacon1);

    const beaconMat2 = new THREE.MeshBasicMaterial({ color: 0xc084fc });
    const orbitBeacon2 = new THREE.Mesh(beaconGeo, beaconMat2);
    orbitRingGroup.add(orbitBeacon2);

    // ── 6. Nodos Académicos Interactivos (Pins) ─────────────────
    const nodeMarkers: { mesh: THREE.Mesh; halo: THREE.Mesh; node: AcademicNode }[] = [];
    const pinGeo = new THREE.SphereGeometry(0.034, 16, 16);
    const haloGeo = new THREE.RingGeometry(0.042, 0.068, 32);

    ACADEMIC_NODES.forEach((node) => {
      const latRad = (node.lat * Math.PI) / 180;
      const lonRad = (node.lon * Math.PI) / 180;
      const r = radius + 0.016;

      const x = -r * Math.cos(latRad) * Math.cos(lonRad);
      const y = r * Math.sin(latRad);
      const z = r * Math.cos(latRad) * Math.sin(lonRad);

      const colorHex = new THREE.Color(node.color);

      // Pin core
      const pinMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(x, y, z);

      // Halo pulsante
      const haloMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.set(x, y, z);
      halo.lookAt(x * 2, y * 2, z * 2);

      planetSystem.add(pin);
      planetSystem.add(halo);

      nodeMarkers.push({ mesh: pin, halo, node });
    });

    // ── 7. Iluminación Cinematográfica (Violeta & Espacial) ────────
    const ambientLight = new THREE.AmbientLight(0x1f1035, 1.2); // Violeta espacial profundo
    scene.add(ambientLight);

    // Luz principal violeta brillante (clave superior derecha)
    const keyLight = new THREE.DirectionalLight(0xa855f7, 3.2);
    keyLight.position.set(4.5, 3.5, 3.0);
    scene.add(keyLight);

    // Luz de relleno cian eléctrico (inferior izquierda)
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    fillLight.position.set(-4.0, -2.5, 1.5);
    scene.add(fillLight);

    // Contraluz de borde en índigo/espacial (profundidad en el limbo posterior)
    const rimLight = new THREE.DirectionalLight(0x7929d2, 2.2);
    rimLight.position.set(0.0, 4.0, -3.5);
    scene.add(rimLight);

    // ── 8. Física Interactiva, Arrastre e Inercia ────────────────
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let velocity = { x: 0.0018, y: 0.0014 };
    let beaconAngle1 = 0;
    let beaconAngle2 = Math.PI;

    const onMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycasting para detectar hover sobre nodos académicos
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(nodeMarkers.map((m) => m.mesh));

      if (intersects.length > 0) {
        const found = nodeMarkers.find((m) => m.mesh === intersects[0].object);
        if (found) {
          setActiveTooltip({
            node: found.node,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
          container.style.cursor = 'pointer';
        }
      } else {
        setActiveTooltip(null);
        container.style.cursor = isDragging ? 'grabbing' : 'grab';
      }

      if (!isDragging || !interactive) return;

      const deltaX = e.clientX - prevMouse.x;
      const deltaY = e.clientY - prevMouse.y;

      velocity.y = deltaX * 0.004;
      velocity.x = deltaY * 0.004;

      planetSystem.rotation.y += velocity.y;
      planetSystem.rotation.x += velocity.x;

      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onClick = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(nodeMarkers.map((m) => m.mesh));

      if (intersects.length > 0) {
        const found = nodeMarkers.find((m) => m.mesh === intersects[0].object);
        if (found) {
          setSelectedNodeId(found.node.id);
          if (onSelectNode) onSelectNode(found.node.name);
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('click', onClick);

    // ── 9. Manejo Responsivo de Dimensiones ───────────────────────
    const handleResize = () => {
      if (!container) return;
      const currentWidth = container.clientWidth || size;
      const currentHeight = container.clientHeight || size;
      const targetSize = Math.min(currentWidth, currentHeight, size);
      
      renderer.setSize(targetSize, targetSize);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // ── 10. Loop de Renderizado con Amortiguación Dinámica ────────
    let animId: number;

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);

      if (!isDragging && !prefersReducedMotion) {
        planetSystem.rotation.y += velocity.y;
        planetSystem.rotation.x += velocity.x * 0.4;

        // Amortiguación inercial suave hacia la velocidad de crucero
        velocity.y = THREE.MathUtils.lerp(velocity.y, 0.0015, 0.035);
        velocity.x = THREE.MathUtils.lerp(velocity.x, 0.0, 0.035);
      }

      // Rotación diferencial de auroras y nubes
      cloudMesh.rotation.y += 0.0005;
      cloudMesh.rotation.x -= 0.0002;

      // Movimiento orbital de anillos y balizas
      orbitLine1.rotation.z += 0.0018;
      orbitLine2.rotation.z -= 0.0014;

      beaconAngle1 += 0.016;
      beaconAngle2 -= 0.012;

      orbitBeacon1.position.set(
        Math.cos(beaconAngle1) * ringRadius1,
        Math.sin(beaconAngle1) * ringRadius1,
        Math.sin(beaconAngle1 * 2) * 0.06
      );

      orbitBeacon2.position.set(
        Math.cos(beaconAngle2) * ringRadius2,
        Math.sin(beaconAngle2) * ringRadius2,
        -Math.sin(beaconAngle2 * 2) * 0.05
      );

      // Pulsación armónica de halos de nodos
      const time = performance.now() * 0.003;
      nodeMarkers.forEach(({ halo, node }, idx) => {
        const pulse = 1 + Math.sin(time + idx * 1.2) * 0.22;
        halo.scale.set(pulse, pulse, pulse);
        if (activeLevel && node.id === activeLevel) {
          halo.scale.set(pulse * 1.5, pulse * 1.5, pulse * 1.5);
        }
      });

      // Rotación suave del polvo cósmico ambiental
      cosmicDust.rotation.y += 0.0003;

      renderer.render(scene, camera);
    };

    renderLoop();

    // ── 11. Limpieza Completa en Desmontaje ───────────────────────
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('click', onClick);

      if (loadedSurfaceTex) (loadedSurfaceTex as THREE.Texture).dispose();
      fallbackSurface.dispose();
      fallbackClouds.dispose();
      planetGeometry.dispose();
      planetMaterial.dispose();
      cloudGeometry.dispose();
      cloudMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      beaconGeo.dispose();
      beaconMat1.dispose();
      beaconMat2.dispose();
      pinGeo.dispose();
      haloGeo.dispose();

      renderer.dispose();
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
    };
  }, [size, interactive, onSelectNode, activeLevel]);

  return (
    <div
      ref={mountRef}
      className={`knowledge-planet-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: size,
        aspectRatio: '1 / 1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        overflow: 'visible',
      }}
    >
      {/* Tooltip contextual cinematográfico */}
      {activeTooltip && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(Math.max(activeTooltip.x + 14, 10), (size || 480) - 270),
            top: Math.max(activeTooltip.y - 14, 10),
            background: 'rgba(10, 14, 28, 0.94)',
            border: `1px solid ${activeTooltip.node.color}`,
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            color: '#f8fafc',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.75), 0 0 16px rgba(121, 41, 210, 0.25)',
            pointerEvents: 'none',
            zIndex: 20,
            backdropFilter: 'blur(12px)',
            maxWidth: '260px',
            fontFamily: "'Sora', sans-serif",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: activeTooltip.node.color, letterSpacing: '0.08em' }}>
              {activeTooltip.node.code}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              {activeTooltip.node.category}
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc', lineHeight: 1.3 }}>
            {activeTooltip.node.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem', lineHeight: 1.4 }}>
            {activeTooltip.node.description}
          </div>
        </div>
      )}

      {/* Indicador de nodo seleccionado en la base */}
      {selectedNodeId && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            padding: '4px 14px',
            borderRadius: '99px',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(168, 85, 247, 0.45)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#c084fc',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            pointerEvents: 'none',
          }}
        >
          Coordenada activa: {selectedNodeId.toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default KnowledgePlanet;
