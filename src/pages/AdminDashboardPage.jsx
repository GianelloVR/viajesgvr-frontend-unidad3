import { Container, Typography, Card, CardContent, Stack, Button } from "@mui/material";
import { Link } from "react-router-dom";

function AdminDashboardPage() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Panel de administración
      </Typography>

      <Stack spacing={3}>
        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Gestión de usuarios
            </Typography>

            <Typography sx={{ mb: 2 }}>
              Administra clientes y administradores registrados en la plataforma.
            </Typography>

            <Button variant="contained" component={Link} to="/admin/users">
              Ir a gestión de usuarios
            </Button>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Gestión de paquetes
            </Typography>

            <Typography sx={{ mb: 2 }}>
              Crea, edita y administra los paquetes turísticos disponibles.
            </Typography>

            <Button variant="contained" component={Link} to="/admin/packages">
              Ir a gestión de paquetes
            </Button>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Gestión de reservas
            </Typography>

            <Typography sx={{ mb: 2 }}>
              Revisa y gestiona las reservas realizadas por los clientes.
            </Typography>

            <Button variant="contained" component={Link} to="/admin/reservations">
              Ir a gestión de reservas
            </Button>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Gestión de pagos
            </Typography>

            <Typography sx={{ mb: 2 }}>
              Consulta los pagos registrados en el sistema.
            </Typography>

            <Button variant="contained" component={Link} to="/admin/payments">
              Ir a gestión de pagos
            </Button>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Reporte de ventas
            </Typography>

            <Typography sx={{ mb: 2 }}>
              Genera reportes de ventas según un período seleccionado.
            </Typography>

            <Button variant="contained" component={Link} to="/admin/reports/sales">
              Ir a reporte de ventas
            </Button>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Ranking de paquetes vendidos
            </Typography>

            <Typography sx={{ mb: 2 }}>
              Consulta los paquetes con mayor demanda dentro de un período.
            </Typography>

            <Button variant="contained" component={Link} to="/admin/reports/ranking">
              Ir a ranking de paquetes
            </Button>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

export default AdminDashboardPage;