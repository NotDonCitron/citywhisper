import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('renders CityWhisper V2 text', () => {
  render(<App />)
  const element = screen.getByText(/City/i)
  expect(element).toBeInTheDocument()
  const element2 = screen.getByText(/Whisper/i)
  expect(element2).toBeInTheDocument()
})
