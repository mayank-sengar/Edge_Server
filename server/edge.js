import express from 'express';
import axios from 'axios';
import Redis from 'ioredis';

const app = express();
const redis= new Redis();


async function rateLimit(ip){
    const key = `rate_limit:${ip}`;
    const count = await redis.incr(key);

    if(count == 1){
        //expire in 10seconds
        return redis.expire(key,10);
    }

    if(count > 20) return false;

    return true;
}

async function isBlackListed(ip){
    const result = await redis.get(`blacklist:${ip}`);

    return result=== "true";
}

async function blacklist(ip){
    //key : value , expire after 1 hour(3600 sec)
    await redis.set(`blacklist:${ip}`,"true","EX",3600);
}