import { AxiosProgressEvent, type AxiosResponse } from 'axios';
import axiosInstance from './translator';

export const getApi = async (url: string) => {
  try {
    const result: AxiosResponse<any, any> = await axiosInstance.get(url);
    return {
      status: result.status,
      data: result.data,
    };
  } catch (err: any) {
    const data = err?.response?.data ? err?.response?.data : 'Failed to connect';
    const status = err?.response?.status ? err.response.status : 500;
    return { status, data };
  }
};

export const getByIdApi = async (url: string, id: any) => {
  try {
    const result = await axiosInstance.get(`${url}/${id}`);
    return {
      status: result.status,
      data: result.data,
    };
  } catch (err: any) {
    const data = err?.response?.data ? err?.response?.data : 'Failed to connect';
    const status = err?.response?.status ? err.response.status : 500;
    return { status, data };
  }
};

export const getByParamsApi = async (url: string, params: any) => {
  try {
    const result = await axiosInstance.get(url, { params: params });
    return {
      status: result.status,
      data: result.data,
    };
  } catch (err: any) {
    const data = err?.response?.data ? err?.response?.data : 'Failed to connect';
    const status = err?.response?.status ? err.response.status : 500;
    return { status, data };
  }
};

export const postApi = async (url: string, request: any = {}) => {
  try {
    const result = await axiosInstance.post(url, request);
    return {
      status: result.status,
      data: result.data,
    };
  } catch (err: any) {
    const data = err?.response?.data ? err?.response?.data : 'Failed to connect';
    const status = err?.response?.status ? err.response.status : 500;
    return { status, data };
  }
};

export const putApi = async (url: string, request: any) => {
  try {
    const result = await axiosInstance.put(url, request);
    return {
      status: result.status,
      data: result.data,
    };
  } catch (err: any) {
    const data = err?.response?.data ? err?.response?.data : 'Failed to connect';
    const status = err?.response?.status ? err.response.status : 500;
    return { status, data };
  }
};

export const patchApi = async (url: string, request: any) => {
  try {
    const result = await axiosInstance.patch(url, request);
    return {
      status: result.status,
      data: result.data,
    };
  } catch (err: any) {
    const data = err?.response?.data ? err?.response?.data : 'Failed to connect';
    const status = err?.response?.status ? err.response.status : 500;
    return { status, data };
  }
};

export const deleteApi = async (url: string) => {
  try {
    const result = await axiosInstance.delete(url);
    return {
      status: result.status,
      data: result.data,
    };
  } catch (err: any) {
    const data = err?.response?.data ? err?.response?.data : 'Failed to connect';
    const status = err?.response?.status ? err.response.status : 500;
    return { status, data };
  }
};

export const uploadApi = async (
  url: string,
  file: File,
  fileName: string,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
) => {
  try {
    const formData = new FormData();
    formData.append(fileName, file);

    const result: AxiosResponse<any> = await axiosInstance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });

    return {
      status: result.status,
      data: result.data,
    };
  } catch (err: any) {
    const data = err?.response?.data ? err?.response?.data : 'Failed to connect';
    const status = err?.response?.status ? err.response.status : 500;
    return { status, data };
  }
};