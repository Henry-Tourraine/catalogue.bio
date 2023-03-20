let { chromium, devices, defineConfig } = require('@playwright/test');
let writeXlsxFile = require('write-excel-file');
let {writeXLSX} = require("./writeXLSX.js");
let {saveToDrive} = require("./saveToDrive.js");
let axios = require("axios");
const fs = require('fs');
require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
const { count } = require('console');
const { apigeeregistry } = require('googleapis/build/src/apis/apigeeregistry/index.js');

let data = [];
let clickTimeout = { timeout: 3000000 }

async function sleep(time){
  return await new Promise((res, rej)=>{setTimeout(()=>res(), time)});
}

async function shallowResearch(word, features, headless=true){

    const browser = await chromium.launch({headless, use: {
      locale: 'fr-FR',
      timezoneId: 'Europe/Paris',
  }});
    const context = await browser.newContext();
    const page = await context.newPage();
    let results = {};
    while(features.length>0){
      let f = features[0];
      if(f.includes("recette")){
        await page.goto("https://chefsimon.com/recettes/search?utf8=%E2%9C%93&search_string=recettes+"+word);
        try{
          await page.locator("text='Autoriser'", {timeout: 2000}).first().click();
        }catch(e){}
        let recettes = await page.evaluate(()=>{
          try{
            return [...document.querySelectorAll("h5 > a")].slice(0,4).map(e=>e.textContent).join("\n");
          }catch(e){
            return null;
          }
        })

        if(!!recettes) results["recettes"] = recettes;
      }else{
      let query = '"'+f+'"';
      if(!query.includes("origine")){
        query = (f[f.length-1] == "s"? 'quels sont les ':'quel est ')+query+' de "'+word+'" ? ';
      }else{
        query = query+' '+word;
      }
     
      await page.goto("https://www.google.com/search?q="+query);
     
      try{
        await page.locator("text='Tout accepter'", {timeout: 2000}).first().click();
      }catch(e){}
      
      let elements = page.locator(".MjjYud");
      let sitesList = []
      for(let i=0; i<Math.min(await elements.count(), 4); i++){
        
          let element = elements.nth(i);
          if(!((await element.textContent()).includes("uestion")) && i > 0){
          let h3 = await element.locator("h3").first().textContent();
          let infos=""
          for(let u=1; u<await element.locator(".Z26q7c.UK95Uc").count(); u++){
            let t= await element.locator(".Z26q7c.UK95Uc").nth(u).textContent();
            if(!!t==true) infos += t;
          }
          console.log("h3 : "+h3);
          console.log("infos : "+infos);
          console.log("\n\n");
          sitesList.push({h3, infos})
        }
      }
      
        let excerpt = await page.evaluate(()=>{
          let try1=null;let try2=null;
          try{
            try1 = document.querySelector(".yp1CPe.wDYxhc.NFQFxe.viOShc.LKPcQc").querySelector("span.ILfuVd");
          }catch(e){}
          try{
            try2 = [...document.querySelector(".yp1CPe.wDYxhc.NFQFxe.viOShc.LKPcQc").querySelectorAll("li")].map(e=>e.textContent).join("\n");
            try2 = try2.split("http")[0];
          }catch(e){}


          if(!!try1 == true ) return try1.textContent;
         
          
          if(!!try2 == true ) return try2;
          return null;
        })
        console.log("excerpt : \n");
        console.log(excerpt+"\n");
        //try#1 fetch questions
        let questions=null;
        /*questions = await page.evaluate(async()=>{
          async function sleep(time){
            await new Promise((res, rej)=>{
              setTimeout(res, time);
            })
          }
          let pairs=null;
          if(document.querySelectorAll(".r21Kzd")==undefined) return null;
          let questions = [...document.querySelectorAll(".r21Kzd")];
          if(questions.length > 0){
           questions.map(e=>e.click());
          await sleep(1000);

           pairs = [...document.querySelectorAll(".wQiwMc.related-question-pair")];
           pairs = pairs.map(e=>{let a = e.textContent.replace(e.querySelector(".wWOJcd").textContent, "").split(/\.\d/)[0];
           let p = a.split(" - ");
           a= p.slice[0, p.length-1];
           return {question : e.querySelector(".wWOJcd").textContent, answer: p }});
           
           
        }
          return pairs;
        })*/
        let pairs=null;
         //try#2 fetch questions
        if(questions==null){
          //yEVEwb
          try{
            
            questions = await page.$$(".r21Kzd", {timeout: 200});
            if(!!questions == true){
              questions.map(e=>e.click());
              
            
              pairs = page.locator(".wQiwMc.related-question-pair");
              let temp = [];
              for(let y=0;y<Math.min(await pairs.count(), 5); y++){
                await pairs.nth(y).click();
                temp.push(pairs.nth(y));
              }
              await temp[0].locator(".wWOJcd").nth(0).textContent();//MBtdbb  wWOJcd

              questions = temp.map(async(e)=>{
                let q = await e.locator(".wWOJcd").nth(0).textContent();
               
                let a= (await e.locator(".MBtdbb ").textContent()).replace(q, "").replace(q, "").split(/\.\d/)[0];
                return {question : q, answer: a.split("http")[0]}
              });
              questions = await Promise.all(questions)

              
              
            }
        }catch(e){console.log(e)}
       
         /* questions = await page.evaluate(async()=>{
            async function sleep(time){
              await new Promise((res, rej)=>{
                setTimeout(res, time);
              })
            }
            let pairs=null;
            let questions = [...document.querySelectorAll(".yEVEwb")];
            if(questions.length > 0){
             questions.map(e=>e.click());
            
  
             pairs = [...document.querySelectorAll(".wQiwMc.related-question-pair")];
             return pairs.map(e=>({question : e.querySelector(".wWOJcd").textContent, answer: e.textContent.replace(e.querySelector(".wWOJcd").textContent, "").split(/\.\d/)[0]}));
            }
            return pairs;
          })*/
        }
        
        
          /*
        if(questions!=null){
          console.log("questions : \n");
          questions.map(e=>{
            console.log("question : "+e.question);
            console.log("answer : "+e.answer);
            console.log("\n");
          })
        }*/
        console.log("questions "+typeof questions)
        console.log(questions);
        results[features[0]] = (!!excerpt==true?"Meta-description :\n"+excerpt+"\n\n":"")+(!!questions==true?"\n"+questions.map((e, index)=>"Question "+index+" : "+e.question+"\nAnswer "+index+" : "+e.answer).join("\n\n"):"");
        
        
        results[features[0]]+=(sitesList.length>0 && results[features[0]].length < 400?"\n\nLinks : "+sitesList.map((e, index)=>"\n link "+index+" : "+e.h3+"\n"+e.infos).join("\n\n"):"");
      }
        features.shift();
      
  }
      let q ="";
      for(let r in results){
        q+="\n\n"+r+" : [\n"+results[r].replace(/\d+(\s*)\w+(\s*)(\d{4}|\d{2})/g, "")+"\n]";
      }
      console.log("-------------------------------------");
      console.log(q);
      //await browser.close();
      return results;
    
}
/*
let start = new Date().getTime();
let l = ['pizza royale'];
(async()=>{
while(l.length>0){
  await shallowResearch(l[0], ['origine'], false);
  l.shift();
}
})()
let end = new Date().getTime();
console.log(((end-start)/1000)+ "s");
*/

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


