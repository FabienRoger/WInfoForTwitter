//alert('Grrr.')
// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//   const re = new RegExp('bear', 'gi')
//   const matches = document.documentElement.innerHTML.match(re)
//   sendResponse({count: matches.length})
// })

// const re = new RegExp('bear', 'gi')
// const matches = document.documentElement.innerHTML.match(re) || []

// chrome.runtime.sendMessage({
//   url: window.location.href,
//   count: matches.length
// })

/*
$('body').on('DOMSubtreeModified', 'main', function(){
  console.log('changed');
  console.log(document.querySelectorAll('div').length);
  console.log(document.querySelectorAll('article').length);
});*/

new MutationObserver(() => {
  console.log('mutation');
  const articles = document.querySelectorAll('article');
  console.log(articles.length);
  articles.forEach(elt => {
    const buttonGroup = elt.querySelector('[role="group"]');
    const textDiv = elt.querySelector('div[lang]:not([lang=""])');
    // console.log(" "+buttonGroup.childNodes.length);
    // console.log(" "+textDiv.length);
    if(textDiv){
      let text = "";
      textDiv.querySelectorAll('span').forEach(sp => {
        text += sp.textContent;
      })
      console.log(text);
      if(buttonGroup.childNodes.length == 4){
        buttonGroup.appendChild(getButton(text))
      }
    }
  })
}).observe(document, {subtree:true, childList:true})

let buttons = []

function getButton(str){
  var bgColor = document.querySelector('body').style.backgroundColor;
  var trtColorScheme = 'light';
  if(bgColor == 'rgb(255, 255, 255)'){
    trtColorScheme = 'light';
  }
  if(bgColor == 'rgb(21, 32, 43)'){
    trtColorScheme = 'dim';
  }
  if(bgColor == 'rgb(0, 0, 0)'){
    trtColorScheme = 'dark';
  }

  let ele = document.createElement('div');
  ele.className = '__focusOnContent '+trtColorScheme;
  ele.innerHTML = ''
  +'<button class="popuppp myButton" id="'+buttons.length+'">'
  +'W'
  +'<span class="popuppptext" id="myPopup">loading</span>'
  +'</button>';

  ele.onclick = function(){
    let sp = ele.querySelector('span');
    
    sp.classList.toggle("show");
    httpGetAsync('http://localhost:8008/api/getsentence?'+encodeURI(str), (text) => {
      let parsed = JSON.parse(text);
      console.log(JSON.parse(text));
      sp.textContent = parsed['mostsim'];
    });
  }
  buttons.push((str, ele));
  return ele;
}

