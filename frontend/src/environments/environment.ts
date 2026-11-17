export const environment = {
  production: false,
  apiUrl: typeof window === 'undefined' || window.location.port === '5000'
    ? '/api'
    : `${window.location.protocol}//${window.location.hostname}:5000/api`
};
