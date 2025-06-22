import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { photoData } from 'photo-data';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';

let scene, camera, renderer, photoGroup, eyeModel;
let composer, glitchPass, controls, bloomPass;
const clock = new THREE.Clock();
let sceneReady = false;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Experience tracking
const visitedPhotos = new Set();
let totalXp = 0;
const maxTotalXp = photoData.reduce((sum, photo) => sum + photo.stats.human_experience, 0);
let dialogueTimeout;

// Game state
let gameStarted = false;
let isZoomed = false;
let zoomedPhoto = null;
let hoveredPhoto = null;
let originalCameraPosition = new THREE.Vector3();
let originalCameraRotation = new THREE.Euler();
let autoRotate = true;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 80; // Further back to see larger photos

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // Add orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 40;  // Adjusted for larger photos
    controls.maxDistance = 150; // Adjusted for larger scene
    controls.maxPolarAngle = Math.PI;
    
    // Post-processing
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.21;
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.55;
    composer.addPass(bloomPass);

    const filmPass = new FilmPass(0.35, 0.025, 648, false);
    composer.addPass(filmPass);

    glitchPass = new GlitchPass();
    composer.addPass(glitchPass);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    camera.add(pointLight);
    scene.add(camera);

    // Central Object (Eye)
    const loader = new GLTFLoader();
    loader.load('assets/textured_mesh.glb', (gltf) => {
        eyeModel = gltf.scene;
        eyeModel.scale.set(10, 10, 10);
        scene.add(eyeModel);

        // Photo Planes (Load after the central object is loaded)
        createPhotoPlanes();

    }, undefined, (error) => {
        console.error('An error happened while loading the eye model:', error);
        // Fallback to a simple sphere if model fails to load
        const eyeGeometry = new THREE.SphereGeometry(4, 32, 32);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
        eyeModel = new THREE.Mesh(eyeGeometry, eyeMaterial);
        scene.add(eyeModel);
        createPhotoPlanes();
    });
    
    // Function to create photo planes
    function createPhotoPlanes() {
        const textureLoader = new THREE.TextureLoader();
        const planeGeometry = new THREE.PlaneGeometry(15, 15); // 3x bigger
        const planes = [];
        photoGroup = new THREE.Group();

        photoData.forEach((data, i) => {
            const material = new THREE.MeshStandardMaterial({
                map: textureLoader.load(`assets/${data.id}`),
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9,  // Increased for better visibility
                emissive: new THREE.Color(0x000000),
                emissiveIntensity: 0
            });

            const plane = new THREE.Mesh(planeGeometry, material);

            const phi = Math.acos(-1 + (2 * i) / (photoData.length -1));
            const theta = Math.sqrt(photoData.length * Math.PI) * phi;

            const radius = 60; // Increased radius for larger photos
            plane.position.setFromSphericalCoords(radius, phi, theta);
            plane.lookAt(0, 0, 0);

            plane.userData = { id: data.id, visited: false };
            planes.push(plane);
            photoGroup.add(plane);
            
            // Log photo creation for verification
            console.log(`Created photo plane ${i}:`, {
                id: data.id,
                title: data.title,
                position: plane.position
            });

            // Add leader lines
            const points = [];
            points.push(new THREE.Vector3(0, 0, 0));
            points.push(plane.position.clone());

            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const lineMaterial = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                linewidth: 1,
                transparent: true,
                opacity: 0.25
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            photoGroup.add(line);
        });

        scene.add(photoGroup);
        sceneReady = true;
    }

    // Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('click', onDocumentClick, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('mousemove', onMouseMove, false);
    
    // Stop auto-rotation on any mouse interaction
    renderer.domElement.addEventListener('mousedown', () => { autoRotate = false; });
    renderer.domElement.addEventListener('wheel', () => { autoRotate = false; });
    
    animate();
}

