class Record3DScene
{
    constructor(fov, near, far)
    {
        let self = this;
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

        // Setup resizing
        window.addEventListener( 'resize', (e) => this.onWindowResize(e), false );
        this.onWindowResize(null);

        // Setup UI
        this.options = {
            modelScale: 1.0,
            modelPointSize: 1.0,
            toggleSound: () => {
                for (let video of self.pointClouds)
                    video.toggleSound();
            },
            toggleVideo: () => {
                for (let video of self.pointClouds)
                    video.toggle();
            },
            toggleMeshPoints: () => {
                for (let video of self.pointClouds) {
                    let newRenderingMode = video.renderingMode === Record3DVideoRenderingMode.MESH ?
                                                Record3DVideoRenderingMode.POINTS : Record3DVideoRenderingMode.MESH;
                    video.switchRenderingTo(newRenderingMode);
                }
            }
        };
        let gui = new dat.gui.GUI();
        gui.add(this.options, 'modelScale').min(1).max(20).step(0.1)
            .onChange(() => {
                for (let ptCloud of self.pointClouds)
                {
                    ptCloud.setScale(self.options.modelScale);
                }
            });

        gui.add(this.options, 'modelPointSize').min(0.1).max(20).step(0.1)
            .onChange(() => {
                for (let ptCloud of self.pointClouds)
                {
                    ptCloud.setPointSize(self.options.modelPointSize);
                }
            });

        gui.add(this.options, 'toggleSound').name('Mute/Unmute');
        gui.add(this.options, 'toggleVideo').name('Play/Pause');
        gui.add(this.options, 'toggleMeshPoints').name('Render points/mesh');
    }

    addVideo(r3dVideo)
    {
        this.pointClouds.push(r3dVideo);
        this.mainScene.add(r3dVideo.videoObject);
    }

    runloop()
    {
        this.renderer.render(this.mainScene, this.camera);
        requestAnimationFrame(() => this.runloop());
    }

    toggleSound()
    {
        for (let ptCloud of this.pointClouds)
        {
            ptCloud.toggleAudio();
        }
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