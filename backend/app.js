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

app.post('/generate-articles', async (req, res) => {
  const { query } = req.body; // クエリを取得

  const apiKey = process.env.DIFY_API_KEY;  
  const apiEndpoint = 'http://localhost/v1/chat-messages'; // 正しいチャット用のエンドポイントに変更

  console.log(`Received request to generate articles with query: ${query}`); // リクエスト受信のログ

  try {
    // キーワードを改行で分割
    const keywords = query.split(',').map(keyword => keyword.trim());
    
    // 各キーワードに対してAPIリクエストを並行して送信
    const requests = keywords.map(keyword => 
      axios.post(apiEndpoint, {
        inputs: {},
        query: keyword, // 各キーワードを使用
        response_mode: "streaming", // ストリ��ミングモードを指定
        user: "akamichi" // ユーザーIDを指定
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      })
    );

    // 全てのリクエストが完了するのを待つ
    const responses = await Promise.all(requests);

    // 各レスポンスを処理
    responses.forEach(response => {
      let finalMessage = '';
      let buffer = '';

      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // 最後の行は不完全な可能性があるのでバッファに残す

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonString = line.replace(/^data: /, '');
            try {
              const data = JSON.parse(jsonString);
              if (data.event === 'message') {
                finalMessage += data.answer;
              } else if (data.event === 'workflow_finished') {
                finalMessage = data.data.outputs.answer;
                console.log('Final Message:', finalMessage);
                // 各キーワードの最終メッセージをフロントエンドに送信
                res.write(JSON.stringify({ answer: finalMessage }));
              }
            } catch (e) {
              console.error('Error parsing JSON:', e);
            }
          }
        }
      });

      response.data.on('end', () => {
        if (!finalMessage) {
          console.error('No articles generated for one of the keywords.');
        }
      });
    });

    // ストリーミングレスポンスの終了
    res.end();

  } catch (error) {
    console.error('Error while generating articles:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);  // レスポンスの詳細をログに記録
      console.error('Response status:', error.response.status);
      res.status(error.response.status).json({ error: error.response.data });
    } else if (error.request) {
      console.error('No response received from API.');  // リクエストの詳細をログに記録
      res.status(500).json({ error: 'No response received from API.' });
    } else {
      console.error('Error message:', error.message);  // エラーメッセージをログに記録
      res.status(500).json({ error: error.message });
    }
  }
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});