function onDocumentClick(event) {
    // First click handles the splash screen
    if (!gameStarted) {
        gameStarted = true;
        const splashScreen = document.getElementById('splash-screen');
        splashScreen.style.opacity = '0';
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 1000);
        return; // Don't process this click for raycasting
    }

    // Subsequent clicks are for photos, but only if they are loaded
    if (sceneReady) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        // Only check photo planes (Mesh objects), not lines
        const photoMeshes = photoGroup.children.filter(child => child.type === 'Mesh');
        const intersects = raycaster.intersectObjects(photoMeshes);

        if (intersects.length > 0 && !isZoomed) {
            const clickedObject = intersects[0].object;
            if (clickedObject.userData && clickedObject.userData.id) {
                zoomToPhoto(clickedObject);
                displayDialogue(clickedObject.userData);
                triggerGlitch();
            }
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

function updateXpBar() {
    const xpBar = document.getElementById('xp-bar-fill');
    const percentage = (totalXp / maxTotalXp) * 100;
    xpBar.style.width = percentage + '%';
}

function displayDialogue(data) {
    const dialogueBox = document.getElementById('dialogue-box');
    
    // Find the photo data from the photoData array
    const photoInfo = photoData.find(p => p.id === data.id);
    if (!photoInfo) {
        console.error('No photo data found for ID:', data.id);
        return;
    }
    
    // Log for verification
    console.log('Displaying dialogue for photo:', {
        id: photoInfo.id,
        title: photoInfo.title,
        userData: data
    });
    
    document.getElementById('dialogue-title').innerText = photoInfo.title;
    document.getElementById('dialogue-date-location').innerText = `${photoInfo.date} - ${photoInfo.location}`;
    document.getElementById('dialogue-description').innerText = photoInfo.description;

    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = ''; // Clear previous stats

    let statAdded = false;
    if (!visitedPhotos.has(data.id)) {
        visitedPhotos.add(data.id);
        totalXp += photoInfo.stats.human_experience;
        statAdded = true;
    }

    for (const [key, value] of Object.entries(photoInfo.stats)) {
        const statItem = document.createElement('div');
        statItem.classList.add('stat-item');
        const formattedKey = key.replace(/_/g, ' ').toUpperCase();
        statItem.innerText = `${formattedKey}: +${value}`;
        statsContainer.appendChild(statItem);
    }
    
    // Add sources
    const sourcesList = document.getElementById('sources-list');
    sourcesList.innerHTML = ''; // Clear previous sources
    
    if (photoInfo.sources && photoInfo.sources.length > 0) {
        photoInfo.sources.forEach(source => {
            const sourceLink = document.createElement('a');
            sourceLink.href = source.url;
            sourceLink.target = '_blank';
            sourceLink.rel = 'noopener noreferrer';
            sourceLink.classList.add('source-link');
            sourceLink.classList.add(`source-${source.type}`);
            sourceLink.innerText = `[${source.type.toUpperCase()}] ${source.name}`;
            
            const sourceItem = document.createElement('div');
            sourceItem.classList.add('source-item');
            sourceItem.appendChild(sourceLink);
            sourcesList.appendChild(sourceItem);
        });
    }
    
    dialogueBox.classList.remove('hidden');

    if (statAdded) {
        updateXpBar();
    }

    // Hide dialogue after a delay
    clearTimeout(dialogueTimeout);
    dialogueTimeout = setTimeout(() => {
        dialogueBox.classList.add('hidden');
    }, 5000); // 5 seconds
}

function triggerGlitch() {
    const glitchPass = composer.passes.find(pass => pass instanceof GlitchPass);
    if (glitchPass) {
        glitchPass.enabled = true;
        setTimeout(() => {
            glitchPass.enabled = false;
        }, 500); // Glitch for 500ms
    }
}

function animatePhotoScale(photo, targetScale) {
    const startScale = photo.scale.x;
    const startTime = Date.now();
    const duration = 300; // 300ms animation
    
    function updateScale() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const currentScale = startScale + (targetScale - startScale) * easeProgress;
        photo.scale.set(currentScale, currentScale, currentScale);
        
        if (progress < 1) {
            requestAnimationFrame(updateScale);
        }
    }
    
    updateScale();
}

function highlightPhotoMaterial(photo) {
    if (photo.material) {
        photo.material.emissive = new THREE.Color(0x00ffff);
        photo.material.emissiveIntensity = 0.3;
        photo.material.opacity = 1;
    }
}

function resetPhotoMaterial(photo) {
    if (photo.material) {
        photo.material.emissive = new THREE.Color(0x000000);
        photo.material.emissiveIntensity = 0;
        photo.material.opacity = 0.8;
    }
}

function zoomToPhoto(photoMesh) {
    if (!photoMesh || isZoomed) return;
    
    isZoomed = true;
    zoomedPhoto = photoMesh;
    
    // Keep photo scaled up
    animatePhotoScale(photoMesh, 3);
    
    // Disable orbit controls during zoom
    if (controls) {
        controls.enabled = false;
    }
    
    // Temporarily reduce bloom intensity for better photo visibility
    if (bloomPass) {
        bloomPass.strength = 0.3; // Significantly reduce bloom
        bloomPass.threshold = 0.5; // Increase threshold to reduce glow
    }
    
    // Store original camera position
    originalCameraPosition.copy(camera.position);
    originalCameraRotation.copy(camera.rotation);
    
    // Calculate optimal viewing position
    const photoNormal = new THREE.Vector3(0, 0, 1);
    photoNormal.applyQuaternion(photoMesh.quaternion);
    
    // Position camera to face the photo directly
    const distance = 35; // Increased distance for better framing
    const targetPosition = photoMesh.position.clone();
    targetPosition.add(photoNormal.multiplyScalar(distance));
    
    // Center the photo completely - no offset
    // The dialogue box appears on the right side of screen and doesn't overlap
    
    // Show ESC hint
    const zoomHint = document.getElementById('zoom-hint');
    zoomHint.classList.remove('hidden');
    
    // Animate camera to target position
    animateCameraToPosition(targetPosition, photoMesh.position);
}

