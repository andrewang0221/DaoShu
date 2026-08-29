/**
 * GLB 三维头像渲染（H5）：three.js 渲染 .glb 模型。
 * 自动取景 + 待机呼吸 + 可调自转 + ARKit 表情驱动（眨眼 / 眼神扫视 / 口型语音同步）。
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { AvatarAnimOptions } from './avatar-anim';
import { DEFAULT_ANIM } from './avatar-anim';

export interface GlbHandle {
  setSpeaking(v: boolean): void;
  /** 实时更新动画设置（自转速度 / 眨眼眼神 / 口型同步） */
  setOptions(opts: Partial<AvatarAnimOptions>): void;
  destroy(): void;
}

/** 需要驱动的 ARKit morph 通道名（缺失自动跳过） */
const CH = {
  jawOpen: 'jawOpen',
  mouthFunnel: 'mouthFunnel',
  browInnerUp: 'browInnerUp',
  eyeBlinkL: 'eyeBlinkLeft',
  eyeBlinkR: 'eyeBlinkRight',
  eyeLookInL: 'eyeLookInLeft',
  eyeLookInR: 'eyeLookInRight',
  eyeLookOutL: 'eyeLookOutLeft',
  eyeLookOutR: 'eyeLookOutRight',
  eyeLookUpL: 'eyeLookUpLeft',
  eyeLookUpR: 'eyeLookUpRight',
  eyeLookDownL: 'eyeLookDownLeft',
  eyeLookDownR: 'eyeLookDownRight',
} as const;

type ChannelKey = keyof typeof CH;

/** 逐 mesh 收集各通道索引（模型可能拆分多个 mesh，按字典探测） */
function collectChannels(model: THREE.Group): Map<ChannelKey, { mesh: THREE.Mesh; idx: number }[]> {
  const map = new Map<ChannelKey, { mesh: THREE.Mesh; idx: number }[]>();
  model.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;
    for (const key of Object.keys(CH) as ChannelKey[]) {
      const idx = mesh.morphTargetDictionary[CH[key]];
      if (idx !== undefined) {
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ mesh, idx });
      }
    }
  });
  return map;
}

function setChannel(chs: Map<ChannelKey, { mesh: THREE.Mesh; idx: number }[]>, key: ChannelKey, v: number) {
  const list = chs.get(key);
  if (!list) return;
  for (const { mesh, idx } of list) mesh.morphTargetInfluences![idx] = v;
}

/**
 * 在 host 元素内挂载 GLB 模型渲染器。
 * 加载失败时 resolve(null)，由调用方回落 Canvas 参数化渲染。
 */
