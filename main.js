import * as THREE from "three";

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    stencil: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.autoClear = true;
renderer.setClearColor(0x000000, 1);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const world = {
    name: "main",
    scene: new THREE.Scene(),
    portals: [],
};
let currentWorld = world;

function addLighting(scene) {
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(6, 10, 4);
    scene.add(dir);
}

function addAxes(scene, originX, originY, originZ, len = 2.4) {
    const origin = new THREE.Vector3(originX, originY, originZ);
    const mk = (color, end) =>
        new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([origin, end]),
            new THREE.LineBasicMaterial({ color })
        );
    scene.add(
        mk(0xff0000, new THREE.Vector3(originX + len, originY, originZ)),
        mk(0x00ff00, new THREE.Vector3(originX, originY + len, originZ)),
        mk(0x0000ff, new THREE.Vector3(originX, originY, originZ + len))
    );
}

function buildTwoAdjacentRooms(scene) {
    const roomDepth = 18;
    const roomHeight = 10;
    const totalWidth = 36;
    const halfDepth = roomDepth / 2;
    const halfWidth = totalWidth / 2;
    const wallThickness = 0.2;

    const doorWidth = 3.2;
    const doorHeight = 4.2;

    const floorTexture = new THREE.TextureLoader().load("/Floor_texture.png");
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(6, 3);
    floorTexture.colorSpace = THREE.SRGBColorSpace;

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(totalWidth, roomDepth),
        new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: floorTexture,
            roughness: 0.9,
        })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.001;
    scene.add(floor);

    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(totalWidth, roomDepth),
        new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.95 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomHeight;
    scene.add(ceiling);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x2f2f35, roughness: 0.95 });

    const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(totalWidth, roomHeight, wallThickness),
        wallMat
    );
    backWall.position.set(0, roomHeight / 2, -halfDepth);
    scene.add(backWall);

    const frontWall = new THREE.Mesh(
        new THREE.BoxGeometry(totalWidth, roomHeight, wallThickness),
        wallMat
    );
    frontWall.position.set(0, roomHeight / 2, halfDepth);
    scene.add(frontWall);

    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, roomHeight, roomDepth),
        wallMat
    );
    leftWall.position.set(-halfWidth, roomHeight / 2, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, roomHeight, roomDepth),
        wallMat
    );
    rightWall.position.set(halfWidth, roomHeight / 2, 0);
    scene.add(rightWall);

    // Middle wall with a door hole at center.
    const segmentDepth = (roomDepth - doorWidth) / 2;
    const sideA = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, roomHeight, segmentDepth),
        wallMat
    );
    sideA.position.set(0, roomHeight / 2, -(doorWidth / 2 + segmentDepth / 2));
    scene.add(sideA);

    const sideB = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, roomHeight, segmentDepth),
        wallMat
    );
    sideB.position.set(0, roomHeight / 2, doorWidth / 2 + segmentDepth / 2);
    scene.add(sideB);

    const topHeight = roomHeight - doorHeight;
    const topSegment = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, topHeight, doorWidth),
        wallMat
    );
    topSegment.position.set(0, doorHeight + topHeight / 2, 0);
    scene.add(topSegment);
}

addLighting(world.scene);
buildTwoAdjacentRooms(world.scene);

const leftMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 24, 16),
    new THREE.MeshStandardMaterial({ color: 0x00d8ff, emissive: 0x003344, roughness: 0.35, metalness: 0.2 })
);
leftMarker.position.set(-10.5, 1.5, 4.8);
world.scene.add(leftMarker);

const rightMarker = new THREE.Mesh(
    new THREE.ConeGeometry(0.8, 1.7, 24),
    new THREE.MeshStandardMaterial({ color: 0xff4fa3, emissive: 0x330015, roughness: 0.35, metalness: 0.2 })
);
rightMarker.position.set(10.5, 1.5, -4.8);
world.scene.add(rightMarker);

const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.2, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x00ff88 })
);
cube.position.set(-7.5, 1.2, 1.5);
world.scene.add(cube);

const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.8, 0.28, 180, 32),
    new THREE.MeshStandardMaterial({ color: 0xffb300, roughness: 0.38, metalness: 0.55 })
);
knot.position.set(7.5, 1.8, -1.8);
world.scene.add(knot);

addAxes(world.scene, -10, 0.02, 0);
addAxes(world.scene, 10, 0.02, 0);

const portalMaskMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
portalMaskMaterial.transparent = true;
portalMaskMaterial.opacity = 0.0;
portalMaskMaterial.depthWrite = false;
portalMaskMaterial.side = THREE.DoubleSide;

const PORTAL_WIDTH = 2.8;
const PORTAL_HEIGHT = 4.0;
const PORTAL_RT_MIN = 256;
const PORTAL_RT_MAX = renderer.capabilities.maxTextureSize;
const PORTAL_RT_SCALE = 32768;
const PORTAL_RT_DISTANCE_BIAS = 0.01;
const PORTAL_RT_SUPERSAMPLE = Math.max(1, window.devicePixelRatio);
const PORTAL_RT_QUALITY_BOOST = 4.0;

function createPortalFrame(color = 0x66ccff) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.2,
        roughness: 0.25,
        metalness: 0.3,
    });
    const addBar = (w, h, x, y) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), mat);
        m.position.set(x, y, 0);
        group.add(m);
    };
    addBar(0.12, 4.28, -1.46, 0);
    addBar(0.12, 4.28, 1.46, 0);
    addBar(3.04, 0.12, 0, 2.08);
    addBar(3.04, 0.12, 0, -2.08);
    return group;
}

function createPortal(ownerWorld, x, y, z, ry, color) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PORTAL_WIDTH, PORTAL_HEIGHT), portalMaskMaterial);
    mesh.position.set(x, y, z);
    mesh.rotation.y = ry;
    mesh.frustumCulled = false;
    mesh.visible = false;
    ownerWorld.scene.add(mesh);

    const initialRtSize = 1024;
    const rt = new THREE.WebGLRenderTarget(initialRtSize, initialRtSize);
    rt.texture.colorSpace = THREE.SRGBColorSpace;
    const prepassRtLow = new THREE.WebGLRenderTarget(PORTAL_RT_MIN, PORTAL_RT_MIN);
    prepassRtLow.texture.colorSpace = THREE.SRGBColorSpace;
    const prepassRtMid = new THREE.WebGLRenderTarget(PORTAL_RT_MIN, PORTAL_RT_MIN);
    prepassRtMid.texture.colorSpace = THREE.SRGBColorSpace;

    const portalCam = new THREE.PerspectiveCamera(75, 1, 0.01, 1000);
    portalCam.matrixAutoUpdate = false;
    const portalCamL2 = new THREE.PerspectiveCamera(75, 1, 0.01, 1000);
    portalCamL2.matrixAutoUpdate = false;
    const portalCamL3 = new THREE.PerspectiveCamera(75, 1, 0.01, 1000);
    portalCamL3.matrixAutoUpdate = false;

    const frontSurface = new THREE.Mesh(
        new THREE.PlaneGeometry(PORTAL_WIDTH, PORTAL_HEIGHT),
        new THREE.MeshBasicMaterial({ map: rt.texture, side: THREE.FrontSide })
    );
    frontSurface.position.copy(mesh.position);
    frontSurface.quaternion.copy(mesh.quaternion);
    frontSurface.position.add(
        new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.quaternion).multiplyScalar(0.004)
    );
    frontSurface.frustumCulled = false;
    ownerWorld.scene.add(frontSurface);

    const backSurface = new THREE.Mesh(
        new THREE.PlaneGeometry(PORTAL_WIDTH, PORTAL_HEIGHT),
        new THREE.MeshBasicMaterial({ map: rt.texture, side: THREE.BackSide })
    );
    backSurface.position.copy(mesh.position);
    backSurface.quaternion.copy(mesh.quaternion);
    backSurface.position.add(
        new THREE.Vector3(0, 0, -1).applyQuaternion(mesh.quaternion).multiplyScalar(0.004)
    );
    backSurface.frustumCulled = false;
    ownerWorld.scene.add(backSurface);

    const frame = createPortalFrame(color);
    frame.position.copy(mesh.position);
    frame.rotation.copy(mesh.rotation);
    frame.traverse((obj) => {
        obj.frustumCulled = false;
    });
    ownerWorld.scene.add(frame);

    const cameraMarker = { position: new THREE.Vector3() };

    return {
        mesh,
        frame,
        frontSurface,
        backSurface,
        renderTarget: rt,
        currentRtSize: initialRtSize,
        prepassTargets: [prepassRtLow, prepassRtMid],
        prepassSizes: [PORTAL_RT_MIN, PORTAL_RT_MIN],
        camera: portalCam,
        levelCameras: [portalCam, portalCamL2, portalCamL3],
        cameraMarker,
        world: ownerWorld,
        destination: null,
        enabled: true,
        entrySign: 1,
        wallInfo: null,
    };
}

function syncPortalVisuals(portal) {
    portal.frame.position.copy(portal.mesh.position);
    portal.frame.quaternion.copy(portal.mesh.quaternion);

    const portalForward = new THREE.Vector3(0, 0, 1).applyQuaternion(portal.mesh.quaternion);
    portal.frontSurface.position.copy(portal.mesh.position).addScaledVector(portalForward, 0.004);
    portal.frontSurface.quaternion.copy(portal.mesh.quaternion);
    portal.backSurface.position.copy(portal.mesh.position).addScaledVector(portalForward, -0.004);
    portal.backSurface.quaternion.copy(portal.mesh.quaternion);
}

// Perpendicular portals: left room back wall, right room side wall.
// Portal A must face +Z (into the room), so rotation is 0.
const portalA = createPortal(world, -9, 2, -8.5, 0, 0x66ccff);
const portalB = createPortal(world, 17.5, 2, 0, -Math.PI / 2, 0xff66aa);
portalA.destination = portalB;
portalB.destination = portalA;
// Blue is entered while moving opposite portal normal, pink is the opposite.
portalA.entrySign = 1;
portalB.entrySign = 1;
world.portals.push(portalA, portalB);

// Debug projection panel (top-right): rows are L1/L2/L3, columns are blue/pink portals.
const projectionPanel = {
    width: 248,
    height: 372,
    right: 12,
    top: 244,
    gap: 6,
    cols: 2,
    rows: 3,
};
const projectionDebugScene = new THREE.Scene();
const projectionDebugCamera = new THREE.OrthographicCamera(
    0,
    projectionPanel.width,
    projectionPanel.height,
    0,
    -10,
    10
);
const projectionTitle = document.createElement("div");
projectionTitle.style.position = "fixed";
projectionTitle.style.top = `${projectionPanel.top - 18}px`;
projectionTitle.style.right = `${projectionPanel.right}px`;
projectionTitle.style.color = "#fff";
projectionTitle.style.fontFamily = "monospace";
projectionTitle.style.fontSize = "11px";
projectionTitle.style.opacity = "0.9";
projectionTitle.style.pointerEvents = "none";
projectionTitle.textContent = "Portal projections: L1 / L2 / L3";
document.body.appendChild(projectionTitle);

