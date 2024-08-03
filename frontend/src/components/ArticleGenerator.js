import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const ArticleGenerator = () => {
  const [keywordsText, setKeywordsText] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    setKeywordsText(event.target.value);
  };

  const generateArticles = async () => {
    setLoading(true);
    setError(null);
    const keywords = keywordsText.split('\n').filter(keyword => keyword.trim() !== '');
    try {
      const response = await fetch('http://localhost:3030/generate-articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: keywords.join(', ') }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: true });
        const articlesChunk = chunk.split('\n').filter(line => line).map(line => JSON.parse(line));
        
        // 受け取った記事を順に表示
        setArticles(prevArticles => [...prevArticles, ...articlesChunk.map(article => ({ answer: article.answer }))]);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred while generating articles.');
    } finally {
      setLoading(false); // エラーが発生してもここでloadingをfalseにする
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
        {loading ? '生成中...' : '記事生成'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h2>記事内容</h2>
      <div>
        {articles.length > 0 ? (
          articles.map((article, index) => (
            <div key={index} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
              <ReactMarkdown>{article.answer}</ReactMarkdown>
            </div>
          ))
        ) : (
          null
        )}
      </div>
    </div>
  );
};

export default ArticleGenerator;