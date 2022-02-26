const baseURL = "http://localhost:8008"

// Called whenever the HTML of the page changes (and therefore whenever a new tweet appears on screen)
new MutationObserver(() => {
  
  // Each "article" corresponds to a tweet
  const articles = document.querySelectorAll('article');
  articles.forEach(elt => {
    const buttonGroup = elt.querySelector('[role="group"]'); // The button group to which the W button is added
    const textDiv = elt.querySelector('div[lang]:not([lang=""])'); // The div where the text of the tweet can be found (it has language attribute)

    if(textDiv){
      // Get the text of the tweet by concatenating the text contained in all the span of the div
      let text = "";
      textDiv.querySelectorAll('span').forEach(sp => {
        text += sp.textContent;
      })

      // To avoid adding the W button mutliple times, check that there is the default number of buttons (4)
      if(buttonGroup.childNodes.length == 4){
        // Create the paragraph which can contain the sentences provided by the server if W is clicked (hidden before that)
        let textDisplay = document.createElement("p");
        textDisplay.innerText = "loading...";
        textDisplay.style.display = "none";
        // Add it to the correct div (one where it is displayed below the tweet)
        elt.childNodes[0].childNodes[0].childNodes[0].appendChild(textDisplay);
        
        // Create a button and add it to the button group
        let wButton = getButton(text, textDisplay);
        buttonGroup.appendChild(wButton);
      }
    }
  })
}).observe(document, {subtree:true, childList:true})

function getButton(str, textDisplay){
  // Returns the W button HTML element
  let ele = document.createElement('div');
  ele.innerHTML = '<button class="WButton">W</button>';

  ele.onclick = function(){
    // Toggle the display of the corresponding sentences on and of
    if(textDisplay.style.display === "block"){
      textDisplay.style.display = "none";
    }else{
      textDisplay.style.display = "block";

      // If it is displayed, show loading the make and async call to the server to request the sentences closest to the tweet
      textDisplay.innerHTML = 'loading...';
      // The tweet is passed as an argument in the URL
      httpGetAsync(baseURL+'/api/getmultiplesentence?'+encodeURI(str), (response) => {
        // Parse the response
        let parsed = JSON.parse(response);
        let id = parsed['id'];
        let answer = parsed['answer'];
        textDisplay.innerHTML = '';
        
        // Create the HTML element of each of the sentences
        let answersHTML = [];
        for(let i = 0;i<answer.length;i++){
          answersHTML[i] = document.createElement('p');
          answersHTML[i].className = "clickable";
          answersHTML[i].textContent = answer[i]['sentence'];

          answersHTML[i].onclick = function(){
            // On click, it sends the choice of the user back to the server
            httpPostAsync(baseURL+'/api/selectedsentence?questionid='+id+'&answerselected='+i, (_) => {});
            // And opens the link in a new tab
            window.open(answer[i]['wikiurl'], '_blank').focus();
          }
        }
        
        // Add all the sentences HTML elements to the display below the tweet
        for(let i = 0;i<answer.length;i++){
          textDisplay.appendChild(answersHTML[i]);
        }
      });
    }
  }
  return ele;
}

// Helper functions to do http get and post requests

function httpGetAsync(theUrl, callback){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

function httpPostAsync(theUrl, callback){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("POST", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}