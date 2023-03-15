var express = require("express");
var cors = require("cors");
let XLSX = require('xlsx');
let { scrap } = require("./index.js");
let openfoodfacts = require("./openfoodfacts");
let {getImages, getImagesWithOFF} = require("./image");
const { makeCompletion } = require("./chatGPT.js");
let dotenv = require("dotenv");
dotenv.config();
//const nodeCmd = require('node-cmd');

var app = express();

let a = process.argv.slice(2);
console.log(a);
console.log(a.length)
let arguments={};
for(let i=0; i<a.length-1; i+=2){
    let t={};
    t[a[i].replace(/-/g, "")]= a[i+1];
    arguments={...arguments, ...t};
}

app.use(express.static('public'));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
/*
app.use(bodyParser.urlencoded({
   extended: true
 }));
 */


//app.use(cors());

app.post('/', async function (req, res) {
   console.log("request to /")
   console.log(req.body.EANS);
   if(req.body.EANS == undefined){
    res.json({message: "no EANS"});
    return;
   } 
   let data = await scrap(req.body.EANS, req.body.name, true);
    console.log("responding")
    console.log(data);
   res.json({data: data, message: "everything is ok"});
    
 
 })

 app.post('/openfoodfacts', async function (req, res) {
   console.log("request to /openfoodfacts")
   console.log(req.body.EANS);
   if(req.body.EANS == undefined){
    res.json({message: "no EANS"})
    return;
   }
   let data = await openfoodfacts(req.body.EANS, true);
    
    console.log(data);
   res.json({data: data, message: "everything is ok"}); 
  
 })

 app.post('/images', async function (req, res) {
   console.log("request to /images")
   console.log(req.body.EANS);
   if(req.body.EANS == undefined){
    res.json({message: "no EANS"})
    return;
   }
   let data = await getImages(req.body.EANS, true);
    
   console.log("-----------> "+data);
   res.json({data: data, message: "everything is ok"}); 
  
 })

 app.post('/descriptionCompletion', async function (req, res) {
  console.log("request to /descriptionCompletion")
  console.log(req.body.theme, req.body.searchKeyWords);
  if(req.body.prompt == undefined){
     res.json({message: "no prompt"});
     return;
  }
  let response;
  if(!!req.body.theme.trim() == true && !!req.body.searchKeyWords == true){
    response = await makeCompletion(req.body.prompt, req.body.theme, req.body.searchKeyWords);
  }else{
    response = await makeCompletion(req.body.prompt);
  }
   console.log("responding")
   console.log(response);
  res.json({...response});
   

})

 app.get('/', function (req, res) {
    
    res.send("hello");
 })


//nodeCmd.run('dir', (err, data, stderr) => console.log(data));
app.listen(process.env.PORT | arguments.p, () => {
 console.log("Server running on port "+arguments.p);
});


