import { useMemo, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  TextField,
  Button,
  Box,
  Chip,
  Grid,
  MenuItem,
} from "@mui/material";
import reportService from "../services/report.service";

function AdminRankingReportPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [orderBy, setOrderBy] = useState("REVENUE");
  const [rankingReport, setRankingReport] = useState([]);
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
      const response = await reportService.getTourPackageRankingByPeriod(
        startDate,
        endDate
      );
      setRankingReport(response.data);
      setReportGenerated(true);
    } catch (error) {
      console.error("Error loading ranking report:", error);

      const backendMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Ocurrió un error al generar el ranking de paquetes";

      alert(backendMessage);
      setRankingReport([]);
      setReportGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const sortedRankingReport = useMemo(() => {
    const rankingCopy = [...rankingReport];

    rankingCopy.sort((a, b) => {
      if (orderBy === "REVENUE") {
        if ((b.totalRevenue ?? 0) !== (a.totalRevenue ?? 0)) {
          return (b.totalRevenue ?? 0) - (a.totalRevenue ?? 0);
        }
        if ((b.reservationCount ?? 0) !== (a.reservationCount ?? 0)) {
          return (b.reservationCount ?? 0) - (a.reservationCount ?? 0);
        }
        if ((b.totalPassengers ?? 0) !== (a.totalPassengers ?? 0)) {
          return (b.totalPassengers ?? 0) - (a.totalPassengers ?? 0);
        }
        return (a.tourPackageName ?? "").localeCompare(b.tourPackageName ?? "");
      }

      if (orderBy === "RESERVATIONS") {
        if ((b.reservationCount ?? 0) !== (a.reservationCount ?? 0)) {
          return (b.reservationCount ?? 0) - (a.reservationCount ?? 0);
        }
        if ((b.totalPassengers ?? 0) !== (a.totalPassengers ?? 0)) {
          return (b.totalPassengers ?? 0) - (a.totalPassengers ?? 0);
        }
        if ((b.totalRevenue ?? 0) !== (a.totalRevenue ?? 0)) {
          return (b.totalRevenue ?? 0) - (a.totalRevenue ?? 0);
        }
        return (a.tourPackageName ?? "").localeCompare(b.tourPackageName ?? "");
      }

      if (orderBy === "PASSENGERS") {
        if ((b.totalPassengers ?? 0) !== (a.totalPassengers ?? 0)) {
          return (b.totalPassengers ?? 0) - (a.totalPassengers ?? 0);
        }
        if ((b.reservationCount ?? 0) !== (a.reservationCount ?? 0)) {
          return (b.reservationCount ?? 0) - (a.reservationCount ?? 0);
        }
        if ((b.totalRevenue ?? 0) !== (a.totalRevenue ?? 0)) {
          return (b.totalRevenue ?? 0) - (a.totalRevenue ?? 0);
        }
        return (a.tourPackageName ?? "").localeCompare(b.tourPackageName ?? "");
      }

      return 0;
    });

    return rankingCopy;
  }, [rankingReport, orderBy]);

  const totalReservations = rankingReport.reduce(
    (acc, item) => acc + (item.reservationCount ?? 0),
    0
  );

  const totalPassengers = rankingReport.reduce(
    (acc, item) => acc + (item.totalPassengers ?? 0),
    0
  );

  const totalRevenue = rankingReport.reduce(
    (acc, item) => acc + (item.totalRevenue ?? 0),
    0
  );

  const topPackage = sortedRankingReport.length > 0 ? sortedRankingReport[0] : null;

  const getOrderByLabel = () => {
    switch (orderBy) {
      case "REVENUE":
        return "Ingresos";
      case "RESERVATIONS":
        return "Reservas";
      case "PASSENGERS":
        return "Pasajeros";
      default:
        return "";
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Ranking de paquetes vendidos por período
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
              <MenuItem value="REVENUE">Ingresos</MenuItem>
              <MenuItem value="RESERVATIONS">Reservas</MenuItem>
              <MenuItem value="PASSENGERS">Pasajeros</MenuItem>
            </TextField>

            <Button
              variant="contained"
              onClick={handleGenerateReport}
              disabled={loading}
            >
              {loading ? "Generando..." : "Generar ranking"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {reportGenerated && (
        <>
          {sortedRankingReport.length === 0 ? (
            <Typography>
              No se encontraron ventas en el período seleccionado.
            </Typography>
          ) : (
            <>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold">
                        Total reservas
                      </Typography>
                      <Typography variant="h4">{totalReservations}</Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold">
                        Total pasajeros
                      </Typography>
                      <Typography variant="h4">{totalPassengers}</Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold">
                        Ingresos totales
                      </Typography>
                      <Typography variant="h4">
                        ${new Intl.NumberFormat("es-CL").format(totalRevenue)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold">
                        Paquete top
                      </Typography>
                      <Typography variant="body1">
                        {topPackage ? topPackage.tourPackageName : "-"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Según {getOrderByLabel()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Stack spacing={3}>
                {sortedRankingReport.map((item, index) => (
                  <Card
                    key={`${item.tourPackageId}-${index}`}
                    sx={{ borderRadius: 3, boxShadow: 3 }}
                  >
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Chip
                          label={`#${index + 1}`}
                          color="primary"
                          sx={{ width: "fit-content" }}
                        />

                        <Typography variant="h5" fontWeight="bold">
                          {item.tourPackageName}
                        </Typography>

                        <Typography>
                          <strong>ID paquete:</strong> {item.tourPackageId}
                        </Typography>

                        <Typography>
                          <strong>Destino:</strong> {item.destination}
                        </Typography>

                        <Typography>
                          <strong>Cantidad de reservas:</strong>{" "}
                          {item.reservationCount ?? 0}
                        </Typography>

                        <Typography>
                          <strong>Total de pasajeros:</strong>{" "}
                          {item.totalPassengers ?? 0}
                        </Typography>

                        <Typography>
                          <strong>Monto total generado:</strong> $
                          {new Intl.NumberFormat("es-CL").format(
                            item.totalRevenue ?? 0
                          )}
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

export default AdminRankingReportPage;