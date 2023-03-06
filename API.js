var express = require("express");
var cors = require("cors");
let XLSX = require('xlsx');
let { scrap } = require("./index.js");
let openfoodfacts = require("./openfoodfacts");
let {getImages, getImagesWithOFF} = require("./image");
//const nodeCmd = require('node-cmd');

var app = express();

app.use(express.static('public'));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
/*
app.use(bodyParser.urlencoded({
   extended: true
 }));
 */


app.use(cors());

app.post('/', async function (req, res) {
   console.log("new request to /")
   console.log(req.body.EANS);
   if(req.body.EANS == undefined) res.json({message: "no EANS"});
   let data = await scrap(req.body.EANS, req.body.name, true);
    console.log("responding")
    console.log(data);
   res.json({data: data, message: "everything is ok"});
    
 
 })

 app.post('/openfoodfacts', async function (req, res) {
   console.log("new request to /openfoodfacts")
   console.log(req.body.EANS);
   if(req.body.EANS == undefined) res.json({message: "no EANS"});
   let data = await openfoodfacts(req.body.EANS, true);
    
    console.log(data);
   res.json({data: data, message: "everything is ok"}); 
  
 })

 app.post('/images', async function (req, res) {
   console.log("new request to /images")
   console.log(req.body.EANS);
   if(req.body.EANS == undefined) res.json({message: "no EANS"});
   let data = await getImages(req.body.EANS, true);
    
   console.log("-----------> "+data);
   res.json({data: data, message: "everything is ok"}); 
  
 })

 app.get('/', function (req, res) {
    
    res.send("hello");
 })


//nodeCmd.run('dir', (err, data, stderr) => console.log(data));
app.listen(8000, () => {
 console.log("Server running on port 8000");
});

