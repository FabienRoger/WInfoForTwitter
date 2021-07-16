const baseURL = "http://localhost:8008"

new MutationObserver(() => {
  console.log('mutation');
  const articles = document.querySelectorAll('article');
  console.log(articles.length);
  articles.forEach(elt => {
    const buttonGroup = elt.querySelector('[role="group"]');
    const textDiv = elt.querySelector('div[lang]:not([lang=""])');

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
    httpGetAsync(baseURL+'/api/getmultiplesentence?'+encodeURI(str), (response) => {
      let parsed = JSON.parse(response);
      console.log(parsed);
      let id = parsed['id'];
      let answer = parsed['answer'];
      sp.innerHTML = '';

      let answersHTML = [];
      for(let i = 0;i<answer.length;i++){
        answersHTML[i] = document.createElement('p');
        answersHTML[i].textContent = answer[i]['sentence'];
        answersHTML[i].onclick = function(){
          httpPostAsync(baseURL+'/api/selectedsentence?questionid='+id+'&answerselected='+i, (_) => {});
          window.open(answer[i]['wikiurl'], '_blank').focus();
        }
      }

      for(let i = 0;i<answer.length;i++){
        sp.appendChild(answersHTML[i]);
      }
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