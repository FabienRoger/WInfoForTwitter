from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, unquote
import json
import cgi
import re
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
import sqlite3
from random import randint

nb_sentences = 3

print('imports done !')

def from_csv_full(filename, nrows=10, print_title=True, print_n_titles=20):
    df = pd.read_csv(filename, nrows=nrows, names=['page', 'content'])
    sentences = []
    for i,row in df.iterrows():
        if print_title and i<print_n_titles: print(row['content'][:40])
        ss = re.split('\.|\!|\?|\=|;|\{|\}', row['content'])
        #ss = sent_tokenize(s)
        for s in ss:
            if 16 <= len(s) <= 512:
                sentences.append((s,row['page']))
    return sentences

sentences = from_csv_full('wikipedia_en_20.csv', nrows=2000, print_title=True, print_n_titles=20)
embeddings = np.load('embeddings.npy')
print('loading done !')
sentences = [(x[0],x[1], embeddings[i,:]) for i,x in enumerate(sentences)]
model = SentenceTransformer('sentence-transformers/bert-base-nli-mean-tokens')
print('model loaded')

con = sqlite3.connect('server.db')
cur = con.cursor()
print('connected to database')

try:
    cur.execute('''CREATE TABLE requests
               (id integer, request text, reponse1 text, reponse2 text, reponse3 text)''')
    cur.execute('''CREATE TABLE responses
               (id integer, responsenumber int)''')
    print('table created')
except sqlite3.OperationalError:
    print('table loaded')

def similarity(a,b):
    return np.dot(a, b)/(np.linalg.norm(a)*np.linalg.norm(b))

def embed(s):
    return model.encode(s).reshape((-1))

def get_most_similar(s):
    return get_most_similars(s, 1)[0]

def get_most_similars(s, n):
    e = embed(s)
    similarities = np.sum(e*embeddings, axis=1)/(np.linalg.norm(e)*np.linalg.norm(embeddings, axis=1))
    indexes = list(range(len(sentences)))
    indexes = sorted(indexes, key=lambda i:similarities[i], reverse=True)
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