function makeProjectionQuad(texture, x, y, w, h, tint = 0xffffff) {
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({
            map: texture,
            color: tint,
            depthTest: false,
            depthWrite: false,
        })
    );
    mesh.position.set(x + w * 0.5, y + h * 0.5, 1);
    projectionDebugScene.add(mesh);
}

{
    const cellW = (projectionPanel.width - projectionPanel.gap * (projectionPanel.cols + 1)) / projectionPanel.cols;
    const cellH = (projectionPanel.height - projectionPanel.gap * (projectionPanel.rows + 1)) / projectionPanel.rows;
    const xA = projectionPanel.gap;
    const xB = projectionPanel.gap * 2 + cellW;
    const yL1 = projectionPanel.height - projectionPanel.gap - cellH;
    const yL2 = yL1 - projectionPanel.gap - cellH;
    const yL3 = yL2 - projectionPanel.gap - cellH;

    makeProjectionQuad(portalA.renderTarget.texture, xA, yL1, cellW, cellH, 0x99dfff);
    makeProjectionQuad(portalB.renderTarget.texture, xB, yL1, cellW, cellH, 0xffb3d6);
    makeProjectionQuad(portalA.prepassTargets[1].texture, xA, yL2, cellW, cellH, 0x99dfff);
    makeProjectionQuad(portalB.prepassTargets[1].texture, xB, yL2, cellW, cellH, 0xffb3d6);
    makeProjectionQuad(portalA.prepassTargets[0].texture, xA, yL3, cellW, cellH, 0x99dfff);
    makeProjectionQuad(portalB.prepassTargets[0].texture, xB, yL3, cellW, cellH, 0xffb3d6);
}

const playerYaw = new THREE.Object3D();
const playerPitch = new THREE.Object3D();
const EYE_HEIGHT = 1.7;
playerYaw.position.set(-11, EYE_HEIGHT, 5.8);
playerPitch.add(camera);
playerYaw.add(playerPitch);
camera.position.set(0, 0, 0);

const moveState = { forward: false, backward: false, left: false, right: false };
const slowArrowState = { up: false, down: false, left: false, right: false };
let verticalVelocity = 0;
let onGround = true;
let teleportCooldown = 0;
const playerCarryVelocity = new THREE.Vector3();
let playerRoll = 0;

const GRAVITY = -24;
const MOVE_SPEED = 6;
const JUMP_SPEED = 8.5;
const CAMERA_AUTO_LEVEL_SPEED = THREE.MathUtils.degToRad(300);
const PLAYER_RADIUS = 0.35;
const WORLD_HALF_X = 17.7;
const WORLD_HALF_Z = 8.7;
const PORTAL_HALF_WIDTH = 1.4;
const PORTAL_HALF_HEIGHT = 2.0;
const clock = new THREE.Clock();

const BALL_RADIUS = 0.23;
const BALL_SHOOT_SPEED = 18;
const BALL_MAX_COUNT = 20;
const BALL_BOUNCE = 0.62;
const BALL_FRICTION = 0.84;
const BALL_AIR_DRAG = 0.995;
const BALL_RESTITUTION = 0.86;
const BALL_GRAVITY = -18;
const BALL_PORTAL_COOLDOWN = 0.08;
const BALL_INDICATOR_RADIUS = 4.5;
const PORTAL_PROJECTILE_RADIUS = 0.08;
const PORTAL_PROJECTILE_SPEED = 36;
const PORTAL_PROJECTILE_MAX = 40;
const PORTAL_PROJECTILE_LIFETIME = 2.5;
const PORTAL_OVERLAP_PADDING = 0.06;
const PORTAL_SAME_WALL_BUFFER = 0.08;
const PORTAL_PLACE_EFFECT_DURATION = 0.16;
const PORTAL_PLACE_EFFECT_START_SCALE = 0.18;
const BALL_PORTAL_CONTACT_DISTANCE = BALL_RADIUS * 1.01;
const BALL_PORTAL_TRANSIT_MAX_TIME = 0.3;
const ROOM_HEIGHT = 10;
const MIDDLE_WALL_HALF_THICKNESS = 0.1;
const DOOR_WIDTH = 3.2;
const DOOR_HEIGHT = 4.2;
const VISUAL_OUTER_WALL_HALF_X = 17.9;
const VISUAL_OUTER_WALL_HALF_Z = 8.9;

const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 18, 14);
const portalProjectileGeometry = new THREE.SphereGeometry(PORTAL_PROJECTILE_RADIUS, 12, 8);
const balls = [];
const portalProjectiles = [];
const portalPlacementEffects = [];
let ballShotCount = 0;
const WEAPON_BALL = "ball";
const WEAPON_PORTAL = "portal";
let currentWeapon = WEAPON_BALL;

const hud = document.createElement("div");
hud.style.position = "fixed";
hud.style.top = "12px";
hud.style.left = "12px";
hud.style.padding = "10px 12px";
hud.style.background = "rgba(0,0,0,0.45)";
hud.style.color = "#fff";
hud.style.fontFamily = "monospace";
hud.style.fontSize = "13px";
hud.style.borderRadius = "8px";
hud.style.userSelect = "none";
hud.textContent = "Click lock | W/A/S/D + Space | Cyan arrow: portal front | Yellow arrow: your exit direction";
document.body.appendChild(hud);

const minimapCanvas = document.createElement("canvas");
minimapCanvas.width = 220;
minimapCanvas.height = 220;
minimapCanvas.style.position = "fixed";
minimapCanvas.style.top = "12px";
minimapCanvas.style.right = "12px";
minimapCanvas.style.border = "1px solid rgba(255,255,255,0.35)";
minimapCanvas.style.background = "rgba(0,0,0,0.45)";
minimapCanvas.style.borderRadius = "8px";
minimapCanvas.style.pointerEvents = "none";
document.body.appendChild(minimapCanvas);
const minimapCtx = minimapCanvas.getContext("2d");
const minimapDir = new THREE.Vector3();
const minimapTarget = new THREE.Vector3();

const weaponIndicatorCanvas = document.createElement("canvas");
weaponIndicatorCanvas.width = 72;
weaponIndicatorCanvas.height = 72;
weaponIndicatorCanvas.style.position = "fixed";
weaponIndicatorCanvas.style.left = "50%";
weaponIndicatorCanvas.style.top = "50%";
weaponIndicatorCanvas.style.transform = "translate(-50%, -50%)";
weaponIndicatorCanvas.style.pointerEvents = "none";
weaponIndicatorCanvas.style.zIndex = "10";
document.body.appendChild(weaponIndicatorCanvas);
const weaponIndicatorCtx = weaponIndicatorCanvas.getContext("2d");

function drawWeaponIndicator() {
    const ctx = weaponIndicatorCtx;
    const w = weaponIndicatorCanvas.width;
    const h = weaponIndicatorCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    ctx.clearRect(0, 0, w, h);

    if (currentWeapon === WEAPON_BALL) {
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.beginPath();
        ctx.arc(cx, cy, BALL_INDICATOR_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        return;
    }

    // Portal gun indicator: two thin half-moons facing each other.
    const rOuter = 17;
    const rInner = 13.5;

    ctx.fillStyle = "rgba(102,204,255,0.95)";
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, Math.PI / 2, (3 * Math.PI) / 2, false);
    ctx.arc(cx, cy, rInner, (3 * Math.PI) / 2, Math.PI / 2, true);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255,102,170,0.95)";
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, -Math.PI / 2, Math.PI / 2, false);
    ctx.arc(cx, cy, rInner, Math.PI / 2, -Math.PI / 2, true);
    ctx.closePath();
    ctx.fill();
}

function worldToMap(x, z, bounds) {
    const sx = (x - bounds.minX) / (bounds.maxX - bounds.minX);
    const sy = (z - bounds.minZ) / (bounds.maxZ - bounds.minZ);
    return {
        x: sx * minimapCanvas.width,
        y: (1 - sy) * minimapCanvas.height,
    };
}

function drawArrow2D(ctx, x, y, dx, dy, color, len = 16) {
    const mag = Math.hypot(dx, dy) || 1;
    const ux = dx / mag;
    const uy = dy / mag;
    const ex = x + ux * len;
    const ey = y + uy * len;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    const hx = -uy;
    const hy = ux;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - ux * 6 + hx * 4, ey - uy * 6 + hy * 4);
    ctx.lineTo(ex - ux * 6 - hx * 4, ey - uy * 6 - hy * 4);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function drawMinimap() {
    const ctx = minimapCtx;
    const w = minimapCanvas.width;
    const h = minimapCanvas.height;
    ctx.clearRect(0, 0, w, h);

    let minX = -WORLD_HALF_X;
    let maxX = WORLD_HALF_X;
    let minZ = -WORLD_HALF_Z;
    let maxZ = WORLD_HALF_Z;

    for (const portal of world.portals) {
        const c = portal.cameraMarker.position;
        minX = Math.min(minX, c.x);
        maxX = Math.max(maxX, c.x);
        minZ = Math.min(minZ, c.z);
        maxZ = Math.max(maxZ, c.z);
    }

    const mapMargin = 1.4;
    minX -= mapMargin;
    maxX += mapMargin;
    minZ -= mapMargin;
    maxZ += mapMargin;

    const bounds = { minX, maxX, minZ, maxZ };

    // Room bounds
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // Middle wall with door opening
    const wallTop = worldToMap(0, WORLD_HALF_Z, bounds);
    const doorTop = worldToMap(0, DOOR_WIDTH * 0.5, bounds);
    const doorBottom = worldToMap(0, -DOOR_WIDTH * 0.5, bounds);
    const wallBottom = worldToMap(0, -WORLD_HALF_Z, bounds);
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wallTop.x, wallTop.y);
    ctx.lineTo(doorTop.x, doorTop.y);
    ctx.moveTo(doorBottom.x, doorBottom.y);
    ctx.lineTo(wallBottom.x, wallBottom.y);
    ctx.stroke();

    // Portals: draw as width line + facing direction arrow
    for (const portal of world.portals) {
        const pColor = portal === portalA ? "#66ccff" : "#ff66aa";

        portal.mesh.getWorldPosition(tmpWorldPos);
        const center = worldToMap(tmpWorldPos.x, tmpWorldPos.z, bounds);
        const quat = portal.mesh.getWorldQuaternion(tmpQuat);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat).normalize();
        const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(quat).normalize();

        const start = worldToMap(
            tmpWorldPos.x - right.x * (PORTAL_WIDTH * 0.5),
            tmpWorldPos.z - right.z * (PORTAL_WIDTH * 0.5),
            bounds
        );
        const end = worldToMap(
            tmpWorldPos.x + right.x * (PORTAL_WIDTH * 0.5),
            tmpWorldPos.z + right.z * (PORTAL_WIDTH * 0.5),
            bounds
        );

        ctx.strokeStyle = pColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        drawArrow2D(ctx, center.x, center.y, normal.x, -normal.z, pColor, 15);
    }

    // Portal camera positions + view directions
    for (const portal of world.portals) {
        const camPos = portal.cameraMarker.position;
        const camMap = worldToMap(camPos.x, camPos.z, bounds);
        const cColor = portal === portalA ? "#7df3ff" : "#ff9bca";
        ctx.fillStyle = cColor;
        ctx.beginPath();
        ctx.arc(camMap.x, camMap.y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        portal.destination.mesh.getWorldPosition(minimapTarget);
        minimapDir.copy(minimapTarget).sub(camPos).normalize();
        drawArrow2D(ctx, camMap.x, camMap.y, minimapDir.x, -minimapDir.z, cColor, 13);
    }

    // Player: position + look direction
    const playerMap = worldToMap(playerYaw.position.x, playerYaw.position.z, bounds);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(playerMap.x, playerMap.y, 5.5, 0, Math.PI * 2);
    ctx.fill();

    camera.getWorldDirection(minimapDir).normalize();
    drawArrow2D(ctx, playerMap.x, playerMap.y, minimapDir.x, -minimapDir.z, "#ffd84d", 20);
}

