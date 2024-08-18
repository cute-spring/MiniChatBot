import requests
from flask import Flask, request, Response, render_template

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message')

    # Send the request to the Ollama server
    response = requests.post(
        "http://localhost:11434/v1/chat/completions",
        json={
            "model": "llama3:latest",
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": user_input}
            ],
            "stream": True  # Enable streaming mode
        },
        stream=True  # Stream the response
    )

    if response.status_code != 200:
        print(f"Error from Ollama server: {response.status_code} - {response.text}")
        return f"Error: {response.status_code} {response.text}", 400

    # Stream the response to the client
    def generate():
        for chunk in response.iter_content(chunk_size=4096):
            if chunk:
                yield f"data:{chunk.decode('utf-8')}\n\n"
        yield "data: [DONE]\n\n"

    return Response(generate(), content_type='text/event-stream')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)