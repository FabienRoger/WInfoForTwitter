import config # local imports

import numpy as np
import pandas as pd
import re
from tqdm import tqdm
import nltk
from nltk.tokenize import sent_tokenize
nltk.download('punkt')
from sentence_transformers import SentenceTransformer

print('imports done !')

def from_csv_full(filename='', # The name of the csv file. The first column contains the page id (ex : wikipedia-253648) and the second column the content of the page
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

sentences = from_csv_full(**config.sentence_loading_config)

print('sentences loaded')

sentence_df = pd.DataFrame(sentences, columns=['sentence','page'])
sentence_df.to_csv(config.sentences_filename+'.csv')

print('sentences saved')

model = SentenceTransformer('paraphrase-MiniLM-L6-v2')

print('computing embeddings...')

embeddings = model.encode([x[0] for x in sentences])

np.save(config.embedding_filename, embeddings)

print('embeddings saved !')