renderer.domElement.addEventListener("click", () => renderer.domElement.requestPointerLock());
document.addEventListener("pointerlockchange", () => {
    hud.style.opacity = document.pointerLockElement === renderer.domElement ? "0.35" : "1";
});
document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});
document.addEventListener("mousedown", (e) => {
    if (e.button !== 0 && e.button !== 2) return;
    if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
        return;
    }
    if (currentWeapon === WEAPON_BALL) {
        if (e.button === 0) shootBall();
        return;
    }
    if (e.button === 0) shootPortalProjectile(0x66ccff);
    if (e.button === 2) shootPortalProjectile(0xff66aa);
});
document.addEventListener(
    "wheel",
    (e) => {
        if (Math.abs(e.deltaY) < 0.01) return;
        currentWeapon = currentWeapon === WEAPON_BALL ? WEAPON_PORTAL : WEAPON_BALL;
        drawWeaponIndicator();
    },
    { passive: true }
);
drawWeaponIndicator();
document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement !== renderer.domElement) return;
    const sens = 0.0022;
    playerYaw.rotation.y -= e.movementX * sens;
    playerPitch.rotation.x -= e.movementY * sens;
    playerPitch.rotation.x = THREE.MathUtils.clamp(
        playerPitch.rotation.x,
        -Math.PI / 2 + 0.01,
        Math.PI / 2 - 0.01
    );
});
document.addEventListener("keydown", (e) => {
    if (e.code === "KeyW") moveState.forward = true;
    if (e.code === "KeyS") moveState.backward = true;
    if (e.code === "KeyA") moveState.left = true;
    if (e.code === "KeyD") moveState.right = true;
    if (e.code === "ArrowUp") slowArrowState.up = true;
    if (e.code === "ArrowDown") slowArrowState.down = true;
    if (e.code === "ArrowLeft") slowArrowState.left = true;
    if (e.code === "ArrowRight") slowArrowState.right = true;
    if (e.code === "Space" && onGround) {
        verticalVelocity = JUMP_SPEED;
        onGround = false;
    }
});
document.addEventListener("keyup", (e) => {
    if (e.code === "KeyW") moveState.forward = false;
    if (e.code === "KeyS") moveState.backward = false;
    if (e.code === "KeyA") moveState.left = false;
    if (e.code === "KeyD") moveState.right = false;
    if (e.code === "ArrowUp") slowArrowState.up = false;
    if (e.code === "ArrowDown") slowArrowState.down = false;
    if (e.code === "ArrowLeft") slowArrowState.left = false;
    if (e.code === "ArrowRight") slowArrowState.right = false;
});

const virtualCameraMatrix = new THREE.Matrix4();
const virtualCameraPosition = new THREE.Vector3();
const destinationCenter = new THREE.Vector3();
const portalCornerWorld = new THREE.Vector3();
const portalCornerCamera = new THREE.Vector3();
const portalCorners = [
    new THREE.Vector3(-PORTAL_WIDTH * 0.5, PORTAL_HEIGHT * 0.5, 0),
    new THREE.Vector3(PORTAL_WIDTH * 0.5, PORTAL_HEIGHT * 0.5, 0),
    new THREE.Vector3(-PORTAL_WIDTH * 0.5, -PORTAL_HEIGHT * 0.5, 0),
    new THREE.Vector3(PORTAL_WIDTH * 0.5, -PORTAL_HEIGHT * 0.5, 0),
];
const clipRotationY = new THREE.Matrix4().makeRotationY(Math.PI);
const invSourcePortal = new THREE.Matrix4();
const oneScale = new THREE.Vector3(1, 1, 1);
const destNormalWorld = new THREE.Vector3();
const sideToPlayer = new THREE.Vector3();

function updatePortalSideVisibility(portal, viewerPosition = playerYaw.position) {
    portal.mesh.getWorldPosition(tmpWorldPos);
    tmpNormal.set(0, 0, 1).applyQuaternion(portal.mesh.getWorldQuaternion(tmpQuat)).normalize();
    sideToPlayer.copy(viewerPosition).sub(tmpWorldPos);
    const frontSide = tmpNormal.dot(sideToPlayer) >= 0;
    portal.frontSurface.visible = frontSide;
    // One-sided portal: from behind, render nothing.
    portal.backSurface.visible = false;
}

function configurePortalCamera(portal) {
    configurePortalCameraFromPosition(portal, playerYaw.position, portal.camera);
}

function configurePortalCameraFromPosition(portal, referencePosition, targetCamera) {
    const source = portal.mesh;
    const destination = portal.destination.mesh;
    const portalCam = targetCamera;

    // Virtual camera transform from player POSITION relative to source portal.
    // Intentionally independent from where the player is looking.
    virtualCameraMatrix
        .copy(destination.matrixWorld)
        .multiply(clipRotationY)
        .multiply(invSourcePortal.copy(source.matrixWorld).invert());

    virtualCameraPosition.copy(referencePosition).applyMatrix4(virtualCameraMatrix);
    destination.getWorldQuaternion(tmpQuat);
    const virtualCameraQuat = new THREE.Quaternion()
        .copy(tmpQuat)
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));

    portalCam.matrixWorld.compose(virtualCameraPosition, virtualCameraQuat, oneScale);
    portalCam.matrixWorldInverse.copy(portalCam.matrixWorld).invert();
    portalCam.matrixAutoUpdate = false;

    // Off-axis projection:
    // transform so portal center is origin + portal plane in XY,
    // then apply shear by asymmetric frustum from portal corner rays.
    destination.getWorldPosition(destinationCenter);
    destNormalWorld.set(0, 0, 1).applyQuaternion(tmpQuat).normalize();
    const nearDistance = Math.max(
        0.02,
        Math.abs(destNormalWorld.dot(sideToPlayer.copy(virtualCameraPosition).sub(destinationCenter)))
    );

    let left = Infinity;
    let right = -Infinity;
    let top = -Infinity;
    let bottom = Infinity;

    for (const c of portalCorners) {
        portalCornerWorld.copy(c).applyMatrix4(destination.matrixWorld);
        portalCornerCamera.copy(portalCornerWorld).applyMatrix4(portalCam.matrixWorldInverse);
        const z = Math.max(0.0001, -portalCornerCamera.z);
        const sx = nearDistance * (portalCornerCamera.x / z);
        const sy = nearDistance * (portalCornerCamera.y / z);
        left = Math.min(left, sx);
        right = Math.max(right, sx);
        bottom = Math.min(bottom, sy);
        top = Math.max(top, sy);
    }

    if (Number.isFinite(left) && Number.isFinite(right) && Number.isFinite(top) && Number.isFinite(bottom)) {
        portalCam.projectionMatrix.makePerspective(left, right, top, bottom, nearDistance, 1000);
        portalCam.projectionMatrixInverse.copy(portalCam.projectionMatrix).invert();
    }

    if (portalCam === portal.camera) {
        portal.cameraMarker.position.setFromMatrixPosition(portalCam.matrixWorld);
    }
}

function updatePortalTextures() {
    // Start hidden, then selectively enable while rendering portal textures.
    for (const portal of world.portals) {
        portal.frontSurface.visible = false;
        portal.backSurface.visible = false;
    }

    const finalRtSizes = new Map();
    for (const portal of world.portals) {
        // Scale quality by perpendicular distance to the portal plane.
        portal.mesh.getWorldPosition(tmpWorldPos);
        tmpNormal.set(0, 0, 1).applyQuaternion(portal.mesh.getWorldQuaternion(tmpQuat)).normalize();
        const distanceToPlayer = Math.abs(
            tmpNormal.dot(sideToPlayer.copy(playerYaw.position).sub(tmpWorldPos))
        );
        updatePortalRenderTargetResolution(portal, distanceToPlayer);
        finalRtSizes.set(portal, portal.currentRtSize);

        // Build camera hierarchy:
        // L1 uses player position, L2 uses L1 camera position, L3 uses L2 camera position.
        configurePortalCameraFromPosition(portal, playerYaw.position, portal.levelCameras[0]);
        tmpWorldPos.setFromMatrixPosition(portal.levelCameras[0].matrixWorld);
        configurePortalCameraFromPosition(portal, tmpWorldPos, portal.levelCameras[1]);
        tmpWorldPos.setFromMatrixPosition(portal.levelCameras[1].matrixWorld);
        configurePortalCameraFromPosition(portal, tmpWorldPos, portal.levelCameras[2]);
    }

    const setAllPortalSurfaceTextures = (textureSelector) => {
        for (const portal of world.portals) {
            portal.frontSurface.material.map = textureSelector(portal);
            portal.backSurface.material.map = textureSelector(portal);
            portal.frontSurface.material.needsUpdate = true;
            portal.backSurface.material.needsUpdate = true;
        }
    };

    const setPortalTexturesFromLevel = (levelKey) => {
        if (levelKey === "final") {
            setAllPortalSurfaceTextures((portal) => portal.renderTarget.texture);
            return;
        }
        if (levelKey === "l3") {
            setAllPortalSurfaceTextures((portal) => portal.prepassTargets[0].texture);
            return;
        }
        // levelKey === "l2"
        setAllPortalSurfaceTextures((portal) => portal.prepassTargets[1].texture);
    };

    const renderPortalPrepass = (scale, prepassIndex, cameraLevelIndex, sampledLevelKey) => {
        // Ensure portal surfaces are updated immediately before this pass.
        setPortalTexturesFromLevel(sampledLevelKey);
        for (const portal of world.portals) {
            // Allow seeing recursive portal iterations by keeping destination surface visible,
            // but hide the destination portal surface (camera sits at that portal plane)
            // to avoid direct self-feedback.
            const activeCamPos = tmpWorldPos.setFromMatrixPosition(
                portal.levelCameras[cameraLevelIndex].matrixWorld
            );
            for (const p of world.portals) {
                updatePortalSideVisibility(p, activeCamPos);
            }
            portal.destination.frontSurface.visible = false;
            portal.destination.backSurface.visible = false;

            const finalSize = finalRtSizes.get(portal);
            const target = portal.prepassTargets[prepassIndex];
            const passSize = quantizePortalResolution(
                Math.max(PORTAL_RT_MIN, finalSize * scale)
            );
            if (portal.prepassSizes[prepassIndex] !== passSize) {
                target.setSize(passSize, passSize);
                portal.prepassSizes[prepassIndex] = passSize;
            }
            renderer.setRenderTarget(target);
            renderer.clear();
            renderer.render(currentWorld.scene, portal.levelCameras[cameraLevelIndex]);
        }
    };

    const renderPortalFinalPass = () => {
        // Ensure level-1 samples the intended level textures right before final render.
        setPortalTexturesFromLevel("l2");
        for (const portal of world.portals) {
            const activeCamPos = tmpWorldPos.setFromMatrixPosition(
                portal.levelCameras[0].matrixWorld
            );
            for (const p of world.portals) {
                updatePortalSideVisibility(p, activeCamPos);
            }
            portal.destination.frontSurface.visible = false;
            portal.destination.backSurface.visible = false;

            const finalSize = finalRtSizes.get(portal);
            if (portal.currentRtSize !== finalSize) {
                portal.renderTarget.setSize(finalSize, finalSize);
                portal.currentRtSize = finalSize;
            }
            renderer.setRenderTarget(portal.renderTarget);
            renderer.clear();
            renderer.render(currentWorld.scene, portal.levelCameras[0]);
        }
    };

    // Render deepest first with destination-texture chaining:
    // final textures -> L3 at 10% -> use L3 textures -> L2 at 10% -> use L2 textures -> L1 final.
    renderPortalPrepass(0.1, 0, 2, "final");
    renderPortalPrepass(0.1, 1, 1, "l3");
    renderPortalFinalPass();
    setPortalTexturesFromLevel("final");
    renderer.setRenderTarget(null);

    for (const portal of world.portals) {
        updatePortalSideVisibility(portal);
    }
}

