let a = process.argv.slice(2);
let arguments={};
for(let i=0; i<a.length-1; i+=2){
    let t={};
    t[a[i].replaceAll("-", "")]= a[i+1];
    arguments={...arguments, ...t};
}
console.log(arguments);