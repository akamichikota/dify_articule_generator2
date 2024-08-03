import React from 'react';
import ArticleGenerator from './components/ArticleGenerator';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>自動記事生成ツール</h1>
        <ArticleGenerator />
      </header>
    </div>
  );
}

export default App;