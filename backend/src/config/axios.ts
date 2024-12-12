import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const timburr_api = axios.create({
	baseURL: process.env.TIMBURR_URL || 'http://localhost:8000',
	timeout: 30000,
	headers: {
		'Content-Type': 'application/json',
	},
});

timburr_api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response) {
			console.error('Response Error: ', error.response.data);
			console.error('Status: ', error.response.status);
		} else if (error.request) {
			console.error('Request Error: ', error.resquest);
		} else {
			console.error('Error: ', error.message);
		}
		return Promise.reject(error);
	}
);

export default timburr_api;
