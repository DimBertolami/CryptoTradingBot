import React from 'react';

console.log('SimpleApp component loaded');

const SimpleApp: React.FC = () => {
  console.log('SimpleApp component rendered');
  
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: '#ffffff'
    }}>
      <h1 style={{
        color: '#2196f3',
        marginBottom: '16px',
        fontSize: '24px'
      }}>Simple App</h1>
      <p style={{
        color: '#333333',
        fontSize: '16px'
      }}>If you can see this, the basic app is working!</p>
    </div>
  );
};

export default SimpleApp;
