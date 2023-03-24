import { api } from '@/utils/api';
import LikeButton, { type LikeButtonProps } from './like';

const WrappedComponent = api.withTRPC(LikeButton) as React.FC<LikeButtonProps>;
    
describe('LikeButton', () => {
    it('should render successfully', () => {
        cy.mount(
            <WrappedComponent videoId="test" />
        )

        cy.get('button').should('exist');
    });
});

export { };

