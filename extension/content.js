const baseURL = "http://localhost:8008"

new MutationObserver(() => {
  //console.log('mutation');
  
  const articles = document.querySelectorAll('article');
  
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
        
        let textDisplay = document.createElement("p");
        textDisplay.innerText = "loading...";
        textDisplay.style.display = "none";
        elt.childNodes[0].childNodes[0].childNodes[0].appendChild(textDisplay);
        buttonGroup.appendChild(getButton(text, textDisplay))
      }
    }
  })
}).observe(document, {subtree:true, childList:true})

function getButton(str, textDisplay){
  let ele = document.createElement('div');
  ele.innerHTML = ''
  +'<button class="WButton" id="'+buttons.length+'">W</button>';

  ele.onclick = function(){
    if(textDisplay.style.display === "block"){
      textDisplay.style.display = "none";
    }else{
      textDisplay.style.display = "block";
      textDisplay.innerHTML = 'loading...';
      httpGetAsync(baseURL+'/api/getmultiplesentence?'+encodeURI(str), (response) => {
        let parsed = JSON.parse(response);
        console.log(parsed);
        let id = parsed['id'];
        let answer = parsed['answer'];
        textDisplay.innerHTML = '';
  
        let answersHTML = [];
        for(let i = 0;i<answer.length;i++){
          answersHTML[i] = document.createElement('p');
          answersHTML[i].className = "clickable";
          answersHTML[i].textContent = answer[i]['sentence'];
          answersHTML[i].onclick = function(){
            httpPostAsync(baseURL+'/api/selectedsentence?questionid='+id+'&answerselected='+i, (_) => {});
            window.open(answer[i]['wikiurl'], '_blank').focus();
          }
        }
  
        for(let i = 0;i<answer.length;i++){
          textDisplay.appendChild(answersHTML[i]);
        }
      });
    }
  }
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