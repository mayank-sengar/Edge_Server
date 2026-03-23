import express from 'express'

const app=express();

app.get('/',(req,res)=>{
    res.json({
        message: "hello",
        time : Date.now()
    })
});

app.listen(3000,()=>{
    console.log("Listening on PORT: 3000")
})
