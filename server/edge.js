import express, { response } from 'express';
import axios from 'axios';
import Redis from 'ioredis';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const redis= new Redis();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;


async function rateLimit(ip){
    const key = `rate_limit:${ip}`;
    const count = await redis.incr(key);

    if(count == 1){
        //expire in 10seconds
        await redis.expire(key,10);
        return true;
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
        userAgent.includes("scraper") 
    )return true;

    return false;
}

app.get("/verify",async(req,res)=>{
    const answer= req.query.answer;
    const ip = req.ip;


    if(answer === "17"){
        await redis.set(`verified:${ip}`,"true","EX",600);
        return res.redirect("/");
    }

    return res.status(400).send("Verification failed");
})

async function isVerified(ip){
    const result= await redis.get(`verified:${ip}`);
    return result == "true";
}

async function getCache(key){
    const data=await redis.get(key);

    if(!data) return null;
    return JSON.parse(data);
}

async function setCache(key,data){
    await redis.set(key,JSON.stringify(data),"EX",30);
    
}

//middleware

app.use(async (req,res,next)=> {
    const ip= req.ip;

    if(await isBlackListed(ip)){
        return res.status(403).send("You are blacklisted")
    }

    const allowed = await rateLimit(ip);
    if(!allowed){
        await blacklist(ip);
        return res.status(429).send("Too many request. You are blacklisted for 1 hour")
    }

    if(detectBot(req)){
        if(!await isVerified(ip)){
        //     return res.status(403).send("Please verify you are human by visiting /verify?answer=17")
        return res.sendFile(path.join(__dirname, "captcha.html"));
        }
    }


    next();


})
app.get('/', async (req, res) => {
    const key = `response:${req.ip}`;

    try {
        const cached = await getCache(key);
        if (cached) return res.json({ ...cached, source: 'cache' });

        const response = await axios.get("http://localhost:3000/")
       const payload=response.data;

        await setCache(key, payload);
        res.json({ ...payload, source: 'origin' });

    } catch (e) {
        res.status(502).json({ message: 'Failed', error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`Listening on PORT: ${PORT}`);
});
