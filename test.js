let a = process.argv.slice(2);
let b={};
for(let i=0; i<a.length-1; i+=2){
    let t={};
    t[a[i].replaceAll("-", "")]= a[i+1];
    b={...b, ...t};
}
console.log(b);