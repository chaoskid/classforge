from groq import Groq
import json

# Initialize the Groq client
client = Groq(
    api_key="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",  
)

# This function simulates retrieving context from ChromaDB
def get_context_from_chroma(student_query):
    # In the actual implementation, this would query ChromaDB
    # For now, return sample context
    return "Previous feedback indicates the student needs more detailed explanations on algorithm complexity."

# Function to generate RAG-enhanced response
def generate_feedback_with_rag(student_query):
    # Retrieve relevant context (will be from ChromaDB in final implementation)
    context = get_context_from_chroma(student_query)

    # Create RAG-enhanced prompt with context
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a student feedback assistant. Use the following context to provide personalized feedback."},
            {"role": "user", "content": f"Context: {context}\n\nStudent query: {student_query}"}
        ],
        model="llama3-70b-8192",
    )

    return chat_completion.choices[0].message.content


# Test the function
student_query = "I don't understand the feedback on my algorithm efficiency."
response = generate_feedback_with_rag(student_query)
print(response)