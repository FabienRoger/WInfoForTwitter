from sentence_transformers import SentenceTransformer

modelPath = "inference/model"
model = SentenceTransformer("paraphrase-MiniLM-L6-v2")
model.save(modelPath)
model = SentenceTransformer(modelPath)