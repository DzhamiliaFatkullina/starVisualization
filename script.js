// Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true }); // Enable antialiasing
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('scene').appendChild(renderer.domElement);

// CSS2D Renderer for Labels
const labelRenderer = new THREE.CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none'; // Ensure labels don't block clicks
document.getElementById('labels').appendChild(labelRenderer.domElement);

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

// Selected Object
let selectedObject = null;

// Add a Light Source
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);

function createSunComparisonChart(container, temperature, starName) {
  if (allStarsData.length === 0) return;

  // Calculate min and max temperatures from the data
  const temperatures = allStarsData.map(star => star.star_effective_temperature).filter(t => t);
  const minTemp = Math.min(...temperatures);
  const maxTemp = Math.max(...temperatures);
  
  // Find the hottest and coldest stars
  const coldestStar = allStarsData.reduce((prev, current) => 
    (prev.star_effective_temperature < current.star_effective_temperature) ? prev : current);
  const hottestStar = allStarsData.reduce((prev, current) => 
    (prev.star_effective_temperature > current.star_effective_temperature) ? prev : current);

  const sunTemp = 5778; // Sun's effective temperature in Kelvin
  const currentTemp = temperature || sunTemp * 0.8;
  
  const data = [
    { name: "Sun", value: sunTemp, label: `Sun (${sunTemp}K)` },
    { name: starName, value: currentTemp, label: `${starName} (${Math.round(currentTemp)}K)` },
    { name: coldestStar.host_star, value: minTemp, label: `${coldestStar.host_star} (${minTemp}K)` },
    { name: hottestStar.host_star, value: maxTemp, label: `${hottestStar.host_star} (${maxTemp}K)` }
  ];

  const width = 300;
  const height = 180;
  const margin = { top: 40, right: 20, bottom: 50, left: 50 };

  const svg = d3.select(container)
    .html('')
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "transparent");

  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "white")
    .text("Temperature Comparison (Kelvin)");

  // Color scale from blue (cold) to red (hot)
  const colorScale = d3.scaleSequential(d3.interpolatePlasma)
    .domain([minTemp * 0.9, maxTemp * 1.1]);

  // Create bars
  const x = d3.scaleBand()
    .domain(data.map(d => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, maxTemp * 1.1])
    .range([height - margin.bottom, margin.top]);

  svg.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.name))
    .attr("y", d => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", d => height - margin.bottom - y(d.value))
    .attr("fill", d => colorScale(d.value))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1);

  // Add value labels on top of bars
  svg.selectAll(".bar-label")
    .data(data)
    .join("text")
    .attr("class", "bar-label")
    .attr("x", d => x(d.name) + x.bandwidth() / 2)
    .attr("y", d => y(d.value) - 5)
    .attr("text-anchor", "middle")
    .text(d => d.label)
    .style("fill", "white")
    .style("font-size", "10px")
    .style("font-weight", "bold");

  // Add axes with white text
  const xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .call(g => g.select(".domain").attr("stroke", "white"))
    .call(g => g.selectAll(".tick line").attr("stroke", "white"))
    .call(g => g.selectAll(".tick text").style("fill", "white"));

  const yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .call(g => g.select(".domain").attr("stroke", "white"))
    .call(g => g.selectAll(".tick line").attr("stroke", "white"))
    .call(g => g.selectAll(".tick text").style("fill", "white"));

  svg.append("g").call(xAxis);
  svg.append("g").call(yAxis);
}

function createSizeComparisonChart(container, radius, planetName) {
  const earthRadius = 1;
  const sunRadius = 109; // Sun radius in Earth units
  
  const data = [
    { name: "Earth", value: earthRadius, color: "#1a75ff" },
    { name: planetName || "Planet", value: radius || earthRadius * 2, color: "#cccccc" },
    { name: "Sun", value: sunRadius, color: "#ff8c42" }
  ];

  const width = 300;
  const height = 180;
  const margin = { top: 30, right: 20, bottom: 40, left: 50 };

  const svg = d3.select(container)
    .html('') // Clear previous content
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("class", "visualization-title")
    .text("Size Comparison (Earth radii)");

  // Create circles with logarithmic scale for better visualization
  const radiusScale = d3.scaleLinear()
    .domain([0, 110])
    .range([5, 60]);

  const x = d3.scaleBand()
    .domain(data.map(d => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.3);

  svg.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.name) + x.bandwidth() / 2)
    .attr("cy", height / 2)
    .attr("r", d => radiusScale(d.value))
    .attr("fill", d => d.color)
    .attr("stroke", "#fff")
    .attr("stroke-width", 1);

  // Add Earth texture pattern
  svg.append("defs")
    .append("pattern")
    .attr("id", "earth-pattern")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 16)
    .attr("height", 16)
    .append("path")
    .attr("d", "M 0 0 L 16 0 16 16 0 16 Z")
    .attr("fill", "#1a75ff")
    .attr("stroke", "#0d47a1")
    .attr("stroke-width", 0.5);

  // Add labels
  svg.selectAll(".size-label")
    .data(data)
    .join("text")
    .attr("class", "size-label")
    .attr("x", d => x(d.name) + x.bandwidth() / 2)
    .attr("y", height - 20)
    .attr("text-anchor", "middle")
    .text(d => `${d.name}\n(${d.value}× Earth)`)
    .attr("fill", "white")
    .attr("font-size", "10px");

  // Add axes
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("fill", "white");
}

