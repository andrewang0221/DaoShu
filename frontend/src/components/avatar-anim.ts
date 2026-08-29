/**
 * 3D 数字人动画设置（自转 / 眨眼眼神 / 口型同步）
 * localStorage 持久化，聊天页与认养预览页共用
 */

export interface AvatarAnimOptions {
  /** 自转角速度（rad/s），0 = 不转 */
  rotationSpeed: number;
  /** 眨眼 + 眼神扫视动画 */
  blinkEnabled: boolean;
  /** 口型跟随语音播报同步张合 */
  mouthSync: boolean;
}

export const AVATAR_ROT_OPTIONS = [
  { value: 0, label: '不转' },
  { value: 0.15, label: '慢' },
  { value: 0.4, label: '中' },
  { value: 0.8, label: '快' },
] as const;

export const DEFAULT_ANIM: AvatarAnimOptions = {
  rotationSpeed: 0.15,
  blinkEnabled: true,
  mouthSync: true,
};

const KEY_ROT = 'ddj_anim_rot';
const KEY_BLINK = 'ddj_anim_blink';
const KEY_MOUTH = 'ddj_anim_mouth';

export function loadAnimOptions(): AvatarAnimOptions {
  try {
    const rot = parseFloat(uni.getStorageSync(KEY_ROT) ?? '');
    const blink = uni.getStorageSync(KEY_BLINK);
    const mouth = uni.getStorageSync(KEY_MOUTH);
    return {
      rotationSpeed: AVATAR_ROT_OPTIONS.some((o) => o.value === rot) ? rot : DEFAULT_ANIM.rotationSpeed,
      blinkEnabled: blink === '' || blink === undefined ? DEFAULT_ANIM.blinkEnabled : blink !== '0',
      mouthSync: mouth === '' || mouth === undefined ? DEFAULT_ANIM.mouthSync : mouth !== '0',
    };
  } catch {
    return { ...DEFAULT_ANIM };
  }
}

export function saveAnimOptions(opts: AvatarAnimOptions): void {
  uni.setStorageSync(KEY_ROT, String(opts.rotationSpeed));
  uni.setStorageSync(KEY_BLINK, opts.blinkEnabled ? '1' : '0');
  uni.setStorageSync(KEY_MOUTH, opts.mouthSync ? '1' : '0');
}
