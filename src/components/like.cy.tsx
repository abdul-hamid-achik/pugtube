import { api } from '@/utils/api';
import LikeButton from './like';

const WrappedComponent = api.withTRPC(LikeButton)
describe('LikeButton', () => {
    it('should render successfully', () => {
        cy.mount(
            <WrappedComponent />
        )

        cy.get('button').should('exist');
    });
});

export { };

