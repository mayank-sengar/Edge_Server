import express from 'express';
import axios from 'axios';
import Redis from 'ioredis';

const app = express();
const redis= new Redis();


async function rateLimit(ip){
    const key = `rate_limit:${ip}`;
    const count = await redis.incr(key);

    if(count == 100){
        //expire in 10seconds
        return redis.expire(key,10);
    }

    if(count > 20) return false;

    return true;
}