async function makeCompletion(prompt="hello how are you ?", theme=null, searchKeyWords=null){
    let response = {}
    if(prompt != null && prompt.length > 1){
      try {
         /* const completion = await openai.createCompletion({
            model: "text-davinci-003-",
            prompt: prompt,
          });
          console.log("length "+completion.data.choices.length+" \n"+completion.data.choices[0].text);
          */
          if(theme!=null && searchKeyWords!=null){
            let rich = await shallowResearch(theme, searchKeyWords);
            //ONLY ONE } IN PROMPT
            let b = prompt.split("}");
            let m="";
            for(let i in rich){
              if(i.includes("origine")){  m += b[0]+"\nOrigine du produit : [\n"+rich[i]+"\n]\n}"; continue}
              m += b[0]+"\n"+i+" : [\n"+rich[i]+"\n]\n}"
            }
            m+=b[1];
            prompt=m;
            
            b = prompt.split("Suis la structure suivante :");
            b[0]+="\nSers-toi des résultats issus de recherches web dans "+(Object.keys(rich).length==1?"la section ":"les sections ")+Object.keys(rich).map((e, index)=>{let u="";if(e.includes("origine")){u+=e+" du produit"}else{u=e};if(index==Object.keys(rich).length-1 && index!= 0){u = "et "+u}else{u = u+" "}; return u;}).join("")+"pour enrichir ta description.\n";
            prompt = b[0]+"Suis la structure suivante :"+b[1];
          }
          console.log("Prompt : ");
          console.log(prompt);
          
 
          let completion = await axios.post("https://api.openai.com/v1/chat/completions", {"messages": [{"role": "user", "content": prompt}], "model": "gpt-3.5-turbo"}, {headers: {'Authorization': "Bearer "+process.env.OPENAI_API_KEY, "Content-Type": "application/json"}});
          if(completion.err){ return response["error"]=completion.err;}
          response["data"] = completion.data.choices[0].message.content;
          console.log("length "+completion.data.choices.length+" \n");
          console.log(response["data"]);
        } catch (error) {
          if (error.response) {
            console.log(error.response.status);
            console.log(error.response.data);
            response["error"]=error.response.data;
          } else {
              response["error"]=error.message;
            console.log(error.message);
          }
        }
    }else{
      response["error"] = "No prompt provided";
    }
    return response;
}

async function preview(query){
  let browser = await chromium.launch({headless: true});
  let page = await browser.newPage();
  await page.goto("https://www.google.com/search?q="+query.split(" ").join("+"));
  let temp = await page.content();
  return temp;

}


module.exports = {makeCompletion: makeCompletion, preview: preview}