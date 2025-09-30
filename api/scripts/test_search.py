import faiss
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer

# Index ve metadata yükle
index = faiss.read_index("../../data/interim/rag_knowledge.index")
metadata = pd.read_parquet("../data/rag_knowledge_metadata.parquet")

# Model yükle
model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

# Örnek sorgu
query = "Kadıköy’de kişi başına düşen yeşil alan kaç metrekaredir?"
q_emb = model.encode([query]).astype("float32")

# FAISS search
D, I = index.search(q_emb, 3)

print("Soru:", query)
for rank, idx in enumerate(I[0]):
    row = metadata.iloc[idx]
    print(f"\nSonuç {rank+1}:")
    print("district:", row["district_name"])
    print("text:", row["text"])
