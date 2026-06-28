import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
} from "@mui/material";
import reservationService from "../services/reservation.service";

const getStatusLabel = (status) => {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Pendiente de pago";
    case "CONFIRMED":
      return "Confirmada";
    case "CANCELED":
      return "Cancelada";
    case "EXPIRED":
      return "Expirada";
    default:
      return status;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "PENDING_PAYMENT":
      return "warning";
    case "CONFIRMED":
      return "success";
    case "CANCELED":
      return "error";
    case "EXPIRED":
      return "default";
    default:
      return "default";
  }
};

function AdminReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const response = await reservationService.getAllReservations();
      setReservations(response.data);
    } catch (error) {
      console.error("Error loading admin reservations:", error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography variant="h4">Cargando reservas...</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Gestión de reservas
      </Typography>

      {reservations.length === 0 ? (
        <Typography>No hay reservas registradas.</Typography>
      ) : (
        <Stack spacing={3}>
          {reservations.map((reservation) => (
            <Card key={reservation.id} sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="h5" fontWeight="bold">
                    Reserva #{reservation.id}
                  </Typography>

                  <Chip
                    label={getStatusLabel(reservation.status)}
                    color={getStatusColor(reservation.status)}
                    sx={{ width: "fit-content" }}
                  />

                  <Typography>
                    <strong>Usuario:</strong> {reservation.user?.fullName}
                  </Typography>

                  <Typography>
                    <strong>Correo:</strong> {reservation.user?.email}
                  </Typography>

                  <Typography>
                    <strong>Paquete:</strong> {reservation.tourPackage?.name}
                  </Typography>

                  <Typography>
                    <strong>Destino:</strong> {reservation.tourPackage?.destination}
                  </Typography>

                  <Typography>
                    <strong>Pasajeros:</strong> {reservation.passengerCount}
                  </Typography>

                  <Typography>
                    <strong>Monto final:</strong> $
                    {new Intl.NumberFormat("es-CL").format(reservation.finalTotalAmount)}
                  </Typography>

                  <Typography>
                    <strong>Fecha inicio tour:</strong>{" "}
                    {reservation.tourStartDate
                      ? new Date(`${reservation.tourStartDate}T00:00:00`).toLocaleDateString("es-CL")
                      : "No registrada"}
                  </Typography>

                  <Typography>
                    <strong>Fecha término tour:</strong>{" "}
                    {reservation.tourEndDate
                      ? new Date(`${reservation.tourEndDate}T00:00:00`).toLocaleDateString("es-CL")
                      : "No registrada"}
                  </Typography>

                  <Typography>
                    <strong>Fecha de reserva:</strong>{" "}
                    {new Date(reservation.reservationDate).toLocaleString("es-CL")}
                  </Typography>

                  <Typography>
                    <strong>Solicitudes especiales:</strong>{" "}
                    {reservation.specialRequests || "Sin solicitudes especiales"}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}

export default AdminReservationsPage;