function zoomOut() {
    if (!isZoomed) return;
    
    isZoomed = false;
    
    // Reset photo scale
    if (zoomedPhoto) {
        animatePhotoScale(zoomedPhoto, 1);
        resetPhotoMaterial(zoomedPhoto);
    }
    
    // Restore bloom intensity
    if (bloomPass) {
        bloomPass.strength = 1.2; // Restore original bloom
        bloomPass.threshold = 0.21; // Restore original threshold
    }
    
    // Re-enable orbit controls
    if (controls) {
        controls.enabled = true;
    }
    
    // Hide dialogue and zoom hint when zooming out
    const dialogueBox = document.getElementById('dialogue-box');
    dialogueBox.classList.add('hidden');
    
    const zoomHint = document.getElementById('zoom-hint');
    zoomHint.classList.add('hidden');
    
    // Animate back to original position
    animateCameraToPosition(originalCameraPosition, new THREE.Vector3(0, 0, 0));
    
    zoomedPhoto = null;
    hoveredPhoto = null; // Reset hover state
    autoRotate = true; // Resume auto-rotation
}

function animateCameraToPosition(targetPos, lookAtPos) {
    const startPos = camera.position.clone();
    const startLookAt = new THREE.Vector3();
    camera.getWorldDirection(startLookAt);
    startLookAt.multiplyScalar(50).add(camera.position); // Get current look-at point
    
    const startTime = Date.now();
    const duration = 1000; // 1 second animation
    
    function updateCamera() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        // Interpolate position
        camera.position.lerpVectors(startPos, targetPos, easeProgress);
        
        // Interpolate look-at target
        const currentLookAt = new THREE.Vector3();
        currentLookAt.lerpVectors(startLookAt, lookAtPos, easeProgress);
        camera.lookAt(currentLookAt);
        
        if (progress < 1) {
            requestAnimationFrame(updateCamera);
        }
    }
    
    updateCamera();
}

function onKeyDown(event) {
    if (event.key === 'Escape' && isZoomed) {
        zoomOut();
    }
}

function onMouseMove(event) {
    if (!sceneReady || isZoomed) return;
    
    // Update mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Raycast to detect hover
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(photoGroup.children.filter(child => child.type === 'Mesh'));
    
    if (intersects.length > 0) {
        const newHoveredPhoto = intersects[0].object;
        
        // If hovering over a new photo
        if (hoveredPhoto !== newHoveredPhoto) {
            // Reset previous hovered photo
            if (hoveredPhoto) {
                animatePhotoScale(hoveredPhoto, 1);
                resetPhotoMaterial(hoveredPhoto);
            }
            
            // Set new hovered photo
            hoveredPhoto = newHoveredPhoto;
            animatePhotoScale(hoveredPhoto, 2.5); // Scale up 2.5x
            highlightPhotoMaterial(hoveredPhoto);
            
            // Pause auto-rotation
            autoRotate = false;
        }
    } else {
        // Not hovering over any photo
        if (hoveredPhoto) {
            animatePhotoScale(hoveredPhoto, 1);
            resetPhotoMaterial(hoveredPhoto);
            hoveredPhoto = null;
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Update controls only when not zoomed
    if (controls && !isZoomed) {
        controls.update();
    }

    if (sceneReady && !isZoomed && autoRotate) {
        // Only rotate when not zoomed and autoRotate is true
        photoGroup.rotation.y += 0.0002; // Slower rotation
        photoGroup.rotation.x += 0.0001;
    }
    
    // Keep camera focused on photo when zoomed
    if (isZoomed && zoomedPhoto) {
        camera.lookAt(zoomedPhoto.position);
    }

    composer.render(delta);
}

// Global function for close button
window.closeDialogue = function() {
    const dialogueBox = document.getElementById('dialogue-box');
    dialogueBox.classList.add('hidden');
    
    // If zoomed, also zoom out
    if (isZoomed) {
        zoomOut();
    }
};

// Initialize the application
init();
