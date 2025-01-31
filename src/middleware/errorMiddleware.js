import axios from 'axios';

export const handleApiError = (error) => {
  if (axios.isAxiosError(error)) {
    // Handle network or server errors
    if (!error.response) {
      return 'Network error. Please check your connection.';
    }

    // Handle authentication errors
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth';
      return 'Session expired. Please login again.';
    }

    // Handle other server errors
    return error.response.data.message || 'Something went wrong';
  }

  // Handle other types of errors
  return error.message || 'An unexpected error occurred';
};