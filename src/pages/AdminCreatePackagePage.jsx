import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  TextField,
  Button,
  MenuItem,
  Box,
} from "@mui/material";
import tourPackageService from "../services/tourPackage.service";

function AdminCreatePackagePage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    destination: "",
    description: "",
    startDate: "",
    endDate: "",
    durationDays: "",
    price: "",
    totalQuota: "",
    availableQuota: "",
    includedServices: "",
    conditions: "",
    restrictions: "",
    travelType: "",
    season: "",
    category: "",
    promotionDiscountPercentage: 0,
    status: "AVAILABLE",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const tourPackageData = {
      ...formData,
      durationDays: Number(formData.durationDays),
      price: Number(formData.price),
      totalQuota: Number(formData.totalQuota),
      availableQuota: Number(formData.availableQuota),
      promotionDiscountPercentage: Number(formData.promotionDiscountPercentage || 0),
    };

    try {
      await tourPackageService.createTourPackage(tourPackageData);
      alert("Paquete turístico creado correctamente");
      navigate("/admin/packages");
    } catch (error) {
      console.error("Error creating tour package:", error);

      const backendMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Ocurrió un error al crear el paquete turístico";

      alert(backendMessage);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Crear paquete turístico
      </Typography>

      <Card sx={{ maxWidth: 800, mx: "auto", borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                label="Nombre"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="Destino"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="Descripción"
                name="description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                multiline
                minRows={3}
              />

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
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
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
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  fullWidth
                />
              </Box>

              <TextField
                label="Duración (días)"
                name="durationDays"
                type="number"
                value={formData.durationDays}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="Precio"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="Cupos totales"
                name="totalQuota"
                type="number"
                value={formData.totalQuota}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="Cupos disponibles"
                name="availableQuota"
                type="number"
                value={formData.availableQuota}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="Servicios incluidos"
                name="includedServices"
                value={formData.includedServices}
                onChange={handleChange}
                fullWidth
                multiline
                minRows={2}
              />

              <TextField
                label="Condiciones"
                name="conditions"
                value={formData.conditions}
                onChange={handleChange}
                fullWidth
                multiline
                minRows={2}
              />

              <TextField
                label="Restricciones"
                name="restrictions"
                value={formData.restrictions}
                onChange={handleChange}
                fullWidth
                multiline
                minRows={2}
              />

              <TextField
                label="Tipo de viaje"
                name="travelType"
                value={formData.travelType}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="Temporada"
                name="season"
                value={formData.season}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="Categoría"
                name="category"
                value={formData.category}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="Promoción (%)"
                name="promotionDiscountPercentage"
                type="number"
                value={formData.promotionDiscountPercentage}
                onChange={handleChange}
                fullWidth
                inputProps={{ min: 0, max: 20 }}
                helperText="Ingresa un porcentaje entre 0 y 20. Si no hay promoción, deja 0."
              />

              <TextField
                select
                label="Estado"
                name="status"
                value={formData.status}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="AVAILABLE">Disponible</MenuItem>
                <MenuItem value="SOLD_OUT">Agotado</MenuItem>
                <MenuItem value="NOT_VALID">No disponible</MenuItem>
                <MenuItem value="CANCELED">Cancelado</MenuItem>
              </TextField>

              <Stack direction="row" spacing={2}>
                <Button type="submit" variant="contained">
                  Crear paquete
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => navigate("/admin/packages")}
                >
                  Cancelar
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}

export default AdminCreatePackagePage;