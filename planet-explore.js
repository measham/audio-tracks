 <script type="module">
        import * as THREE from 'three';
    
    /////////////////////////////////////////////////////// Scene, Camera, and Renderer //////////////////////////////////////////////////////////////
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('three-canvas'), 
        antialias: true,
        alpha: true // Enable transparency
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
        
        // Load Textures with Cache
        const texturePaths = {
            starTexture: "https://cdn.prod.website-files.com/674b90dd8dfb734293c8e163/674b91999148f9d910dc0806_279.png",
            smokeTexture: "https://cdn.prod.website-files.com/6738a290d57d477447758a67/674f7656ef004d87e71414a0_674b919ab14bdea27047b94d_Smoke-Element.webp",
            planet1Diffuse: "https://cdn.prod.website-files.com/6738a290d57d477447758a67/674e0f4543c78c0a9ce77508_1%20(1).webp",
            planet1Normal: "https://cdn.prod.website-files.com/6738a290d57d477447758a67/674e0f434d3f70908bed5772_1normal%20(1).webp",
            planet2Diffuse: "https://cdn.prod.website-files.com/6738a290d57d477447758a67/674e0fb08afb539b9a5f273b_2.webp",
            planet2Normal: "https://cdn.prod.website-files.com/6738a290d57d477447758a67/674e0fb0352dd79972fbc259_2normal.webp",
            planet3Diffuse: "https://cdn.prod.website-files.com/6738a290d57d477447758a67/674e10079ccbfedd36b5ede4_3.webp",
            planet3Normal: "https://cdn.prod.website-files.com/6738a290d57d477447758a67/674e100743c78c0a9ce83fdb_ice_normal.webp",
        };

        const textures = {};
        const loader = new THREE.TextureLoader();

        Object.keys(texturePaths).forEach((key) => {
            textures[key] = loader.load(texturePaths[key], undefined, undefined, (err) => {
                console.error(`Error loading texture ${key}:`, err);
            });
        });

        // Set texture encoding
        textures.planet1Diffuse.encoding = THREE.sRGBEncoding;
        textures.planet2Diffuse.encoding = THREE.sRGBEncoding;
        textures.planet3Diffuse.encoding = THREE.sRGBEncoding;

        // Geometry
        const createGeometry = () => {
            const segments = window.innerWidth <= 768 ? 32 : 64;
            return new THREE.SphereGeometry(5, segments, segments);
        };

        // Create Planets
        const createPlanet = (diffuse, normal, position) => {
            const material = new THREE.MeshStandardMaterial({
                map: diffuse,
                normalMap: normal,
                roughness: 1,
                metalness: 0,
            });
            const planet = new THREE.Mesh(createGeometry(), material);
            planet.position.set(...position);
            return planet;
        };

        const planet1 = createPlanet(textures.planet1Diffuse, textures.planet1Normal, [0, 0, 0]);
        const planet2 = createPlanet(textures.planet2Diffuse, textures.planet2Normal, [40, -40, -30]);
        const planet3 = createPlanet(textures.planet3Diffuse, textures.planet3Normal, [-40, -80, -60]);

        scene.add(planet1, planet2, planet3);

        const setPlanetPositions = () => {
            if (window.innerWidth <= 768) {
                // Position planets in a row for tablet and smaller screens
                planet1.position.set(0, 0, 0);
                planet2.position.set(20, 0, 0);
                planet3.position.set(40, 0, 0);
            } else {
                // Original positions for larger screens
                planet1.position.set(0, 0, 0);
                planet2.position.set(40, -40, -30);
                planet3.position.set(-40, -80, -60);
            }
        };

        window.addEventListener('resize', setPlanetPositions);
        setPlanetPositions();
    
        /////////////////////////////////////////////////////// Add Ambient Light //////////////////////////////////////////////////////////////
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Lower intensity for subtle global illumination
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Bright directional light
        directionalLight.position.set(-50, 50, 50); // Position the light at the top-left
        directionalLight.target.position.set(0, 0, 0); // Aim at the center of the scene
        scene.add(directionalLight);
        scene.add(directionalLight.target); // Add the target for the light


        // Position Camera
        camera.position.set(0, 0, 12);
    

        // Add Fog to the Scene
        const fogColor = new THREE.Color("#21262B");
        const initialFogDensity = 0.005; // Lower density for planet view
        const transitionFogDensity = 0.02; // Higher density for transitions
        scene.fog = new THREE.FogExp2(fogColor, initialFogDensity);
    
        // Position SVGs behind planets
        const svgContainer = document.getElementById('svg-container');
        const planet1Svg = document.getElementById('planet1-svg');
        const planet2Svg = document.getElementById('planet2-svg');
        const planet3Svg = document.getElementById('planet3-svg');
        const svgs = [planet1Svg, planet2Svg, planet3Svg];

        // Variables for Interaction
        const planetLink = document.getElementById('planet-link');
        const closeButton = document.getElementById('close-interaction');
        const buttons = document.querySelectorAll('.button.is-icon');
        const planets = [planet1, planet2, planet3];
        let isInteractive = false;
        let currentPlanetIndex = null;
    
        const touchpointTemplate = document.getElementById('touchpoint-template');
        const touchpoints = Array.from({ length: 9 }, (_, i) => {
            const clone = touchpointTemplate.cloneNode(true);
            clone.id = `touchpoint${i + 1}-svg`;
            clone.style.display = 'none'; // Ensure touchpoints are initially hidden
            svgContainer.appendChild(clone);
            return clone;
        });

        const revealCards = [
            document.querySelector('.reveal-card-1'),
            document.querySelector('.reveal-card-2'),
            document.querySelector('.reveal-card-3'),
            document.querySelector('.reveal-card-4'),
            document.querySelector('.reveal-card-5'),
            document.querySelector('.reveal-card-6'),
            document.querySelector('.reveal-card-7'),
            document.querySelector('.reveal-card-8'),
            document.querySelector('.reveal-card-9')
        ];

        const updateSvgPosition = (svg, planet) => {
            const vector = planet.position.clone();
            vector.project(camera);

            const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

            svg.style.left = `${x}px`;
            svg.style.top = `${y}px`;
        };
       
        /////////////////////////////////////////////////////// Position Touchpoints //////////////////////////////////////////////////////////////
        const positionTouchpoints = (planet, startIndex) => {
        const touchpointRange = touchpoints.slice(startIndex, startIndex + 3);
        const radius = 5; // Sphere radius (adjust if scaled)

        // Compute camera frustum
        const frustum = new THREE.Frustum();
        const cameraViewProjectionMatrix = new THREE.Matrix4();
        cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);

        // Refine touchpoint positions to match the sphere's surface
        const positions = [
            new THREE.Vector3(0, 0.2, 1).normalize().multiplyScalar(radius), // Top-right on sphere
            new THREE.Vector3(-1, -0.6, 0).normalize().multiplyScalar(radius), // Bottom-left on sphere
            new THREE.Vector3(0, 0, -1).normalize().multiplyScalar(radius), // Directly behind sphere
        ];

        touchpointRange.forEach((touchpoint, i) => {
            // Transform the position into world space
            const worldPosition = positions[i].clone().applyMatrix4(planet.matrixWorld);

            // Project the position into screen space
            const screenPosition = worldPosition.clone().project(camera);

            const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
            const y = (screenPosition.y * -0.5 + 0.5) * window.innerHeight;

            // Check if point is within the camera frustum
            if (!frustum.containsPoint(worldPosition)) {
                touchpoint.style.display = 'none';
                touchpoint.style.opacity = 0;
                return;
            }

            // Calculate visibility based on dot product
            const planetCenter = planet.getWorldPosition(new THREE.Vector3());
            const surfaceNormal = new THREE.Vector3().subVectors(worldPosition, planetCenter).normalize();
            const cameraDirection = new THREE.Vector3().subVectors(camera.position, worldPosition).normalize();

            const visibilityDot = surfaceNormal.dot(cameraDirection);

            // Show touchpoint if it's facing the camera
            if (visibilityDot > 0) { // Surface is visible to the camera
                touchpoint.style.display = 'block';
                touchpoint.style.left = `${x}px`;
                touchpoint.style.top = `${y}px`;
                touchpoint.style.opacity = 1;
            } else {
                touchpoint.style.display = 'none';
                touchpoint.style.opacity = 0;
            }
        });
    };



    /////////////////////////////////////////////////////// Animate Stars //////////////////////////////////////////////////////////////
        // Create stars using Points
        const createStarField = () => {
            const particleCount = 2000;

            // Star geometry and attributes
            const particleGeometry = new THREE.BufferGeometry();
            const particlePositions = new Float32Array(particleCount * 3);
            const particleOpacities = new Float32Array(particleCount);
            const particleSizes = new Float32Array(particleCount);

            for (let i = 0; i < particleCount; i++) {
                // Increased radius range for wider distribution
                const r = 100 + Math.random() * 300; // Between 100 and 400 units
                const theta = Math.random() * 2 * Math.PI;
                const phi = Math.acos((Math.random() * 2) - 1);

                // Calculate position with wider distribution
                particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                particlePositions[i * 3 + 2] = r * Math.cos(phi);

                // More aggressive opacity falloff for better blending
                const distanceFromCenter = (r - 100) / 300;
                const baseOpacity = Math.max(0.1, 1 - Math.pow(distanceFromCenter, 1.5));
                particleOpacities[i] = baseOpacity * (0.2 + Math.random() * 0.5); // Lower overall opacity

                // Slightly larger sizes for outer stars to create depth
                const sizeVariation = 1 + distanceFromCenter * 0.5;
                particleSizes[i] = (0.2 + Math.random() * 0.6) * sizeVariation;
            }

            particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
            particleGeometry.setAttribute('opacity', new THREE.BufferAttribute(particleOpacities, 1));
            particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

            const particleMaterial = new THREE.PointsMaterial({
                map: textures.starTexture,
                transparent: true,
                alphaTest: 0.01, // Lower alpha test for softer edges
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                vertexColors: false,
                sizeAttenuation: true,
                opacity: 0.75 // Overall material opacity
            });

            particleMaterial.size = 0.8;

            return new THREE.Points(particleGeometry, particleMaterial);
        };

        // Create and add stars to the scene
        const stars = createStarField();
        scene.add(stars);


        /////////////////////////////////////////////////////// Create smoke field //////////////////////////////////////////////////////////////


    		const audioElement = new Audio('https://cdn.glitch.global/bc33860c-de64-4a2b-95df-5c632e5316a8/planet-movementv2.wav?v=1733080553568');

        /////////////////////////////////////////////////////// Move Camera to Planet //////////////////////////////////////////////////////////////
        let currentTextTimeline;

        const updateCounter = (newIndex) => {
            const current = document.querySelector('.count-heading.current');
            const next = document.querySelector('.count-heading.next');
            const prev = document.querySelector('.count-heading.prev');
            
            const currentNum = parseInt(current.textContent);
            const newNum = newIndex + 1;
            
            if (newNum > currentNum) {
                // Moving forward - current slides up, new number comes from bottom
                gsap.to(current, {
                    y: '-100%',
                    duration: 1,
                    ease: 'power3.inOut'
                });
                
                next.textContent = newNum < 10 ? `0${newNum}` : newNum;
                gsap.fromTo(next, {
                    y: '100%'
                }, {
                    y: '0%',
                    duration: 1,
                    ease: 'power3.inOut',
                    onComplete: () => {
                        current.textContent = next.textContent;
                        gsap.set(current, { y: 0 });
                        gsap.set(next, { y: '100%' });
                    }
                });
            } else {
                // Moving backward - current slides down, new number comes from top
                gsap.to(current, {
                    y: '100%',
                    duration: 1,
                    ease: 'power3.inOut'
                });
                
                prev.textContent = newNum < 10 ? `0${newNum}` : newNum;
                gsap.fromTo(prev, {
                    y: '-100%'
                }, {
                    y: '0%',
                    duration: 1,
                    ease: 'power3.inOut',
                    onComplete: () => {
                        current.textContent = prev.textContent;
                        gsap.set(current, { y: 0 });
                        gsap.set(prev, { y: '-100%' });
                    }
                });
            }
        };

        const moveCameraToPlanet = (planet, index) => {
            if (isInteractive || currentPlanetIndex === index) return;
            
            // Update counter
            updateCounter(index);
            
            // Scale down previous planet's SVG if it exists
            if (currentPlanetIndex !== null) {
                gsap.to(svgs[currentPlanetIndex], {
                    scale: 0.7,
                    opacity: 0.5,
                    duration: 1.5,
                    ease: 'power3.inOut'
                });
            }

            // Scale up new planet's SVG
            gsap.to(svgs[index], {
                scale: 1,
                opacity: 1,
                duration: 1.5,
                delay: 0.2,
                ease: 'power3.inOut'
            });

            // Play audio when camera starts moving
            audioElement.currentTime = 0;
            audioElement.play();

            // Remove active class from all buttons
            buttons.forEach(button => button.classList.remove('active'));
            buttons[index].classList.add('active');

            // Kill any existing text animation timeline
            if (currentTextTimeline) {
                currentTextTimeline.kill();
                currentTextTimeline = null;
            }

            // Hide current text elements if they exist
            if (currentPlanetIndex !== null) {
                const currentHeadingWrap = document.querySelector(`.planet_heading-wrap.is-0${currentPlanetIndex + 1}`);
                const currentTerminalContainer = document.querySelector(`.terminal-container.is-0${currentPlanetIndex + 1}`);
                
                // Text wrap scale down and blur out
                gsap.to(currentHeadingWrap, {
                    opacity: 0,
                    scale: 0.9,
                    filter: 'blur(5px)',
                    duration: 0.5,
                    onComplete: () => {
                        currentHeadingWrap.style.display = 'none';
                        gsap.set(currentHeadingWrap, { clearProps: "all" });
                        // Revert split text
                        SplitType.revert(currentHeadingWrap);
                    }
                });

                // Terminal simple fade and blur
                gsap.to(currentTerminalContainer, {
                    opacity: 0,
                    filter: 'blur(5px)',
                    duration: 0.5,
                    onComplete: () => {
                        currentTerminalContainer.style.display = 'none';
                        gsap.set(currentTerminalContainer, { clearProps: "all" });
                    }
                });
            }

            // Increase fog density for transition
            gsap.to(scene.fog, { density: transitionFogDensity, duration: 1.5 });

            const targetPosition = new THREE.Vector3(planet.position.x, planet.position.y, planet.position.z + 12);

            // Get the new text elements with more specific selector
            const headingWrap = document.querySelector(`.planet_heading-wrap.is-0${index + 1}`);
            const eyebrowWrap = headingWrap.querySelector('.eyebrow-wrap');
            const planetHeading = headingWrap.querySelector('.planet_heading');
            const textWrap = headingWrap.querySelector('.text-wrap');
            const textParagraph = textWrap.querySelector('.text-wrap p');
            const terminalContainer = document.querySelector(`.terminal-container.is-0${index + 1}`);

            // Show elements but start them invisible
            headingWrap.style.display = 'block';
            terminalContainer.style.display = 'block';

            // Revert any existing splits before creating new ones
            SplitType.revert(planetHeading);
            SplitType.revert(textParagraph);

            // Create new splits
            const splitHeading = new SplitType(planetHeading, { types: 'lines' });
            const splitParagraph = new SplitType(textParagraph, { types: 'lines' });

            // Reset initial states
            gsap.set([eyebrowWrap, terminalContainer], {
                opacity: 0,
                y: 50,
                filter: 'blur(5px)'
            });

            gsap.set(splitHeading.lines, {
                opacity: 0,
                y: 50,
                filter: 'blur(5px)'
            });

            gsap.set(splitParagraph.lines, {
                opacity: 0,
                y: 50,
                filter: 'blur(5px)'
            });

            // When camera starts moving (beginning of function)
            gsap.to(planetLink, { 
                opacity: 0, 
                duration: 0.5 
            });
            
            // Camera movement with earlier animation start
            gsap.to(camera.position, {
                x: targetPosition.x,
                y: targetPosition.y,
                z: targetPosition.z,
                duration: 1.5,
                ease: 'power3.inOut',
                onUpdate: function() {
                    // Start animations when camera is 70% through its movement
                    if (this.progress() > 0.7 && !currentTextTimeline) {
                        startTextAnimations();
                    }
                },
                onComplete: () => {
                    camera.lookAt(planet.position);
                    currentPlanetIndex = index;
                    planetLink.style.display = 'block';
                    gsap.to(planetLink, { opacity: 1, duration: 0.5 });
                    gsap.to(scene.fog, { density: initialFogDensity, duration: 1.5 });
                }
            });

            // Separate function for text animations
            const startTextAnimations = () => {
                currentTextTimeline = gsap.timeline({
                    defaults: { duration: 0.8, ease: 'power3.out' }
                });

                currentTextTimeline
                    .to(eyebrowWrap, {
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                        duration: 0.8
                    })
                    .to(splitHeading.lines, {
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                        stagger: 0.1,
                        duration: 0.6
                    }, '-=0.6')
                    .to(splitParagraph.lines, {
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                        stagger: 0.1,
                        duration: 0.6
                    }, '-=0.4')
                    .to(terminalContainer, {
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                        duration: 0.8
                    }, '-=0.6');
            };
        };

        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Prevent default button behavior and scroll
                e.preventDefault();
                e.stopPropagation();
                
                const index = parseInt(button.getAttribute('data-planet'), 10);
                const planet = planets[index];
                if (planet) {
                    moveCameraToPlanet(planet, index);
                } else {
                    console.error(`Planet at index ${index} is undefined.`);
                }
                
                // Ensure viewport stays in place
                return false;
            });
        });
    
        const setPlanetSizes = () => {
            if (window.innerWidth <= 768) {
                // Set smaller scale for planets on smaller screens
                planet1.scale.set(0.8, 0.8, 0.8);
                planet2.scale.set(0.8, 0.8, 0.8);
                planet3.scale.set(0.8, 0.8, 0.8);
            } else {
                // Set default scale for larger screens
                planet1.scale.set(1, 1, 1);
                planet2.scale.set(1, 1, 1);
                planet3.scale.set(1, 1, 1);
            }
        };

        const makePlanetInteractive = (planet, index) => {
            isInteractive = true;
            planetLink.style.display = 'none';
            gsap.to(planetLink, { opacity: 0, duration: 0.5 });

            // Get the text elements for the current planet
            const headingWrap = document.querySelector(`.planet_heading-wrap.is-0${index + 1}`);
            const eyebrowWrap = headingWrap.querySelector('.eyebrow-wrap');
            const planetHeading = headingWrap.querySelector('.planet_heading');
            const textWrap = headingWrap.querySelector('.text-wrap');
            const textParagraph = textWrap.querySelector('.text-wrap p');
            const terminalContainer = document.querySelector(`.terminal-container.is-0${index + 1}`);

            // Hide all touchpoints immediately
            touchpoints.forEach(touchpoint => {
                touchpoint.style.display = 'none';
                touchpoint.style.visibility = 'hidden';
                touchpoint.style.opacity = 0;
            });

            // Animate SVG
            gsap.to(svgs[index], { scale: 0.7, opacity: 0, duration: 2, ease: 'power3.inOut' });

            // Fade out heading wrap and terminal with blur
            gsap.to([headingWrap, terminalContainer], {
                opacity: 0,
                filter: 'blur(5px)',
                duration: 1,
                ease: 'power3.inOut'
            });

            // Determine scale factor based on screen size
            const scaleFactor = window.innerWidth <= 768 ? 1.0 : 1.2;

            // Planet scaling and rotation
            gsap.timeline()
                .to(planet.scale, { 
                    x: scaleFactor, 
                    y: scaleFactor, 
                    z: scaleFactor, 
                    duration: 3, 
                    ease: 'power3.inOut' 
                })
                .to(planet.rotation, { 
                    y: planet.rotation.y - Math.PI, 
                    duration: 3, 
                    ease: 'power3.inOut' 
                }, 0)
                .call(() => {
                    const touchpointRange = touchpoints.slice(index * 3, (index + 1) * 3);
                    touchpointRange.forEach((touchpoint, i) => {
                        touchpoint.style.display = 'block';
                        touchpoint.style.visibility = 'visible';
                        touchpoint.style.opacity = 0;
                        touchpoint.style.transform = 'scale(0.5)';
                        
                        gsap.to(touchpoint, {
                            opacity: 1,
                            scale: 1.5,
                            duration: 0.5,
                            delay: i * 0.1,
                            ease: 'back.out(1.7)'
                        });
                    });
                    
                    positionTouchpoints(planet, index * 3);
                });

            let isDragging = false;
            let lastMouseX = 0;

            const onMouseDown = (event) => {
                isDragging = true;
                lastMouseX = event.clientX;
                closeAllRevealCards();
            };

            const onMouseMove = (event) => {
                if (isDragging) {
                    const deltaX = event.clientX - lastMouseX;
                    lastMouseX = event.clientX;
                    planet.rotation.y += deltaX * 0.0005;
                }
            };

            const onMouseUp = () => {
                isDragging = false;
            };

            window.addEventListener('mousedown', onMouseDown);
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);

            closeButton.style.display = 'block';
            
            // Update close button functionality
            const handleClose = () => {
                // Make specific planet heading wrap visible
                const specificHeadingWrap = document.querySelector(`.planet_heading-wrap.is-0${index + 1}`);
                const textWrap = specificHeadingWrap.querySelector('.text-wrap');
                const eyebrowWrap = specificHeadingWrap.querySelector('.eyebrow-wrap');
                const planetHeading = specificHeadingWrap.querySelector('.planet_heading');
                const textParagraph = textWrap.querySelector('.text-wrap p');
                const terminalContainer = document.querySelector(`.terminal-container.is-0${index + 1}`);

                // Set correct initial state for the heading wrap container
                gsap.set(specificHeadingWrap, {
                    display: 'block',
                    opacity: 1,
                    filter: 'blur(0px)',
                    transform: 'translate(0, 0)'
                });

                // Reset initial states for child elements
                gsap.set([eyebrowWrap, terminalContainer], {
                    opacity: 0,
                    y: 50,
                    filter: 'blur(5px)'
                });

                // Revert any existing splits
                SplitType.revert(planetHeading);
                SplitType.revert(textParagraph);

                // Create new splits
                const splitHeading = new SplitType(planetHeading, { types: 'words' });
                const splitParagraph = new SplitType(textParagraph, { types: 'lines' });

                gsap.set(splitHeading.words, {
                    opacity: 0,
                    y: 50,
                    filter: 'blur(5px)'
                });

                gsap.set(splitParagraph.lines, {
                    opacity: 0,
                    y: 50,
                    filter: 'blur(5px)'
                });

                // Start animations immediately before cleanup
                const rotationAnimation = gsap.to(planet.rotation, { 
                    y: planet.rotation.y + Math.PI, 
                    duration: 3, 
                    ease: 'power3.inOut' 
                });

                const scaleAnimation = gsap.to(planet.scale, {
                    x: window.innerWidth <= 768 ? 0.8 : 1,
                    y: window.innerWidth <= 768 ? 0.8 : 1,
                    z: window.innerWidth <= 768 ? 0.8 : 1,
                    duration: 3,
                    ease: 'power3.inOut'
                });

                const svgAnimation = gsap.to(svgs[index], { 
                    scale: 1, 
                    opacity: 1, 
                    duration: 2, 
                    ease: 'power3.inOut' 
                });

                // Fade out touchpoints
                const touchpointRange = touchpoints.slice(index * 3, (index + 1) * 3);
                touchpointRange.forEach(touchpoint => {
                    gsap.killTweensOf(touchpoint);
                    gsap.to(touchpoint, {
                        opacity: 0,
                        scale: 0.5,
                        duration: 1,
                        ease: 'power2.out',
                        onComplete: () => {
                            touchpoint.style.display = 'none';
                            touchpoint.style.visibility = 'hidden';
                        }
                    });
                });

                // Timeline to ensure proper animation sequence
                gsap.timeline()
                    .add(rotationAnimation)
                    .add(scaleAnimation, 0)
                    .add(svgAnimation, 0)
                    .add(gsap.timeline()
                        .to(eyebrowWrap, {
                            opacity: 1,
                            y: 0,
                            filter: 'blur(0px)',
                            duration: 0.8
                        })
                        .to(splitHeading.words, {
                            opacity: 1,
                            y: 0,
                            filter: 'blur(0px)',
                            stagger: 0.1,
                            duration: 0.6
                        }, '-=0.4')
                        .to(splitParagraph.lines, {
                            opacity: 1,
                            y: 0,
                            filter: 'blur(0px)',
                            stagger: 0.1,
                            duration: 0.6
                        }, '-=0.2')
                        .to(terminalContainer, {
                            opacity: 1,
                            y: 0,
                            filter: 'blur(0px)',
                            duration: 0.8
                        }, '-=0.6'), '-=1')
                    .call(() => {
                        isInteractive = false;
                        planetLink.style.display = 'block';
                        gsap.to(planetLink, { opacity: 1, duration: 0.5 });
                    });

                // Cleanup
                window.removeEventListener('mousedown', onMouseDown);
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                closeButton.style.display = 'none';
                closeAllRevealCards();
                closeButton.removeEventListener('click', handleClose);
            };

            closeButton.addEventListener('click', handleClose);
        };
    
        planetLink.addEventListener('click', () => {
            if (currentPlanetIndex === null) return;
            const planet = planets[currentPlanetIndex];
            makePlanetInteractive(planet, currentPlanetIndex);
        });
    
        let isRevealCardOpen = false;

        // Add these variables near the top with other state variables
        let rotationSpeed = 0.001;
        let targetRotationSpeed = 0.001;
        const rotationDeceleration = 0.95; // Controls how quickly rotation slows down
        const minRotationSpeed = 0.00001; // Threshold to consider rotation completely stopped

        // Modify the animation loop to include smooth rotation changes
        const animate = () => {
            requestAnimationFrame(animate);

            // Update SVG positions
            updateSvgPosition(planet1Svg, planet1);
            updateSvgPosition(planet2Svg, planet2);
            updateSvgPosition(planet3Svg, planet3);

            // Update touchpoint positions
            if (isInteractive) {
                positionTouchpoints(planets[currentPlanetIndex], currentPlanetIndex * 3);
            }

            // Smoothly adjust rotation speed
            rotationSpeed = rotationSpeed + (targetRotationSpeed - rotationSpeed) * 0.1;

            // Rotate planets based on conditions
            planets.forEach((planet, index) => {
                if (!isInteractive || (index === currentPlanetIndex && !isRevealCardOpen)) {
                    planet.rotation.y += rotationSpeed;
                }
            });

            // Get current time once
            const time = performance.now();
            
            // Softer twinkling effect
            const opacities = stars.geometry.attributes.opacity.array;
            const sizes = stars.geometry.attributes.size.array;
            const starTime = time * 0.0005; // Slower animation for stars

            for (let i = 0; i < opacities.length; i++) {
                const uniqueFreq = 0.3 + (i % 5) * 0.1;
                const uniquePhase = i * 0.2;
                
                // Gentler opacity variation
                const opacityWave = Math.sin(starTime * uniqueFreq + uniquePhase);
                opacities[i] = opacities[i] * (0.8 + 0.2 * opacityWave);
                
                // Subtle size pulsing
                const sizeWave = Math.sin(starTime * uniqueFreq * 0.5 + uniquePhase);
                sizes[i] = sizes[i] * (0.95 + 0.05 * sizeWave);
            }

            stars.geometry.attributes.opacity.needsUpdate = true;
            stars.geometry.attributes.size.needsUpdate = true;

            // Slower rotation
            stars.rotation.y += 0.00003;
            stars.rotation.x += 0.00001;

            // Log renderer info specifically for smoke
            console.log(' Render Info:', {
                geometries: renderer.info.memory.geometries,
                textures: renderer.info.memory.textures,
                drawCalls: renderer.info.render.calls,
                triangles: renderer.info.render.triangles,
                points: renderer.info.render.points
            });

            renderer.render(scene, camera);
        };

        // Update the touchpoint event handlers
        touchpoints.forEach((touchpoint, i) => {
            touchpoint.addEventListener('mouseenter', () => {
                gsap.to(touchpoint, {
                    scale: 1.8, // Keep larger hover state for better feedback
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            touchpoint.addEventListener('mouseleave', () => {
                if (revealCards[i].style.display !== 'block') {
                    gsap.to(touchpoint, {
                        scale: 1.5, // Keep original scale
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                }
            });

            touchpoint.addEventListener('click', () => {
                const card = revealCards[i];
                const animationDuration = 0.3;
                
                if (card.style.display === 'block') {
                    gsap.to(card, {
                        y: 50, // Animate down
                        opacity: 0,
                        duration: animationDuration,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            card.style.display = 'none';
                            isRevealCardOpen = false;
                            targetRotationSpeed = 0.001;
                        }
                    });
                } else {
                    closeAllRevealCards();
                    targetRotationSpeed = 0;
                    
                    // Position the card near the touchpoint
                    const touchpointRect = touchpoint.getBoundingClientRect();
                    const cardWidth = 200;
                    const cardHeight = 100;
                    const padding = 20;
                    
                    let left = touchpointRect.right + padding;
                    let top = touchpointRect.top;
                    
                    if (left + cardWidth > window.innerWidth) {
                        left = touchpointRect.left - cardWidth - padding;
                    }
                    
                    if (top + cardHeight > window.innerHeight) {
                        top = window.innerHeight - cardHeight - padding;
                    }
                    
                    if (top < padding) {
                        top = padding;
                    }
                    
                    // Position and prepare card for animation
                    card.style.left = `${left}px`;
                    card.style.top = `${top}px`;
                    card.style.display = 'block';
                    card.style.transform = 'translateY(50px)'; // Start from below
                    card.style.opacity = '0';
                    
                    isRevealCardOpen = true;
                    gsap.to(card, {
                        y: 0, // Animate up
                        opacity: 1,
                        duration: animationDuration,
                        ease: 'power2.out'
                    });
                }
            });
        });

        // Add click listener to close cards when clicking anywhere else
        window.addEventListener('click', (event) => {
            // Check if click is outside of touchpoints and reveal cards
            const isClickInsideTouchpoint = Array.from(touchpoints).some(touchpoint => touchpoint.contains(event.target));
            const isClickInsideRevealCard = Array.from(revealCards).some(card => card.contains(event.target));
            
            if (!isClickInsideTouchpoint && !isClickInsideRevealCard) {
                closeAllRevealCards();
            }
        });

        // Update closeAllRevealCards to handle position reset
        const closeAllRevealCards = () => {
            isRevealCardOpen = false;
            targetRotationSpeed = 0.001;
            
            revealCards.forEach((card, index) => {
                if (card.style.display === 'block') {
                    gsap.to(card, {
                        y: 50, // Animate down
                        opacity: 0,
                        duration: 0.5,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            card.style.display = 'none';
                            card.style.left = '';
                            card.style.top = '';
                            const touchpoint = touchpoints[index];
                            gsap.to(touchpoint, {
                                scale: 1.5,
                                duration: 0.3,
                                ease: 'power2.out'
                            });
                        }
                    });
                }
            });
        };

        // After creating the planets but before the animation loop
        const initializePlanets = () => {
            // Force initial render of all planets
            planets.forEach(planet => {
                // Temporarily move each planet to camera's view and render it
                const originalPosition = planet.position.clone();
                planet.position.set(0, 0, 0);
                
                // Force material compilation
                renderer.compile(scene, camera);
                
                // Render one frame of the planet
                renderer.render(scene, camera);
                
                // Move planet back to original position
                planet.position.copy(originalPosition);
            });
        };

        // Call this before starting the animation loop
        window.addEventListener('load', () => {
            initializePlanets();
            currentPlanetIndex = 0;
            planetLink.style.display = 'block';
            gsap.to(planetLink, { opacity: 1, duration: 0.5 });
            
            // Set initial SVG states
            svgs.forEach((svg, i) => {
                if (i === 0) {
                    gsap.set(svg, { scale: 1, opacity: 1 });
                } else {
                    gsap.set(svg, { scale: 0.5, opacity: 1 });
                }
            });
            
            // Start animation loop
            animate();
        });

        // Animation Loop
        animate();


        // Handle window resize
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);
        });

        // Call the function initially and on resize
        setPlanetSizes();
        window.addEventListener('resize', setPlanetSizes);

        // Add ScrollTrigger
        gsap.registerPlugin(ScrollTrigger);

        // Initial setup
        const initFirstPlanetAnimation = () => {
            const headingWrap = document.querySelector('.planet_heading-wrap.is-01');
            const eyebrowWrap = headingWrap.querySelector('.eyebrow-wrap');
            const planetHeading = headingWrap.querySelector('.planet_heading');
            const textWrap = headingWrap.querySelector('.text-wrap');
            const textParagraph = textWrap.querySelector('.text-wrap p');
            const terminalContainer = document.querySelector('.terminal-container.is-01');

            // Show elements but start them invisible
            headingWrap.style.display = 'block';
            terminalContainer.style.display = 'block';

            // Split text
            const splitHeading = new SplitType(planetHeading, { types: 'words' });
            const splitParagraph = new SplitType(textParagraph, { types: 'lines' });

            // Set initial states
            gsap.set([eyebrowWrap, terminalContainer], {
                opacity: 0,
                y: 50,
                filter: 'blur(5px)'
            });

            gsap.set(splitHeading.words, {
                opacity: 0,
                y: 50,
                filter: 'blur(5px)'
            });

            gsap.set(splitParagraph.lines, {
                opacity: 0,
                y: 50,
                filter: 'blur(5px)'
            });

            // Create timeline with ScrollTrigger
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: '#canvas-wrapper',
                    start: 'top 20%', // Triggers when canvas-wrapper is 80% in view
                    toggleActions: 'play none none none'
                }
            });

            tl.to(eyebrowWrap, {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 0.8
            })
            .to(splitHeading.words, {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                stagger: 0.1,
                duration: 0.6
            }, '-=0.6')
            .to(splitParagraph.lines, {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                stagger: 0.1,
                duration: 0.6
            }, '-=0.4')
            .to(terminalContainer, {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 0.8
            }, '-=0.6');
        };

        // Call this after your other initializations
        document.addEventListener('DOMContentLoaded', initFirstPlanetAnimation);

    </script>