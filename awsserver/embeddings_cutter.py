import numpy as np

full_embeddings = np.load('embeddings_full.npy')
n, dim = full_embeddings.shape
print(n,dim)
embeddings = full_embeddings[:n//100]
np.save('embeddings.npy', embeddings)