describe('Visit Localhost', () => {
    it('should load the localhost page', () => {
        cy.visit('http://localhost:5173');
        cy.contains('Welcome'); 
    });
});