
import { render, screen } from '@testing-library/react'
import Home from '../index'
import '@testing-library/jest-dom'

describe('Home', () => {
    it('renders a heading', () => {
        render(<Home videos={{results: []}}/>)

        const heading = screen.getByRole('heading', {
            name: /welcome to pugtube/i,
        })

        expect(heading).toBeInTheDocument()
    })
})