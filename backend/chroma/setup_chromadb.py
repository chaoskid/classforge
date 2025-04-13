import chromadb
from chromadb.config import Settings

def get_chroma_client():
    client = chromadb.PersistentClient(
        path="db/student_feedback",  # Directory for persistent storage
        settings=Settings(allow_reset=True)  # Optional: Enable data reset capability
    )
    return client

# Test the setup
if __name__ == "__main__":
    try:
        client = get_chroma_client()
        print("ChromaDB setup is successful.")
    except Exception as e:
        print(f"Error during ChromaDB setup: {e}")
