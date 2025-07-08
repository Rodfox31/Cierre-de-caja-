import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  CircularProgress
} from '@mui/material';
import { API_BASE_URL } from '../config';
import moment from 'moment';

function Exportar() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/cierres-completo`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching cierres:', err);
        setError(err);
        setLoading(false);
      });
  }, []);

  const headers = data.length > 0
    ? Object.keys(data[0])
    : [];

  return (
    <Box
      p={3}
      sx={{
        bgcolor: '#121212',
        color: '#ffffff',
        minHeight: '100vh'
      }}
    >
      <Paper
        sx={{
          p: 3,
          mb: 3,
          bgcolor: '#1e1e1e',
          color: '#ffffff'
        }}
      >
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <CircularProgress color="inherit" />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            Error cargando datos: {error.message}
          </Box>
        ) : data.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
            No se encontraron cierres.
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th
                      key={h}
                      style={{
                        border: '1px solid #333',
                        padding: '8px',
                        textAlign: 'left',
                        background: '#242424',
                        color: '#ffffff'
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      background: i % 2 === 0 ? '#1e1e1e' : '#2a2a2a'
                    }}
                  >
                    {headers.map((h) => {
                      let cell = row[h];
                      if (h === 'fecha' && typeof cell === 'string') {
                        cell = moment(cell).format('DD/MM/YYYY');
                      }
                      if (typeof cell === 'object' && cell !== null) {
                        cell = JSON.stringify(cell);
                      }
                      return (
                        <td
                          key={h}
                          style={{
                            border: '1px solid #333',
                            padding: '8px',
                            color: '#ffffff'
                          }}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default Exportar;
