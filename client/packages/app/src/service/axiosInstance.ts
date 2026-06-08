import axios from 'axios';
import { getBaseURL } from '@/utils/url';

const DEVICE_ID_STORAGE_KEY = 'adp_chat_device_id';
const DEVICE_ID_HEADER = 'X-Device-ID';

const createDeviceId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

const getDeviceId = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const storage = window.localStorage;
    let deviceId = storage.getItem(DEVICE_ID_STORAGE_KEY);
    if (!deviceId) {
      deviceId = createDeviceId();
      storage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    }
    return deviceId;
  } catch {
    return '';
  }
}

// 创建axios实例
const instance = axios.create({
  baseURL: getBaseURL(),
  timeout: 1000 * 60, // 请求超时时间
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const deviceId = getDeviceId();
    if (deviceId) {
      config.headers = config.headers || {};
      const headers = config.headers as any;
      if (typeof headers.set === 'function') {
        headers.set(DEVICE_ID_HEADER, deviceId);
      } else if (!headers[DEVICE_ID_HEADER]) {
        headers[DEVICE_ID_HEADER] = deviceId;
      }
    }
    return config
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error)
  },
)

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    return response.data
  },
  async (error) => {
    // 如果是stream响应
    if (
      error.response &&
      error.response.config &&
      error.response.config.responseType === 'stream'
    ) {
      try {
        // 将流转换为文本
        const data = await new Response(error.response.data).text()
        // 替换为转换后的数据
        if (error.response.headers['content-type'] === 'application/json') {
          error.response.data = JSON.parse(data)
        } else {
          error.response.data = data
        }
      } catch (e) {
        console.error('stream转换失败:', e)
      }
    } else if (error.response) {
      // 对响应错误做点什么
      // 服务器返回了错误状态码
      console.error('API Error:', error.response.status, error.response.data)
    } else {
      console.error('Network Error:', error.message)
    }
    console.log('[error] axio',error)
    return Promise.reject(error)
  },
)

// workaround for webkit bug 194379 (https://bugs.webkit.org/show_bug.cgi?id=194379)
if (!(ReadableStream.prototype as any)[Symbol.asyncIterator]) {
  (ReadableStream.prototype as any)[Symbol.asyncIterator] = async function* () {
    const reader = this.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  };
}
export default instance
