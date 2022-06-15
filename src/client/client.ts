import { KeyDisplay } from './utils';
import { CharacterControls } from './characterControls';
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000F0F);

// CAMERA
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 0;
camera.position.z = 10;
camera.position.x = 0;

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true

RectAreaLightUniformsLib.init();

const labelContainerElem = document.querySelector('#labels');

const rectLight1 = new THREE.RectAreaLight( 0xffffff, 5, 4, 7 );
rectLight1.position.set( - 8, 3, -20 );
rectLight1.lookAt( - 8, 3, -4 );

scene.add( rectLight1 );

const rectLight2 = new THREE.RectAreaLight( 0xffffff, 5, 4, 7 );
rectLight2.position.set( 0, 3, -20 )
rectLight2.lookAt( 0, 3, -4 );
scene.add( rectLight2 );

const rectLight3 = new THREE.RectAreaLight( 0xffffff, 5, 4, 7 );
rectLight3.position.set( 8, 3, -20 );
rectLight3.lookAt( 8, 3, -4 );
scene.add( rectLight3 );

/*const texture = new THREE.TextureLoader().load( 'textures/crate.gif' );

const geometry = new THREE.BoxGeometry( 200, 200, 200 );
const material = new THREE.MeshBasicMaterial( { map: texture } );

const mesh = new THREE.Mesh( geometry, material );
mesh.position.set( 5, 5, 5)
scene.add( mesh );*/

scene.add( new RectAreaLightHelper( rectLight1 ) );
scene.add( new RectAreaLightHelper( rectLight2 ) );
scene.add( new RectAreaLightHelper( rectLight3 ) );
const raycaster = new THREE.Raycaster()
const sceneMeshes: THREE.Mesh[] = []
const dir = new THREE.Vector3()
let intersects: THREE.Intersection[] = []
// CONTROLS
//crosshair
const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x0000ff,
})
const points: THREE.Vector3[] = []
points[0] = new THREE.Vector3(-0.1, 0, 0)
points[1] = new THREE.Vector3(0.1, 0, 0)
let lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
const xLine = new THREE.Line(lineGeometry, lineMaterial)
scene.add(xLine)
points[0] = new THREE.Vector3(0, -0.1, 0)
points[1] = new THREE.Vector3(0, 0.1, 0)
lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
const yLine = new THREE.Line(lineGeometry, lineMaterial)
scene.add(yLine)
points[0] = new THREE.Vector3(0, 0, -0.1)
points[1] = new THREE.Vector3(0, 0, 0.1)
lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
const zLine = new THREE.Line(lineGeometry, lineMaterial)
scene.add(zLine)
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true
orbitControls.minDistance = 5
orbitControls.maxDistance = 15
orbitControls.enablePan = false
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05
orbitControls.enableDamping = true
orbitControls.addEventListener('change', function () {
    xLine.position.copy(orbitControls.target)
    yLine.position.copy(orbitControls.target)
    zLine.position.copy(orbitControls.target)

    raycaster.set(
        orbitControls.target,
        dir.subVectors(camera.position, orbitControls.target).normalize()
    )

    intersects = raycaster.intersectObjects(sceneMeshes, false)
    if (intersects.length > 0) {
        if (
            intersects[0].distance < orbitControls.target.distanceTo(camera.position)
        ) {
            camera.position.copy(intersects[0].point)
        }
    }
})
orbitControls.update();

// LIGHTS
light()


// FLOOR
const geoFloor = new THREE.BoxGeometry( 40, 0.01, 40 );
const matStdFloor = new THREE.MeshStandardMaterial( { color: 0x000, roughness: 0.1, metalness: 0 } );
const mshStdFloor = new THREE.Mesh( geoFloor, matStdFloor );
const mirrorFloor = mshStdFloor.clone();

const floorMirror = new Reflector( geoFloor,
    { clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight  * window.devicePixelRatio,
    color: 0x777777 } );
mirrorFloor.add(floorMirror);
scene.add(mshStdFloor);

