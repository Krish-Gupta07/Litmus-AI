import axios from 'axios';
import { apiEndUrl } from './urls';

const axiosInstance = axios.create({
  baseURL: apiEndUrl,
  withCredentials: true,
});

export default axiosInstance;
