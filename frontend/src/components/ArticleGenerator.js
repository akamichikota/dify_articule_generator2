import React, { useState } from 'react';
import axios from 'axios';

const ArticleGenerator = () => {
  const [keywordsText, setKeywordsText] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setKeywordsText(event.target.value);
  };

  const generateArticles = async () => {
    setLoading(true);
    const keywords = keywordsText.split('\n').filter(keyword => keyword.trim() !== '');
    try {
      const response = await axios.post('http://localhost:3030/generate-articles', { 
        query: keywords.join(', ')
      });
      
      console.log(response.data); // APIからのレスポンスを確認

      // 最終的なメッセージのみを返す
      if (response.data && response.data.answer) {
        setArticles([{ answer: response.data.answer }]); // answerを含むオブジェクトを配列にラップして設定
      } else {
        setArticles([{ answer: 'No articles generated.' }]); // エラーメッセージを設定
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea
        value={keywordsText}
        onChange={handleChange}
        placeholder="Enter keywords, one per line"
        rows="10"
        cols="30"
      />
      <br />
      <button onClick={generateArticles} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Articles'}
      </button>
      <div>
        {articles.length > 0 ? (
          articles.map((article, index) => (
            <div key={index}>
              <h2>Article</h2>
              <p>{article.answer}</p> {/* 最終的なメッセージを表示 */}
            </div>
          ))
        ) : (
          <p>No articles generated.</p> // 記事が生成されていない場合のメッセージ
        )}
      </div>
    </div>
  );
};

export default ArticleGenerator;