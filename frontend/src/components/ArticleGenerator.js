import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const ArticleGenerator = () => {
  const [keywordsText, setKeywordsText] = useState('');
  const [article, setArticle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    setKeywordsText(event.target.value);
  };

  const generateArticles = async () => {
    setLoading(true);
    setError(null);
    setArticle('');
    const keywords = keywordsText.split('\n').filter(keyword => keyword.trim() !== '');

    try {
      const eventSource = new EventSource(`http://localhost:3030/generate-articles?query=${encodeURIComponent(keywords.join(', '))}`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setArticle(prevArticle => prevArticle + data.answer);
      };

      eventSource.onerror = (err) => {
        console.error('EventSource failed:', err);
        setError('An error occurred while generating articles.');
        setLoading(false);
        eventSource.close();
      };

      eventSource.onopen = () => {
        setLoading(false);
      };
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred while generating articles.');
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
        {loading ? '生成中...' : '記事生成'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h2>記事内容</h2>
      <div>
        {article && (
          <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
            <ReactMarkdown>{article}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleGenerator;