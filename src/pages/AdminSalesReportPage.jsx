import { useMemo, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  TextField,
  Button,
  Chip,
  Box,
  Grid,
  MenuItem,
} from "@mui/material";
import reportService from "../services/report.service";

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

function AdminSalesReportPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [orderBy, setOrderBy] = useState("OPERATION_DATE");
  const [salesReport, setSalesReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      alert("Debes ingresar fecha de inicio y fecha de término");
      return;
    }

    if (startDate > endDate) {
      alert("La fecha de inicio no puede ser posterior a la fecha de término");
      return;
    }

    try {
      setLoading(true);
      const response = await reportService.getSalesReportByPeriod(startDate, endDate);
      setSalesReport(response.data);
      setReportGenerated(true);
    } catch (error) {
      console.error("Error loading sales report:", error);

      const backendMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Ocurrió un error al generar el reporte de ventas";

      alert(backendMessage);
      setSalesReport([]);
      setReportGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const sortedSalesReport = useMemo(() => {
    const result = [...salesReport];

    result.sort((a, b) => {
      if (orderBy === "OPERATION_DATE") {
        return new Date(b.operationDate ?? 0) - new Date(a.operationDate ?? 0);
      }

      if (orderBy === "PAID_AMOUNT") {
        return (b.paidAmount ?? 0) - (a.paidAmount ?? 0);
      }

      if (orderBy === "CUSTOMER") {
        return (a.customerFullName ?? "").localeCompare(b.customerFullName ?? "");
      }

      if (orderBy === "PACKAGE") {
        return (a.tourPackageName ?? "").localeCompare(b.tourPackageName ?? "");
      }

      return 0;
    });

    return result;
  }, [salesReport, orderBy]);

  const totalSales = sortedSalesReport.length;

  const totalPassengers = sortedSalesReport.reduce(
    (acc, item) => acc + (item.passengerCount ?? 0),
    0
  );

  const totalPaidAmount = sortedSalesReport.reduce(
    (acc, item) => acc + (item.paidAmount ?? 0),
    0
  );

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Reporte de ventas por período
      </Typography>

      <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 4 }}>
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  textAlign: "left",
                  mb: 0.5,
                  ml: 0.5,
                  color: "text.secondary",
                }}
              >
                Fecha de inicio
              </Typography>
              <TextField
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                fullWidth
              />
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  textAlign: "left",
                  mb: 0.5,
                  ml: 0.5,
                  color: "text.secondary",
                }}
              >
                Fecha de término
              </Typography>
              <TextField
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                fullWidth
              />
            </Box>

            <TextField
              select
              label="Ordenar por"
              value={orderBy}
              onChange={(event) => setOrderBy(event.target.value)}
              fullWidth
            >
              <MenuItem value="OPERATION_DATE">Fecha de operación</MenuItem>
              <MenuItem value="PAID_AMOUNT">Monto pagado</MenuItem>
              <MenuItem value="CUSTOMER">Cliente</MenuItem>
              <MenuItem value="PACKAGE">Paquete</MenuItem>
            </TextField>

            <Button
              variant="contained"
              onClick={handleGenerateReport}
              disabled={loading}
            >
              {loading ? "Generando..." : "Generar reporte"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {reportGenerated && (
        <>
          {sortedSalesReport.length === 0 ? (
            <Typography>No se encontraron ventas en el período seleccionado.</Typography>
          ) : (
            <>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold">
                        Total ventas
                      </Typography>
                      <Typography variant="h4">{totalSales}</Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold">
                        Total pasajeros
                      </Typography>
                      <Typography variant="h4">{totalPassengers}</Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold">
                        Monto total pagado
                      </Typography>
                      <Typography variant="h4">
                        ${new Intl.NumberFormat("es-CL").format(totalPaidAmount)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Stack spacing={3}>
                {sortedSalesReport.map((item, index) => (
                  <Card
                    key={`${item.reservationId}-${item.paymentId ?? index}`}
                    sx={{ borderRadius: 3, boxShadow: 3 }}
                  >
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Typography variant="h5" fontWeight="bold">
                          Venta #{item.reservationId}
                        </Typography>

                        <Chip
                          label={getStatusLabel(item.reservationStatus)}
                          color={getStatusColor(item.reservationStatus)}
                          sx={{ width: "fit-content" }}
                        />

                        <Typography>
                          <strong>Fecha de operación:</strong>{" "}
                          {item.operationDate
                            ? new Date(item.operationDate).toLocaleString("es-CL")
                            : "No registrada"}
                        </Typography>

                        <Typography>
                          <strong>Reserva ID:</strong> {item.reservationId}
                        </Typography>

                        <Typography>
                          <strong>Pago ID:</strong> {item.paymentId ?? "Sin pago"}
                        </Typography>

                        <Typography>
                          <strong>Cliente:</strong> {item.customerFullName}
                        </Typography>

                        <Typography>
                          <strong>Correo:</strong> {item.customerEmail}
                        </Typography>

                        <Typography>
                          <strong>Paquete:</strong> {item.tourPackageName}
                        </Typography>

                        <Typography>
                          <strong>Destino:</strong> {item.destination}
                        </Typography>

                        <Typography>
                          <strong>Cantidad de pasajeros:</strong> {item.passengerCount}
                        </Typography>

                        <Typography>
                          <strong>Monto total reserva:</strong> $
                          {new Intl.NumberFormat("es-CL").format(
                            item.reservationTotalAmount ?? 0
                          )}
                        </Typography>

                        <Typography>
                          <strong>Monto pagado:</strong> $
                          {new Intl.NumberFormat("es-CL").format(item.paidAmount ?? 0)}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </>
          )}
        </>
      )}
    </Container>
  );
}

export default AdminSalesReportPage;