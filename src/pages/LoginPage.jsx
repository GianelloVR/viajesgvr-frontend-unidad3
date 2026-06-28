import { useEffect } from "react";
import { Container, Card, CardContent, Typography, Button, Stack } from "@mui/material";
import { useKeycloak } from "@react-keycloak/web";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const { keycloak, initialized } = useKeycloak();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized && keycloak.authenticated) {
      navigate("/");
    }
  }, [initialized, keycloak.authenticated, navigate]);

  const handleLogin = () => {
    keycloak.login({
      redirectUri: window.location.origin,
    });
  };

  return (
    <Container sx={{ py: 6 }}>
      <Card sx={{ maxWidth: 500, mx: "auto", borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Stack spacing={3}>
            <Typography variant="h4" fontWeight="bold" textAlign="center">
              Iniciar sesión
            </Typography>

            <Typography textAlign="center">
              El acceso al sistema se realiza mediante Keycloak.
            </Typography>

            <Button variant="contained" size="large" onClick={handleLogin}>
              Ingresar con Keycloak
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

export default LoginPage;