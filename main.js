import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, 1, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 6;
controls.maxDistance = 10;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.7;
controls.autoRotate = false;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();

// Front Spot Light
const frontSpotLight = new THREE.SpotLight(0xffffff, 800);
frontSpotLight.position.set(10, 20, 10);
frontSpotLight.castShadow = true;
frontSpotLight.shadow.bias = -0.1;
frontSpotLight.shadow.mapSize.width = 2048;
frontSpotLight.shadow.mapSize.height = 2048;
scene.add(frontSpotLight);

// Rear Spot Light
const rearSpotLight = new THREE.SpotLight(0xffffff, 1000);
rearSpotLight.position.set(-10, 20, -10);
rearSpotLight.castShadow = true;
rearSpotLight.shadow.bias = -0.1;
rearSpotLight.shadow.mapSize.width = 2048;
rearSpotLight.shadow.mapSize.height = 2048;
scene.add(rearSpotLight);

// Left Spotlight
const leftSpotLight = new THREE.SpotLight(0xffffff, 100);
leftSpotLight.position.set(-10, 5, 0);
leftSpotLight.target.position.set(0, 0, 0);
leftSpotLight.castShadow = true;
scene.add(leftSpotLight);
scene.add(leftSpotLight.target);

// Right Spotlight
const rightSpotLight = new THREE.SpotLight(0xffffff, 100);
rightSpotLight.position.set(10, 5, 0);
rightSpotLight.target.position.set(0, 0, 0);
rightSpotLight.castShadow = true;
scene.add(rightSpotLight);
scene.add(rightSpotLight.target);

// Ambient Light
const ambientLight = new THREE.AmbientLight(0x404040, 3);
scene.add(ambientLight);

// Directional Light
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.bias = -0.000001;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Create a ground plane
const groundGeometry = new THREE.PlaneGeometry(500, 500);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1;
ground.receiveShadow = true;
scene.add(ground);

// Load Textures
const textureLoader = new THREE.TextureLoader();
const carBodyTexture = textureLoader.load('public/textures/emblem_baseColor.png');
const carWheelTexture = textureLoader.load('public/textures/Grille1_Material_baseColor.png');
const carInteriorTexture = textureLoader.load('public/textures/Light_Material_baseColor.png');
const carGlassTexture = textureLoader.load('public/textures/Light_Material_baseColor.png');

// Load Model
const loader = new GLTFLoader().setPath('public/');
loader.load('bugatti_chiron.glb', (gltf) => {
  console.log('loading model');
  const mesh = gltf.scene;

  mesh.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Apply textures based on the part of the car
      if (child.name.includes('Body')) {
        child.material = new THREE.MeshStandardMaterial({
          map: carBodyTexture,
          roughness: 0.5,
          metalness: 0.8
        });
      } else if (child.name.includes('Wheel')) {
        child.material = new THREE.MeshStandardMaterial({
          map: carWheelTexture,
          roughness: 0.5,
          metalness: 0.8
        });
      } else if (child.name.includes('Interior')) {
        child.material = new THREE.MeshStandardMaterial({
          map: carInteriorTexture,
          roughness: 0.5,
          metalness: 0.8
        });
      } else if (child.name.includes('Glass')) {
        child.material = new THREE.MeshStandardMaterial({
          map: carGlassTexture,
          roughness: 0.1,
          metalness: 0.5,
          transparent: true,
          opacity: 0.5
        });
      }
    }
  });

  mesh.position.set(0, -1, -1);
  scene.add(mesh);

  document.getElementById('progress-container').style.display = 'none';
}, (xhr) => {
  console.log(`loading ${xhr.loaded / xhr.total * 100}%`);
}, (error) => {
  console.error(error);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/**
 * @type {Object<string, string>}
 */
const explanations = {
  front: "This is the front of the Bugatti Chiron. The front houses the distinctive horseshoe grille and the iconic Bugatti logo.",
  back: "This is the back of the Bugatti Chiron. The back features the car's powerful exhaust system and signature rear lights.",
  top: "This is the top view of the Bugatti Chiron. The top showcases the aerodynamic design and the streamlined roof.",
  engine: "This is the engine of the Bugatti Chiron. The engine is a quad-turbocharged W16 that produces an incredible 1,479 horsepower.",
  wheels: "These are the wheels of the Bugatti Chiron. The wheels are made from lightweight materials and designed for high performance."
};

/**
 * Smoothly moves the camera to a new position.
 * @param {THREE.Vector3} newPosition - The new position to move the camera to.
 * @param {number} duration - The duration of the animation in milliseconds.
 * @param {function} callback - A callback function to be called after the animation completes.
 */
function animateCamera(newPosition, duration, callback) {
  const startPosition = camera.position.clone();
  const distance = startPosition.distanceTo(newPosition);
  const startTime = performance.now();

  function update() {
    const currentTime = performance.now();
    const elapsedTime = currentTime - startTime;
    const t = Math.min(elapsedTime / duration, 1);

    camera.position.lerpVectors(startPosition, newPosition, t);
    camera.lookAt(new THREE.Vector3(0, 1, 0));
    controls.update();

    if (t < 1) {
      requestAnimationFrame(update);
    } else if (callback) {
      callback();
    }
  }

  update();
}

/**
 * Focuses the camera on a specific part of the car and displays the explanation.
 * @param {string} part - The part of the car to focus on.
 */
function focusOnPart(part) {
  const explanationDiv = document.getElementById('explanation');
  let newPosition = new THREE.Vector3();
  let x = 0, y = 0;

  switch (part) {
    case 'front':
      newPosition.set(0, 1, 6);
      x = window.innerWidth / 2 - 150; // Adjust as necessary
      y = window.innerHeight / 2;
      break;
    case 'back':
      newPosition.set(0, 0, -7);
      x = window.innerWidth / 2 - 150; // Adjust as necessary
      y = window.innerHeight / 2;
      break;
    case 'top':
      newPosition.set(0, 6, 0);
      x = window.innerWidth / 2 - 150; // Adjust as necessary
      y = window.innerHeight / 2 - 200;
      break;
    case 'engine':
      newPosition.set(0, 1.5, -3);
      x = window.innerWidth / 2 - 150; // Adjust as necessary
      y = window.innerHeight / 2;
      break;
    case 'wheels':
      newPosition.set(3, 1, 0);
      x = window.innerWidth / 2 - 150; // Adjust as necessary
      y = window.innerHeight / 2;
      break;
  }

  animateCamera(newPosition, 1000, () => {
    // Update and show the explanation
    explanationDiv.textContent = explanations[part];
    explanationDiv.style.left = `${x}px`;
    explanationDiv.style.top = `${y}px`;
    explanationDiv.classList.remove('hidden');
  });
}

document.querySelectorAll('.spec-item').forEach(item => {
  item.addEventListener('click', function () {
    const part = this.getAttribute('data-part');
    focusOnPart(part);
  });
});

// Add an event listener to detect user interaction and hide the explanation
controls.addEventListener('start', () => {
  document.getElementById('explanation').classList.add('hidden');
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