// MODEL WITH ANIMATIONS
var characterControls: CharacterControls
new GLTFLoader().load('models/walker4.glb', function (gltf) {
    const model = gltf.scene;

    
    model.traverse(function (object: any) {
        if (object.isMesh) object.castShadow = true;
    });
    model.position.y = 0
    model.position.x = 0
    model.position.z = -10
    model.lookAt(0,0,5);
    scene.add(model);

    const gltfAnimations: THREE.AnimationClip[] = gltf.animations;
    const mixer = new THREE.AnimationMixer(model);
    const animationsMap: Map<string, THREE.AnimationAction> = new Map()
    gltfAnimations.filter(a => a.name != 'TPose').forEach((a: THREE.AnimationClip) => {
        animationsMap.set(a.name, mixer.clipAction(a))
    })

    characterControls = new CharacterControls(model, mixer, animationsMap, orbitControls, camera,  'Idle')
});
const loader = new THREE.FontLoader();

loader.load('fonts/font2.json', function (font) {
    const geometry = new THREE.TextGeometry('Crypto-Junkies', {
        font: font,
        size: 0.3,
        height: 0.5,
        curveSegments: 10,
        bevelEnabled: false,
        bevelOffset: 0,
        bevelSegments: 1,
        bevelSize: 0.3,
        bevelThickness: 0.4
    });
    const geometry1 = new THREE.TextGeometry('Crypto-Frens', {
        font: font,
        size: 0.3,
        height: 0.5,
        curveSegments: 10,
        bevelEnabled: false,
        bevelOffset: 0,
        bevelSegments: 1,
        bevelSize: 0.3,
        bevelThickness: 0.4
    });
    const geometry2 = new THREE.TextGeometry('Bessfrens', {
        font: font,
        size: 0.3,
        height: 0.5,
        curveSegments: 10,
        bevelEnabled: false,
        bevelOffset: 0,
        bevelSegments: 1,
        bevelSize: 0.3,
        bevelThickness: 0.4
    });
    const materials = [
        new THREE.MeshPhongMaterial({ color: 0xAAAAAA }), // front
        new THREE.MeshPhongMaterial({ color: 0xFFFFFF }) // side
    ];
    const materialsDesc = [
        new THREE.MeshPhongMaterial({ color: 0x000000 }), // front
        new THREE.MeshPhongMaterial({ color: 0xAAAAAA }) // side
    ];
    const textMesh1 = new THREE.Mesh(geometry, materials);
    textMesh1.castShadow = true
    textMesh1.position.y = 6.7
    textMesh1.position.x = -10.8
    textMesh1.position.z = -20
    const textMesh2 = new THREE.Mesh(geometry1, materials);
    textMesh2.castShadow = true
    textMesh2.position.y = 6.7
    textMesh2.position.x = -2.5
    textMesh2.position.z = -20
    const textMesh3 = new THREE.Mesh(geometry2, materials);
    textMesh3.castShadow = true
    textMesh3.position.y = 6.7
    textMesh3.position.x = 6
    textMesh3.position.z = -20
    
    scene.add(textMesh1)
    scene.add(textMesh2)
    scene.add(textMesh3)

    // Junkies description
    const descriptionGeo = new THREE.TextGeometry("Crypto-Junkies is a handcrafted Limited Collection",
    {
        font: font,
        size: 0.05,
        height: 0.1,
    });
    const descriptionGeoJunk = new THREE.TextGeometry("created by artist sascha salender.",
    {
        font: font,
        size: 0.05,
        height: 0.1,
    });
    const descriptionGeoJunk2 = new THREE.TextGeometry("Every crypto junkie is unique and inspired by the deep",
    {
        font: font,
        size: 0.05,
        height: 0.1,
    });
    const descriptionGeoJunk3 = new THREE.TextGeometry("needs and addictions of modern-day people.",
    {
        font: font,
        size: 0.05,
        height: 0.1,
    });

    const textMeshDesc = new THREE.Mesh(descriptionGeo, materialsDesc);
    const textMeshDesc2 = new THREE.Mesh(descriptionGeoJunk, materialsDesc);
    const textMeshDesc3 = new THREE.Mesh(descriptionGeoJunk2, materialsDesc);
    const textMeshDesc4 = new THREE.Mesh(descriptionGeoJunk3, materialsDesc);

    textMeshDesc.position.y = 3.6
    textMeshDesc.position.x = -9.8
    textMeshDesc.position.z = -20
    textMeshDesc2.position.y = 3.4
    textMeshDesc2.position.x = -9.8
    textMeshDesc2.position.z = -20
    textMeshDesc3.position.y = 3.2
    textMeshDesc3.position.x = -9.8
    textMeshDesc3.position.z = -20
    textMeshDesc4.position.y = 3.0
    textMeshDesc4.position.x = -9.8
    textMeshDesc4.position.z = -20
    scene.add(textMeshDesc)
    scene.add(textMeshDesc2)
    scene.add(textMeshDesc3)
    scene.add(textMeshDesc4)
    const cubegeometry = new THREE.BoxGeometry( 1, 1, 1 );
    const material = new THREE.MeshBasicMaterial( {color: 0xDDDDDD} );
    const material2 = new THREE.MeshBasicMaterial( {color: 0xAAAAAA} );
    const cube = new THREE.Mesh( cubegeometry, material );
    cube.position.x = -6;
    cube.position.z = -6;
    cube.lookAt(0, 0, 0);
    const cube2 = new THREE.Mesh( cubegeometry, material2 );
    cube2.position.x = -6.5;
    cube2.position.y = 0.5;
    cube2.position.z = -6;
    cube.lookAt(-0.5, 0, 0);
    const cube3 = new THREE.Mesh( cubegeometry, material );
    cube3.position.x = -7;
    cube3.position.z = -6;
    cube.lookAt(1, 0, 0);
    /*scene.add( cube );
    scene.add( cube2 );
    scene.add( cube3 );*/
    const descriptionGeoFren = new THREE.TextGeometry("Crypto-Frens is a non generative, handcrafted 1/1",
    {
        font: font,
        size: 0.05,
        height: 0.1,
    });
    const descriptionGeoFren2 = new THREE.TextGeometry("collection of 100 Frens by artist Sascha Salender.",
    {
        font: font,
        size: 0.05,
        height: 0.1,
    });
    const descriptionGeoFren3 = new THREE.TextGeometry("Each Fren is unique in its appearance and has its",
    {
        font: font,
        size: 0.05,
        height: 0.1,
    });
    const descriptionGeoFren4 = new THREE.TextGeometry("own traits.",
    {
        font: font,
        size: 0.05,
        height: 0.1,
    });

    const textMeshDescFren = new THREE.Mesh(descriptionGeoFren, materialsDesc);
    const textMeshDescFren2 = new THREE.Mesh(descriptionGeoFren2, materialsDesc);
    const textMeshDescFren3 = new THREE.Mesh(descriptionGeoFren3, materialsDesc);
    const textMeshDescFren4 = new THREE.Mesh(descriptionGeoFren4, materialsDesc);

    textMeshDescFren.position.y = 3.6
    textMeshDescFren.position.x = -1.8
    textMeshDescFren.position.z = -20
    textMeshDescFren2.position.y = 3.4
    textMeshDescFren2.position.x = -1.8
    textMeshDescFren2.position.z = -20
    textMeshDescFren3.position.y = 3.2
    textMeshDescFren3.position.x = -1.8
    textMeshDescFren3.position.z = -20
    textMeshDescFren4.position.y = 3.0
    textMeshDescFren4.position.x = -1.8
    textMeshDescFren4.position.z = -20
    scene.add(textMeshDescFren)
    scene.add(textMeshDescFren2)
    scene.add(textMeshDescFren3)
    scene.add(textMeshDescFren4)
    const descriptionGeoBessFren = new THREE.TextGeometry("Bessfrens is a 'Frens only' project, that means you",
    {
        font: font,
        size: 0.05,
        height: 0.1,
    });
    const descriptionGeoBessFren2 = new THREE.TextGeometry("could only mint one if you were holding a Fren.",
    {
        font: font,
        size: 0.05,
        height: 0.1,
    });
    const descriptionGeoBessFren3 = new THREE.TextGeometry("Holding a Fren together with a Bessfren grants you",
    {
        font: font,
        size: 0.05,
        height: 0.1,
    });
    const descriptionGeoBessFren4 = new THREE.TextGeometry("VIP access to our following 3D Avatar drop.",
    {
        font: font,
        size: 0.05,
        height: 0.1,
    });

    const textMeshDescBessFren = new THREE.Mesh(descriptionGeoBessFren, materialsDesc);
    const textMeshDescBessFren2 = new THREE.Mesh(descriptionGeoBessFren2, materialsDesc);
    const textMeshDescBessFren3 = new THREE.Mesh(descriptionGeoBessFren3, materialsDesc);
    const textMeshDescBessFren4 = new THREE.Mesh(descriptionGeoBessFren4, materialsDesc);

    textMeshDescBessFren.position.y = 3.6
    textMeshDescBessFren.position.x = 6.2
    textMeshDescBessFren.position.z = -20
    textMeshDescBessFren2.position.y = 3.4
    textMeshDescBessFren2.position.x = 6.2
    textMeshDescBessFren2.position.z = -20
    textMeshDescBessFren3.position.y = 3.2
    textMeshDescBessFren3.position.x = 6.2
    textMeshDescBessFren3.position.z = -20
    textMeshDescBessFren4.position.y = 3.0
    textMeshDescBessFren4.position.x = 6.2
    textMeshDescBessFren4.position.z = -20
    scene.add(textMeshDescBessFren)
    scene.add(textMeshDescBessFren2)
    scene.add(textMeshDescBessFren3)
    scene.add(textMeshDescBessFren4)
});

