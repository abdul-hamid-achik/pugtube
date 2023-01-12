
import { render, screen } from '@testing-library/react'
import Home from '../pages'
import '@testing-library/jest-dom'
const fixture = {
    id: '1',
    title: 'Test video',
    poster: {
        file: 'https://example.com/poster.png'
    },
}
describe('Landing page', () => {
    it('renders feed element', () => {
        // @ts-ignore
        render(<Home videos={{results: [fixture]}}/>)

        const video = screen.getByAltText(fixture.title)

        expect(video).toBeInTheDocument()
    })
})