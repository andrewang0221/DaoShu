import { API_BASE } from '../env';

let token = '';

export function setToken(t: string): void {
  token = t;
}
export function getToken(): string {
  return token;
}

/** 统一请求封装：JWT 注入 + 错误提示（silent 时不弹 toast，用于游客预览兜底场景） */
export function request<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: unknown,
  opts?: { silent?: boolean; timeout?: number },
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: `${API_BASE}${path}`,
      method,
      data: data as never,
      timeout: opts?.timeout ?? 30000,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
        } else {
          const body = res.data as { message?: string } | undefined;
          const msg = body?.message ?? `请求失败（${res.statusCode}）`;
          if (!opts?.silent) uni.showToast({ title: msg, icon: 'none', duration: 2500 });
          reject(new Error(msg));
        }
      },
      fail: (err) => {
        if (!opts?.silent) uni.showToast({ title: '网络异常，请检查后端是否启动', icon: 'none', duration: 2500 });
        reject(err);
      },
    });
  });
}

export const get = <T = unknown>(path: string, opts?: { silent?: boolean }): Promise<T> =>
  request<T>('GET', path, undefined, opts);
export const post = <T = unknown>(path: string, data?: unknown, opts?: { silent?: boolean; timeout?: number }): Promise<T> =>
  request<T>('POST', path, data, opts);
export const put = <T = unknown>(path: string, data?: unknown, opts?: { silent?: boolean; timeout?: number }): Promise<T> =>
  request<T>('PUT', path, data, opts);
export const del = <T = unknown>(path: string, opts?: { silent?: boolean }): Promise<T> =>
  request<T>('DELETE', path, undefined, opts);
