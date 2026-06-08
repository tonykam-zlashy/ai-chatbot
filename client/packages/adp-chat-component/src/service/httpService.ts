/**
 * HTTP 服务模块
 * 基于 Axios 的请求封装
 */
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

const DEVICE_ID_STORAGE_KEY = 'adp_chat_device_id';
const DEVICE_ID_HEADER = 'X-Device-ID';

const createDeviceId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
};

export const getDeviceId = (): string => {
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
};

// 默认配置
const defaultConfig: AxiosRequestConfig = {
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
};

// 创建 axios 实例
let axiosInstance: AxiosInstance = axios.create(defaultConfig);

// 标记是否设置了自定义响应拦截器
let hasCustomResponseInterceptor = false;

interface RequestInterceptorHandler {
    onFulfilled?: (config: any) => any;
    onRejected?: (error: any) => any;
}

interface ResponseInterceptorHandler {
    onFulfilled?: (response: AxiosResponse) => any;
    onRejected?: (error: any) => any;
}

const requestInterceptors: RequestInterceptorHandler[] = [];
const responseInterceptors: ResponseInterceptorHandler[] = [];

const applyDeviceIdInterceptor = (instance: AxiosInstance) => {
    instance.interceptors.request.use((config) => {
        const deviceId = getDeviceId();
        if (!deviceId) {
            return config;
        }

        config.headers = config.headers || {};
        const headers = config.headers as any;
        if (typeof headers.set === 'function') {
            headers.set(DEVICE_ID_HEADER, deviceId);
        } else if (!headers[DEVICE_ID_HEADER]) {
            headers[DEVICE_ID_HEADER] = deviceId;
        }
        return config;
    });
};

const applyStoredInterceptors = (instance: AxiosInstance) => {
    applyDeviceIdInterceptor(instance);
    requestInterceptors.forEach(({ onFulfilled, onRejected }) => {
        instance.interceptors.request.use(onFulfilled, onRejected);
    });
    responseInterceptors.forEach(({ onFulfilled, onRejected }) => {
        instance.interceptors.response.use(onFulfilled, onRejected);
    });
    hasCustomResponseInterceptor = responseInterceptors.length > 0;
};

applyDeviceIdInterceptor(axiosInstance);

/**
 * 配置 axios 实例
 * @param config axios 配置
 */
export const configureAxios = (config: AxiosRequestConfig) => {
    const { apiDetailConfig: _apiDetailConfig, ...axiosConfig } = config as AxiosRequestConfig & {
        apiDetailConfig?: unknown;
    };
    axiosInstance = axios.create({
        ...defaultConfig,
        ...axiosConfig,
    });
    applyStoredInterceptors(axiosInstance);
};

/**
 * 设置请求拦截器
 * @param onFulfilled 成功回调
 * @param onRejected 失败回调
 */
export const setRequestInterceptor = (
    onFulfilled?: (config: any) => any,
    onRejected?: (error: any) => any
) => {
    requestInterceptors.push({ onFulfilled, onRejected });
    axiosInstance.interceptors.request.use(onFulfilled, onRejected);
};

/**
 * 设置响应拦截器
 * @param onFulfilled 成功回调
 * @param onRejected 失败回调
 */
export const setResponseInterceptor = (
    onFulfilled?: (response: AxiosResponse) => any,
    onRejected?: (error: any) => any
) => {
    responseInterceptors.push({ onFulfilled, onRejected });
    hasCustomResponseInterceptor = true;
    axiosInstance.interceptors.response.use(onFulfilled, onRejected);
};

/**
 * HTTP 服务对象
 */
/**
 * 获取当前 axios 实例的 baseURL
 * 用于拼接同域代理 URL（如文件下载）
 */
export const getAxiosBaseURL = (): string => {
    return axiosInstance.defaults.baseURL || '';
};

export const httpService = {
    /**
     * GET 请求
     * @param url 请求地址
     * @param params 请求参数
     * @param config 额外配置
     */
    async get<T = any>(url: string, params?: object, config?: AxiosRequestConfig): Promise<T> {
        const response = await axiosInstance.get(url, { params, ...config });
        // 如果设置了自定义响应拦截器，拦截器已经处理了 response.data
        return (hasCustomResponseInterceptor ? response : response.data) as T;
    },

    /**
     * POST 请求
     * @param url 请求地址
     * @param data 请求数据
     * @param config 额外配置
     */
    async post<T = any>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
        const response = await axiosInstance.post(url, data, config);
        return (hasCustomResponseInterceptor ? response : response.data) as T;
    },

    /**
     * PUT 请求
     * @param url 请求地址
     * @param data 请求数据
     * @param config 额外配置
     */
    async put<T = any>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
        const response = await axiosInstance.put(url, data, config);
        return (hasCustomResponseInterceptor ? response : response.data) as T;
    },

    /**
     * DELETE 请求
     * @param url 请求地址
     * @param config 额外配置
     */
    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await axiosInstance.delete(url, config);
        return (hasCustomResponseInterceptor ? response : response.data) as T;
    },
};

export default httpService;
