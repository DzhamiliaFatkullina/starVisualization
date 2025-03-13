const visualization = document.getElementById('visualization');
const infoPanel = document.getElementById('info-panel');

// Create the solar system (red dot)
const solarSystem = document.createElement('div');
solarSystem.className = 'solar-system';
visualization.appendChild(solarSystem);

// Function to normalize values for size and distance
function normalize(value, min, max, newMin, newMax) {
  return ((value - min) / (max - min)) * (newMax - newMin) + newMin;
}

// Function to create a star/planet dot
function createStar(star, minRadius, maxRadius, minDistance, maxDistance) {
  const starElement = document.createElement('div');
  starElement.className = 'star';

  // Normalize the planet radius for size (scaled to a reasonable range)
  const size = normalize(star.pl_radius, minRadius, maxRadius, 5, 50); // Size between 5px and 50px
  starElement.style.width = `${size}px`;
  starElement.style.height = `${size}px`;

  // Normalize the distance from the solar system (scaled to a reasonable range)
  const distance = normalize(star.to_star_distance, minDistance, maxDistance, 10, 90); // Distance between 10% and 90%
  const angle = Math.random() * 2 * Math.PI; // Random angle for placement
  starElement.style.left = `${50 + distance * Math.cos(angle)}%`;
  starElement.style.top = `${50 + distance * Math.sin(angle)}%`;

  // Add click event to show info
  starElement.addEventListener('click', () => {
    infoPanel.innerHTML = `
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
  });

  visualization.appendChild(starElement);
}

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