export async function mountGlb(
  host: HTMLElement,
  url: string,
  opts?: Partial<AvatarAnimOptions>,
): Promise<GlbHandle | null> {
  try {
    const width = host.clientWidth || 160;
    const height = host.clientHeight || 200;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.01, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    host.innerHTML = '';
    host.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    // 灯光：柔和主光 + 补光 + 环境光
    scene.add(new THREE.AmbientLight(0xfff6e8, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2, 3, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe8dcc8, 0.7);
    fill.position.set(-3, 1, 2);
    scene.add(fill);

    const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
      new GLTFLoader().load(
        url,
        (g) => resolve(g),
        undefined,
        (err) => reject(err),
      );
    }).catch((err) => {
      console.warn('[glb-avatar] 模型加载失败，回落参数化渲染:', url, err);
      return null;
    });
    if (!gltf) return null;
    const model = gltf.scene;
    const chs = collectChannels(model);
    if (!chs.has('jawOpen')) {
      console.warn('[glb-avatar] 模型无 jawOpen 通道，口型同步不可用');
    }

    // 取景：按包围盒居中，取上半身视角（顶部 60%）
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    scene.add(model);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    camera.position.set(0, size.y * 0.12, maxDim * 1.6);
    camera.lookAt(0, 0, 0);

    // ---------- 动画状态 ----------
    const anim: Required<AvatarAnimOptions> = { ...DEFAULT_ANIM, ...opts };
    let disposed = false;
    let speaking = false;
    const clock = new THREE.Clock();

    // 眨眼状态机：等待 → 闭眼 → 睁眼
    let nextBlinkAt = 1 + Math.random() * 3;
    let blinkPhase: 'idle' | 'closing' | 'opening' = 'idle';
    let blinkT = 0;
    let blinkValue = 0;

    // 眼神扫视：目标 → 缓动逼近
    let gazeX = 0;
    let gazeY = 0;
    let gazeTargetX = 0;
    let gazeTargetY = 0;
    let nextGazeAt = 2 + Math.random() * 2;
    let rotAngle = 0;

    function pickGaze(t: number) {
      if (speaking) {
        // 说话时大多看向镜头，偶尔瞟开
        if (Math.random() < 0.75) {
          gazeTargetX = 0;
          gazeTargetY = 0;
        } else {
          gazeTargetX = (Math.random() - 0.5) * 0.7;
          gazeTargetY = (Math.random() - 0.5) * 0.3;
        }
      } else {
        gazeTargetX = (Math.random() - 0.5) * 1.1;
        gazeTargetY = (Math.random() - 0.4) * 0.5;
      }
      nextGazeAt = t + (speaking ? 1.5 : 3) + Math.random() * 2.5;
    }

    function tick() {
      if (disposed) return;
      requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.1);
      const t = clock.getElapsedTime();

      // 自转（可调速/可停）+ 呼吸起伏；说话时微动幅度加大
      rotAngle += anim.rotationSpeed * dt;
      model.rotation.y = rotAngle;
      const amp = speaking ? 0.03 : 0.012;
      model.position.y = center.y * -1 + Math.sin(t * (speaking ? 6 : 2)) * amp;

      // 眨眼状态机
      if (anim.blinkEnabled) {
        if (blinkPhase === 'idle' && t >= nextBlinkAt) {
          blinkPhase = 'closing';
          blinkT = 0;
        } else if (blinkPhase === 'closing') {
          blinkT += dt;
          blinkValue = Math.min(1, blinkT / 0.12);
          if (blinkValue >= 1) {
            blinkPhase = 'opening';
            blinkT = 0;
          }
        } else if (blinkPhase === 'opening') {
          blinkT += dt;
          blinkValue = Math.max(0, 1 - blinkT / 0.18);
          if (blinkValue <= 0) {
            blinkPhase = 'idle';
            nextBlinkAt = t + 2 + Math.random() * 4;
          }
        }
      } else {
        blinkValue = 0;
      }
      setChannel(chs, 'eyeBlinkL', blinkValue);
      setChannel(chs, 'eyeBlinkR', blinkValue);

      // 眼神扫视（缓动逼近目标）
      if (t >= nextGazeAt) pickGaze(t);
      const ease = 1 - Math.pow(0.001, dt); // 平滑系数
      gazeX += (gazeTargetX - gazeX) * ease;
      gazeY += (gazeTargetY - gazeY) * ease;
      // ARKit 约定：In = 看向鼻侧，Out = 看向耳侧；两眼同向时左右眼通道互补
      setChannel(chs, 'eyeLookInL', Math.max(0, gazeX));
      setChannel(chs, 'eyeLookOutR', Math.max(0, gazeX));
      setChannel(chs, 'eyeLookOutL', Math.max(0, -gazeX));
      setChannel(chs, 'eyeLookInR', Math.max(0, -gazeX));
      setChannel(chs, 'eyeLookUpL', Math.max(0, gazeY));
      setChannel(chs, 'eyeLookUpR', Math.max(0, gazeY));
      setChannel(chs, 'eyeLookDownL', Math.max(0, -gazeY));
      setChannel(chs, 'eyeLookDownR', Math.max(0, -gazeY));

      // 口型 + 表情：跟随语音播报节奏张合（0.55 倍率避免夸张）
      if (speaking && anim.mouthSync) {
        const open = Math.max(0, Math.sin(t * 9)) * 0.55;
        setChannel(chs, 'jawOpen', open);
        setChannel(chs, 'mouthFunnel', open * 0.35);
        setChannel(chs, 'browInnerUp', 0.12 + Math.max(0, Math.sin(t * 2.6)) * 0.12);
      } else {
        setChannel(chs, 'jawOpen', 0);
        setChannel(chs, 'mouthFunnel', 0);
        setChannel(chs, 'browInnerUp', 0);
      }

      renderer.render(scene, camera);
    }
    tick();

    return {
      setSpeaking(v: boolean) {
        speaking = v;
        if (v) pickGaze(clock.getElapsedTime());
      },
      setOptions(update: Partial<AvatarAnimOptions>) {
        Object.assign(anim, update);
      },
      destroy() {
        disposed = true;
        renderer.dispose();
        host.innerHTML = '';
      },
    };
  } catch (err) {
    console.warn('[glb-avatar] 渲染器初始化失败，回落参数化渲染:', err);
    return null;
  }
}
