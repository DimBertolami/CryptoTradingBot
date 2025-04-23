import axios from 'axios';
import { StatusResponse } from '../types/status';

const API_BASE_URL = '/api/v1';

export const fetchStatus = async (endpoint: string): Promise<StatusResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}${endpoint}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching status:', error);
    throw error;
  }
};