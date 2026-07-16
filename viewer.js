var urlParams = new URLSearchParams(window.location.search);
var modelUrl = urlParams.get("model");
var isMini = urlParams.get("mini") === "1";

if (!modelUrl) {
    document.getElementById("loading").innerText = "错误：未找到模型地址";
} else {
    initThree(modelUrl);
}

function initThree(url) {
    var container = document.getElementById("canvas-container");
    var loadingDiv = document.getElementById("loading");

    // mini 模式：简化 UI
    if (isMini) {
        var toolbar = document.getElementById("toolbar");
        var info = document.getElementById("info");
        if (toolbar) toolbar.style.display = "none";
        if (info) info.style.display = "none";
        loadingDiv.style.fontSize = "12px";
    }

    // 1. 场景、相机、渲染器
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2b2b2b);

    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(100, 200, 300);

    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (!isMini) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
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

    // 4. 参考网格（地面，常显）
    var gridHelper = new THREE.GridHelper(500, 50, 0x444444, 0x333333);
    scene.add(gridHelper);

    // 线框叠层容器
    var wireframeGroup = new THREE.Group();
    wireframeGroup.visible = true;
    scene.add(wireframeGroup);

    var wireframeVisible = true;
    var btnGrid = document.getElementById("btn-grid");
    if (btnGrid) {
        btnGrid.addEventListener("click", function () {
            wireframeVisible = !wireframeVisible;
            wireframeGroup.visible = wireframeVisible;
            if (wireframeVisible) {
                btnGrid.classList.add("active");
            } else {
                btnGrid.classList.remove("active");
            }
        });
    }

    // 5. 加载 FBX 模型
    var loader = new THREE.FBXLoader();
    loader.load(url,
        function (object) {
            // 生成线框叠层
            object.traverse(function (child) {
                if (child.isMesh && child.material) {
                    var materials = Array.isArray(child.material) ? child.material : [child.material];
                    for (var m = 0; m < materials.length; m++) {
                        var mat = materials[m];
                        if (mat.color && mat.color.getHex() === 0xffffff) {
                            mat.color.setHex(0x888888);
                        }
                    }
                    try {
                        var edges = new THREE.EdgesGeometry(child.geometry, 30);
                        var line = new THREE.LineSegments(
                            edges,
                            new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1, transparent: true, opacity: 0.4 })
                        );
                        line.position.copy(child.position);
                        line.rotation.copy(child.rotation);
                        line.scale.copy(child.scale);
                        wireframeGroup.add(line);
                    } catch (e) {}
                }
            });

            // ========== BBOX 自适应显示 ==========
            var box = new THREE.Box3().setFromObject(object);
            var center = box.getCenter(new THREE.Vector3());
            var bboxSize = new THREE.Vector3();
            box.getSize(bboxSize);

            // 将模型移至原点
            object.position.x -= center.x;
            object.position.y -= center.y;
            object.position.z -= center.z;
            wireframeGroup.position.copy(object.position);

            // 包围球半径（最长轴的一半）
            var maxDim = Math.max(bboxSize.x, bboxSize.y, bboxSize.z);
            var radius = Math.max(maxDim * 0.5, 1);

            // 基于 FOV 计算刚好容纳模型的距离
            // 公式：distance = radius / sin(fov / 2)
            var fovRad = camera.fov * Math.PI / 180;
            var fitDistance = radius / Math.sin(fovRad / 2);
            var distance = fitDistance * 1.6; // 留 60% 边距，看着不贴边

            // 根据模型比例智能选择相机角度
            var isFlat = bboxSize.y < bboxSize.x * 0.3 && bboxSize.y < bboxSize.z * 0.3;
            var isTall = bboxSize.y > bboxSize.x * 2 || bboxSize.y > bboxSize.z * 2;
            var camX, camY, camZ;
            if (isFlat) {
                // 扁平模型（悬浮岛、地形）：从更上方看
                camX = distance * 0.5;
                camY = distance * 0.85;
                camZ = distance * 0.5;
            } else if (isTall) {
                // 瘦高模型：从侧方看
                camX = distance * 0.8;
                camY = distance * 0.35;
                camZ = distance * 0.6;
            } else {
                // 默认对角线视角
                camX = distance * 0.7;
                camY = distance * 0.5;
                camZ = distance * 0.7;
            }

            camera.position.set(center.x + camX, center.y + camY, center.z + camZ);
            camera.lookAt(center);

            // 同步更新 near/far 裁剪面
            camera.near  = Math.max(0.1, distance * 0.001);
            camera.far   = distance * 15;
            camera.updateProjectionMatrix();

            // 控制器限制
            controls.target.copy(center);
            controls.minDistance = distance * 0.15;
            controls.maxDistance = distance * 8;
            controls.update();

            // 重建网格：尺寸匹配模型
            scene.remove(gridHelper);
            var gridExtent = maxDim * 3;
            var divisions  = Math.min(60, Math.max(20, Math.round(gridExtent / 2)));
            gridHelper = new THREE.GridHelper(gridExtent, divisions, 0x444444, 0x333333);
            gridHelper.position.copy(center);
            gridHelper.position.y = box.min.y + object.position.y - maxDim * 0.01;
            scene.add(gridHelper);

            // 同步方向光阴影范围
            dirLight.shadow.camera.near   = camera.near;
            dirLight.shadow.camera.far    = camera.far;
            dirLight.shadow.camera.left   = -maxDim;
            dirLight.shadow.camera.right  =  maxDim;
            dirLight.shadow.camera.top    =  maxDim;
            dirLight.shadow.camera.bottom = -maxDim;
            dirLight.shadow.camera.updateProjectionMatrix();

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
