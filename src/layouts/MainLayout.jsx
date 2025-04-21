import { Container, Box, Typography } from '@mui/material';

function MainLayout({ children, pageName }) {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {pageName && (
                <Typography variant="h4" component="h2" gutterBottom>
                    {pageName}
                </Typography>
            )}
            <Box sx={{ flexGrow: 1 }}>{children}</Box>
        </Container>
    );
}

export default MainLayout;
