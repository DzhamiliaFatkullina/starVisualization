const scene = document.getElementById('scene');
const starsContainer = document.getElementById('stars-container');
const solarSystem = document.getElementById('solar-system');
const infoPanel = document.getElementById('info-panel');
const infoContent = document.getElementById('info-content');
const closeBtn = document.getElementById('close-btn');

let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
let rotationX = 0;
let rotationY = 0;

// Function to generate a random shade of gray
function getRandomGray() {
  const brightness = Math.floor(Math.random() * 155) + 100; // Range: 100-255
  return `rgb(${brightness}, ${brightness}, ${brightness})`;
}

// Function to normalize values for size and distance
function normalize(value, min, max, newMin, newMax) {
  return ((value - min) / (max - min)) * (newMax - newMin) + newMin;
}

// Function to create a star/planet dot
function createStar(star, minRadius, maxRadius, minDistance, maxDistance) {
  const starElement = document.createElement('div');
  starElement.className = 'star';

  // Set size based on planet radius (scaled down for visualization)
  const size = normalize(star.pl_radius, minRadius, maxRadius, 5, 50); // Size between 5px and 50px
  starElement.style.width = `${size}px`;
  starElement.style.height = `${size}px`;

  // Set random shade of gray
  starElement.style.backgroundColor = getRandomGray();

  // Position the star on a 3D sphere
  const distance = normalize(star.to_star_distance, minDistance, maxDistance, 100, 300); // Distance between 100px and 300px
  const theta = Math.random() * Math.PI * 2; // Random angle for horizontal placement
  const phi = Math.random() * Math.PI; // Random angle for vertical placement

  const x = distance * Math.sin(phi) * Math.cos(theta);
  const y = distance * Math.sin(phi) * Math.sin(theta);
  const z = distance * Math.cos(phi);

  starElement.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;

  // Add click event to show info
  starElement.addEventListener('click', () => {
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
    infoPanel.style.transform = 'translateX(0)';
  });

  starsContainer.appendChild(starElement);
}

// Add click event to the solar system
solarSystem.addEventListener('click', () => {
  infoContent.innerHTML = `
    <h2>Solar System</h2>
    <p><strong>Star:</strong> Sun</p>
    <p><strong>Star Type:</strong> G2 V</p>
    <p><strong>Number of Planets:</strong> 8</p>
    <p><strong>Distance to Center of Galaxy:</strong> 26,000 light-years</p>
  `;
  infoPanel.style.transform = 'translateX(0)';
});

// Close button for the info panel
closeBtn.addEventListener('click', () => {
  infoPanel.style.transform = 'translateX(100%)';
});

// Fetch data from info.json
fetch('info.json')
  .then(response => response.text()) // Read the file as text
  .then(data => {
    // Split the file into lines
    const lines = data.split('\n').filter(line => line.trim() !== '');

    // Parse each line as a JSON object
    const starsData = lines.map(line => JSON.parse(line));

    // Calculate min and max values for radius and distance
    const radii = starsData.map(star => star.pl_radius);
    const distances = starsData.map(star => star.to_star_distance);
    const minRadius = Math.min(...radii);
    const maxRadius = Math.max(...radii);
    const minDistance = Math.min(...distances);
    const maxDistance = Math.max(...distances);

    // Create stars/planets from the data
    starsData.forEach(star => createStar(star, minRadius, maxRadius, minDistance, maxDistance));
  })
  .catch(error => {
    console.error('Error loading or parsing the JSON file:', error);
  });

// Make the 3D scene rotatable
scene.addEventListener('mousedown', (e) => {
  isDragging = true;
  previousMouseX = e.clientX;
  previousMouseY = e.clientY;
});

scene.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const deltaX = e.clientX - previousMouseX;
    const deltaY = e.clientY - previousMouseY;

    rotationY += deltaX * 0.5;
    rotationX += deltaY * 0.5;

    starsContainer.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;

    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
  }
});

scene.addEventListener('mouseup', () => {
  isDragging = false;
});

scene.addEventListener('mouseleave', () => {
  isDragging = false;
});