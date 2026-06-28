import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Button,
  Box,
} from "@mui/material";
import { Link } from "react-router-dom";
import tourPackageService from "../services/tourPackage.service";

const getStatusLabel = (status) => {
  switch (status) {
    case "AVAILABLE":
      return "Disponible";
    case "SOLD_OUT":
      return "Agotado";
    case "NOT_VALID":
      return "No disponible";
    case "CANCELED":
      return "Cancelado";
    default:
      return status;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "AVAILABLE":
      return "success";
    case "SOLD_OUT":
      return "warning";
    case "NOT_VALID":
      return "default";
    case "CANCELED":
      return "error";
    default:
      return "default";
  }
};

function AdminPackagesPage() {
  const [tourPackages, setTourPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTourPackages();
  }, []);

  const loadTourPackages = async () => {
    try {
      const response = await tourPackageService.getAllTourPackages();
      setTourPackages(response.data);
    } catch (error) {
      console.error("Error loading admin tour packages:", error);
      setTourPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateTourPackage = async (id) => {
    const confirmed = window.confirm(
      "¿Estás seguro de que deseas desactivar este paquete turístico?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await tourPackageService.deactivateTourPackage(id);
      alert("Paquete turístico desactivado correctamente");
      loadTourPackages();
    } catch (error) {
      console.error("Error deactivating tour package:", error);

      const backendMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Ocurrió un error al desactivar el paquete turístico";

      alert(backendMessage);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography variant="h4">Cargando paquetes...</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h3" fontWeight="bold">
          Gestión de paquetes
        </Typography>

        <Button
          variant="contained"
          component={Link}
          to="/admin/packages/create"
        >
          Crear paquete turístico
        </Button>
      </Box>

      {tourPackages.length === 0 ? (
        <Typography>No hay paquetes turísticos registrados.</Typography>
      ) : (
        <Stack spacing={3}>
          {tourPackages.map((tourPackage) => {
            const promotionPercentage = Number(tourPackage.promotionDiscountPercentage || 0);
            const hasPromotion = promotionPercentage > 0;

            return (
            <Card key={tourPackage.id} sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="h5" fontWeight="bold">
                    {tourPackage.name}
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      label={getStatusLabel(tourPackage.status)}
                      color={getStatusColor(tourPackage.status)}
                      sx={{ width: "fit-content" }}
                    />

                    {hasPromotion && (
                      <Chip
                        label={`Promoción ${promotionPercentage}% OFF`}
                        color="warning"
                        sx={{ width: "fit-content", fontWeight: "bold" }}
                      />
                    )}
                  </Stack>

                  <Typography>
                    <strong>ID:</strong> {tourPackage.id}
                  </Typography>

                  <Typography>
                    <strong>Destino:</strong> {tourPackage.destination}
                  </Typography>

                  <Typography>
                    <strong>Precio:</strong> $
                    {new Intl.NumberFormat("es-CL").format(tourPackage.price)}
                  </Typography>

                  <Typography>
                    <strong>Promoción:</strong>{" "}
                    {promotionPercentage > 0 ? `${promotionPercentage}% OFF` : "Sin promoción"}
                  </Typography>

                  <Typography>
                    <strong>Duración:</strong> {tourPackage.durationDays} día(s)
                  </Typography>

                  <Typography>
                    <strong>Cupos totales:</strong> {tourPackage.totalQuota}
                  </Typography>

                  <Typography>
                    <strong>Cupos disponibles:</strong> {tourPackage.availableQuota}
                  </Typography>

                  <Typography>
                    <strong>Temporada:</strong> {tourPackage.season}
                  </Typography>

                  <Typography>
                    <strong>Categoría:</strong> {tourPackage.category}
                  </Typography>

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      component={Link}
                      to={`/packages/${tourPackage.id}`}
                    >
                      Ver detalle
                    </Button>

                    <Button
                      variant="contained"
                      color="warning"
                      onClick={() => handleDeactivateTourPackage(tourPackage.id)}
                      disabled={
                        tourPackage.status === "NOT_VALID" ||
                        tourPackage.status === "CANCELED"
                      }
                    >
                      Desactivar
                    </Button>

                    <Button
                      variant="contained"
                      component={Link}
                      to={`/admin/packages/${tourPackage.id}/edit`}
                    >
                      Editar
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            );
          })}
        </Stack>
      )}
    </Container>
  );
}

export default AdminPackagesPage;