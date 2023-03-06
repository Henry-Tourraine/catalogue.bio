let { chromium, devices, defineConfig } = require('@playwright/test');

async function sleep(time){
    return await new Promise((res, rej)=>{setTimeout(()=>res(), time)});
  }
  
async function run(EANS, headless=true){
  
      const browser = await chromium.launch({headless});
      const context = await browser.newContext();
      const page = await context.newPage();
    let pagesInfos = []
    while(EANS.length>0){
        let EAN = EANS[EANS.length-1];
        await page.goto("https://fr.openfoodfacts.org/produit/"+EAN);
        let infos = await page.evaluate(()=>{
            let t = {};
        try{
            let title = document.querySelector("h2.title-1").textContent;
            t = {...t, title}
        }catch(e){

        }
        try{
            let brand = document.querySelector("#field_brands").textContent;
            t = {...t, brand}
        }catch(e){

        }
        try{
            let ingredients = document.querySelector("#panel_ingredients_content").textContent.includes("ajouter")?null:document.querySelector("#panel_ingredients_content").textContent.trim(); 
            ingredients = ingredients.replace("\n", "");
            t = {...t, ingredients}
        }catch(e){

        }
        try{
            let nutrition = {};
            [...document.querySelectorAll("table tbody tr")].map(tr=>{let infos=tr.querySelectorAll("td"); nutrition[infos[0].textContent.trim()] = infos[1].textContent.replace("\n", "").trim().replace(" ", "")});
            nutrition["Énergie"] = nutrition["Énergie"].substring(0, nutrition["Énergie"].length-1).replace("kj", " Kj ").replace("kcal", " Kcal").replace("(", "/ ")

            t = {...t, ...nutrition}
        }catch(e){

        }
        
        
            
            return t;
    
        })
        infos["EAN"] = EAN+"";
        pagesInfos.push(infos);
        EANS.pop();
        }
    await browser.close();
    return pagesInfos
  }

module.exports = run;
//run("3760049231083", true);