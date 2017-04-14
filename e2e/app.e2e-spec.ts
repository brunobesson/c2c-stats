import { C2cStatsPage } from './app.po';

describe('c2c-stats App', () => {
  let page: C2cStatsPage;

  beforeEach(() => {
    page = new C2cStatsPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