function getRandomGray() {
  const brightness = Math.floor(Math.random() * 155) + 100; // Range: 100-255
  return `rgb(${brightness}, ${brightness}, ${brightness})`;
}

function normalize(value, min, max, newMin, newMax) {
  return ((value - min) / (max - min)) * (newMax - newMin) + newMin;
}

function createStar(star, minRadius, maxRadius, minDistance, maxDistance) {
  const size = normalize(star.pl_radius, minRadius, maxRadius, 0.2, 2); 
  const distance = normalize(star.to_star_distance, minDistance, maxDistance, 50, 200); 

  const geometry = new THREE.SphereGeometry(size, 64, 64); // Higher resolution
  const material = new THREE.MeshBasicMaterial({ color: getRandomGray() });
  const sphere = new THREE.Mesh(geometry, material);

  const theta = Math.random() * Math.PI * 2; // Random angle for horizontal placement
  const phi = Math.random() * Math.PI; // Random angle for vertical placement

  sphere.position.x = distance * Math.sin(phi) * Math.cos(theta);
  sphere.position.y = distance * Math.sin(phi) * Math.sin(theta);
  sphere.position.z = distance * Math.cos(phi);

  sphere.userData = star; // Attach the star data to the sphere

  const label = new THREE.CSS2DObject(createLabelElement(star.pl_name));
  label.position.set(0, size + 0.5, 0); // Position the label above the sphere
  label.visible = false; // Hide the label initially
  sphere.add(label);

  starsContainer.add(sphere);
}

function createLabelElement(text) {
  const div = document.createElement('div');
  div.className = 'label';
  div.textContent = text;
  return div;
}

// Create the Solar System at the Center
const solarSystemGeometry = new THREE.SphereGeometry(5, 64, 64); 
const solarSystemMaterial = new THREE.MeshBasicMaterial({ color: 0xff8c42 });
const solarSystem = new THREE.Mesh(solarSystemGeometry, solarSystemMaterial);
solarSystem.position.set(0, 0, 0);
scene.add(solarSystem);

const solarSystemLabel = new THREE.CSS2DObject(createLabelElement("Solar System"));
solarSystemLabel.position.set(0, 6, 0); // Position the label above the solar system
solarSystemLabel.visible = false; 
solarSystem.add(solarSystemLabel);

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
  // Clear previous visualizations
  d3.select("#sun-comparison").selectAll("*").remove();
  d3.select("#size-comparison").selectAll("*").remove();
  
  // Create new visualizations
  createSunComparisonChart("#sun-comparison", 5778, "Sun");
  createSizeComparisonChart("#size-comparison", 109, "Sun", "Solar System");
  
  infoPanel.classList.add('open');
};

fetch('info.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.text();
  })
  .then(data => {
    // Parse the data and store in allStarsData
    allStarsData = data
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          console.error('Error parsing line:', line);
          return null;
        }
      })
      .filter(star => star !== null); // Filter out any null entries from failed parsing

    // Calculate Min and Max Values for Radius and Distance
    const radii = allStarsData.map(star => star.pl_radius).filter(r => !isNaN(r));
    const distances = allStarsData.map(star => star.to_star_distance).filter(d => !isNaN(d));
    
    // Handle case where arrays might be empty
    const minRadius = radii.length ? Math.min(...radii) : 1;
    const maxRadius = radii.length ? Math.max(...radii) : 10;
    const minDistance = distances.length ? Math.min(...distances) : 1;
    const maxDistance = distances.length ? Math.max(...distances) : 100;

    // Create Stars/Planets from the Data
    allStarsData.forEach(star => {
      createStar(star, minRadius, maxRadius, minDistance, maxDistance);
    });

    console.log('Loaded', allStarsData.length, 'stars');
    console.log('Temperature range:', 
      Math.min(...allStarsData.map(s => s.star_effective_temperature).filter(t => t)), 
      'to',
      Math.max(...allStarsData.map(s => s.star_effective_temperature).filter(t => t))
    );
  })
  .catch(error => {
    console.error('Error loading or parsing the JSON file:', error);
    // Initialize with empty array if there's an error
    allStarsData = [];
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

    // Deselect the previously selected object
    if (selectedObject) {
      selectedObject.material.color.set(selectedObject.userData.originalColor || 0xffffff);
      selectedObject.children[0].visible = false; // Hide the previous label
    }

    // Select the new object
    selectedObject = object;
    selectedObject.userData.originalColor = selectedObject.material.color.getHex();

    // Change color when selected
    if (object === solarSystem) {
      selectedObject.material.color.set(0xffd700);
    } else {
      selectedObject.material.color.set(0x1e90ff);
    }

    // Show the label for the selected object
    selectedObject.children[0].visible = true;

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
      // Clear previous visualizations
      d3.select("#sun-comparison").selectAll("*").remove();
      d3.select("#size-comparison").selectAll("*").remove();
      
      // Create new visualizations
      createSunComparisonChart("#sun-comparison", star.star_effective_temperature);
      createSizeComparisonChart("#size-comparison", star.pl_radius);
      
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
  labelRenderer.render(scene, camera); // Render CSS2D labels
}

// Move the camera farther away
camera.position.z = 150; // Increased from 100 to 200
animate();

// Handle Window Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});