function quantizePortalResolution(size) {
    const clamped = THREE.MathUtils.clamp(size, PORTAL_RT_MIN, PORTAL_RT_MAX);
    const pow2 = 2 ** Math.ceil(Math.log2(clamped));
    return THREE.MathUtils.clamp(pow2, PORTAL_RT_MIN, PORTAL_RT_MAX);
}

function updatePortalRenderTargetResolution(portal, distanceToPlayer) {
    const inverseDistanceScaled =
        (PORTAL_RT_SCALE * PORTAL_RT_SUPERSAMPLE * PORTAL_RT_QUALITY_BOOST) /
        (distanceToPlayer + PORTAL_RT_DISTANCE_BIAS);
    const clamped = THREE.MathUtils.clamp(inverseDistanceScaled, PORTAL_RT_MIN, PORTAL_RT_MAX);
    const targetSize = quantizePortalResolution(clamped);

    if (portal.currentRtSize !== targetSize) {
        portal.renderTarget.setSize(targetSize, targetSize);
        portal.currentRtSize = targetSize;
    }
}

const tmpWorldPos = new THREE.Vector3();
const tmpLocalPos = new THREE.Vector3();
const tmpNormal = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const sourceInverse = new THREE.Matrix4();
const teleportRot = new THREE.Matrix4().makeRotationY(Math.PI);
const teleportMat = new THREE.Matrix4();
const tmpForward = new THREE.Vector3();
const transformedDir = new THREE.Vector3();
const tmpPrevDelta = new THREE.Vector3();
const tmpCurDelta = new THREE.Vector3();
const tmpMoveDelta = new THREE.Vector3();
const tmpHitPoint = new THREE.Vector3();
const tmpRemainingMove = new THREE.Vector3();
const ballPrevPos = new THREE.Vector3();
const cameraShootOrigin = new THREE.Vector3();
const cameraShootDir = new THREE.Vector3();
const playerLookDir = new THREE.Vector3();
const transformedLookDir = new THREE.Vector3();
const normalBuffer = new THREE.Vector3();
const tangentBuffer = new THREE.Vector3();
const delta = new THREE.Vector3();
const pairNormal = new THREE.Vector3();
const relVel = new THREE.Vector3();
const impulse = new THREE.Vector3();
const tmpProjectilePos = new THREE.Vector3();
const tmpProjectileHitPoint = new THREE.Vector3();
const tmpProjectileHitNormal = new THREE.Vector3();
const portalPlaceQuat = new THREE.Quaternion();
const portalTwistQuat = new THREE.Quaternion();
const portalTopCurrent = new THREE.Vector3();
const portalTopDesired = new THREE.Vector3();
const worldUp = new THREE.Vector3(0, 1, 0);
const portalCandidateQuat = new THREE.Quaternion();
const axisX = new THREE.Vector3(1, 0, 0);
const axisY = new THREE.Vector3(0, 1, 0);
const playerUpDir = new THREE.Vector3();
const transformedUpDir = new THREE.Vector3();
const baseUpAfterTeleport = new THREE.Vector3();
const projectedBaseUp = new THREE.Vector3();
const projectedTransformedUp = new THREE.Vector3();
const rollCross = new THREE.Vector3();
const playerMoveDelta = new THREE.Vector3();
const transformedPlayerMove = new THREE.Vector3();
const portalCandidateCenter = new THREE.Vector3();
const portalOtherCenter = new THREE.Vector3();
const portalCandidateRight = new THREE.Vector3();
const portalCandidateUp = new THREE.Vector3();
const portalCandidateNormal = new THREE.Vector3();
const portalOtherRight = new THREE.Vector3();
const portalOtherUp = new THREE.Vector3();
const portalOtherNormal = new THREE.Vector3();
const portalCenterDelta = new THREE.Vector3();
const portalSatAxis = new THREE.Vector3();

function rangesOverlapOnAxis(axis, centerDelta, aRight, aUp, bRight, bUp, halfW, halfH) {
    const dist = Math.abs(centerDelta.dot(axis));
    const aRadius = halfW * Math.abs(axis.dot(aRight)) + halfH * Math.abs(axis.dot(aUp));
    const bRadius = halfW * Math.abs(axis.dot(bRight)) + halfH * Math.abs(axis.dot(bUp));
    return dist <= aRadius + bRadius;
}

function wouldOverlapOtherPortalOnSameWall(portalRef, pos, quat) {
    const other = portalRef === portalA ? portalB : portalA;
    const halfW = PORTAL_WIDTH * 0.5 + PORTAL_OVERLAP_PADDING;
    const halfH = PORTAL_HEIGHT * 0.5 + PORTAL_OVERLAP_PADDING;

    portalCandidateCenter.copy(pos);
    portalOtherCenter.copy(other.mesh.position);
    portalCandidateRight.set(1, 0, 0).applyQuaternion(quat).normalize();
    portalCandidateUp.set(0, 1, 0).applyQuaternion(quat).normalize();
    portalCandidateNormal.set(0, 0, 1).applyQuaternion(quat).normalize();
    portalOtherRight.set(1, 0, 0).applyQuaternion(other.mesh.quaternion).normalize();
    portalOtherUp.set(0, 1, 0).applyQuaternion(other.mesh.quaternion).normalize();
    portalOtherNormal.set(0, 0, 1).applyQuaternion(other.mesh.quaternion).normalize();

    const normalAlignment = portalCandidateNormal.dot(portalOtherNormal);
    // Same wall face only (not opposite face).
    if (normalAlignment < 0.999) return false;

    const planeDistance = Math.abs(
        portalCenterDelta.copy(portalCandidateCenter).sub(portalOtherCenter).dot(portalOtherNormal)
    );
    if (planeDistance > 0.03) return false;

    portalCenterDelta.copy(portalOtherCenter).sub(portalCandidateCenter);
    if (!rangesOverlapOnAxis(
        portalSatAxis.copy(portalCandidateRight),
        portalCenterDelta,
        portalCandidateRight,
        portalCandidateUp,
        portalOtherRight,
        portalOtherUp,
        halfW,
        halfH
    )) return false;
    if (!rangesOverlapOnAxis(
        portalSatAxis.copy(portalCandidateUp),
        portalCenterDelta,
        portalCandidateRight,
        portalCandidateUp,
        portalOtherRight,
        portalOtherUp,
        halfW,
        halfH
    )) return false;
    if (!rangesOverlapOnAxis(
        portalSatAxis.copy(portalOtherRight),
        portalCenterDelta,
        portalCandidateRight,
        portalCandidateUp,
        portalOtherRight,
        portalOtherUp,
        halfW,
        halfH
    )) return false;
    if (!rangesOverlapOnAxis(
        portalSatAxis.copy(portalOtherUp),
        portalCenterDelta,
        portalCandidateRight,
        portalCandidateUp,
        portalOtherRight,
        portalOtherUp,
        halfW,
        halfH
    )) return false;
    return true;
}

function isTooCloseToOtherPortalOnSameWall(portalRef, hit, candidatePos) {
    const other = portalRef === portalA ? portalB : portalA;
    if (!other.wallInfo || !hit || !hit.wall) return false;
    if (other.wallInfo.axis !== hit.wall.axis) return false;

    const candidateSideKey = getWallSideKey(hit.wall.axis, hit.normal, candidatePos, hit.wall.coord);
    if (other.wallInfo.sideKey !== candidateSideKey) return false;

    const faceCoord = hit.wall.coord ?? (hit.wall.axis === "y" ? candidatePos.y : 0);
    const sameFaceCoord = Math.abs(faceCoord - other.wallInfo.coord) <= 0.03;
    const sameFacing =
        hit.normal && other.wallInfo.normal
            ? hit.normal.dot(other.wallInfo.normal) > 0.999
            : true;
    if (!sameFaceCoord || !sameFacing) return false;

    const halfW = PORTAL_WIDTH * 0.5 + PORTAL_SAME_WALL_BUFFER;
    const halfH = PORTAL_HEIGHT * 0.5 + PORTAL_SAME_WALL_BUFFER;
    if (hit.wall.axis === "x") {
        return (
            Math.abs(candidatePos.z - other.wallInfo.position.z) <= halfW * 2 &&
            Math.abs(candidatePos.y - other.wallInfo.position.y) <= halfH * 2
        );
    }
    if (hit.wall.axis === "z") {
        return (
            Math.abs(candidatePos.x - other.wallInfo.position.x) <= halfW * 2 &&
            Math.abs(candidatePos.y - other.wallInfo.position.y) <= halfH * 2
        );
    }
    // Floor / ceiling: use in-plane distance precheck; precise overlap check still runs too.
    return candidatePos.distanceTo(other.wallInfo.position) <= PORTAL_WIDTH + PORTAL_SAME_WALL_BUFFER;
}

function getWallSideKey(axis, normal, pos, coordHint) {
    if (axis === "x") {
        const coord = Number.isFinite(coordHint) ? coordHint : pos.x;
        const dir = normal.x >= 0 ? "+" : "-";
        return `x:${coord.toFixed(3)}:${dir}`;
    }
    if (axis === "z") {
        const coord = Number.isFinite(coordHint) ? coordHint : pos.z;
        const dir = normal.z >= 0 ? "+" : "-";
        return `z:${coord.toFixed(3)}:${dir}`;
    }
    const coord = Number.isFinite(coordHint) ? coordHint : pos.y;
    const dir = normal.y >= 0 ? "+" : "-";
    return `y:${coord.toFixed(3)}:${dir}`;
}

