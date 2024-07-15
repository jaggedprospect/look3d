let scene, camera, renderer, controls, directionalLight, boundingBox;
let model;
let initialCameraPosition, initialTarget;

function init() {
    const container = document.getElementById('container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaaaaa);  // Default background color

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;  // Enable damping (inertia)
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;  // Don't allow panning in screen space
    controls.minDistance = 1;
    controls.maxDistance = 500;

    // Add directional light
    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 10, 10).normalize();
    scene.add(directionalLight);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    // Load GLTF model
    const loader = new THREE.GLTFLoader();
    loader.load('models/kate_pc_size_ref.glb', function(gltf) {
        model = gltf.scene;
        scene.add(model);

        // Add bounding box to the model
        boundingBox = new THREE.BoxHelper(model, 0xffff00);
        scene.add(boundingBox);

        // Fit camera to model
        const box3 = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box3.getSize(size);
        const center = new THREE.Vector3();
        box3.getCenter(center);

        controls.target.copy(center);
        camera.position.set(center.x, center.y, size.z * 2);

        // Set max/min distance for zoom based on model size
        controls.maxDistance = size.length() * 10;
        controls.minDistance = size.length() / 10;

        // Store initial camera position and target
        initialCameraPosition = camera.position.clone();
        initialTarget = controls.target.clone();

        controls.update();
    }, undefined, function(error) {
        console.error('An error happened', error);
    });

    window.addEventListener('resize', onWindowResize, false);

    createUI();

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

    renderer.render(scene, camera);
}

function createUI() {
    const uiContainer = document.createElement('div');
    uiContainer.id = 'uiContainer';
    uiContainer.className = 'container-fluid';
    document.body.appendChild(uiContainer);

    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';

    // Graphics settings
    const graphicsSelect = document.createElement('select');
    graphicsSelect.id = 'graphicsSettings';
    graphicsSelect.className = 'form-control';
    graphicsSelect.innerHTML = `
        <option value="low">Low Graphics</option>
        <option value="average" selected>Average Graphics</option>
        <option value="fancy">Fancy Graphics</option>
    `;
    graphicsSelect.addEventListener('change', () => setGraphics(graphicsSelect.value));
    formGroup.appendChild(graphicsSelect);

    // Toggle light button
    const toggleLightButton = document.createElement('button');
    toggleLightButton.id = 'toggleLightButton';
    toggleLightButton.className = 'btn btn-primary mt-2';
    toggleLightButton.textContent = 'Toggle Exposure Light';
    toggleLightButton.addEventListener('click', toggleLight);
    formGroup.appendChild(toggleLightButton);

    // Light intensity range
    const lightIntensityRange = document.createElement('input');
    lightIntensityRange.type = 'range';
    lightIntensityRange.id = 'lightIntensity';
    lightIntensityRange.min = 0;
    lightIntensityRange.max = 2;
    lightIntensityRange.step = 0.1;
    lightIntensityRange.value = 1;
    lightIntensityRange.className = 'form-control mt-2';
    lightIntensityRange.addEventListener('input', () => updateLightIntensity(lightIntensityRange.value));
    formGroup.appendChild(lightIntensityRange);

    // Background color radio buttons
    const radioGroup = document.createElement('div');
    radioGroup.className = 'form-group mt-2';
    radioGroup.innerHTML = `
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="backgroundColor" id="lightBackground" value="0xaaaaaa" checked>
            <label class="form-check-label" for="lightBackground">Light Background</label>
        </div>
        <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="backgroundColor" id="darkBackground" value="0x444444">
            <label class="form-check-label" for="darkBackground">Dark Background</label>
        </div>
    `;
    radioGroup.addEventListener('change', (event) => setBackgroundColor(event.target.value));
    formGroup.appendChild(radioGroup);

    // Toggle bounding box button
    const toggleBoundingBoxButton = document.createElement('button');
    toggleBoundingBoxButton.id = 'toggleBoundingBoxButton';
    toggleBoundingBoxButton.className = 'btn btn-primary mt-2';
    toggleBoundingBoxButton.textContent = 'Toggle Bounding Box';
    toggleBoundingBoxButton.addEventListener('click', toggleBoundingBox);
    formGroup.appendChild(toggleBoundingBoxButton);

    // Reset camera button
    const resetCameraButton = document.createElement('button');
    resetCameraButton.id = 'resetCameraButton';
    resetCameraButton.className = 'btn btn-primary mt-2';
    resetCameraButton.textContent = 'Reset Camera';
    resetCameraButton.addEventListener('click', resetCamera);
    formGroup.appendChild(resetCameraButton);

    uiContainer.appendChild(formGroup);

    // Toggle menu button
    const toggleMenuButton = document.createElement('button');
    toggleMenuButton.id = 'toggleMenuButton';
    toggleMenuButton.className = 'btn btn-secondary';
    toggleMenuButton.innerHTML = '&#9668;'; // left arrow
    toggleMenuButton.style.position = 'absolute';
    toggleMenuButton.style.bottom = '-15px';
    toggleMenuButton.style.right = '-15px';
    toggleMenuButton.style.borderRadius = '50%';
    uiContainer.appendChild(toggleMenuButton);

    // Event listener for toggle menu button
    toggleMenuButton.addEventListener('click', () => {
        uiContainer.classList.toggle('hidden');
        if (uiContainer.classList.contains('hidden')) {
            toggleMenuButton.innerHTML = '&#9658;'; // right arrow
        } else {
            toggleMenuButton.innerHTML = '&#9668;'; // left arrow
        }
    });
}

function setGraphics(level) {
    switch(level) {
        case 'low':
            renderer.setPixelRatio(0.5);
            break;
        case 'average':
            renderer.setPixelRatio(window.devicePixelRatio);
            break;
        case 'fancy':
            renderer.setPixelRatio(2);
            break;
    }
}

function toggleLight() {
    directionalLight.visible = !directionalLight.visible;
    document.getElementById('toggleLightButton').classList.toggle('active', directionalLight.visible);
}

function updateLightIntensity(value) {
    directionalLight.intensity = value;
}

function setBackgroundColor(color) {
    scene.background = new THREE.Color(parseInt(color));
}

function toggleBoundingBox() {
    boundingBox.visible = !boundingBox.visible;
    document.getElementById('toggleBoundingBoxButton').classList.toggle('active', boundingBox.visible);
}

function resetCamera() {
    camera.position.copy(initialCameraPosition);
    controls.target.copy(initialTarget);
    controls.update();
}

init();