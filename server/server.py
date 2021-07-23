from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, unquote
import json
import cgi
import re
import numpy as np
import pandas as pd
import nltk
from nltk.tokenize import sent_tokenize
nltk.download('punkt')
from sentence_transformers import SentenceTransformer
import sqlite3
from random import randint
from tqdm import tqdm
from . import config

print('imports done !')

# Load the embeddings and the sentences
sdf = pd.read_csv(config.sentences_filename+'.csv')
sentences = []
for i,row in sdf.iterrows():
    sentences.append((row['sentence'], row['page']))

embeddings = np.load(config.embedding_filename+'.npy')
print('embeddings and sentences loaded !')

# Load the embedding model
model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
print('model loaded')

# Connecting to the existing SQL database
con = sqlite3.connect(config.database_filename+'.db')
cur = con.cursor()
print('connected to database')

# Create the SQL tables if needed
try:
    cur.execute('''CREATE TABLE requests
               (id integer, request text, reponse1 text, reponse2 text, reponse3 text)''')
    cur.execute('''CREATE TABLE responses
               (id integer, responsenumber int)''')
    print('table created')
except sqlite3.OperationalError: # Error thrown if the tables already exist
    print('table loaded')

# Helper functions to determine if two sentences are close or not

def similarity(a,b):
    # returns the cosine similarity between a and b (two 1-D np array)
    return np.dot(a, b)/(np.linalg.norm(a)*np.linalg.norm(b))

def embed(s):
    # get the embedding and flattens it
    return model.encode(s).reshape((-1))

def get_most_similar(s):
    return get_most_similars(s, 1)[0]

def get_most_similars(s, n):
    # return the n most similars sentences to the query s

    # first embed the query
    e = embed(s)

    # use vectorizing to compute the similarity between the querry and all the sentences
    similarities = np.sum(e*embeddings, axis=1)/(np.linalg.norm(e)*np.linalg.norm(embeddings, axis=1))

    # sort every sentence in the dataset according to its similarity to the query
    indexes = list(range(len(sentences)))
    indexes = sorted(indexes, key=lambda i:similarities[i], reverse=True)

    # returns the best n ones (page id and sentence)
    return [sentences[indexes[i]] for i in range(n)]

class Server(BaseHTTPRequestHandler):
    def _set_headers(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
    def do_HEAD(self):
        self._set_headers()
        
    # GET sends back a Hello world message
    def do_GET(self):
        if None != re.search('/api/getsentence*', self.path):
            sentence = unquote(self.path.split('?')[1])

            mostsim,id = get_most_similar(sentence)
            wikiurl = 'https://en.wikipedia.org/?curid='+id.split('-')[0]

            self._set_headers()
            self.wfile.write(json.dumps({'mostsim': mostsim, 'wikiurl': wikiurl}).encode('utf-8'))
        
        if None != re.search('/api/getmultiplesentence*', self.path):
            sentence = unquote(self.path.split('?')[1])

            i = randint(1,2**50)

            results = get_most_similars(sentence, 3)
            sentences = [r[0] for r in results]
            wikiurls = ['https://en.wikipedia.org/?curid='+r[1].split('-')[1] for r in results]
            response = {'id':i, 'answer':[{'sentence': s, 'wikiurl': u} for (s,u) in zip(sentences, wikiurls)]}

            self._set_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))

            responses = [r[0]+r[1] for r in results]
            cur.execute("INSERT INTO requests VALUES (?, ?, ?, ?, ?)", (i, sentence, *responses))
            con.commit()

    def do_POST(self):
        if None != re.search('/api/selectedsentence*', self.path):
            i, ri = [int(s.split('=')[1]) for s in self.path.split('?')[1].split('&')]
            
            cur.execute("INSERT INTO responses VALUES (?, ?)", (i, ri))
            con.commit()

        # send the message back
        self._set_headers()
        self.wfile.write(json.dumps('ok').encode('utf-8'))
        
def run(server_class=HTTPServer, handler_class=Server, port=8008):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    
    print('Starting httpd on port'+str(port))
    httpd.serve_forever()
    
if __name__ == "__main__":
    from sys import argv
    
    if len(argv) == 2:
        run(port=int(argv[1]))
    else:
        run()