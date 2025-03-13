// Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true }); // Enable antialiasing
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('scene').appendChild(renderer.domElement);

// Stars Container
const starsContainer = new THREE.Group();
scene.add(starsContainer);

// Info Panel
const infoPanel = document.getElementById('info-panel');
const infoContent = document.getElementById('info-content');
const closeBtn = document.getElementById('close-btn');

// Variables for Mouse Interaction
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
let rotationX = 0;
let rotationY = 0;

// Zoom Variables
let targetFOV = 75; // Target field of view for smooth zooming
const zoomSpeed = 1; // Speed of zooming
const zoomDamping = 0.1; // Smoothing factor for zooming

// Add a Light Source
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);

// Function to Generate a Random Shade of Gray
function getRandomGray() {
  const brightness = Math.floor(Math.random() * 155) + 100; // Range: 100-255
  return `rgb(${brightness}, ${brightness}, ${brightness})`;
}

// Function to Normalize Values for Size and Distance
function normalize(value, min, max, newMin, newMax) {
  return ((value - min) / (max - min)) * (newMax - newMin) + newMin;
}

// Function to Create a Star/Planet
function createStar(star, minRadius, maxRadius, minDistance, maxDistance) {
  const size = normalize(star.pl_radius, minRadius, maxRadius, 0.2, 2); // Larger size range
  const distance = normalize(star.to_star_distance, minDistance, maxDistance, 50, 200); // Larger distance range

  const geometry = new THREE.SphereGeometry(size, 64, 64); // Higher resolution
  const material = new THREE.MeshBasicMaterial({ color: getRandomGray() });
  const sphere = new THREE.Mesh(geometry, material);

  const theta = Math.random() * Math.PI * 2; // Random angle for horizontal placement
  const phi = Math.random() * Math.PI; // Random angle for vertical placement

  sphere.position.x = distance * Math.sin(phi) * Math.cos(theta);
  sphere.position.y = distance * Math.sin(phi) * Math.sin(theta);
  sphere.position.z = distance * Math.cos(phi);

  sphere.userData = star; // Store star data for click events

  starsContainer.add(sphere);
}

// Create the Solar System at the Center
const solarSystemGeometry = new THREE.SphereGeometry(5, 64, 64); // Larger and higher resolution
const solarSystemMaterial = new THREE.MeshBasicMaterial({ color: 0xff8c42 }); // Yellowish-orange
const solarSystem = new THREE.Mesh(solarSystemGeometry, solarSystemMaterial);
solarSystem.position.set(0, 0, 0); // Center of the scene
scene.add(solarSystem);

// Add Click Event to the Solar System
solarSystem.userData = {
  pl_name: "Solar System",
  host_star: "Sun",
  st_spectype: "G2 V",
  pl_orbital_period: 365.25,
  pl_radius: 109, // Relative to Earth
  pl_mass: 333000, // Relative to Earth
  to_star_distance: 0,
  equilibrium_temperature_pl: 5778,
  star_effective_temperature: 5778,
  st_mass: 1
};

solarSystem.onClick = () => {
  infoContent.innerHTML = `
    <h2>Solar System</h2>
    <p><strong>Host Star:</strong> Sun</p>
    <p><strong>Star Spectral Type:</strong> G2 V</p>
    <p><strong>Orbital Period:</strong> 365.25 days</p>
    <p><strong>Planet Radius:</strong> 109 Earth radii</p>
    <p><strong>Planet Mass:</strong> 333,000 Earth masses</p>
    <p><strong>Distance to Star:</strong> 0 light-years</p>
    <p><strong>Equilibrium Temperature:</strong> 5778 K</p>
    <p><strong>Star Effective Temperature:</strong> 5778 K</p>
    <p><strong>Star Mass:</strong> 1 Solar mass</p>
  `;
  infoPanel.classList.add('open');
};

// Fetch Data from info.json
fetch('info.json')
  .then(response => response.text())
  .then(data => {
    const starsData = data
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => JSON.parse(line));

    // Calculate Min and Max Values for Radius and Distance
    const radii = starsData.map(star => star.pl_radius);
    const distances = starsData.map(star => star.to_star_distance);
    const minRadius = Math.min(...radii);
    const maxRadius = Math.max(...radii);
    const minDistance = Math.min(...distances);
    const maxDistance = Math.max(...distances);

    // Create Stars/Planets from the Data
    starsData.forEach(star => createStar(star, minRadius, maxRadius, minDistance, maxDistance));
  })
  .catch(error => {
    console.error('Error loading or parsing the JSON file:', error);
  });

// Handle Click Events on Stars and Solar System
renderer.domElement.addEventListener('click', (event) => {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects([...starsContainer.children, solarSystem]);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    if (object === solarSystem) {
      solarSystem.onClick();
    } else {
      const star = object.userData;
      infoContent.innerHTML = `
        <h2>${star.pl_name}</h2>
        <p><strong>Host Star:</strong> ${star.host_star}</p>
        <p><strong>Star Spectral Type:</strong> ${star.st_spectype || 'N/A'}</p>
        <p><strong>Orbital Period:</strong> ${star.pl_orbital_period} days</p>
        <p><strong>Planet Radius:</strong> ${star.pl_radius} Earth radii</p>
        <p><strong>Planet Mass:</strong> ${star.pl_mass} Earth masses</p>
        <p><strong>Distance to Star:</strong> ${star.to_star_distance} light-years</p>
        <p><strong>Equilibrium Temperature:</strong> ${star.equilibrium_temperature_pl} K</p>
        <p><strong>Star Effective Temperature:</strong> ${star.star_effective_temperature} K</p>
        <p><strong>Star Mass:</strong> ${star.st_mass} Solar masses</p>
      `;
      infoPanel.classList.add('open');
    }
  }
});

// Close Button for the Info Panel
closeBtn.addEventListener('click', () => {
  infoPanel.classList.remove('open');
});

// Handle Mouse Drag to Rotate the Scene
renderer.domElement.addEventListener('mousedown', (e) => {
  isDragging = true;
  previousMouseX = e.clientX;
  previousMouseY = e.clientY;
});

renderer.domElement.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const deltaX = e.clientX - previousMouseX;
    const deltaY = e.clientY - previousMouseY;

    rotationY += deltaX * 0.005;
    rotationX += deltaY * 0.005;

    starsContainer.rotation.x = rotationX;
    starsContainer.rotation.y = rotationY;

    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
  }
});

renderer.domElement.addEventListener('mouseup', () => {
  isDragging = false;
});

renderer.domElement.addEventListener('mouseleave', () => {
  isDragging = false;
});

// Handle Zoom In/Out with Mouse Wheel
renderer.domElement.addEventListener('wheel', (event) => {
  event.preventDefault();
  if (event.deltaY < 0) {
    // Zoom in
    targetFOV -= zoomSpeed;
  } else {
    // Zoom out
    targetFOV += zoomSpeed;
  }
  // Clamp the FOV to reasonable values
  targetFOV = Math.max(10, Math.min(100, targetFOV));
});

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // Smoothly interpolate the FOV
  camera.fov += (targetFOV - camera.fov) * zoomDamping;
  camera.updateProjectionMatrix();

  renderer.render(scene, camera);
}

// Move the camera farther away
camera.position.z = 150; // Increased from 100 to 200
animate();

// Handle Window Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});