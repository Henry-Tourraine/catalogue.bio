let { chromium, devices, 
 } = require('@playwright/test');
let writeXlsxFile = require('write-excel-file');
let {writeXLSX} = require("./writeXLSX.js");
let {saveToDrive} = require("./saveToDrive.js");
const fs = require('fs');
require("dotenv").config();


module.exports = 
({
  use: {
    video: 'on',
  },
});

let data = [];
let clickTimeout = { timeout: 3000000 }

async function sleep(time){
  return await new Promise((res, rej)=>{setTimeout(()=>res(), time)});
}

async function run(EANS=["3483190000154"], name="test_", headless=false){

    const browser = await chromium.launch({headless});
    const context = await browser.newContext({recordVideo: { 
        dir: 'videos/',
        size: { width: 640, height: 480 }
     } });
    const page = await context.newPage();

   await connexion(page);
   
   
   //await getCollections(page);
   let id = await createCollection(page, name, browser, EANS);
   context.close();
   return id;

  
}

async function connexion(page){
    await page.goto('https://catalogue.bio', { timeout: 10000000 });
    await page.locator(".btn.btn-outline-dark.rounded-pill.m-2").first().click(clickTimeout);
    await page.locator("#user_data_login").first().fill(process.env.ID);
    
    await page.evaluate(()=>{
        document.querySelector("#user_data_pass").type = "text";
    })
    await page.locator("#user_data_pass").first().fill(process.env.PSWD); //".btn.btn_envoyer"
    await page.locator(".btn.btn_envoyer").first().click(clickTimeout);
    await sleep(8000);

}

async function getCollections(page){
    await page.locator("a[title='Configuration'] img").first().click(clickTimeout);
    let collections = page.locator(".collection-item");
    for(let collection=0; collection< await collections.count(); collection++){
        console.log((await collections.nth(collection).getAttribute("id")).replace("Collec_", ""));
        console.log(await collections.nth(collection).locator(".divinput input").first().getAttribute("value"));
    }
}

async function createEAN(name, EANS){
  await writeXLSX(name, EANS.map(ean=>{return {"EAN": ean}}));
return;
}

async function createCollection(page, name, browser, EANS){
    await page.goto("https://back.catalogue.bio/back/configuration/collections");
    console.log("createCollection EANS ",name, EANS);
    await createEAN(name, EANS);
    await sleep(5000);
    await page.locator("#buttonadd").first().click(clickTimeout);
    await page.locator("#new_collection").first().fill(name);
    await page.locator("#new_collection_save").first().click(clickTimeout);
    await sleep(2000);
    let collections = page.locator(".collection-item");
    let col_element = null;
    for(let collection=(await collections.count())-1; collection >= 0; collection--){
        let col_name = await collections.nth(collection).locator(".divinput input").first().getAttribute("value");
        if(col_name ==  name){
            console.log((await collections.nth(collection).getAttribute("id")).replace("Collec_", ""));
            console.log(await collections.nth(collection).locator(".divinput input").first().getAttribute("value"));
            col_element = await collections.nth(collection).locator(".divbtn").first();
            break;
        }
        
    }
    console.log("nouvelle collection trouvée : ", col_element != null);
    if(col_element != null){
        await (await col_element.locator(".fa.fa-upload").first()).click(clickTimeout);
        await page.locator("#list_product").setInputFiles('./'+name+'.xlsx');
        await sleep(5000);
        await page.locator("button#go").click(clickTimeout);
        await sleep(5000);
       await page.locator("button.ui-dialog-titlebar-close").first().click(clickTimeout);

        await col_element.locator(".fa.fa-eye").first().click(clickTimeout);

        await page.locator(".fa.fa-file-excel-o.fa-lg").nth(1).click(clickTimeout);
        await page.locator("#nam").first().selectOption("Catalogue Données Complètes");
       
        const downloadPromise = page.waitForEvent('download');
        await page.locator("#dlfile").first().click(clickTimeout);
        const download = await downloadPromise;
        await download.saveAs('./data.xlsx');
        let name_id = saveToDrive("data.xlsx");
        await fs.unlinkSync("./"+name+".xlsx");
        await page.goto("https://back.catalogue.bio/back/configuration/collections");
        let collections = page.locator(".collection-item");
        for(let i=0; i<await collections.count(); i++){
            let colToRemove = await collections.nth(i);
            if(await colToRemove.locator("input[type='text']").first().inputValue() == name){
                await colToRemove.locator("button[title='Supprimer la collection']").first().click();
            }
        }
        await browser.close();
        console.log("browser closed");
        return name_id;
       
    
    }else{
        console.log("collection not found")
        return null;
    }
    
}

run()

module.exports = {scrap: run}

