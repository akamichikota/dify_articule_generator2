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
    // 新しい会話を開始
    const startConversationResponse = await axios.post(apiEndpoint, {
      inputs: {},
      query: query, // ユーザーからの入力
      response_mode: "streaming", // ストリーミングモードを指定
      user: "abc-123" // ユーザーIDを指定
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // レスポンスの詳細をログに出力
    console.log('Start Conversation Response:', startConversationResponse.data);

    // レスポンス全体をログに出力
    console.log('Full Start Conversation Response:', JSON.stringify(startConversationResponse.data, null, 2));

    // 会話IDを取得
    const conversationId = startConversationResponse.data.conversation_id || startConversationResponse.data.data.conversation_id;
    if (!conversationId) {
      throw new Error('Failed to retrieve conversation ID');
    }
    console.log(`Successfully started conversation with ID: ${conversationId}`); // 会話開始のログ

    // 取得した会話IDを使用して再度リクエストを送信
    const response = await axios.post(apiEndpoint, {
      inputs: {},
      query: query, // ユーザーからの入力
      response_mode: "streaming", // ストリーミングモードを指定
      conversation_id: conversationId, // 会話IDを指定
      user: "abc-123" // ユーザーIDを指定
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // レスポンスの詳細をログに出力
    console.log('Generate Articles Response:', response.data);

    console.log(`Successfully generated articles for conversation ID: ${conversationId}`); // 記事生成成功のログ

    // 最終的なメッセージのみを返す
    if (response.data && response.data.outputs && response.data.outputs.answer) {
      const finalMessage = response.data.outputs.answer; // 最後のメッセージを取得
      res.json({ answer: finalMessage }); // 最終的なメッセージを返す
    } else {
      res.status(500).json({ error: 'No articles generated.' });
    }
  } catch (error) {
    console.error('Error while generating articles:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);  // レスポンスの詳細をログに記録
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request data:', error.request);  // リクエストの詳細をログに記録
    } else {
      console.error('Error message:', error.message);  // エラーメッセージをログに記録
    }
    res.status(500).json({ error: 'An error occurred while generating articles.' });
  }
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});