const loader2 = new THREE.TextureLoader();
const geometry = new THREE.PlaneGeometry(2, 2);
const junkMaterial = new THREE.MeshLambertMaterial({
map: loader2.load('models/junk_pfp.png')});
const frenMaterial = new THREE.MeshLambertMaterial({
    map: loader2.load('models/frens.png')});
const bessFrenMaterial = new THREE.MeshLambertMaterial({
    map: loader2.load('models/bessfrens.png')});    
const junkMesh = new THREE.Mesh(geometry, junkMaterial);
junkMesh.position.y = 5
junkMesh.position.x = -8
junkMesh.position.z = -19.9
const frenMesh = new THREE.Mesh(geometry, frenMaterial);
frenMesh.position.y = 5
frenMesh.position.z = -19.9

const bessFrenMesh = new THREE.Mesh(geometry, bessFrenMaterial);
bessFrenMesh.position.y = 5
bessFrenMesh.position.x = 8
bessFrenMesh.position.z = -19.9
scene.add(frenMesh);
scene.add(junkMesh);
scene.add(bessFrenMesh);

// CONTROL KEYS
const keysPressed = {  }
const keyDisplayQueue = new KeyDisplay();
document.addEventListener('keydown', (event) => {
    keyDisplayQueue.down(event.key)
    if (event.shiftKey && characterControls) {
        characterControls.switchRunToggle()
    } else {
        (keysPressed as any)[event.key.toLowerCase()] = true
    }
}, false);
document.addEventListener('keyup', (event) => {
    keyDisplayQueue.up(event.key);
    (keysPressed as any)[event.key.toLowerCase()] = false
}, false);

