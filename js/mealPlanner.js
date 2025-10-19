let overlay=document.querySelector(".overlay")
let addBtns=document.querySelectorAll(".add")
overlay.addEventListener("click",(e)=>{
    if(e.target.classList.contains("overlay")){
        e.target.style.display="none"
    }
})
addBtns.forEach(btn=>{
    btn.addEventListener("click",()=>{
        overlay.style.display="flex"
    })
})
function getThisWeek(){
    let today=new Date()
    let day =today.getDay()
    
    let monday=new Date()
    let diff=day===0?-6:1-day
    monday.setDate(today.getDate() +diff)

    let week=[]
    for(let i=0;i<=7;i++){
        let d=new Date()
        d.setDate(monday.getDate() +i)
        week.push(d)
    }
    return week
}
let thisWeek=getThisWeek()
thisWeek.forEach(d=>{
    content=`
    
    `
})