function shootBall() {
    const hue = (ballShotCount * 47) % 360;
    ballShotCount += 1;

    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(`hsl(${hue}, 88%, 58%)`),
        roughness: 0.45,
        metalness: 0.08,
    });
    const mesh = new THREE.Mesh(ballGeometry, material);
    mesh.frustumCulled = false;

    camera.getWorldPosition(cameraShootOrigin);
    camera.getWorldDirection(cameraShootDir).normalize();

    mesh.position.copy(cameraShootOrigin).addScaledVector(cameraShootDir, 0.8);
    world.scene.add(mesh);

    balls.push({
        mesh,
        velocity: cameraShootDir.clone().multiplyScalar(BALL_SHOOT_SPEED),
        teleportCooldown: 0,
        portalTransit: null,
        portalTransitTime: 0,
    });

    if (balls.length > BALL_MAX_COUNT) {
        const oldest = balls.shift();
        world.scene.remove(oldest.mesh);
        oldest.mesh.material.dispose();
    }
}

function shootPortalProjectile(colorHex) {
    const material = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.3,
        roughness: 0.3,
        metalness: 0.0,
    });
    const mesh = new THREE.Mesh(portalProjectileGeometry, material);
    mesh.frustumCulled = false;

    camera.getWorldPosition(cameraShootOrigin);
    camera.getWorldDirection(cameraShootDir).normalize();
    mesh.position.copy(cameraShootOrigin).addScaledVector(cameraShootDir, 0.55);
    world.scene.add(mesh);

    portalProjectiles.push({
        mesh,
        velocity: cameraShootDir.clone().multiplyScalar(PORTAL_PROJECTILE_SPEED),
        life: PORTAL_PROJECTILE_LIFETIME,
        portalRef: colorHex === 0x66ccff ? portalA : portalB,
    });

    if (portalProjectiles.length > PORTAL_PROJECTILE_MAX) {
        const oldest = portalProjectiles.shift();
        world.scene.remove(oldest.mesh);
        oldest.mesh.material.dispose();
    }
}

function removePortalProjectile(index) {
    const p = portalProjectiles[index];
    if (!p) return;
    world.scene.remove(p.mesh);
    p.mesh.material.dispose();
    portalProjectiles.splice(index, 1);
}

function checkProjectileWallContact(pos) {
    if (pos.x <= -WORLD_HALF_X + PORTAL_PROJECTILE_RADIUS) return true;
    if (pos.x >= WORLD_HALF_X - PORTAL_PROJECTILE_RADIUS) return true;
    if (pos.z <= -WORLD_HALF_Z + PORTAL_PROJECTILE_RADIUS) return true;
    if (pos.z >= WORLD_HALF_Z - PORTAL_PROJECTILE_RADIUS) return true;
    if (pos.y <= PORTAL_PROJECTILE_RADIUS) return true;
    if (pos.y >= ROOM_HEIGHT - PORTAL_PROJECTILE_RADIUS) return true;

    // Middle wall with door opening.
    const inMiddleX = Math.abs(pos.x) < MIDDLE_WALL_HALF_THICKNESS + PORTAL_PROJECTILE_RADIUS;
    const inDoorGapZ = Math.abs(pos.z) < DOOR_WIDTH * 0.5 - PORTAL_PROJECTILE_RADIUS;
    const belowDoorTop = pos.y < DOOR_HEIGHT - PORTAL_PROJECTILE_RADIUS;
    if (inMiddleX && (!inDoorGapZ || !belowDoorTop)) return true;

    return false;
}

function getProjectileWallHit(prevPos, nextPos) {
    let best = null;
    let bestT = Infinity;
    const rad = PORTAL_PROJECTILE_RADIUS;

    const tryCandidate = (t, normal, wall) => {
        if (!Number.isFinite(t) || t < 0 || t > 1 || t >= bestT) return;
        tmpProjectileHitPoint.copy(prevPos).lerp(nextPos, t);
        if (tmpProjectileHitPoint.y < wall.yMin || tmpProjectileHitPoint.y > wall.yMax) return;
        const horiz = wall.axis === "x" ? tmpProjectileHitPoint.z : tmpProjectileHitPoint.x;
        if (horiz < wall.hMin || horiz > wall.hMax) return;
        bestT = t;
        best = {
            point: tmpProjectileHitPoint.clone(),
            normal: normal.clone(),
            wall,
        };
    };

    // Outer vertical walls.
    if (nextPos.x > WORLD_HALF_X - rad && prevPos.x <= WORLD_HALF_X - rad) {
        const t = (WORLD_HALF_X - rad - prevPos.x) / (nextPos.x - prevPos.x);
        tryCandidate(t, new THREE.Vector3(-1, 0, 0), {
            axis: "x",
            coord: WORLD_HALF_X,
            hMin: -WORLD_HALF_Z,
            hMax: WORLD_HALF_Z,
            yMin: rad,
            yMax: ROOM_HEIGHT - rad,
        });
    }
    if (nextPos.x < -WORLD_HALF_X + rad && prevPos.x >= -WORLD_HALF_X + rad) {
        const t = (-WORLD_HALF_X + rad - prevPos.x) / (nextPos.x - prevPos.x);
        tryCandidate(t, new THREE.Vector3(1, 0, 0), {
            axis: "x",
            coord: -WORLD_HALF_X,
            hMin: -WORLD_HALF_Z,
            hMax: WORLD_HALF_Z,
            yMin: rad,
            yMax: ROOM_HEIGHT - rad,
        });
    }
    if (nextPos.z > WORLD_HALF_Z - rad && prevPos.z <= WORLD_HALF_Z - rad) {
        const t = (WORLD_HALF_Z - rad - prevPos.z) / (nextPos.z - prevPos.z);
        tryCandidate(t, new THREE.Vector3(0, 0, -1), {
            axis: "z",
            coord: WORLD_HALF_Z,
            hMin: -WORLD_HALF_X,
            hMax: -MIDDLE_WALL_HALF_THICKNESS,
            yMin: rad,
            yMax: ROOM_HEIGHT - rad,
        });
        tryCandidate(t, new THREE.Vector3(0, 0, -1), {
            axis: "z",
            coord: WORLD_HALF_Z,
            hMin: MIDDLE_WALL_HALF_THICKNESS,
            hMax: WORLD_HALF_X,
            yMin: rad,
            yMax: ROOM_HEIGHT - rad,
        });
    }
    if (nextPos.z < -WORLD_HALF_Z + rad && prevPos.z >= -WORLD_HALF_Z + rad) {
        const t = (-WORLD_HALF_Z + rad - prevPos.z) / (nextPos.z - prevPos.z);
        tryCandidate(t, new THREE.Vector3(0, 0, 1), {
            axis: "z",
            coord: -WORLD_HALF_Z,
            hMin: -WORLD_HALF_X,
            hMax: -MIDDLE_WALL_HALF_THICKNESS,
            yMin: rad,
            yMax: ROOM_HEIGHT - rad,
        });
        tryCandidate(t, new THREE.Vector3(0, 0, 1), {
            axis: "z",
            coord: -WORLD_HALF_Z,
            hMin: MIDDLE_WALL_HALF_THICKNESS,
            hMax: WORLD_HALF_X,
            yMin: rad,
            yMax: ROOM_HEIGHT - rad,
        });
    }

    // Middle wall faces (x = +/- thickness).
    const middleLeftFace = -MIDDLE_WALL_HALF_THICKNESS - rad;
    const middleRightFace = MIDDLE_WALL_HALF_THICKNESS + rad;
    const sideZMin = -WORLD_HALF_Z;
    const sideZMax = WORLD_HALF_Z;

    const tryMiddle = (t, normal) => {
        if (!Number.isFinite(t) || t < 0 || t > 1 || t >= bestT) return;
        tmpProjectileHitPoint.copy(prevPos).lerp(nextPos, t);
        const y = tmpProjectileHitPoint.y;
        const z = tmpProjectileHitPoint.z;
        if (y < rad || y > ROOM_HEIGHT - rad) return;

        // Two side columns and top segment above door.
        const inLeftColumn = z <= -DOOR_WIDTH * 0.5;
        const inRightColumn = z >= DOOR_WIDTH * 0.5;
        const inTopSegment = Math.abs(z) <= DOOR_WIDTH * 0.5 && y >= DOOR_HEIGHT;
        if (!(inLeftColumn || inRightColumn || inTopSegment)) return;

        const hMin = inLeftColumn ? sideZMin : inRightColumn ? DOOR_WIDTH * 0.5 : -DOOR_WIDTH * 0.5;
        const hMax = inLeftColumn ? -DOOR_WIDTH * 0.5 : inRightColumn ? sideZMax : DOOR_WIDTH * 0.5;
        const yMin = inTopSegment ? DOOR_HEIGHT : rad;
        const yMax = ROOM_HEIGHT - rad;
        if (y < yMin || y > yMax) return;

        bestT = t;
        best = {
            point: tmpProjectileHitPoint.clone(),
            normal: normal.clone(),
            wall: {
                axis: "x",
                    coord: normal.x > 0 ? MIDDLE_WALL_HALF_THICKNESS : -MIDDLE_WALL_HALF_THICKNESS,
                hMin,
                hMax,
                yMin,
                yMax,
            },
        };
    };

    if (nextPos.x > middleLeftFace && prevPos.x <= middleLeftFace) {
        const t = (middleLeftFace - prevPos.x) / (nextPos.x - prevPos.x);
        tryMiddle(t, new THREE.Vector3(-1, 0, 0));
    }
    if (nextPos.x < middleRightFace && prevPos.x >= middleRightFace) {
        const t = (middleRightFace - prevPos.x) / (nextPos.x - prevPos.x);
        tryMiddle(t, new THREE.Vector3(1, 0, 0));
    }

    // Floor/ceiling: considered hits for projectile disappearance only.
    if (nextPos.y <= rad && prevPos.y > rad) {
        const t = (rad - prevPos.y) / (nextPos.y - prevPos.y);
        const point = prevPos.clone().lerp(nextPos, t);
        if (!best || t < bestT) {
            bestT = t;
            best = {
                point,
                normal: new THREE.Vector3(0, 1, 0),
                wall: { axis: "y" },
            };
        }
    }
    if (nextPos.y >= ROOM_HEIGHT - rad && prevPos.y < ROOM_HEIGHT - rad) {
        const t = (ROOM_HEIGHT - rad - prevPos.y) / (nextPos.y - prevPos.y);
        const point = prevPos.clone().lerp(nextPos, t);
        if (!best || t < bestT) {
            best = {
                point,
                normal: new THREE.Vector3(0, -1, 0),
                wall: { axis: "y" },
            };
        }
    }

    return best;
}

