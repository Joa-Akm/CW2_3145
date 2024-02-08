const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs')
const mongodb = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/images', express.static(path.join(__dirname, 'images')));

const MongoClient = require('mongodb').MongoClient;
const ObjectID = mongodb.ObjectID;
// MongoDB Connection
let db;

MongoClient.connect('mongodb+srv://dbJoana:Akimanajo*@atlascluster.ces6ikx.mongodb.net', (err, client) =>{
db = client.db('lessonsActivity');
lessonsCollection = db.collection('lessons');
ordersCollection = db.collection('orders');


})

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

app.use((express.static('Public')));

// Middleware - Logger
app.use(function (req, res, next){
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware - Static File
app.use((req, res, next) => {
  const imagePath = path.join(__dirname, 'images', req.url);
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    next()
    
  }
});

app.param('collectionName', function (req, res, next, collectionName){
    req.collection = db.collection(collectionName)
    return next()
})
//Routes
app.get('/', (req,res,next) =>{
    req.send('Select a collection, e.g, /collection/messages')
})



//retrieve all the objects from the collection
app.get('/collection/:collectionName',(req, res, next) =>{
    req.collection.find({}).toArray((e, results) =>{
        if (e) return next(e)
        res.send(results)
    })
})

app.get('/search', (req, res,next) => {
    req.collection = db.collection("lessons")
    let {keyword} = req.query
    console.log("searching for "+keyword)
    req.collection.find({}).toArray((err, results) => {
        if (err) return next(err)
        let filteredList = results.filter((lesson) => {
            return lesson.title.toLowerCase().includes(keyword.toLowerCase()) || lesson.location.toLowerCase().includes(keyword.toLowerCase())
         });  
         res.send(filteredList)
     });
})

//Adding post
app.post('/collection/:collectionName', (req, res, next) =>{
    req.collection.insert(req.body, (e, results) =>{
        if(e) return next(e)
        res.send(results.ops)
    })
})

//return with object id

app.get('/collection/:collectionName/:id', (req,res, next) => {
    req.collection.findOne({ _id: new ObjectID(req.params.id)}, (e, result) => {
        if(e) return next(e)
        res.send(result)
    })
})

//update an object
app.put('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.update({
        _id: new ObjectID(req.params.id)
    },
    {
        $set: req.body
    },
    {
        safe: true, multi:false
    },
    (e, result) => {
        if(e) return next(e)
        res.send((result.result.n === 1) ? {msg: 'success'} : {msg: 'error'})
    })
})

//Delete
app.delete('/collection/:collectionName/:id', (req, res, next) =>{
    req.collection.deleteOne(
        {_id: ObjectID(req.params.id)},(e, result)=>
        {
            if (e) return next(e)
            res.send((result.result.n === 1) ? 
            {msg: 'success'} : {msg: 'error'}
            )
        }
    )
})

app.listen(port, function () {
    console.log(`Server running on port ${port}`);
});