function httpGetAsync(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

function httpPostAsync(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("POST", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}


// window.__ttrExcludeUrls = ["https://twitter.com/explore", "https://twitter.com/home",
// "https://twitter.com/notifications", "https://twitter.com/messages"];

// let lastUrl = location.href;

// //HELPER START  --
// function createElementFromHTMLString(htmlString) {
//   var div = document.createElement('div');
//   div.innerHTML = htmlString.trim();
//   return div;
// }
// //HELPER END    --

// function onUrlChange() {
//   console.log('URL changed!', location.href);
//   if(window.__ttrExcludeUrls.includes(location.href) == false){
//     //stop checks and restart
//     __stFuncExt.__extTimerStop();
//     __stFuncExt.countExtRept = 0;
//     __stFuncExt.run_ext();
//   }else{
//     //console.warn('dont run...');
//     __stFuncExt.__extTimerStop();
//   }
//   if(location.href == "https://twitter.com/home"){
//     //replace feed with whiteboard and suggestions
//     //hide trending
//     //easier lists open
//     //console.warn('Improve display - whiteboard--');
//     //__stFuncExt.__displayOverlayBoard();
//   }else{
//     try{
//       document.querySelector('.__focusOnContent').style.display='none';
//     }catch(e){}
//   }
// }

// window.__stFuncExt = {};
// __stFuncExt.__extTimerStop = function(){
// 	clearInterval(__stFuncExt.__extTimerVar);
// }
// __stFuncExt.__extTimerStopBlock = function(){
// 	clearInterval(__stFuncExt.__extTimerBlock);
// }
// __stFuncExt.countExtRept = 0;
// __stFuncExt.countExtReptBlock = 0;
// __stFuncExt.run_ext = function() {
// 	if(__stFuncExt.countExtRept == 0){
// 		console.log('listen for clicks');
// 	}
//   console.log(document.querySelectorAll('div'));
//   console.log(document.querySelectorAll('article'));

//   if(location.href == "https://twitter.com/home"){
//     //replace feed with whiteboard and suggestions
//     //hide trending
//     //easier lists open
//     //console.warn('Improve display - whiteboard--');
//     __stFuncExt.__displayOverlayBoard();
//   }else{
//     try{
//       document.querySelector('.__focusOnContent').style.display='none';
//     }catch(e){}
//   }
//   if(window.__ttrExcludeUrls.includes(location.href) == true){
//     return false;
//   }

// 	try{
// 		__stFuncExt.__extTimerVar = setInterval(function(){
// 			if(__stFuncExt.countExtRept >= 20){
//         //console.warn('cancel timer-----');
// 				__stFuncExt.__extTimerStop();
// 			}else{
//         //console.warn('run once, ran ('+__stFuncExt.countExtRept+') times');
//   			__stFuncExt.countExtRept++;
//   			//__stFuncExt.__searchTweetsInit();
//       }
// 		}, 1500);

//     //onUrlChange()
// 	}catch(e){
// 		//console.warn('error', e);
// 	}
// }
// __stFuncExt.__displayOverlayBoard_setup = 0;
// __stFuncExt.__displayOverlayBoard = function(){
//   //console.warn('setup?');
//   try{
//     //check if on page
//     if(document.querySelectorAll('.__focusOnContent').length == 0){

//       //Check Colour Scheme
//       var bgColor = document.querySelector('body').style.backgroundColor;
//       var trtColorScheme = 'light';
//       if(bgColor == 'rgb(255, 255, 255)'){
//         trtColorScheme = 'light';
//       }
//       if(bgColor == 'rgb(21, 32, 43)'){
//         trtColorScheme = 'dim';
//       }
//       if(bgColor == 'rgb(0, 0, 0)'){
//         trtColorScheme = 'dark';
//       }

//       var ele = document.createElement('div');
//       ele.className = '__focusOnContent '+trtColorScheme;
//       ele.innerHTML = ''
//       +'<div class="top-item" style="margin-left:25px;">'
//       +'<span data-item="close">X</span>'
//       +'<span data-item="minimise">Minimise</span>'
//       +'<span data-item="lists">Lists</span>'
//       +'<span data-item="w-count">Char Count</span>'
//       +'  <div style="margin:0px;"><h3>Need Inspiration?</h3>'
//       +'    <p>'
//       +'      <a href="https://marketingexamples.com/handbook/twitter-inspiration?ref=producthunt" target="_blank">Handbook by Marketing Examples</a>'
//       +'      &middot; <a href="https://dvassallo.gumroad.com/#PBkrO" target="_blank">Twitter Course by @dvassallo</a>'
//       +'    </p>'
//       +'  </div>'
//       //Add word count
//       +'  <div class="word-counterArea" style="display:none">'
//       +'    <h3>Character Count</h3><textarea></textarea><span>0 / 280</span>'
//       +'  </div>'
//       +'</div>'
//       +'<div class="holder">'
//       +'  <h3 style="display: flex;align-items: center;">My Tweet Ideas <em style="position: relative;top: 1px;margin-left: 5px;font-size: 12px;" class="rdm-prompt">Random Prompt: '+window.__tweetSuggestPrompts[Math.floor(Math.random()*window.__tweetSuggestPrompts.length)]+'</em></h3>'
//       +'  <div class="__whiteboard" placeholder="Write down some tweet ideas here, autosave enabled" contenteditable>....</div>'
//       +'</div>';
//       document.querySelector('body').appendChild(ele);
//       var oW = document.querySelector('header[role="banner"]').offsetWidth;
//       if(oW < 50){
//         //console.warn('now width...?');
//       }
//       document.querySelector('.__focusOnContent').style.width = 'calc(100% - '+oW+'px)';
//       document.querySelector('.__focusOnContent').style.left = (oW+1)+'px';
//       document.querySelector('.__focusOnContent').style.display='block';
//     }else{
//       var oW = document.querySelector('header[role="banner"]').offsetWidth;
//       document.querySelector('.__focusOnContent').style.width = 'calc(100% - '+oW+'px)';
//       document.querySelector('.__focusOnContent').style.left = (oW+1)+'px';
//       document.querySelector('.__focusOnContent').style.display='block';


//       document.querySelector('.__focusOnContent').classList.remove('minimise');

//       var oW = document.querySelector('header[role="banner"]').offsetWidth;
//       document.querySelector('.__focusOnContent').style.width = 'calc(100% - '+oW+'px)';
//       document.querySelector('.__focusOnContent').style.left = (oW+1)+'px';

//       document.querySelector('.__focusOnContent span[data-item="minimise"]').innerText = 'Minimise';

//       document.querySelector('.__focusOnContent .rdm-prompt').innerHTML='Random Prompt: '+window.__tweetSuggestPrompts[Math.floor(Math.random()*window.__tweetSuggestPrompts.length)];
//     }


//     //console.warn('--cancel here timer-----');
//     __stFuncExt.__extTimerStopBlock();


//     //Listeners only run once..
//     if(__stFuncExt.__displayOverlayBoard_setup == 0){
//       //Prefill
//       var whiteboardWords = localStorage.getItem("__trt_whiteboard");
//       document.querySelector('.__focusOnContent .__whiteboard').innerHTML = whiteboardWords;
//       document.querySelector('.__focusOnContent .__whiteboard').addEventListener('keyup', function(ev){
//         var whiteboardWords = document.querySelector('.__focusOnContent .__whiteboard').innerHTML;
//         localStorage.setItem("__trt_whiteboard", whiteboardWords);
//         //console.warn('update...', whiteboardWords);
//       }, false);

//       //also listen to on paste but strip any styling...
//       document.querySelector('.__focusOnContent .__whiteboard').addEventListener('paste', (event) => {
//         event.preventDefault();

//         let data = event.clipboardData.getData('text/plain');
//         const newElement = createElementFromHTMLString(data);
//         document.execCommand('insertHTML', false, newElement.innerHTML);

//         var whiteboardWords = document.querySelector('.__focusOnContent .__whiteboard').innerHTML;
//         localStorage.setItem("__trt_whiteboard", whiteboardWords);
//         //console.log('update...', whiteboardWords);
//       });

//       //listener for charcount
//       var counterArea = document.querySelector('.word-counterArea textarea');
//       counterArea.addEventListener('keyup', (event) => {
//         //Count HERE...
//         var str = document.querySelector('.word-counterArea textarea').value;
//         var countCh = str.length;
//         document.querySelector('.word-counterArea span').innerText = countCh+' / 280';
//       });
//       counterArea.addEventListener('paste', (event) => {
//         setTimeout(function() {
//           var str = document.querySelector('.word-counterArea textarea').value;
//           var countCh = str.length;
//           document.querySelector('.word-counterArea span').innerText = countCh+' / 280';
//         }, 100);
//       });

//       //charcount - word-counterArea
//       document.querySelector('.__focusOnContent span[data-item="w-count"]').addEventListener('click', function(){
//         document.querySelector('.word-counterArea').classList.toggle('toggle-hide');
//       });


//       //lists
//       document.querySelector('.__focusOnContent span[data-item="lists"]').addEventListener('click', function(){
//         document.querySelector('nav a[aria-label="Lists"]').click();
//       });

//       //close
//       document.querySelector('.__focusOnContent span[data-item="close"]').addEventListener('click', function(){
//         document.querySelector('.__focusOnContent').style.display='none';
//       });
//       //minimise toggle
//       document.querySelector('.__focusOnContent span[data-item="minimise"]').addEventListener('click', function(){
//         //console.warn(document.querySelector('.__focusOnContent').classList);
//         if(document.querySelector('.__focusOnContent').classList.contains('minimise')){
//           //remove
//           document.querySelector('.__focusOnContent').classList.remove('minimise');

//           var oW = document.querySelector('header[role="banner"]').offsetWidth;
//           document.querySelector('.__focusOnContent').style.width = 'calc(100% - '+oW+'px)';
//           document.querySelector('.__focusOnContent').style.left = (oW+1)+'px';

//           document.querySelector('.__focusOnContent span[data-item="minimise"]').innerText = 'Minimise';
//         }else{
//           //add
//           document.querySelector('.__focusOnContent').classList.add('minimise');

//           var minW = document.querySelector('div [aria-label="Timeline: Trending now"]').offsetWidth;
//           document.querySelector('.__focusOnContent').style.width = (minW+40)+'px';

//           document.querySelector('.__focusOnContent span[data-item="minimise"]').innerText = 'Maximise';
//         }
//       });


//       __stFuncExt.__displayOverlayBoard_setup = 1;
//     }
//   }catch(e){
//     console.log(e);
//     //RUN AGAIN --

//     __stFuncExt.__extTimerBlock = setInterval(function(){
//       //console.warn('run once, ran ('+__stFuncExt.countExtReptBlock+') times');

//       if(__stFuncExt.countExtReptBlock >= 3){
//         //console.warn('cancel timer-----');
//         __stFuncExt.__extTimerStopBlock();
//       }else{
//         __stFuncExt.countExtReptBlock++;
//         __stFuncExt.__displayOverlayBoard();
//       }
//     }, 1500);


//   }
// }

// //document.addEventListener("DOMContentLoaded", __stFuncExt.run_ext);
// __stFuncExt.run_ext();

// __stFuncExt.__searchTweetsInit = function(){
// 	var u = window.location.pathname.split('/')[1];
// 	u = u.split('?')[0];
// 	var str = '/'+u+'/photo';
// 	var length = document.querySelector('a[href^="'+str+'" i]');
// 	try{
// 		var target = document.querySelector('input[placeholder="Search Twitter"]');
// 		//console.warn(target, target.placeholder);
// 		if(length.innerHTML != '' && target.placeholder == 'Search Twitter'){
// 			__stFuncExt.__extTimerStop();
// 			__stFuncExt.__searchTweets();
// 		}
// 	}catch(e){
// 		//console.warn('e',e);
// 	}
// }