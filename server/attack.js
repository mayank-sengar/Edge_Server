 import axios from 'axios'
import { response } from 'express';

 for(let i=0; i<1000;i++){
    axios.get("http://localhost:3001").then(
        res => 
            {
                console.log(res.data);
            }
    ).catch(err => console.log("BLocked" ,err.response.status));
 }