import pandas as pd
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

# 1. Veri yükle
df = pd.read_parquet("../../data/interim/rag_knowledge.parquet")

# 2. Embedding modeli
model = SentenceTransformer("intfloat/multilingual-e5-base")

# 3. Tüm textleri embed et
embeddings = model.encode(df["text"].tolist(), show_progress_bar=True)
embeddings = np.array(embeddings).astype("float32")

# 4. FAISS index oluştur
dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(embeddings)

# 5. Kaydet
faiss.write_index(index, "../../data/interim/rag_knowledge.index")

# 6. Metadata kaydet (doc_id, district_name vs)
df.to_parquet("../../data/interim/rag_knowledge_metadata.parquet", index=False)

print("Index ve metadata kaydedildi.")
