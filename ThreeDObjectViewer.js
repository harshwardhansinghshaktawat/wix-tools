class ThreeDObjectViewer extends HTMLElement {
  constructor() {
    super();
    
    // Configuration constants
    this.OBJ_FILE_URL = 'https://tmpfiles.org/dl/15684843/intercom_with_screen.obj';
    
    // Animation state
    this.isInViewport = false;
    this.hasEnteredOnce = false;
    this.hasExitedOnce = false;
    this.entryRotation = 0;
    this.exitRotation = 0;
    this.autoRotateSpeed = 0.02;
    
    // Three.js objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.object = null;
    this.animationFrameId = null;
    
    // Intersection Observer
    this.observer = null;
    
    // Library loading flags
    this.librariesLoaded = false;
  }

  connectedCallback() {
    Object.assign(this.style, {
      display: 'block',
      width: '100%',
      height: '100%',
      minHeight: '400px',
      position: 'relative',
      overflow: 'hidden'
    });
    
    this.render();
    this.loadThreeJS(() => {
      setTimeout(() => {
        this.initThreeJS();
        this.setupIntersectionObserver();
        this.animate();
      }, 100);
    });
    
    // Handle resize
    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize);
  }

  disconnectedCallback() {
    // Cleanup
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.controls) {
      this.controls.dispose();
    }
    window.removeEventListener('resize', this.onWindowResize);
  }

  static get observedAttributes() {
    return ['object-url', 'background-color', 'rotation-speed'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (newValue && newValue !== oldValue) {
      if (name === 'object-url') {
        this.OBJ_FILE_URL = newValue;
        if (this.librariesLoaded && this.scene && this.object) {
          this.scene.remove(this.object);
          this.loadOBJModel();
        }
      } else if (name === 'background-color') {
        if (this.scene) {
          this.scene.background = new THREE.Color(newValue);
        }
      } else if (name === 'rotation-speed') {
        this.autoRotateSpeed = parseFloat(newValue) || 0.02;
      }
    }
  }

  render() {
    this.innerHTML = `
      <style>
        #canvas-container {
          width: 100%;
          height: 100%;
          position: relative;
        }
        
        canvas {
          display: block;
          width: 100%;
          height: 100%;
        }
        
        #loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #666;
          font-family: Arial, sans-serif;
          font-size: 16px;
          z-index: 10;
          text-align: center;
        }
        
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
      
      <div id="canvas-container">
        <div id="loading">
          <div class="spinner"></div>
          <div>Loading 3D Model...</div>
        </div>
      </div>
    `;
  }

  loadThreeJS(callback) {
    // Check if THREE.js is already loaded
    if (window.THREE) {
      console.log('THREE.js already loaded');
      this.librariesLoaded = true;
      callback();
      return;
    }

    console.log('Starting to load THREE.js libraries...');

    // Load THREE.js core library (r128 for better compatibility)
    const threeScript = document.createElement('script');
    threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    threeScript.onload = () => {
      console.log('THREE.js core loaded');
      
      // After THREE.js loads, load OBJLoader
      const objLoaderScript = document.createElement('script');
      objLoaderScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js';
      objLoaderScript.onload = () => {
        console.log('OBJLoader loaded');
        
        // After OBJLoader loads, load OrbitControls
        const orbitScript = document.createElement('script');
        orbitScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
        orbitScript.onload = () => {
          console.log('OrbitControls loaded');
          console.log('All THREE.js libraries loaded successfully');
          this.librariesLoaded = true;
          callback();
        };
        orbitScript.onerror = (error) => {
          console.error('Failed to load OrbitControls', error);
          this.showError('Failed to load 3D controls');
        };
        document.head.appendChild(orbitScript);
      };
      objLoaderScript.onerror = (error) => {
        console.error('Failed to load OBJLoader', error);
        this.showError('Failed to load 3D model loader');
      };
      document.head.appendChild(objLoaderScript);
    };
    threeScript.onerror = (error) => {
      console.error('Failed to load THREE.js', error);
      this.showError('Failed to load 3D library');
    };
    document.head.appendChild(threeScript);
  }

  showError(message) {
    const loadingElement = this.querySelector('#loading');
    if (loadingElement) {
      loadingElement.innerHTML = `<div style="color: red;">${message}</div>`;
    }
  }

  initThreeJS() {
    console.log('Initializing THREE.js scene...');
    const container = this.querySelector('#canvas-container');
    const loadingElement = this.querySelector('#loading');
    
    if (!container) {
      console.error('Canvas container not found');
      return;
    }
    
    const rect = container.getBoundingClientRect();
    console.log('Container dimensions:', rect.width, 'x', rect.height);
    
    if (rect.width === 0 || rect.height === 0) {
      console.error('Container has zero dimensions');
      this.showError('Container has no size');
      return;
    }
    
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    
    // Camera setup
    const aspect = rect.width / rect.height;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 2, 8);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(rect.width, rect.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);
    
    console.log('Renderer created');
    
    // Orbit Controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.autoRotate = false;
    
    console.log('Controls initialized');
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);
    
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(5, 5, 5);
    directionalLight1.castShadow = true;
    this.scene.add(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-5, 3, -5);
    this.scene.add(directionalLight2);
    
    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight3.position.set(0, -5, 0);
    this.scene.add(directionalLight3);
    
    console.log('Lights added');
    
    // Load OBJ model
    this.loadOBJModel();
  }

  loadOBJModel() {
    const loadingElement = this.querySelector('#loading');
    
    if (loadingElement) {
      loadingElement.style.display = 'block';
      loadingElement.innerHTML = `
        <div class="spinner"></div>
        <div>Loading 3D Model...</div>
      `;
    }
    
    console.log('Starting to load OBJ model from:', this.OBJ_FILE_URL);
    
    const loader = new THREE.OBJLoader();
    
    loader.load(
      this.OBJ_FILE_URL,
      (obj) => {
        console.log('OBJ model loaded successfully', obj);
        this.object = obj;
        
        // Center and scale the object
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        
        console.log('Model size:', size);
        console.log('Model center:', center);
        console.log('Scale factor:', scale);
        
        obj.scale.multiplyScalar(scale);
        obj.position.sub(center.multiplyScalar(scale));
        
        // Apply material
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshPhongMaterial({
              color: 0x808080,
              shininess: 30,
              flatShading: false,
              side: THREE.DoubleSide
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        this.scene.add(obj);
        if (loadingElement) {
          loadingElement.style.display = 'none';
        }
        console.log('Model added to scene');
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          console.log(`Loading: ${Math.round(percentComplete)}%`);
          if (loadingElement) {
            const progressDiv = loadingElement.querySelector('div:last-child');
            if (progressDiv) {
              progressDiv.textContent = `Loading: ${Math.round(percentComplete)}%`;
            }
          }
        }
      },
      (error) => {
        console.error('Error loading OBJ file:', error);
        if (loadingElement) {
          loadingElement.innerHTML = '<div style="color: red;">Error loading model<br/>Check console for details</div>';
        }
      }
    );
  }

  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: [0, 0.1, 0.5, 0.9, 1.0]
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.isInViewport) {
          // Entering viewport
          console.log('Element entering viewport');
          this.isInViewport = true;
          if (!this.hasEnteredOnce) {
            this.entryRotation = 0;
            this.hasEnteredOnce = true;
          }
        } else if (!entry.isIntersecting && this.isInViewport) {
          // Exiting viewport
          console.log('Element exiting viewport');
          this.isInViewport = false;
          if (!this.hasExitedOnce) {
            this.exitRotation = 0;
            this.hasExitedOnce = true;
          }
        }
      });
    }, options);

    this.observer.observe(this);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    
    if (this.object) {
      // Entry animation - rotate on Y axis when entering
      if (this.isInViewport && this.entryRotation < Math.PI * 2) {
        this.entryRotation += this.autoRotateSpeed * 2;
        this.object.rotation.y = this.entryRotation;
        this.controls.enabled = false; // Disable controls during entry animation
      } 
      // Exit animation - complete full rotation when exiting
      else if (!this.isInViewport && this.hasEnteredOnce && this.exitRotation < Math.PI * 2) {
        this.exitRotation += this.autoRotateSpeed * 2;
        this.object.rotation.y += this.autoRotateSpeed * 2;
        this.controls.enabled = false; // Disable controls during exit animation
      }
      // Normal state - allow user control
      else if (this.isInViewport) {
        this.controls.enabled = true;
        this.controls.update();
      }
    }
    
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  onWindowResize() {
    const container = this.querySelector('#canvas-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const aspect = rect.width / rect.height;
    
    if (this.camera) {
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
    }
    
    if (this.renderer) {
      this.renderer.setSize(rect.width, rect.height);
    }
    
    console.log('Resized to:', rect.width, 'x', rect.height);
  }
}

// Register the custom element
customElements.define('threed-object-viewer', ThreeDObjectViewer);
