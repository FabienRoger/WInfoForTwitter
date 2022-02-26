"""
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
"""

import json
print('start imports')

import config # local imports

import json
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
import faiss

print('imports done\n')

# Load the embeddings and the sentences
print('loading the embeddings and the sentences')
sdf = pd.read_csv(config.sentences_filename+'.csv')
sentences = []
for i,row in sdf.iterrows():
    sentences.append((row['sentence'], row['page']))

ddf = pd.read_csv(config.dict_filename+'.csv')
id_to_title = {}
for i,row in ddf.iterrows():
    id_to_title[str(row['id'])] = row['title']

embeddings = np.load(config.embedding_filename+'.npy')
embeddings = embeddings/np.linalg.norm(embeddings, axis=1, keepdims=True) # Normalize the embeddings
print('embeddings and sentences loaded\n')

# Construct the faiss index for the embeddings
print('constructing the index')
d = embeddings.shape[1]
index = faiss.IndexFlatIP(d)
index.add(embeddings)
print('index constructed\n')

# Load the embedding model
print('loading the model')
model = SentenceTransformer('./model')
print('model loaded\n')

# Helper functions to determine if two sentences are close or not
def embed(s):
    # get the embedding and flattens it
    return model.encode(s).reshape((-1))

def get_most_similar(s):
    return get_most_similars(s, 1)[0]

def get_most_similars(s, n):
    # return the n most similars sentences to the query s

    # first embed the query
    e = embed(s)
    # normalize it
    e = e/np.linalg.norm(e)

    # Use faiss to get the most similar (according to the cosine similarity)
    query = e[None,:]
    _, indexes = index.search(query, n)
    indexes = list(indexes[0,:])

    # returns the best n ones (page id and sentence)
    return [sentences[indexes[i]] for i in range(n)]

def handler(event, context):
    if 'this_is_a_test' in event:
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": True,
            },
            "body": "ok",
        }

    text_to_run = str(event["body"][:500])
    # gpt.run_on_text("a very very long text")
    print("ran", text_to_run)
    # print("activation computed")
    results = get_most_similars(text_to_run, 3)
    sentences = [r[0]+' ('+id_to_title[str(r[1])]+')' for r in results]
    wikiurls = ['https://en.wikipedia.org/?curid='+str(r[1]) for r in results]
    response = {'id':i, 'answer':[{'sentence': s, 'wikiurl': u} for (s,u) in zip(sentences, wikiurls)]}
    
    data_proportions = json.dumps(response)
    # print("prereturn")
    response = {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": True,
        },
        "body": data_proportions,
    }
    return response