function computePortalPlacementFromHit(portalRef, hit) {
    if (!portalRef || !hit || !hit.wall) return null;

    const halfW = PORTAL_WIDTH * 0.5;
    const halfH = PORTAL_HEIGHT * 0.5;

    // Floor/ceiling hit: place portal horizontally and align top edge with player yaw direction.
    if (hit.wall.axis === "y") {
        portalPlaceQuat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), hit.normal);

        portalTopDesired.set(0, 0, -1).applyAxisAngle(worldUp, playerYaw.rotation.y);
        portalTopDesired.projectOnPlane(hit.normal).normalize();
        if (portalTopDesired.lengthSq() < 1e-8) {
            portalTopDesired.set(0, 0, -1);
        }

        portalTopCurrent.set(0, 1, 0).applyQuaternion(portalPlaceQuat);
        portalTopCurrent.projectOnPlane(hit.normal).normalize();

        const signedAngle = Math.atan2(
            hit.normal.dot(tmpNormal.copy(portalTopCurrent).cross(portalTopDesired)),
            portalTopCurrent.dot(portalTopDesired)
        );
        portalTwistQuat.setFromAxisAngle(hit.normal, signedAngle);
        portalCandidateQuat.copy(portalTwistQuat).multiply(portalPlaceQuat);

        const halfSpan = Math.max(halfW, halfH);
        const px = THREE.MathUtils.clamp(hit.point.x, -WORLD_HALF_X + halfSpan, WORLD_HALF_X - halfSpan);
        const pz = THREE.MathUtils.clamp(hit.point.z, -WORLD_HALF_Z + halfSpan, WORLD_HALF_Z - halfSpan);
        const py = hit.normal.y > 0
            ? PORTAL_PROJECTILE_RADIUS + 0.003
            : ROOM_HEIGHT - PORTAL_PROJECTILE_RADIUS - 0.003;

        portalCandidateCenter.set(px, py, pz);
        const blocked =
            isTooCloseToOtherPortalOnSameWall(portalRef, hit, portalCandidateCenter) ||
            wouldOverlapOtherPortalOnSameWall(portalRef, portalCandidateCenter, portalCandidateQuat);

        return {
            position: portalCandidateCenter.clone(),
            quaternion: portalCandidateQuat.clone(),
            blocked,
            wallInfo: {
                axis: "y",
                coord: py,
                normal: hit.normal.clone(),
                position: portalCandidateCenter.clone(),
                sideKey: getWallSideKey("y", hit.normal, portalCandidateCenter, py),
            },
        };
    }

    portalCandidateQuat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), hit.normal);

    let px = hit.point.x;
    let py = THREE.MathUtils.clamp(hit.point.y, hit.wall.yMin + halfH, hit.wall.yMax - halfH);
    let pz = hit.point.z;

    if (hit.wall.axis === "x") {
        pz = THREE.MathUtils.clamp(hit.point.z, hit.wall.hMin + halfW, hit.wall.hMax - halfW);
        const isMiddleWallFace = Math.abs(hit.wall.coord) <= MIDDLE_WALL_HALF_THICKNESS + 1e-6;
        px = isMiddleWallFace
            ? hit.wall.coord
            : Math.sign(hit.wall.coord) * VISUAL_OUTER_WALL_HALF_X;
    } else if (hit.wall.axis === "z") {
        px = THREE.MathUtils.clamp(hit.point.x, hit.wall.hMin + halfW, hit.wall.hMax - halfW);
        pz = Math.sign(hit.wall.coord) * VISUAL_OUTER_WALL_HALF_Z;
    }

    if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(pz)) return null;
    portalCandidateCenter.set(px, py, pz);
    const blocked =
        isTooCloseToOtherPortalOnSameWall(portalRef, hit, portalCandidateCenter) ||
        wouldOverlapOtherPortalOnSameWall(portalRef, portalCandidateCenter, portalCandidateQuat);

    return {
        position: portalCandidateCenter.clone(),
        quaternion: portalCandidateQuat.clone(),
        blocked,
        wallInfo: {
            axis: hit.wall.axis,
            coord: hit.wall.coord ?? (hit.wall.axis === "x" ? px : pz),
            normal: hit.normal.clone(),
            position: portalCandidateCenter.clone(),
            sideKey: getWallSideKey(
                hit.wall.axis,
                hit.normal,
                portalCandidateCenter,
                hit.wall.coord ?? (hit.wall.axis === "x" ? px : pz)
            ),
        },
    };
}

function applyPortalPlacement(portalRef, placement) {
    if (!portalRef || !placement || placement.blocked) return;
    portalRef.mesh.quaternion.copy(placement.quaternion);
    portalRef.mesh.position.copy(placement.position);
    portalRef.wallInfo = placement.wallInfo;
    syncPortalVisuals(portalRef);
}

function spawnPortalPlacementEffect(portalRef, placement) {
    const effectMaterial = new THREE.MeshBasicMaterial({
        color: portalRef === portalA ? 0x66ccff : 0xff66aa,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
    });
    const effectMesh = new THREE.Mesh(new THREE.PlaneGeometry(PORTAL_WIDTH, PORTAL_HEIGHT), effectMaterial);
    effectMesh.position.copy(placement.position);
    effectMesh.quaternion.copy(placement.quaternion);
    effectMesh.scale.set(PORTAL_PLACE_EFFECT_START_SCALE, PORTAL_PLACE_EFFECT_START_SCALE, 1);
    effectMesh.frustumCulled = false;
    world.scene.add(effectMesh);

    portalPlacementEffects.push({
        mesh: effectMesh,
        portalRef,
        placement,
        elapsed: 0,
        duration: PORTAL_PLACE_EFFECT_DURATION,
    });
}

function updatePortalPlacementEffects(dt) {
    for (let i = portalPlacementEffects.length - 1; i >= 0; i -= 1) {
        const effect = portalPlacementEffects[i];
        effect.elapsed += dt;
        const t = Math.min(1, effect.elapsed / effect.duration);
        const s = THREE.MathUtils.lerp(PORTAL_PLACE_EFFECT_START_SCALE, 1, t);
        effect.mesh.scale.set(s, s, 1);
        effect.mesh.material.opacity = (1 - t) * 0.85;

        if (t >= 1) {
            applyPortalPlacement(effect.portalRef, effect.placement);
            world.scene.remove(effect.mesh);
            effect.mesh.material.dispose();
            effect.mesh.geometry.dispose();
            portalPlacementEffects.splice(i, 1);
        }
    }
}

function didPortalProjectileHitPortal(prevPos, nextPos) {
    tmpMoveDelta.copy(nextPos).sub(prevPos);
    if (tmpMoveDelta.lengthSq() < 1e-10) return false;

    const planeEps = 0.0005;
    for (const portal of currentWorld.portals) {
        portal.mesh.getWorldPosition(tmpWorldPos);
        tmpNormal.set(0, 0, 1).applyQuaternion(portal.mesh.getWorldQuaternion(tmpQuat)).normalize();

        const prevSide = tmpNormal.dot(tmpPrevDelta.copy(prevPos).sub(tmpWorldPos));
        const curSide = tmpNormal.dot(tmpCurDelta.copy(nextPos).sub(tmpWorldPos));
        const crossedPlane =
            (prevSide > planeEps && curSide <= planeEps) ||
            (prevSide < -planeEps && curSide >= -planeEps);
        if (!crossedPlane) continue;

        const denom = prevSide - curSide;
        const t = Math.max(0, Math.min(1, Math.abs(denom) < 1e-8 ? 0 : prevSide / denom));
        tmpHitPoint.copy(prevPos).addScaledVector(tmpMoveDelta, t);
        if (isInsidePortalOpeningWithRadius(portal.mesh, tmpHitPoint, PORTAL_PROJECTILE_RADIUS)) {
            return true;
        }
    }
    return false;
}

function updatePortalProjectiles(dt) {
    for (let i = portalProjectiles.length - 1; i >= 0; i -= 1) {
        const p = portalProjectiles[i];
        p.life -= dt;
        if (p.life <= 0) {
            removePortalProjectile(i);
            continue;
        }

        tmpProjectilePos.copy(p.mesh.position);
        p.mesh.position.addScaledVector(p.velocity, dt);

        // Ignore portal-gun projectiles that hit an existing portal.
        if (didPortalProjectileHitPortal(tmpProjectilePos, p.mesh.position)) {
            removePortalProjectile(i);
            continue;
        }

        const hit = getProjectileWallHit(tmpProjectilePos, p.mesh.position);
        if (hit) {
            const placement = computePortalPlacementFromHit(p.portalRef, hit);
            if (placement) {
                spawnPortalPlacementEffect(p.portalRef, placement);
            }
            removePortalProjectile(i);
        }
    }
}

function applySurfaceFriction(velocity, normal, friction) {
    normalBuffer.copy(normal).multiplyScalar(velocity.dot(normal));
    tangentBuffer.copy(velocity).sub(normalBuffer).multiplyScalar(friction);
    velocity.copy(normalBuffer).add(tangentBuffer);
}

function tryBallPortalCrossing(ball, prevPos, dt) {
    if (ball.teleportCooldown > 0) return;

    const pos = ball.mesh.position;
    const vel = ball.velocity;
    const speed = vel.length();
    if (speed < 0.0001) return;

    if (ball.portalTransit) {
        const portal = ball.portalTransit;
        const source = portal.mesh;
        const destination = portal.destination.mesh;

        source.getWorldPosition(tmpWorldPos);
        tmpNormal.set(0, 0, 1).applyQuaternion(source.getWorldQuaternion(tmpQuat)).normalize();
        tmpMoveDelta.copy(pos).sub(prevPos);
        const prevSide = tmpNormal.dot(tmpPrevDelta.copy(prevPos).sub(tmpWorldPos));
        const curSide = tmpNormal.dot(tmpCurDelta.copy(pos).sub(tmpWorldPos));
        const crossedCenterPlane = prevSide * curSide <= 0 || Math.abs(curSide) <= 0.001;

        if (
            crossedCenterPlane &&
            isInsidePortalOpening(source, pos)
        ) {
            const denom = prevSide - curSide;
            const t = Math.max(0, Math.min(1, Math.abs(denom) < 1e-8 ? 0 : prevSide / denom));
            tmpHitPoint.copy(prevPos).addScaledVector(tmpMoveDelta, t);

            teleportMat
                .copy(destination.matrixWorld)
                .multiply(teleportRot)
                .multiply(sourceInverse.copy(source.matrixWorld).invert());

            tmpHitPoint.applyMatrix4(teleportMat);
            tmpRemainingMove.copy(tmpMoveDelta).multiplyScalar(1 - t);
            const remainingLen = tmpRemainingMove.length();
            if (remainingLen > 1e-8) {
                transformedDir.copy(tmpRemainingMove).normalize().transformDirection(teleportMat);
                tmpRemainingMove.copy(transformedDir).multiplyScalar(remainingLen);
            } else {
                tmpRemainingMove.set(0, 0, 0);
            }

            transformedDir.copy(vel).normalize().transformDirection(teleportMat);
            vel.copy(transformedDir).multiplyScalar(speed);
            pos.copy(tmpHitPoint).add(tmpRemainingMove).addScaledVector(transformedDir, 0.02);

            ball.portalTransit = null;
            ball.portalTransitTime = 0;
            ball.teleportCooldown = BALL_PORTAL_COOLDOWN;
        } else {
            ball.portalTransitTime += dt;
            const stillNearPortal =
                Math.abs(curSide) <= BALL_PORTAL_CONTACT_DISTANCE * 2 &&
                isInsidePortalOpeningWithRadius(source, pos, BALL_PORTAL_CONTACT_DISTANCE * 1.4);
            if (!stillNearPortal || ball.portalTransitTime > BALL_PORTAL_TRANSIT_MAX_TIME) {
                ball.portalTransit = null;
                ball.portalTransitTime = 0;
            }
        }
        return;
    }

    for (const portal of currentWorld.portals) {
        const source = portal.mesh;

        source.getWorldPosition(tmpWorldPos);
        tmpNormal.set(0, 0, 1).applyQuaternion(source.getWorldQuaternion(tmpQuat)).normalize();

        tmpMoveDelta.copy(pos).sub(prevPos);
        const prevSide = tmpNormal.dot(tmpPrevDelta.copy(prevPos).sub(tmpWorldPos));
        const curSide = tmpNormal.dot(tmpCurDelta.copy(pos).sub(tmpWorldPos));
        const movementTowardPlane = tmpMoveDelta.dot(tmpNormal);

        const closestSideDistance = Math.min(Math.abs(prevSide), Math.abs(curSide));
        const movingTowardPortalFace = movementTowardPlane * portal.entrySign < 0;
        const withinTeleportDistance = closestSideDistance <= BALL_PORTAL_CONTACT_DISTANCE;
        const enteredFromFront = movingTowardPortalFace;
        if (withinTeleportDistance && enteredFromFront) {
            const t = THREE.MathUtils.clamp(
                (Math.abs(prevSide) + 1e-8) / (Math.abs(prevSide) + Math.abs(curSide) + 1e-8),
                0,
                1
            );
            tmpHitPoint.copy(prevPos).addScaledVector(tmpMoveDelta, t);
            if (!isInsidePortalOpeningWithRadius(source, tmpHitPoint, BALL_PORTAL_CONTACT_DISTANCE)) {
                continue;
            }
            ball.portalTransit = portal;
            ball.portalTransitTime = 0;
            break;
        }
    }
}

