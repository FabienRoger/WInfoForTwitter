# WInfo Chrome Extension for Twitter

WInfoForTwitter is a Chrome extension that enables users to see the most relevant Wikipedia sentences related to any given tweet.

This repo contains the code for the extension and the server needed to support the Chrome extension.

## What it enables you to do

When activated, the extension adds a button below each tweet.

<div align="center">
  <img src="images/feed.png">
</div>

Clicking on it displays sentences from Wikipedia which are the most relevant to the current tweet.

<div align="center">
  <img src="images/sentences.png">
</div>

Clicking on the sentence sends you to the Wikipedia page where the sentence can be found. If you do, your choice is sent back to the server and saved to enable possible future improvements of the algorithm evaluating which sentences are the most relevant.

This could help you get more information about the current subject of your attention than a short tweet can provide, and check easily what the facts are.

## How it works

<div align="center">
  <img src="images/schema.png">
</div>
<br>

The embeddings of the sentences are created using Hugging Face's sentence transformer named "paraphrase-MiniLM-L6-v2" which provides good sentence embeddings at a relatively low computing cost [(Reimers 2019)](http://arxiv.org/abs/1908.10084). It uses the average of the bert tokens of each word of the sentence weighted by the attention mask. It only supports english.

The similarity used here is the cosine similarity.

[Faiss](https://faiss.ai/) is used to accelerate the search.

Start-of-sentences pronouns are replaced by the Wikipedia page title before generating the embeddings. I've tried using coreference resolution using neuralcoref, but it didn't provide good enough results.

## How to install the extension

1. Download the extension folder
2. Open the Chrome extension settings by typing ```chrome://extensions/``` in the search bar
3. Toggle the Developer mode, load the compressed element and select the extension folder:

<div align="center">
  <img src="images/loadextension.png">
</div>
<br>
You might need to change the baseURL at the top of the content.js file in order to match the address of the server currently running the server. By default, it is set to the address it has if you run server.js locally.

## How to run the server

1. Download the server folder
2. Create an empty "server.db" file next to server.py
3. Download the embeddings and the sentences at the end of [this Kaggle notebook](https://www.kaggle.com/fabienroger/sentences-of-wikipedia/output). Put the ```sentences.csv``` and ```embeddings.npy``` files next to server.py
4. Run the server by running the following command:

  ```bash
  python server.py
  ```

If you want to use more up-to-date Wikipedia articles, use [this code](https://github.com/daveshap/PlainTextWikipedia) by daveshap to create the Wikipedia dataset, then clean further and generate the sentnces and the embeddings using the code from [this Kaggle notebook](https://www.kaggle.com/fabienroger/sentences-of-wikipedia).

## Current limitations and possible improvements

I do not have the funding to run a permanent server to support the extension. Feel free to run it yourself if you do !

With the current state of the algorithm, it is required that all the embeddings (~20GB if you load all the dataset, ~2GB if you use the current parameters) are loaded into memory.Using the quantization of vectors that faiss can provide might help alleviate the issue. It also requires considerable computing power : on 1 CPU, it takes about half seconds per request which might not be scalable.

Using only Wikipedia may not be enough to find relevant claims concerning timely matters. Using others trusted sources in combination with Wikipedia might help.

## Experiments

Quick experiments were done to determine if the project was feasible and what type of embeddings and searching method to use. The following results are not a rigorous evaluation of the performances of the algorithm but might help you understand the choice that were made. Feel free to share your experiments if you want to change the current algorithm.

4 methods were tested :

* "big model" : the best pretrained sentence transformer available on Hugging Face (paraphrase-mpnet-base-v2), tested on the 2013 dataset
* "small model" : a faster pretrained sentence transformer available on Hugging Face (paraphrase-MiniLM-L6-v2), tested on the 2013 dataset
* "USE model" : the Universal Sentence Encoder (available at <https://tfhub.dev/google/universal-sentence-encoder/4>), tested on a small part of the 2013 dataset due to RAM limitations
* "small model with faiss" : the "small model" but using faiss clustering of embeddings (with 30 clusters)

Here are the results :

| Method | big model | **small model** | USE model | small model with faiss |
| :- | :-: | :-: | :-: | :-: |
| Top-1 Accuracy on tweets I created (at least the good subject) | 7/12 | 7/12 | 5/12 | 6/12 |
| Top-1 Accuracy on opposite sentences* (exactly the right sentence) | 5/9 | 5/9 | not tested | 4/9 |
| Time to find the most similar sentences to one tweet on Kaggle's GPU without faiss acceleration | 2.5s | 1.7s | 2.0s** | - |
| Time to find the most similar sentences to one tweet on Kaggle's GPU with faiss acceleration | not tested | 300ms | not tested | 10ms |
| Dimension of the embedded sentences | 768 | 384 | 500 | - |

\* Example:<br/>
Sentence of Wikipedia : The Human Torch is a real man, who runs a business at San Francisco.<br/>
-><br/>
Sentence fed to the model : The Human Torch is a fictional character, a superhero that appears in comic books published by Marvel Comics.

\** Because the USE model's embeddings were only generated for a small part of the dataset, the time displayed here is a linear extrapolation of what it would have been if the number of sentences in its dataset were the same as for the other models.

I made the experiments in the different versions of [this Kaggle notebook](https://www.kaggle.com/fabienroger/comparaisons-de-phrases) (the code hasn't been cleaned).

### Discussion

The performance of the algorithm is good enough if you keep in mind that 3 sentences are given to the user. Further experiments are needed to confirm that it is the case in "real world" scenario (all 3 sentences should be considered, and tweets should not be created based on what is on Wikipedia, but captured in the wild).

I chose the **small model** because it seems to be as good as the big one while running faster and having a lower footprint in memory. The performance of the clustering of algorithm of faiss seems are not good enough to be used here.

### Footnotes

These experiments were done with the 2013 dataset which is not formatted in exactly the same way as the current dataset is. For instance, experiments were done without start-of-sentences pronoun replacement.

The 2013 dataset, just as the 2020-11 dataset is not a full dataset of all the sentences of Wikipedia. It is a dataset containing only the first 10 sentences of large English Wikipedia articles (more than 100 sentences) due to RAM limitations (otherwise the embeddings do not fit in the memory of my laptop). The 2013 dataset contains 617,341 sentences, and the current one (2020-11 dataset) contains 1,536,475 sentences.

Original idea by Fabien Roger and Siméon Campos.
