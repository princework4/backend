/* eslint-disable no-undef */
const Redis = require('ioredis');
require('dotenv').config();

const redisClient = () => {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
        try {
            console.log('Connecting to Redis with URL:', redisUrl);
            const client = new Redis(redisUrl, {
                maxRetriesPerRequest: 100, // Increase the max retries
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    console.log(`Retrying Redis connection in ${delay}ms...`);
                    return delay;
                },
            });
            client.on('connect', () => {
                console.log('Redis Connected');
            });
            client.on('error', (err) => {
                console.error('Redis connection error:', err);
            });
            return client;
        } catch (err) {
            console.error('Error creating Redis client:', err);
            throw err;
        }
    } else {
        console.error('REDIS_URL not found in environment variables');
        throw new Error('Redis connection failed');
    }
};

module.exports = redisClient();
