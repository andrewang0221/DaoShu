/**
 * Live2D 适配器（仅 H5）
 * - 依赖 pixi-live2d-display + pixi.js，模型文件由 LIVE2D_MODEL_URL 指定
 * - 需在 H5 页面加载 Cubism Core 运行时（live2dcubismcore.min.js），
 *   未加载或模型缺失时抛错 → 返回 null → 上层自动降级为画布数字人
 */

export interface Live2DHandle {
  destroy(): void;
}

export async function mountLive2D(
  el: HTMLElement,
  modelUrl: string,
): Promise<Live2DHandle | null> {
  // #ifdef H5
  try {
    const [{ Application }, { Live2DModel }] = await Promise.all([
      import('pixi.js'),
      import('pixi-live2d-display'),
    ]);
    const app = new Application({
      resizeTo: el,
      backgroundAlpha: 0,
      autoStart: true,
      antialias: true,
    });
    el.appendChild(app.view as HTMLCanvasElement);
    const model = await Live2DModel.from(modelUrl, { autoInteract: false });
    model.scale.set(0.16);
    model.anchor.set(0.5, 0.5);
    app.stage.addChild(model);
    app.ticker.add(() => model.update(app.ticker.deltaMS));
    return {
      destroy: () => {
        app.destroy(true, { children: true, texture: true });
      },
    };
  } catch (e) {
    console.warn('[live2d] 加载失败，降级为画布数字人：', (e as Error).message);
    return null;
  }
  // #endif
  // #ifndef H5
  return null;
  // #endif
}