function updateBallPhysics(dt) {
    for (const ball of balls) {
        const pos = ball.mesh.position;
        const vel = ball.velocity;
        ballPrevPos.copy(pos);

        if (ball.teleportCooldown > 0) {
            ball.teleportCooldown -= dt;
        }

        vel.y += BALL_GRAVITY * dt;
        vel.multiplyScalar(BALL_AIR_DRAG);
        pos.addScaledVector(vel, dt);

        // Teleport when ball center crosses a portal plane.
        tryBallPortalCrossing(ball, ballPrevPos, dt);
        const inPortalTransit = Boolean(ball.portalTransit);

        if (!inPortalTransit) {
            // Floor / ceiling collisions
            if (pos.y < BALL_RADIUS) {
                pos.y = BALL_RADIUS;
                if (vel.y < 0) vel.y = -vel.y * BALL_BOUNCE;
                applySurfaceFriction(vel, new THREE.Vector3(0, 1, 0), BALL_FRICTION);
            } else if (pos.y > ROOM_HEIGHT - BALL_RADIUS) {
                pos.y = ROOM_HEIGHT - BALL_RADIUS;
                if (vel.y > 0) vel.y = -vel.y * BALL_BOUNCE;
                applySurfaceFriction(vel, new THREE.Vector3(0, -1, 0), BALL_FRICTION);
            }

            // Outer room bounds
            if (pos.x < -WORLD_HALF_X + BALL_RADIUS) {
                const throughPortal = isPointInsidePortalWallHole(
                    pos,
                    BALL_RADIUS,
                    "x",
                    -WORLD_HALF_X
                );
                if (!throughPortal) {
                    pos.x = -WORLD_HALF_X + BALL_RADIUS;
                    if (vel.x < 0) vel.x = -vel.x * BALL_BOUNCE;
                    applySurfaceFriction(vel, new THREE.Vector3(1, 0, 0), BALL_FRICTION);
                }
            } else if (pos.x > WORLD_HALF_X - BALL_RADIUS) {
                if (!isPointInsidePortalWallHole(pos, BALL_RADIUS, "x", WORLD_HALF_X)) {
                    pos.x = WORLD_HALF_X - BALL_RADIUS;
                    if (vel.x > 0) vel.x = -vel.x * BALL_BOUNCE;
                    applySurfaceFriction(vel, new THREE.Vector3(-1, 0, 0), BALL_FRICTION);
                }
            }

            if (pos.z < -WORLD_HALF_Z + BALL_RADIUS) {
                if (!isPointInsidePortalWallHole(pos, BALL_RADIUS, "z", -WORLD_HALF_Z)) {
                    pos.z = -WORLD_HALF_Z + BALL_RADIUS;
                    if (vel.z < 0) vel.z = -vel.z * BALL_BOUNCE;
                    applySurfaceFriction(vel, new THREE.Vector3(0, 0, 1), BALL_FRICTION);
                }
            } else if (pos.z > WORLD_HALF_Z - BALL_RADIUS) {
                if (!isPointInsidePortalWallHole(pos, BALL_RADIUS, "z", WORLD_HALF_Z)) {
                    pos.z = WORLD_HALF_Z - BALL_RADIUS;
                    if (vel.z > 0) vel.z = -vel.z * BALL_BOUNCE;
                    applySurfaceFriction(vel, new THREE.Vector3(0, 0, -1), BALL_FRICTION);
                }
            }

            // Middle wall with door opening.
            const inMiddleX = Math.abs(pos.x) < MIDDLE_WALL_HALF_THICKNESS + BALL_RADIUS;
            const inDoorGapZ = Math.abs(pos.z) < DOOR_WIDTH * 0.5 - BALL_RADIUS;
            const belowDoorTop = pos.y < DOOR_HEIGHT - BALL_RADIUS;
            const blockedByWall = !inDoorGapZ || !belowDoorTop;

            if (inMiddleX && blockedByWall) {
                const middleCoord = pos.x >= 0
                    ? MIDDLE_WALL_HALF_THICKNESS
                    : -MIDDLE_WALL_HALF_THICKNESS;
                if (!isPointInsidePortalWallHole(pos, BALL_RADIUS, "x", middleCoord)) {
                    const pushRight = pos.x >= 0;
                    pos.x = (pushRight ? 1 : -1) * (MIDDLE_WALL_HALF_THICKNESS + BALL_RADIUS);
                    if (pushRight && vel.x < 0) vel.x = -vel.x * BALL_BOUNCE;
                    if (!pushRight && vel.x > 0) vel.x = -vel.x * BALL_BOUNCE;
                    applySurfaceFriction(
                        vel,
                        new THREE.Vector3(pushRight ? 1 : -1, 0, 0),
                        BALL_FRICTION
                    );
                }
            }
        }
    }

    // Ball-ball collisions
    for (let i = 0; i < balls.length; i += 1) {
        for (let j = i + 1; j < balls.length; j += 1) {
            const a = balls[i];
            const b = balls[j];
            const aPos = a.mesh.position;
            const bPos = b.mesh.position;

            delta.copy(bPos).sub(aPos);
            const distSq = delta.lengthSq();
            const minDist = BALL_RADIUS * 2;
            if (distSq <= 1e-8 || distSq > minDist * minDist) continue;

            const dist = Math.sqrt(distSq);
            pairNormal.copy(delta).multiplyScalar(1 / dist);
            const overlap = minDist - dist;

            // Separate spheres equally
            aPos.addScaledVector(pairNormal, -overlap * 0.5);
            bPos.addScaledVector(pairNormal, overlap * 0.5);

            relVel.copy(b.velocity).sub(a.velocity);
            const relAlongNormal = relVel.dot(pairNormal);
            if (relAlongNormal > 0) continue;

            const jImpulse = -(1 + BALL_RESTITUTION) * relAlongNormal / 2;
            impulse.copy(pairNormal).multiplyScalar(jImpulse);
            a.velocity.addScaledVector(impulse, -1);
            b.velocity.add(impulse);

            // Tangential damping (simple collision friction)
            applySurfaceFriction(a.velocity, pairNormal, BALL_FRICTION);
            applySurfaceFriction(b.velocity, pairNormal, BALL_FRICTION);
        }
    }
}

function isInsidePortalOpening(portalMesh, worldPos) {
    tmpLocalPos.copy(worldPos);
    portalMesh.worldToLocal(tmpLocalPos);
    return (
        Math.abs(tmpLocalPos.x) <= PORTAL_HALF_WIDTH &&
        Math.abs(tmpLocalPos.y) <= PORTAL_HALF_HEIGHT
    );
}

function isPointInsidePortalWallHole(worldPos, radius, axis, wallCoord) {
    const wallCoordTolerance = 0.35;
    const normalAxisThreshold = 0.85;
    const planeDepthTolerance = radius + 0.25;

    for (const portal of currentWorld.portals) {
        portal.mesh.getWorldPosition(tmpWorldPos);
        tmpNormal.set(0, 0, 1).applyQuaternion(portal.mesh.getWorldQuaternion(tmpQuat)).normalize();

        if (Math.abs(tmpWorldPos[axis] - wallCoord) > wallCoordTolerance) continue;
        if (Math.abs(tmpNormal[axis]) < normalAxisThreshold) continue;

        tmpLocalPos.copy(worldPos);
        portal.mesh.worldToLocal(tmpLocalPos);
        if (
            Math.abs(tmpLocalPos.z) <= planeDepthTolerance &&
            Math.abs(tmpLocalPos.x) <= PORTAL_HALF_WIDTH + radius &&
            Math.abs(tmpLocalPos.y) <= PORTAL_HALF_HEIGHT + radius
        ) {
            return true;
        }
    }
    return false;
}

function isOverHorizontalPortalHole(worldPos) {
    for (const portal of currentWorld.portals) {
        portal.mesh.getWorldPosition(tmpWorldPos);
        tmpNormal.set(0, 0, 1).applyQuaternion(portal.mesh.getWorldQuaternion(tmpQuat)).normalize();

        // Only portals facing upward act as floor holes.
        if (tmpNormal.y < 0.75) continue;

        // Player must be on the portal's front side (above it).
        if (tmpNormal.dot(sideToPlayer.copy(worldPos).sub(tmpWorldPos)) < 0) continue;

        // Project player XZ to portal plane level for footprint test.
        tmpLocalPos.set(worldPos.x, tmpWorldPos.y, worldPos.z);
        portal.mesh.worldToLocal(tmpLocalPos);
        if (
            Math.abs(tmpLocalPos.x) <= PORTAL_HALF_WIDTH &&
            Math.abs(tmpLocalPos.y) <= PORTAL_HALF_HEIGHT
        ) {
            return true;
        }
    }
    return false;
}

