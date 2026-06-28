import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  TextField,
  Button,
  MenuItem,
} from "@mui/material";
import tourPackageService from "../services/tourPackage.service";

function AdminEditPackagePage() {
  const { id } = useParams();
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
    status: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTourPackage();
  }, [id]);

  const loadTourPackage = async () => {
    try {
      const response = await tourPackageService.getTourPackageById(id);
      const tourPackage = response.data;

      setFormData({
        name: tourPackage.name || "",
        destination: tourPackage.destination || "",
        description: tourPackage.description || "",
        startDate: tourPackage.startDate || "",
        endDate: tourPackage.endDate || "",
        durationDays: tourPackage.durationDays || "",
        price: tourPackage.price || "",
        totalQuota: tourPackage.totalQuota || "",
        availableQuota: tourPackage.availableQuota || "",
        includedServices: tourPackage.includedServices || "",
        conditions: tourPackage.conditions || "",
        restrictions: tourPackage.restrictions || "",
        travelType: tourPackage.travelType || "",
        season: tourPackage.season || "",
        category: tourPackage.category || "",
        promotionDiscountPercentage: tourPackage.promotionDiscountPercentage ?? 0,
        status: tourPackage.status || "",
      });
    } catch (error) {
      console.error("Error loading tour package for edit:", error);
      alert("No se pudo cargar el paquete turístico");
      navigate("/admin/packages");
    } finally {
      setLoading(false);
    }
  };

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
      await tourPackageService.updateTourPackage(id, tourPackageData);
      alert("Paquete turístico actualizado correctamente");
      navigate("/admin/packages");
    } catch (error) {
      console.error("Error updating tour package:", error);

      const backendMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Ocurrió un error al actualizar el paquete turístico";

      alert(backendMessage);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography variant="h4">Cargando paquete...</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Editar paquete turístico
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

              <TextField
                label="Fecha de inicio"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Fecha de término"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

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
                  Guardar cambios
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

export default AdminEditPackagePage;