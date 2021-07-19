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

print('imports done !')

def from_csv_full(filename, # The name of the csv file. The first column contains the page id (ex : wikipedia-253648) and the second column the content of the page
                  nrows=10, # The numbers of row to read in the file. None to read the whole file
                  first_n_sentences=None, # If set to an integer n, only keeps the first n sentences of each wikipedia page
                  article_min_size=None, # If set to an integer n, only keeps articles with at least n sentences
                  print_title=True, # Should the first print_n_titles pages titles be printed ?
                  print_n_titles=20, 
                  use_nltk=True # If True, uses the nltk tokenizer. Otherwise, uses a split on a simple regex.
                  ):
    # Returns a list of (sentence, page id) pairs found in the csv file given
    
    df = pd.read_csv(filename, nrows=nrows, names=['page', 'content'])

    sentences = []

    for i,row in tqdm(df.iterrows()):
        # Print the title (which is considered to be the first 40 chars of the content) if it should be (see the arguments)
        if print_title and i<print_n_titles: print(row['content'][:40])
        
        ss = sent_tokenize(row['content']) if use_nltk else re.split('\.|\!|\?|\=|;|\{|\}', row['content'])
        
        if article_min_size == None or len(ss) >= article_min_size:
            sentence_nb = len(ss) if first_n_sentences == None else min(len(ss), first_n_sentences)
            
            # Adds each sentence found in the page to the sentences list
            for i in range(sentence_nb):
                s = ss[i]
                if 16 <= len(s) <= 512: # Sentences too long or too short are considered to be errors to be eliminated
                    sentences.append((s,row['page']))
    
    return sentences


# The number of sentences returned to the client
# Warning : it can't be changed without making other changes to the program
nb_sentences = 3

# Load the embeddings and the sentences
sentences = from_csv_full('wikipedia_en_20.csv', nrows=None, article_min_size=100, first_n_sentences=10, print_title=False, use_nltk=True)
embeddings = np.load('embeddings.npy')
sentences = [(x[0],x[1], embeddings[i,:]) for i,x in enumerate(sentences)] # Put the sentences and the embeddings together
print('embeddings and sentences loaded !')

# Load the embedding model
model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
print('model loaded')

# Connecting to the existing SQL database
con = sqlite3.connect('server.db')
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

    # returns the best n ones (page id and sentence, but not the embeddings)
    return [sentences[indexes[i]][0:2] for i in range(n)]

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

            results = get_most_similars(sentence, nb_sentences)
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