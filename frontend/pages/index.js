import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../src/components/Header';

export default function Home() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get('/api/data')
      .then(response => setData(response.data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <div>
      <Header />
      <h1>Welcome to RiskParix</h1>
      <p>{data ? JSON.stringify(data) : 'Loading...'}</p>
    </div>
  );
}
