const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); // 環境変数を読み込む

const app = express();

app.use(express.json());

// CORSを有効にする
app.use(cors({
  origin: 'http://localhost:3000'  // フロントエンドのURL
}));

app.get('/generate-articles', async (req, res) => {
  const { query } = req.query;
  const apiKey = process.env.DIFY_API_KEY;
  const apiEndpoint = 'http://localhost/v1/chat-messages';

  console.log(`Received request to generate articles with query: ${query}`);

  try {
    const keywords = query.split(',').map(keyword => keyword.trim());
    const requests = keywords.map(keyword => 
      axios.post(apiEndpoint, {
        inputs: {},
        query: keyword,
        response_mode: "streaming",
        user: "akamichi"
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      })
    );

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const responses = await Promise.all(requests);

    responses.forEach(response => {
      let buffer = '';

      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonString = line.replace(/^data: /, '');
            try {
              const data = JSON.parse(jsonString);
              if (data.event === 'message') {
                res.write(`data: ${JSON.stringify({ answer: data.answer })}\n\n`);
              } else if (data.event === 'workflow_finished') {
                res.write(`data: ${JSON.stringify({ answer: data.data.outputs.answer })}\n\n`);
              }
            } catch (e) {
              console.error('Error parsing JSON:', e);
            }
          }
        }
      });

      response.data.on('end', () => {
        res.write('event: end\n\n');
      });
    });

  } catch (error) {
    console.error('Error while generating articles:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});