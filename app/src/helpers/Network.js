import axios from 'axios';

// Add base URL to network requests
const axiosInstance = axios.create({
    baseURL: process.env.VUE_APP_API_URL,
});

export default class Network {

    static axios = axiosInstance;

    static get(url, config) {
        return this.axios.get(url, config);
    }

    static post(url, data, config) {
        return this.axios.post(url, data, config);
    }

    static patch(url, data, config) {
        return this.axios.patch(url, data, config);
    }

    static put(url, data, config) {
        return this.axios.put(url, data, config);
    }

    static delete(url, config) {
        return this.axios.delete(url, config);
    }

}
