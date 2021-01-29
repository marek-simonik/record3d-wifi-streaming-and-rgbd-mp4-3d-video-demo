class Record3DScene
{
    constructor(fov, near, far)
    {
        this.mainScene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();

        // Camera settings
        this.camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, near, far);
        this.camera.position.x = 0.0;
        this.camera.position.y = 0.0;
        this.camera.position.z = 0.2;
        this.camera.lookAt(new THREE.Vector3(0,0,0));

        // Camera control settings
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableZoom = true;
        this.controls.update();

        this.pointClouds = [];

        // Init scene
        this.renderer.setClearColor(new THREE.Color(0x343a40));
        this.renderer.setPixelRatio(window.devicePixelRatio);

        document.body.appendChild(this.renderer.domElement);

        // Add toggle button
        let self = this;
        let toggleButton = document.createElement('button');
        toggleButton.textContent = "Play/Pause";
        toggleButton.id = 'toggle-button';
        toggleButton.onclick = e => {
            for (let video of self.pointClouds)
                video.toggle();
        };
        document.body.appendChild(toggleButton);

        // Setup resizing
        window.addEventListener( 'resize', (e) => this.onWindowResize(e), false );
        this.onWindowResize(null);
    }

    addPointCloud(r3dPointCloud)
    {
        this.pointClouds.push(r3dPointCloud);
        this.mainScene.add(r3dPointCloud.pointCloud);
    }

    runloop()
    {
        this.renderer.render(this.mainScene, this.camera);
        requestAnimationFrame(() => this.runloop());
    }

    resizeRendererToDisplaySize()
    {
        // https://threejsfundamentals.org/threejs/lessons/threejs-responsive.html
        const canvas = this.renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            this.renderer.setSize(width, height, false);
        }
        return needResize;
    }

    onWindowResize(event)
    {
        if (this.resizeRendererToDisplaySize(this.renderer)) {
            const canvas = this.renderer.domElement;
            this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            this.camera.updateProjectionMatrix();
        }
    }
}