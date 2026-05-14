
const navs = document.querySelectorAll('.nav-item')

navs.forEach(nav=>{
nav.addEventListener('mouseenter',()=>{
nav.style.boxShadow='0 0 20px rgba(59,130,246,.15)'
})

nav.addEventListener('mouseleave',()=>{
nav.style.boxShadow='none'
})
})
