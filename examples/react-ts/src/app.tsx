import { useState } from 'react';

import styles from './app.module.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className={styles.container}>
      <h1>Hello world</h1>

      <button onClick={() => setCount((prevState) => ++prevState)}>Increase count</button>

      <div>Count: {count}</div>
    </div>
  );
}

export default App;
