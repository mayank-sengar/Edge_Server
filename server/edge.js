import express from 'express';
import axios from 'axios';
import Redis from 'ioredis';
import { use } from 'react';

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

function detectBot(req){
    const userAgent= req.headers["user-agent"] || "";

    if(
        userAgent.includes("curl") ||
        userAgent.includes("bot") ||
        userAgent.includes("scrapper") 
    )return true;

    return false;
}

app.get("/verify",async(req,res)=>{
    const answer= req.query.answer;
    const ip = req.ip;


    if(answer==17){
        await redis.set(`verified:${ip}`,"true","EX",600);
        res.send("Verification success");
    }
    else{
        res.send("Verification failed");
    }
})

async function isVerified(ip){
    const result= await redis.get(`verified:${ip}`);
    return result == "true";
}