function isInsidePortalOpeningWithRadius(portalMesh, worldPos, radius) {
    tmpLocalPos.copy(worldPos);
    portalMesh.worldToLocal(tmpLocalPos);
    return (
        Math.abs(tmpLocalPos.x) <= PORTAL_HALF_WIDTH + radius &&
        Math.abs(tmpLocalPos.y) <= PORTAL_HALF_HEIGHT + radius
    );
}

function tryPortalCrossing(prevCenter, curCenter, dt) {
    if (teleportCooldown > 0) return;
    const planeEps = 0.02;
    const sphereRadius = camera.near;
    for (const portal of currentWorld.portals) {
        const source = portal.mesh;
        const destination = portal.destination.mesh;

        source.getWorldPosition(tmpWorldPos);
        tmpNormal.set(0, 0, 1).applyQuaternion(source.getWorldQuaternion(tmpQuat)).normalize();

        const prevSide = tmpNormal.dot(tmpPrevDelta.copy(prevCenter).sub(tmpWorldPos));
        const curSide = tmpNormal.dot(tmpCurDelta.copy(curCenter).sub(tmpWorldPos));
        const movementTowardPlane = tmpMoveDelta.copy(curCenter).sub(prevCenter).dot(tmpNormal);

        const crossedPlane =
            (prevSide > sphereRadius + planeEps && curSide <= sphereRadius + planeEps) ||
            (prevSide < -(sphereRadius + planeEps) && curSide >= -(sphereRadius + planeEps));
        const enteredFromFront = movementTowardPlane * portal.entrySign < 0;

        if (crossedPlane && enteredFromFront && isInsidePortalOpeningWithRadius(source, curCenter, sphereRadius)) {
            // Preserve player speed relative to portal orientation.
            playerMoveDelta.copy(curCenter).sub(prevCenter);
            const moveLen = playerMoveDelta.length();

            teleportMat
                .copy(destination.matrixWorld)
                .multiply(teleportRot)
                .multiply(sourceInverse.copy(source.matrixWorld).invert());
            playerYaw.position.applyMatrix4(teleportMat);

            // Transform camera direction through the same portal transform as speed.
            playerLookDir
                .set(0, 0, -1)
                .applyAxisAngle(axisX, playerPitch.rotation.x)
                .applyAxisAngle(axisY, playerYaw.rotation.y)
                .normalize();
            playerUpDir
                .set(0, 1, 0)
                .applyAxisAngle(axisX, playerPitch.rotation.x)
                .applyAxisAngle(axisY, playerYaw.rotation.y)
                .applyAxisAngle(playerLookDir, playerRoll)
                .normalize();
            transformedLookDir.copy(playerLookDir).transformDirection(teleportMat).normalize();
            transformedUpDir.copy(playerUpDir).transformDirection(teleportMat).normalize();
            playerYaw.rotation.y = Math.atan2(-transformedLookDir.x, -transformedLookDir.z);
            playerPitch.rotation.x = Math.asin(
                THREE.MathUtils.clamp(transformedLookDir.y, -0.999, 0.999)
            );
            baseUpAfterTeleport
                .set(0, 1, 0)
                .applyAxisAngle(axisX, playerPitch.rotation.x)
                .applyAxisAngle(axisY, playerYaw.rotation.y)
                .normalize();
            projectedBaseUp.copy(baseUpAfterTeleport).addScaledVector(
                transformedLookDir,
                -baseUpAfterTeleport.dot(transformedLookDir)
            );
            projectedTransformedUp.copy(transformedUpDir).addScaledVector(
                transformedLookDir,
                -transformedUpDir.dot(transformedLookDir)
            );
            if (projectedBaseUp.lengthSq() > 1e-8 && projectedTransformedUp.lengthSq() > 1e-8) {
                projectedBaseUp.normalize();
                projectedTransformedUp.normalize();
                rollCross.crossVectors(projectedTransformedUp, projectedBaseUp);
                playerRoll = Math.atan2(
                    transformedLookDir.dot(rollCross),
                    THREE.MathUtils.clamp(
                        projectedBaseUp.dot(projectedTransformedUp),
                        -1,
                        1
                    )
                );
            } else {
                playerRoll = 0;
            }
            camera.rotation.z = playerRoll;

            if (moveLen > 1e-6 && dt > 1e-6) {
                transformedPlayerMove.copy(playerMoveDelta).normalize().transformDirection(teleportMat);
                transformedPlayerMove.multiplyScalar(moveLen / dt);
                playerCarryVelocity.set(transformedPlayerMove.x, 0, transformedPlayerMove.z);
                verticalVelocity = transformedPlayerMove.y;
            }

            teleportCooldown = 0.2;
            break;
        }
    }
}

function resolvePlayerMiddleWallCollision() {
    const pos = playerYaw.position;
    const inMiddleX = Math.abs(pos.x) < MIDDLE_WALL_HALF_THICKNESS + PLAYER_RADIUS;
    if (!inMiddleX) return;

    // Door opening is passable only below door top and within door width.
    const inDoorGapZ = Math.abs(pos.z) < DOOR_WIDTH * 0.5 - PLAYER_RADIUS;
    const belowDoorTop = pos.y < DOOR_HEIGHT - PLAYER_RADIUS;
    if (inDoorGapZ && belowDoorTop) return;

    // If player is entering a portal that is placed on the middle wall, do not block.
    for (const portal of currentWorld.portals) {
        portal.mesh.getWorldPosition(tmpWorldPos);
        if (Math.abs(Math.abs(tmpWorldPos.x) - MIDDLE_WALL_HALF_THICKNESS) > 0.08) continue;
        tmpNormal.set(0, 0, 1).applyQuaternion(portal.mesh.getWorldQuaternion(tmpQuat)).normalize();
        if (Math.abs(tmpNormal.x) < 0.85) continue;

        const planeDist = Math.abs(tmpNormal.dot(tmpPrevDelta.copy(pos).sub(tmpWorldPos)));
        if (planeDist > PLAYER_RADIUS + 0.2) continue;
        if (isInsidePortalOpeningWithRadius(portal.mesh, pos, PLAYER_RADIUS)) {
            return;
        }
    }

    const pushRight = pos.x >= 0;
    pos.x = (pushRight ? 1 : -1) * (MIDDLE_WALL_HALF_THICKNESS + PLAYER_RADIUS);
    playerCarryVelocity.x = 0;
}

function animate() {
    const dt = Math.min(clock.getDelta(), 0.033);
    const previousPos = playerYaw.position.clone();

    const arrowScale = 0.1;
    const inputX =
        (moveState.right ? 1 : 0) -
        (moveState.left ? 1 : 0) +
        arrowScale * ((slowArrowState.right ? 1 : 0) - (slowArrowState.left ? 1 : 0));
    const inputZ =
        (moveState.backward ? 1 : 0) -
        (moveState.forward ? 1 : 0) +
        arrowScale * ((slowArrowState.down ? 1 : 0) - (slowArrowState.up ? 1 : 0));
    if (inputX !== 0 || inputZ !== 0) {
        const moveDir = new THREE.Vector3(inputX, 0, inputZ);
        if (moveDir.lengthSq() > 1) moveDir.normalize();
        moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerYaw.rotation.y);
        playerYaw.position.addScaledVector(moveDir, MOVE_SPEED * dt);
    }

    // Carry preserved velocity from teleports (e.g. falling into floor portal exits horizontally).
    playerYaw.position.x += playerCarryVelocity.x * dt;
    playerYaw.position.z += playerCarryVelocity.z * dt;

    verticalVelocity += GRAVITY * dt;
    playerYaw.position.y += verticalVelocity * dt;
    const overFloorPortalHole = isOverHorizontalPortalHole(playerYaw.position);
    if (playerYaw.position.y <= EYE_HEIGHT && !overFloorPortalHole) {
        playerYaw.position.y = EYE_HEIGHT;
        verticalVelocity = 0;
        onGround = true;
        playerCarryVelocity.multiplyScalar(0.85);
    } else {
        onGround = false;
    }

    if (
        playerYaw.position.x < -WORLD_HALF_X &&
        !isPointInsidePortalWallHole(playerYaw.position, PLAYER_RADIUS, "x", -WORLD_HALF_X)
    ) {
        playerYaw.position.x = -WORLD_HALF_X;
        playerCarryVelocity.x = 0;
    } else if (
        playerYaw.position.x > WORLD_HALF_X &&
        !isPointInsidePortalWallHole(playerYaw.position, PLAYER_RADIUS, "x", WORLD_HALF_X)
    ) {
        playerYaw.position.x = WORLD_HALF_X;
        playerCarryVelocity.x = 0;
    }

    if (
        playerYaw.position.z < -WORLD_HALF_Z &&
        !isPointInsidePortalWallHole(playerYaw.position, PLAYER_RADIUS, "z", -WORLD_HALF_Z)
    ) {
        playerYaw.position.z = -WORLD_HALF_Z;
        playerCarryVelocity.z = 0;
    } else if (
        playerYaw.position.z > WORLD_HALF_Z &&
        !isPointInsidePortalWallHole(playerYaw.position, PLAYER_RADIUS, "z", WORLD_HALF_Z)
    ) {
        playerYaw.position.z = WORLD_HALF_Z;
        playerCarryVelocity.z = 0;
    }
    resolvePlayerMiddleWallCollision();

    // Teleport when a virtual sphere (radius = camera.near) around the camera touches portal.
    tryPortalCrossing(previousPos, playerYaw.position, dt);
    if (teleportCooldown > 0) teleportCooldown -= dt;

    // Quickly re-level camera roll back to world-up orientation.
    if (Math.abs(playerRoll) > 1e-6) {
        const maxStep = CAMERA_AUTO_LEVEL_SPEED * dt;
        if (Math.abs(playerRoll) <= maxStep) {
            playerRoll = 0;
        } else {
            playerRoll -= Math.sign(playerRoll) * maxStep;
        }
        camera.rotation.z = playerRoll;
    }

    updateBallPhysics(dt);
    updatePortalProjectiles(dt);
    updatePortalPlacementEffects(dt);

    playerYaw.updateMatrixWorld(true);
    world.scene.updateMatrixWorld(true);

	cube.rotation.x += 0.01;
    cube.rotation.y += 0.011;
    knot.rotation.y += 0.015;
    knot.rotation.x += 0.005;
    leftMarker.rotation.y += 0.012;
    rightMarker.rotation.y += 0.014;

    camera.updateMatrixWorld(true);
    updatePortalTextures();
    renderer.render(currentWorld.scene, camera);
    renderer.clearDepth();
    renderer.setScissorTest(true);
    renderer.setScissor(
        window.innerWidth - projectionPanel.right - projectionPanel.width,
        window.innerHeight - projectionPanel.top - projectionPanel.height,
        projectionPanel.width,
        projectionPanel.height
    );
    renderer.setViewport(
        window.innerWidth - projectionPanel.right - projectionPanel.width,
        window.innerHeight - projectionPanel.top - projectionPanel.height,
        projectionPanel.width,
        projectionPanel.height
    );
    renderer.render(projectionDebugScene, projectionDebugCamera);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    drawMinimap();
    drawWeaponIndicator();
}

renderer.setAnimationLoop(animate);

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
