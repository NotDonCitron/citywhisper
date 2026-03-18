import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('renders CityWhisper V2 text', () => {
  render(<App />)
  const element = screen.getByText(/CityWhisper V2/i)
  expect(element).toBeInTheDocument()
})
