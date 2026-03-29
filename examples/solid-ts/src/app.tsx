import { createSignal } from 'solid-js';

function App() {
  const [count, setCount] = createSignal(0);

  return (
    <div>
      <h1>Hello world</h1>
      <button onClick={() => setCount((prevState) => ++prevState)}>Increase count</button>

      <div>Count: {count()}</div>
    </div>
  );
}

export default App;
