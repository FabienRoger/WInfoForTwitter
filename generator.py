import numpy as np
import pandas as pd
import re
from tqdm import tqdm
import nltk
from nltk.tokenize import sent_tokenize
nltk.download('punkt')
from sentence_transformers import SentenceTransformer

print('imports done !')

def from_csv_full(filename, nrows=10, first_n_sentences=None, print_title=True, print_n_titles=20):
    df = pd.read_csv(filename, nrows=nrows, names=['page', 'content'])
    sentences = []
    for i,row in tqdm(df.iterrows()):
        if print_title and i<print_n_titles: print(row['content'][:40])
        ss = sent_tokenize(row['content'])
        sentence_nb = len(ss) if first_n_sentences == None else min(len(ss), first_n_sentences)
        for i in range(sentence_nb):
            s = ss[i]
            if 16 <= len(s) <= 512:
                sentences.append((s,row['page']))
    return sentences

sentences = from_csv_full('/kaggle/input/full-wikipdia/wikipedia_en_20.csv', nrows=None, first_n_sentences=50, print_title=True, print_n_titles=20)

model = SentenceTransformer('sentence-transformers/bert-base-nli-mean-tokens')

print('computing embeddings...')

embeddings = model.encode([x[0] for x in sentences])

np.save('embeddings', embeddings)

print('embeddings saved !')