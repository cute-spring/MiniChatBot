document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (userInput.trim() === '') return;

    addMessage('User', userInput);
    document.getElementById('user-input').value = '';

    console.log("Sending message:", userInput);

    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userInput })
    }).then(response => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let botMessageElement;
        let accumulatedData = '';

        reader.read().then(function processText({ done, value }) {
            if (done) {
                console.log("Stream complete");
                return;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            lines.forEach(line => {
                if (line.startsWith('data:')) {
                    const messageData = line.replace(/^data:\s*/, '').trim();

                    if (messageData === '[DONE]') {
                        console.log("Received [DONE] signal, closing stream.");
                        return;
                    }

                    accumulatedData = messageData.replace(/^data:/g, '');
                    try {
                        const parsedData = JSON.parse(accumulatedData);
                        accumulatedData = ''; // Clear accumulated data after successful parse

                        const deltaContent = parsedData.choices[0].delta.content || '';

                        if (deltaContent) {
                            if (!botMessageElement) {
                                botMessageElement = document.createElement('p');
                                botMessageElement.classList.add('bot');
                                botMessageElement.innerText = 'Bot: ';
                                document.getElementById('chat-box').appendChild(botMessageElement);
                            }

                            botMessageElement.innerText += deltaContent;
                        }
                    } catch (e) {
                        // If JSON parsing fails, continue accumulating data
                        console.log("Accumulating more data for JSON parsing...");
                    }
                }
            });

            return reader.read().then(processText);
        });
    }).catch(error => {
        console.error('Error:', error);
    });
}

function addMessage(sender, message) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('p');
    messageElement.innerText = `${sender}: ${message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}