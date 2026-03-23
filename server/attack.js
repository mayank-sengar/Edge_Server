 import axios from 'axios'

 for(let i=0; i<100000;i++){
    axios.get("http://localhost:3000").then(
        res => 
            {
                console.log(res.data);
            }
    ).catch(err => console.log(err));
 }