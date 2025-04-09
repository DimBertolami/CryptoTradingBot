import { render, screen } from '@testing-library/react';
import App from './App';

test('renders welcome message', () => {
  render(<App />);
  const welcomeElement = screen.getByText(/Welcome to Dim's Crypto Samurai Portal!/i);
  expect(welcomeElement).toBeInTheDocument();
});
