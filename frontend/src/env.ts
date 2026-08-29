/**
 * 运行环境配置
 * - API_BASE：后端地址
 * - LIVE2D_MODEL_URL：Live2D 模型地址（可选，空则使用内置画布数字人）
 */

// 运行环境配置
declare const process: {
  env: {
    NODE_ENV: string;
  };
};

// 检查是否在H5环境
const isH5 = typeof window !== 'undefined' && window.location && window.location.protocol === 'http:';

// 根据环境设置API基础地址
let API_BASE: string;
if (isH5) {
  // H5环境：本地开发（localhost/127.0.0.1）指向本地后端；线上部署走同源（nginx 反代 /api/v1）
  const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
  API_BASE = isLocalHost
    ? 'http://localhost:3081/api/v1'
    : `${window.location.origin}/api/v1`;
} else {
  // 小程序/App环境
  API_BASE = 'https://your-domain.example.com/api/v1';
}

export { API_BASE };

// Live2D 模型（H5 可用）：如 '/static/live2d/mymodel/model3.json'
// 未配置或加载失败时，AvatarRenderer 自动降级为内置 Canvas 国风卡通数字人
export const LIVE2D_MODEL_URL = '';
