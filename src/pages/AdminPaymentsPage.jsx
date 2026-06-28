import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
} from "@mui/material";
import paymentService from "../services/payment.service";

const getPaymentStatusLabel = (status) => {
  switch (status) {
    case "APPROVED":
      return "Aprobado";
    case "REJECTED":
      return "Rechazado";
    case "PENDING":
      return "Pendiente";
    default:
      return status;
  }
};

const getPaymentStatusColor = (status) => {
  switch (status) {
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "error";
    case "PENDING":
      return "warning";
    default:
      return "default";
  }
};

function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const response = await paymentService.getAllPayments();
      setPayments(response.data);
    } catch (error) {
      console.error("Error loading admin payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography variant="h4">Cargando pagos...</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Gestión de pagos
      </Typography>

      {payments.length === 0 ? (
        <Typography>No hay pagos registrados.</Typography>
      ) : (
        <Stack spacing={3}>
          {payments.map((payment) => (
            <Card key={payment.id} sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="h5" fontWeight="bold">
                    Pago #{payment.id}
                  </Typography>

                  <Chip
                    label={getPaymentStatusLabel(payment.paymentStatus)}
                    color={getPaymentStatusColor(payment.paymentStatus)}
                    sx={{ width: "fit-content" }}
                  />

                  <Typography>
                    <strong>Reserva asociada:</strong> #{payment.reservation?.id}
                  </Typography>

                  <Typography>
                    <strong>Usuario:</strong> {payment.reservation?.user?.fullName}
                  </Typography>

                  <Typography>
                    <strong>Correo:</strong> {payment.reservation?.user?.email}
                  </Typography>

                  <Typography>
                    <strong>Paquete:</strong> {payment.reservation?.tourPackage?.name}
                  </Typography>

                  <Typography>
                    <strong>Monto:</strong> $
                    {new Intl.NumberFormat("es-CL").format(payment.amount)}
                  </Typography>

                  <Typography>
                    <strong>Método de pago:</strong> {payment.paymentMethod}
                  </Typography>

                  <Typography>
                    <strong>Fecha de pago:</strong>{" "}
                    {new Date(payment.paymentDate).toLocaleString("es-CL")}
                  </Typography>

                  <Typography>
                    <strong>Tarjeta:</strong> {payment.cardNumber}
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

export default AdminPaymentsPage;