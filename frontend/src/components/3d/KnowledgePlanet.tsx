import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

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
    color: '#a855f7',
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
    color: '#c084fc',
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
 * - Océanos de abismo índigo/espacial
 * - Masas continentales orgánicas con textura de relieve digital
 * - Red de sinapsis de datos (rutas de fibra y ciudades nocturnas en violeta/cian)
 */
function createPlanetTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // 1. Fondo base oceánico profundo
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#060a16');
  oceanGrad.addColorStop(0.5, '#080d21');
  oceanGrad.addColorStop(1, '#050713');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Ruido continental pseudo-fractal
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  for (let i = 0; i < 40; i++) {
    const cx = (Math.sin(i * 1.7) * 0.5 + 0.5) * width;
    const cy = (Math.cos(i * 2.3) * 0.4 + 0.5) * height;
    const rad = 60 + Math.sin(i * 3.1) * 45;

    const radial = ctx.createRadialGradient(cx, cy, 10, cx, cy, rad * 1.8);
    radial.addColorStop(0, '#1a2238');
    radial.addColorStop(0.6, '#111827');
    radial.addColorStop(1, 'transparent');
    ctx.fillStyle = radial;

    ctx.beginPath();
    ctx.arc(cx, cy, rad * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Cuadrícula de coordenadas y meridianos digitales sutiles
  ctx.strokeStyle = 'rgba(124, 58, 237, 0.08)';
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

  // 4. Red neuronal de conocimiento: filamentos de luz violeta y cian
  ctx.lineWidth = 1.5;
  for (let k = 0; k < 60; k++) {
    const x1 = (Math.sin(k * 4.3) * 0.45 + 0.5) * width;
    const y1 = (Math.cos(k * 3.7) * 0.4 + 0.5) * height;
    const x2 = x1 + Math.sin(k * 2.1) * 140;
    const y2 = y1 + Math.cos(k * 1.9) * 90;

    const strokeGrad = ctx.createLinearGradient(x1, y1, x2, y2);
    strokeGrad.addColorStop(0, 'rgba(168, 85, 247, 0.65)');
    strokeGrad.addColorStop(1, 'rgba(56, 189, 248, 0.5)');
    ctx.strokeStyle = strokeGrad;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(
      (x1 + x2) / 2 + Math.sin(k) * 30,
      (y1 + y2) / 2 + Math.cos(k) * 30,
      x2,
      y2
    );
    ctx.stroke();

    // Nodos metropolitanos brillantes en los extremos
    ctx.fillStyle = k % 2 === 0 ? '#c084fc' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(x1, y1, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Textura procedural para la capa de nubes/aurora atmosférica
 */
function createCloudTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, width, height);

  // Bandas sutiles de nubes y auroras atmosféricas
  for (let j = 0; j < 35; j++) {
    const cx = (Math.sin(j * 5.7) * 0.5 + 0.5) * width;
    const cy = (Math.cos(j * 1.4) * 0.35 + 0.5) * height;
    const rx = 120 + Math.sin(j) * 60;
    const ry = 40 + Math.cos(j) * 20;

    const cloudGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, rx);
    cloudGrad.addColorStop(0, 'rgba(192, 132, 252, 0.18)');
    cloudGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.09)');
    cloudGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = cloudGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0.15 * Math.sin(j), 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export const KnowledgePlanet: React.FC<KnowledgePlanetProps> = ({
  size = 540,
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
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
    camera.position.z = 2.95;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    container.appendChild(renderer.domElement);

    // Grupo maestro de rotación planetaria
    const planetSystem = new THREE.Group();
    scene.add(planetSystem);

    const radius = 1.0;

    // ── 1. Planeta Principal con Textura Orgánica Procedural ──────
    const surfaceTexture = createPlanetTexture();
    const planetGeometry = new THREE.SphereGeometry(radius, 64, 64);
    const planetMaterial = new THREE.MeshStandardMaterial({
      map: surfaceTexture,
      roughness: 0.65,
      metalness: 0.25,
      emissive: new THREE.Color(0x0c0824),
      emissiveIntensity: 0.6,
    });
    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    planetSystem.add(planetMesh);

    // ── 2. Capa Atmosférica y Nubes de Auroras ──────────────────
    const cloudTexture = createCloudTexture();
    const cloudGeometry = new THREE.SphereGeometry(radius * 1.025, 48, 48);
    const cloudMaterial = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    planetSystem.add(cloudMesh);

    // ── 3. Halo Atmosférico Volumétrico Fresnel (Shader) ─────────
    const atmosphereGeometry = new THREE.SphereGeometry(radius * 1.22, 40, 40);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float intensity = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 2.8);
          vec3 haloViolet = vec3(0.55, 0.25, 0.95);
          vec3 haloCyan = vec3(0.18, 0.75, 0.98);
          vec3 glowColor = mix(haloViolet, haloCyan, intensity * 0.7);
          gl_FragColor = vec4(glowColor, intensity * 0.65);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);

    // ── 4. Polvo Estelar y Partículas de Conexión Ambiental ───────
    // Partículas que se desvanecen orgánicamente en el fondo del canvas
    const particleCount = 420;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let p = 0; p < particleCount; p++) {
      // Distribución esférica expansiva que conecta el planeta con el espacio
      const dist = radius * 1.15 + Math.random() * 1.6;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);

      particlePositions[p * 3] = dist * Math.sin(phi) * Math.cos(theta);
      particlePositions[p * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      particlePositions[p * 3 + 2] = dist * Math.cos(phi);

      const isCyan = Math.random() > 0.6;
      particleColors[p * 3] = isCyan ? 0.22 : 0.68;
      particleColors[p * 3 + 1] = isCyan ? 0.75 : 0.35;
      particleColors[p * 3 + 2] = isCyan ? 0.98 : 0.96;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.022,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const cosmicDust = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(cosmicDust);

    // ── 5. Anillos Orbitales de Datos Tecnológicos ───────────────
    const orbitRingGroup = new THREE.Group();
    const ringRadius = radius * 1.55;
    const ringSegments = 160;
    const ringGeo = new THREE.BufferGeometry();
    const ringPos = new Float32Array(ringSegments * 3);

    for (let r = 0; r < ringSegments; r++) {
      const angle = (r / ringSegments) * Math.PI * 2;
      ringPos[r * 3] = Math.cos(angle) * ringRadius;
      ringPos[r * 3 + 1] = Math.sin(angle) * ringRadius;
      ringPos[r * 3 + 2] = Math.sin(angle * 3) * 0.12;
    }
    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));

    const ringMat1 = new THREE.LineBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.45,
    });
    const orbitLine1 = new THREE.LineLoop(ringGeo, ringMat1);
    orbitLine1.rotation.x = Math.PI * 0.35;
    orbitLine1.rotation.y = Math.PI * 0.18;
    orbitRingGroup.add(orbitLine1);

    const ringMat2 = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
    });
    const orbitLine2 = new THREE.LineLoop(ringGeo, ringMat2);
    orbitLine2.rotation.x = -Math.PI * 0.38;
    orbitLine2.rotation.y = -Math.PI * 0.22;
    orbitRingGroup.add(orbitLine2);

    planetSystem.add(orbitRingGroup);

    // Satélite/baliza que viaja por la órbita
    const beaconGeometry = new THREE.SphereGeometry(0.035, 16, 16);
    const beaconMaterial = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const orbitBeacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
    orbitRingGroup.add(orbitBeacon);

    // ── 6. Nodos Académicos Interactivos (Pins) ─────────────────
    const nodeMarkers: { mesh: THREE.Mesh; halo: THREE.Mesh; node: AcademicNode }[] = [];
    const pinGeo = new THREE.SphereGeometry(0.042, 16, 16);
    const haloGeo = new THREE.RingGeometry(0.05, 0.08, 24);

    ACADEMIC_NODES.forEach((node) => {
      const latRad = (node.lat * Math.PI) / 180;
      const lonRad = (node.lon * Math.PI) / 180;
      const r = radius + 0.025;

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
        opacity: 0.6,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.set(x, y, z);
      halo.lookAt(x * 2, y * 2, z * 2);

      planetSystem.add(pin);
      planetSystem.add(halo);

      nodeMarkers.push({ mesh: pin, halo, node });
    });

    // ── 7. Iluminación Ambiental y Direccional ───────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Luz principal violeta espacial (clave superior derecha)
    const keyLight = new THREE.DirectionalLight(0xa855f7, 2.8);
    keyLight.position.set(4, 3, 3);
    scene.add(keyLight);

    // Luz de relleno cian (inferior izquierda)
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    fillLight.position.set(-4, -2, -2);
    scene.add(fillLight);

    // Contraluz de borde índigo
    const rimLight = new THREE.DirectionalLight(0x4338ca, 1.8);
    rimLight.position.set(0, -4, 4);
    scene.add(rimLight);

    // ── 8. Física Interactiva, Arrastre e Inercia ────────────────
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let velocity = { x: 0.0018, y: 0.0014 };
    let beaconAngle = 0;

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

    // ── 9. Loop de Renderizado con Amortiguación Dinámica ─────────
    let animId: number;

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);

      if (!isDragging && !prefersReducedMotion) {
        planetSystem.rotation.y += velocity.y;
        planetSystem.rotation.x += velocity.x * 0.4;

        // Amortiguación inercial hacia la velocidad de crucero
        velocity.y = THREE.MathUtils.lerp(velocity.y, 0.0016, 0.035);
        velocity.x = THREE.MathUtils.lerp(velocity.x, 0.0, 0.035);
      }

      // Rotación diferencial de nubes y auroras
      cloudMesh.rotation.y += 0.0006;
      cloudMesh.rotation.x -= 0.0003;

      // Movimiento orbital de anillos y baliza
      orbitLine1.rotation.z += 0.002;
      orbitLine2.rotation.z -= 0.0016;

      beaconAngle += 0.018;
      orbitBeacon.position.set(
        Math.cos(beaconAngle) * ringRadius,
        Math.sin(beaconAngle) * ringRadius,
        Math.sin(beaconAngle * 3) * 0.12
      );

      // Pulsación de halos de nodos
      const time = performance.now() * 0.003;
      nodeMarkers.forEach(({ halo, node }, idx) => {
        const pulse = 1 + Math.sin(time + idx * 1.2) * 0.22;
        halo.scale.set(pulse, pulse, pulse);
        if (activeLevel && node.id === activeLevel) {
          halo.scale.set(pulse * 1.5, pulse * 1.5, pulse * 1.5);
        }
      });

      // Rotación suave del polvo estelar espacial
      cosmicDust.rotation.y += 0.0004;

      renderer.render(scene, camera);
    };

    renderLoop();

    // ── 10. Limpieza en Desmontaje ───────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('click', onClick);

      surfaceTexture.dispose();
      cloudTexture.dispose();
      planetGeometry.dispose();
      planetMaterial.dispose();
      cloudGeometry.dispose();
      cloudMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      ringGeo.dispose();
      ringMat1.dispose();
      ringMat2.dispose();
      pinGeo.dispose();
      haloGeo.dispose();
      beaconGeometry.dispose();
      beaconMaterial.dispose();

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
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        maxWidth: '100%',
      }}
    >
      {/* Tooltip contextual cinematográfico */}
      {activeTooltip && (
        <div
          style={{
            position: 'absolute',
            left: activeTooltip.x + 14,
            top: activeTooltip.y - 14,
            background: 'rgba(10, 14, 28, 0.94)',
            border: `1px solid ${activeTooltip.node.color}`,
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            color: '#f8fafc',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65)',
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
            bottom: '8px',
            padding: '4px 12px',
            borderRadius: '99px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            fontSize: '0.75rem',
            color: '#c084fc',
            backdropFilter: 'blur(8px)',
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
