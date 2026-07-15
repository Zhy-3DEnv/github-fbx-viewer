var urlParams = new URLSearchParams(window.location.search);
var modelUrl = urlParams.get("model");

if (!modelUrl) {
    document.getElementById("loading").innerText = "错误：未找到模型地址";
} else {
    initThree(modelUrl);
}

function initThree(url) {
    var container = document.getElementById("canvas-container");
    var loadingDiv = document.getElementById("loading");

    // 1. 场景、相机、渲染器
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2b2b2b);

    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(100, 200, 300);

    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. 轨道控制器
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 100, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.update();

    // 3. 灯光
    var ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);

    var hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    var dirLight = new THREE.DirectionalLight(0xffffff, 4);
    dirLight.position.set(100, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 2000;
    scene.add(dirLight);

    // 4. 参考网格
    var gridHelper = new THREE.GridHelper(500, 50, 0x444444, 0x333333);
    scene.add(gridHelper);

    // 5. 加载 FBX 模型
    var loader = new THREE.FBXLoader();
    loader.load(url,
        function (object) {
            // 自动缩放和居中
            var box = new THREE.Box3().setFromObject(object);
            var size = box.getSize(new THREE.Vector3()).length();
            var center = box.getCenter(new THREE.Vector3());

            object.position.x -= center.x;
            object.position.y -= center.y;
            object.position.z -= center.z;

            camera.position.copy(center);
            camera.position.x += size / 1.5;
            camera.position.y += size / 1.5;
            camera.position.z += size / 1.5;
            camera.lookAt(center);

            controls.target.copy(center);
            controls.maxDistance = size * 10;
            controls.update();

            gridHelper.position.copy(center);
            gridHelper.position.y = box.min.y - 1;

            scene.add(object);
            loadingDiv.style.display = "none";
        },
        function (xhr) {
            if (xhr.total > 0) {
                var percent = Math.round((xhr.loaded / xhr.total) * 100);
                loadingDiv.innerText = "正在加载：" + percent + "%";
            }
        },
        function (error) {
            console.error("FBX 加载失败:", error);
            loadingDiv.innerText = "模型加载失败（可能是私有仓库或跨域限制）";
        }
    );

    // 6. 动画循环
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // 7. 窗口自适应
    window.addEventListener("resize", function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
