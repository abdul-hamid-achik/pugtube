import { RouterContext } from "next/dist/shared/lib/router-context";
import { NextRouter } from "next/router";

const createRouter = (params: Partial<NextRouter>) => ({
  route: '/',
  pathname: '/',
  query: {},
  asPath: '/',
  basePath: '',
  back: cy.spy().as('back'),
  beforePopState: cy.spy().as('beforePopState'),
  forward: cy.spy().as('forward'), // <---------- added `forward`
  prefetch: cy.stub().as('prefetch').resolves(),
  push: cy.spy().as('push'),
  reload: cy.spy().as('reload'),
  replace: cy.spy().as('replace'),
  events: {
    emit: cy.spy().as('emit'),
    off: cy.spy().as('off'),
    on: cy.spy().as('on'),
  },
  isFallback: false,
  isLocaleDomain: false,
  isReady: true,
  defaultLocale: 'en',
  domainLocales: [],
  isPreview: false,
  ...params,
});

interface MockRouterProps extends Partial<NextRouter> {
  children: React.ReactNode;
}

const MockRouter = ({ children, ...props }: MockRouterProps) => {
  const router = createRouter(props);
  return <RouterContext.Provider value={router}>{children}</RouterContext.Provider>
};

export default MockRouter;