const clock = new THREE.Clock();
// ANIMATE
function animate() {
    let mixerUpdateDelta = clock.getDelta();
    if (characterControls) {
        characterControls.update(mixerUpdateDelta, keysPressed);
    }
    orbitControls.update()
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
document.body.appendChild(renderer.domElement);
animate();

// RESIZE HANDLER
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    keyDisplayQueue.updatePosition()
}
window.addEventListener('resize', onWindowResize);

function generateFloor() {
    // TEXTURES
    const textureLoader = new THREE.TextureLoader();
    const placeholder = textureLoader.load("./textures/placeholder/placeholder.png");
    const sandBaseColor = textureLoader.load("./textures/sand/Sand 002_COLOR.jpg");
    const sandNormalMap = textureLoader.load("./textures/sand/Sand 002_NRM.jpg");
    const sandHeightMap = textureLoader.load("./textures/sand/Sand 002_DISP.jpg");
    const sandAmbientOcclusion = textureLoader.load("./textures/sand/Sand 002_OCC.jpg");

    const WIDTH = 80
    const LENGTH = 80

    const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 512, 512);
    const material = new THREE.MeshStandardMaterial(
        {
            map: sandBaseColor, normalMap: sandNormalMap,
            displacementMap: sandHeightMap, displacementScale: 0.1,
            aoMap: sandAmbientOcclusion
        })
    wrapAndRepeatTexture(material.map)
    wrapAndRepeatTexture(material.normalMap)
    wrapAndRepeatTexture(material.displacementMap)
    wrapAndRepeatTexture(material.aoMap)
    // const material = new THREE.MeshPhongMaterial({ map: placeholder})

    const floor = new THREE.Mesh(geometry, material)
    floor.receiveShadow = true
    floor.rotation.x = - Math.PI / 2
    scene.add(floor)
}

function wrapAndRepeatTexture (map: THREE.Texture) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.x = map.repeat.y = 10
}

function light() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.7))

/*    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(0, 100, 0);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = - 50;
    dirLight.shadow.camera.left = - 50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    //scene.add(dirLight);
    scene.add( new THREE.CameraHelper(dirLight.shadow.camera))*/
}